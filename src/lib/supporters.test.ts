import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  ANONYMOUS,
  invoiceToPayment,
  sessionToSupport,
  subscriptionToMember,
  toWall,
  type Support,
} from "./supporters";

function session(overrides: Partial<Stripe.Checkout.Session> & {
  refunded?: boolean;
  metadata?: Record<string, string>;
} = {}): Stripe.Checkout.Session {
  const { refunded = false, ...rest } = overrides;
  return {
    id: "cs_test_abc12345",
    object: "checkout.session",
    created: 1_760_000_000,
    mode: "payment",
    status: "complete",
    payment_status: "paid",
    amount_total: 900,
    metadata: {
      app: "kape",
      kind: "coffee",
      coffees: "3",
      name: "Bea",
      note: "Para sa film!",
      private: "false",
    },
    payment_intent: {
      id: "pi_test_1",
      latest_charge: {
        id: "ch_test_1",
        amount: 900,
        amount_refunded: refunded ? 900 : 0,
        refunded,
      },
    },
    ...rest,
  } as unknown as Stripe.Checkout.Session;
}

describe("sessionToSupport", () => {
  it("maps a paid session", () => {
    expect(sessionToSupport(session())).toEqual({
      id: "cs_test_abc12345",
      createdAt: 1_760_000_000_000,
      amountCents: 900,
      coffees: 3,
      name: "Bea",
      note: "Para sa film!",
      isPrivate: false,
      status: "paid",
    });
  });

  it("drops unpaid and incomplete sessions", () => {
    expect(sessionToSupport(session({ payment_status: "unpaid" }))).toBeNull();
    expect(sessionToSupport(session({ status: "open" }))).toBeNull();
    expect(sessionToSupport(session({ status: "expired", payment_status: "unpaid" }))).toBeNull();
  });

  it("drops sessions from other apps and memberships", () => {
    expect(sessionToSupport(session({ metadata: { app: "other", kind: "coffee" } }))).toBeNull();
    expect(sessionToSupport(session({ metadata: { app: "kape", kind: "tier" } }))).toBeNull();
    expect(sessionToSupport(session({ mode: "subscription" }))).toBeNull();
  });

  it("flags refunded sessions", () => {
    expect(sessionToSupport(session({ refunded: true }))?.status).toBe("refunded");
  });

  it("keeps the private flag", () => {
    const s = sessionToSupport(
      session({ metadata: { app: "kape", kind: "coffee", coffees: "1", name: "X", note: "secret", private: "true" } }),
    );
    expect(s?.isPrivate).toBe(true);
  });
});

describe("toWall", () => {
  const base: Support = {
    id: "a",
    createdAt: 1,
    amountCents: 300,
    coffees: 1,
    name: "Bea",
    note: "hello",
    isPrivate: false,
    status: "paid",
  };

  it("shows private supports as Someone with no note", () => {
    const [entry] = toWall([{ ...base, isPrivate: true, name: "Secret Name", note: "secret" }]);
    expect(entry.displayName).toBe(ANONYMOUS);
    expect(entry.note).toBeNull();
    expect(JSON.stringify(entry)).not.toContain("Secret");
  });

  it("hides refunded supports", () => {
    expect(toWall([{ ...base, status: "refunded" }])).toEqual([]);
  });

  it("returns the latest 20, newest first", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ ...base, id: String(i), createdAt: i }));
    const wall = toWall(many);
    expect(wall).toHaveLength(20);
    expect(wall[0].id).toBe("24");
  });

  it("uses Someone when no name was given", () => {
    expect(toWall([{ ...base, name: "" }])[0].displayName).toBe(ANONYMOUS);
  });
});

describe("subscriptionToMember", () => {
  function sub(status: string, extra: Record<string, unknown> = {}) {
    return {
      id: "sub_1",
      created: 1_760_000_000,
      status,
      cancel_at_period_end: false,
      metadata: { app: "kape", tier: "barista", name: "Lorna" },
      items: { data: [{ price: { unit_amount: 1500 }, current_period_end: 1_762_000_000 }] },
      ...extra,
    } as unknown as Stripe.Subscription;
  }

  it("maps statuses to active, past_due and canceled", () => {
    expect(subscriptionToMember(sub("active"))?.status).toBe("active");
    expect(subscriptionToMember(sub("past_due"))?.status).toBe("past_due");
    expect(subscriptionToMember(sub("canceled"))?.status).toBe("canceled");
    expect(subscriptionToMember(sub("incomplete"))).toBeNull();
  });

  it("treats cancel_at (how the portal schedules a cancel) as ending at that date", () => {
    const m = subscriptionToMember(sub("active", { cancel_at_period_end: false, cancel_at: 1_762_000_000 }));
    expect(m?.status).toBe("active");
    expect(m?.cancelAtPeriodEnd).toBe(true);
    expect(m?.currentPeriodEnd).toBe(1_762_000_000_000);
  });

  it("still honours the legacy cancel_at_period_end flag", () => {
    const m = subscriptionToMember(sub("active", { cancel_at_period_end: true, cancel_at: null }));
    expect(m?.cancelAtPeriodEnd).toBe(true);
  });

  it("is not scheduled to cancel when neither field is set", () => {
    expect(subscriptionToMember(sub("active", { cancel_at: null }))?.cancelAtPeriodEnd).toBe(false);
  });

  it("ignores unknown tiers and other apps", () => {
    expect(subscriptionToMember(sub("active", { metadata: { app: "kape", tier: "toString" } }))).toBeNull();
    expect(subscriptionToMember(sub("active", { metadata: { app: "x", tier: "regular" } }))).toBeNull();
  });
});

describe("invoiceToPayment", () => {
  it("counts paid Kape membership invoices", () => {
    const invoice = {
      status: "paid",
      amount_paid: 500,
      created: 100,
      status_transitions: { paid_at: 200 },
      parent: { subscription_details: { metadata: { app: "kape" } } },
    } as unknown as Stripe.Invoice;
    expect(invoiceToPayment(invoice)).toEqual({ at: 200_000, amountCents: 500, kind: "membership" });
    expect(invoiceToPayment({ ...invoice, status: "open" } as Stripe.Invoice)).toBeNull();
  });
});
