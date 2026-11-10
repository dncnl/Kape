import type Stripe from "stripe";
import { COFFEE_PRICE_CENTS, NAME_MAX, NOTE_MAX, TIERS, type TierId } from "./config";
import { APP_TAG } from "./checkout";
import { cleanText, parseCoffeeCount, parseTier } from "./pricing";

export type SupportStatus = "paid" | "refunded";

/** One coffee purchase. Full detail: dashboard only. */
export type Support = {
  id: string;
  createdAt: number; // epoch ms
  amountCents: number;
  coffees: number;
  name: string;
  note: string;
  isPrivate: boolean;
  status: SupportStatus;
};

/** What the public wall is allowed to see. Private details never leave the server. */
export type WallEntry = {
  id: string;
  createdAt: number;
  coffees: number;
  displayName: string;
  note: string | null;
};

export type MemberStatus = "active" | "canceled" | "past_due";

export type Member = {
  id: string;
  createdAt: number;
  tier: TierId;
  name: string;
  amountCents: number;
  status: MemberStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
};

/** A dollar that actually arrived: a paid coffee or a paid membership invoice. */
export type Payment = {
  at: number;
  amountCents: number;
  kind: "coffee" | "membership";
};

export const ANONYMOUS = "Someone";

function isRefunded(session: Stripe.Checkout.Session): boolean {
  const pi = session.payment_intent;
  if (!pi || typeof pi === "string") return false;
  const charge = pi.latest_charge;
  if (!charge || typeof charge === "string") return false;
  return charge.refunded || (charge.amount > 0 && charge.amount_refunded >= charge.amount);
}

/**
 * Checkout Session → Support. Returns null for anything that isn't a paid Kape coffee.
 * Expects `payment_intent.latest_charge` to be expanded to detect refunds.
 */
export function sessionToSupport(session: Stripe.Checkout.Session): Support | null {
  const meta = session.metadata ?? {};
  if (meta.app !== APP_TAG || meta.kind !== "coffee") return null;
  if (session.mode !== "payment") return null;
  if (session.status !== "complete" || session.payment_status !== "paid") return null;

  const amountCents = session.amount_total ?? 0;
  if (amountCents <= 0) return null;

  const coffees =
    parseCoffeeCount(meta.coffees) ?? Math.max(1, Math.round(amountCents / COFFEE_PRICE_CENTS));

  return {
    id: session.id,
    createdAt: session.created * 1000,
    amountCents,
    coffees,
    name: cleanText(meta.name, NAME_MAX),
    note: cleanText(meta.note, NOTE_MAX),
    isPrivate: meta.private === "true",
    status: isRefunded(session) ? "refunded" : "paid",
  };
}

/** Public wall: latest paid supports, refunds hidden, private ones anonymised. */
export function toWall(supports: Support[], limit = 20): WallEntry[] {
  return supports
    .filter((s) => s.status === "paid")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      coffees: s.coffees,
      displayName: s.isPrivate || !s.name ? ANONYMOUS : s.name,
      note: s.isPrivate || !s.note ? null : s.note,
    }));
}

function memberStatus(status: Stripe.Subscription.Status): MemberStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return null; // `incomplete`: checkout never finished
  }
}

export function subscriptionToMember(sub: Stripe.Subscription): Member | null {
  const meta = sub.metadata ?? {};
  if (meta.app !== APP_TAG) return null;
  const tier = parseTier(meta.tier);
  if (!tier) return null;
  const status = memberStatus(sub.status);
  if (!status) return null;
  const item = sub.items?.data?.[0];
  return {
    id: sub.id,
    createdAt: sub.created * 1000,
    tier,
    name: cleanText(meta.name, NAME_MAX),
    amountCents: item?.price?.unit_amount ?? TIERS[tier].priceCents,
    status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    currentPeriodEnd: item?.current_period_end ? item.current_period_end * 1000 : null,
  };
}

export function invoiceToPayment(invoice: Stripe.Invoice): Payment | null {
  if (invoice.status !== "paid" || invoice.amount_paid <= 0) return null;
  const meta = invoice.parent?.subscription_details?.metadata ?? {};
  if (meta.app !== APP_TAG) return null;
  const paidAt = invoice.status_transitions?.paid_at ?? invoice.created;
  return { at: paidAt * 1000, amountCents: invoice.amount_paid, kind: "membership" };
}

export function supportsToPayments(supports: Support[]): Payment[] {
  return supports
    .filter((s) => s.status === "paid")
    .map((s) => ({ at: s.createdAt, amountCents: s.amountCents, kind: "coffee" as const }));
}
