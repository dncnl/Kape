import "server-only";
import Stripe from "stripe";

/** Only sandbox/test keys are ever accepted. There is no live-key path. */
export function isTestKey(key: string | undefined | null): key is string {
  return typeof key === "string" && /^(sk|rk)_test_[A-Za-z0-9_]{8,}$/.test(key.trim());
}

let client: Stripe | null = null;
let clientKey: string | null = null;

/**
 * Returns a Stripe client, or null when the key is missing or not a test key.
 * Callers must treat null as "demo mode".
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!isTestKey(key)) return null;
  if (!client || clientKey !== key) {
    client = new Stripe(key, {
      maxNetworkRetries: 1,
      timeout: 8000,
      appInfo: { name: "kape", url: "https://github.com/dncnl" },
    });
    clientKey = key;
  }
  return client;
}

export function getWebhookSecret(): string | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return secret && secret.startsWith("whsec_") ? secret : null;
}
