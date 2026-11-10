import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { POST } = await import("./route");

const SECRET = "whsec_test_kape_secret_value";
const URL = "http://localhost:3000/api/stripe/webhook";

function eventBody(type: string) {
  return JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type,
    api_version: Stripe.API_VERSION,
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "cs_test_abc12345", object: "checkout.session" } },
  });
}

function signed(payload: string, secret = SECRET): string {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret });
}

function post(body: string, headers: Record<string, string> = {}) {
  return POST(new Request(URL, { method: "POST", body, headers }));
}

beforeEach(() => {
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", SECRET);
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/stripe/webhook", () => {
  it("accepts a valid signature, returns 200 and revalidates / and /dashboard", async () => {
    const body = eventBody("checkout.session.completed");
    const res = await post(body, { "stripe-signature": signed(body) });
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it.each([
    "checkout.session.async_payment_succeeded",
    "invoice.paid",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "charge.refunded",
  ])("revalidates on %s", async (type) => {
    const body = eventBody(type);
    const res = await post(body, { "stripe-signature": signed(body) });
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("acknowledges unrelated events without revalidating", async () => {
    const body = eventBody("customer.created");
    const res = await post(body, { "stripe-signature": signed(body) });
    expect(res.status).toBe(200);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("treats repeated deliveries as harmless", async () => {
    const body = eventBody("charge.refunded");
    const header = signed(body);
    const first = await post(body, { "stripe-signature": header });
    const second = await post(body, { "stripe-signature": header });
    expect([first.status, second.status]).toEqual([200, 200]);
    expect(revalidatePath).toHaveBeenCalledTimes(4);
  });

  it("rejects a missing signature with 400", async () => {
    const res = await post(eventBody("checkout.session.completed"));
    expect(res.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a signature made with the wrong secret with 400", async () => {
    const body = eventBody("checkout.session.completed");
    const res = await post(body, { "stripe-signature": signed(body, "whsec_attacker") });
    expect(res.status).toBe(400);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a tampered body with 400", async () => {
    const body = eventBody("checkout.session.completed");
    const header = signed(body);
    const res = await post(body.replace("cs_test_abc12345", "cs_test_evil0000"), {
      "stripe-signature": header,
    });
    expect(res.status).toBe(400);
  });

  it("rejects a garbage signature header with 400", async () => {
    const res = await post(eventBody("invoice.paid"), { "stripe-signature": "t=1,v1=nope" });
    expect(res.status).toBe(400);
  });
});
