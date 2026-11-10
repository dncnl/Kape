import "server-only";
import type Stripe from "stripe";
import { creator } from "./config";
import { APP_TAG } from "./checkout";

let cachedConfigId: string | null = null;

/**
 * The sandbox has no Dashboard, so the Customer Portal is configured through the API.
 * Created once (tagged metadata.app = "kape") and reused after that.
 */
export async function getPortalConfigurationId(stripe: Stripe): Promise<string> {
  if (cachedConfigId) return cachedConfigId;

  const existing = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
  const ours = existing.data.find((c) => c.metadata?.app === APP_TAG);
  if (ours) {
    cachedConfigId = ours.id;
    return ours.id;
  }

  const created = await stripe.billingPortal.configurations.create({
    name: "Kape memberships",
    metadata: { app: APP_TAG },
    business_profile: {
      headline: `Manage your membership with ${creator.name}`,
    },
    features: {
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  });
  cachedConfigId = created.id;
  return created.id;
}
