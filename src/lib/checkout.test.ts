import { describe, expect, it } from "vitest";
import { buildCheckoutParams } from "./checkout";
import { parseSupportForm, type SupportRequest } from "./pricing";

const ORIGIN = "https://kape.example";

function req(fields: Record<string, string>): SupportRequest {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  const parsed = parseSupportForm(fd);
  if (!parsed) throw new Error("fixture should be valid");
  return parsed;
}

describe("buildCheckoutParams: coffees", () => {
  const params = buildCheckoutParams(
    req({ coffees: "5", name: "Tita Lorna", note: "Para sa lens!", private: "on" }),
    ORIGIN,
  );

  it("uses one-time payment with inline price_data at $3 per coffee", () => {
    expect(params.mode).toBe("payment");
    const item = params.line_items?.[0];
    expect(item?.quantity).toBe(5);
    expect(item?.price_data?.currency).toBe("usd");
    expect(item?.price_data?.unit_amount).toBe(300);
    expect(item?.price_data?.recurring).toBeUndefined();
    expect((item?.price_data?.unit_amount ?? 0) * (item?.quantity ?? 0)).toBe(1500);
    expect(item?.price).toBeUndefined();
  });

  it("carries supporter details as metadata", () => {
    expect(params.metadata).toEqual({
      app: "kape",
      kind: "coffee",
      coffees: "5",
      name: "Tita Lorna",
      note: "Para sa lens!",
      private: "true",
    });
    expect(params.payment_intent_data?.metadata).toEqual(params.metadata);
  });

  it("returns to /thanks with the session id placeholder", () => {
    expect(params.success_url).toBe(`${ORIGIN}/thanks?session_id={CHECKOUT_SESSION_ID}`);
    expect(params.cancel_url).toBe(`${ORIGIN}/?canceled=1`);
  });
});

describe("buildCheckoutParams: tiers", () => {
  it("builds a monthly subscription from server prices", () => {
    const params = buildCheckoutParams(req({ tier: "regular", name: "Paolo" }), ORIGIN);
    expect(params.mode).toBe("subscription");
    const item = params.line_items?.[0];
    expect(item?.quantity).toBe(1);
    expect(item?.price_data?.unit_amount).toBe(500);
    expect(item?.price_data?.recurring).toEqual({ interval: "month" });
    expect(params.metadata).toEqual({ app: "kape", kind: "tier", tier: "regular", name: "Paolo" });
    expect(params.subscription_data?.metadata).toEqual(params.metadata);
    expect(params.success_url).toBe(`${ORIGIN}/thanks?session_id={CHECKOUT_SESSION_ID}`);
  });

  it("prices barista at $15/month", () => {
    const params = buildCheckoutParams(req({ tier: "barista" }), ORIGIN);
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(1500);
  });
});
