import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { getWebhookSecret } from "@/lib/stripe";

/** Events that change what the wall or the dashboard shows. */
const REVALIDATE_EVENTS = new Set<string>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
]);

/**
 * Stripe is the database, so a webhook only has to say "something changed".
 * Revalidating a path is idempotent: repeated or out-of-order deliveries are harmless.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = getWebhookSecret();
  if (!secret) {
    return Response.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  // The signature covers the exact raw bytes, so read text, never JSON.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const revalidated = REVALIDATE_EVENTS.has(event.type);
  if (revalidated) {
    revalidatePath("/");
    revalidatePath("/dashboard");
  }

  return Response.json({ received: true, type: event.type, revalidated });
}
