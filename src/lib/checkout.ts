import type Stripe from "stripe";
import { COFFEE_PRICE_CENTS, TIERS, creator } from "./config";
import type { SupportRequest } from "./pricing";

export const APP_TAG = "kape";

/** Metadata values must be strings; keep keys short and stable. */
export function buildMetadata(req: SupportRequest): Record<string, string> {
  if (req.kind === "tier") {
    return {
      app: APP_TAG,
      kind: "tier",
      tier: req.tier,
      name: req.name,
    };
  }
  return {
    app: APP_TAG,
    kind: "coffee",
    coffees: String(req.coffees),
    name: req.name,
    note: req.note,
    private: req.isPrivate ? "true" : "false",
  };
}

/**
 * Builds Checkout Session params with inline `price_data`, so no products need seeding.
 * Amounts come from server config only.
 */
export function buildCheckoutParams(
  req: SupportRequest,
  origin: string,
): Stripe.Checkout.SessionCreateParams {
  const metadata = buildMetadata(req);
  const success_url = `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/?canceled=1`;

  if (req.kind === "tier") {
    const tier = TIERS[req.tier];
    return {
      mode: "subscription",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: tier.priceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `${tier.name} membership · ${creator.name}`,
              description: tier.tagline,
            },
          },
        },
      ],
      metadata,
      subscription_data: { metadata },
      success_url,
      cancel_url,
    };
  }

  const label = req.coffees === 1 ? "coffee" : "coffees";
  return {
    mode: "payment",
    submit_type: "donate",
    line_items: [
      {
        quantity: req.coffees,
        price_data: {
          currency: "usd",
          unit_amount: COFFEE_PRICE_CENTS,
          product_data: {
            name: `Coffee for ${creator.firstName}`,
            description: `${req.coffees} ${label} to keep the film rolling`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url,
    cancel_url,
  };
}
