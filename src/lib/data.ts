import "server-only";
import { cache } from "react";
import type Stripe from "stripe";
import { sampleData, type CreatorData } from "./sample";
import { getStripe } from "./stripe";
import {
  invoiceToPayment,
  sessionToSupport,
  subscriptionToMember,
  supportsToPayments,
  type Member,
  type Payment,
  type Support,
} from "./supporters";

export type DataMode = "live" | "demo";

export type LoadedData = CreatorData & {
  mode: DataMode;
  /** Why we fell back to demo mode. Never shown verbatim to visitors. */
  reason?: "no-key" | "stripe-error";
  now: number;
};

/** Stripe list endpoints cap at 100 per page. Kape reads the latest page only (see README). */
const PAGE = 100;

async function loadLive(stripe: Stripe): Promise<CreatorData> {
  const [sessions, subscriptions, invoices] = await Promise.all([
    stripe.checkout.sessions.list({
      limit: PAGE,
      status: "complete",
      expand: ["data.payment_intent.latest_charge"],
    }),
    stripe.subscriptions.list({ limit: PAGE, status: "all" }),
    stripe.invoices.list({ limit: PAGE, status: "paid" }),
  ]);

  const supports = sessions.data
    .map(sessionToSupport)
    .filter((s): s is Support => s !== null);
  const members = subscriptions.data
    .map(subscriptionToMember)
    .filter((m): m is Member => m !== null);
  const membershipPayments = invoices.data
    .map(invoiceToPayment)
    .filter((p): p is Payment => p !== null);

  return {
    supports,
    members,
    payments: [...supportsToPayments(supports), ...membershipPayments],
  };
}

/**
 * Loads supporters and members from Stripe, or sample data when Stripe isn't available.
 * Never throws: an expired sandbox must not take the site down.
 */
export const loadCreatorData = cache(async (): Promise<LoadedData> => {
  const now = Date.now();
  const stripe = getStripe();
  if (!stripe) return { ...sampleData(now), mode: "demo", reason: "no-key", now };
  try {
    return { ...(await loadLive(stripe)), mode: "live", now };
  } catch (error) {
    console.error("[kape] Stripe unavailable, falling back to demo data:", errorSummary(error));
    return { ...sampleData(now), mode: "demo", reason: "stripe-error", now };
  }
});

export function errorSummary(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { type?: string; code?: string; message?: string };
    return [e.type, e.code, e.message].filter(Boolean).join(" · ");
  }
  return String(error);
}
