import { APP_TAG } from "@/lib/checkout";
import { errorSummary } from "@/lib/data";
import { getPortalConfigurationId } from "@/lib/portal";
import { isCheckoutSessionId } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

/**
 * "Manage membership" on /thanks POSTs the Checkout Session id here.
 * The customer is read from Stripe, never from the form.
 */
export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const fail = (query: string) => Response.redirect(`${origin}/?${query}#memberships`, 303);

  let sessionId: FormDataEntryValue | null = null;
  try {
    sessionId = (await request.formData()).get("session_id");
  } catch {
    return fail("error=invalid");
  }
  if (!isCheckoutSessionId(sessionId)) return fail("error=invalid");

  const stripe = getStripe();
  if (!stripe) return fail("paused=1");

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (session.metadata?.app !== APP_TAG || session.mode !== "subscription" || !customer) {
      return fail("error=invalid");
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer,
      configuration: await getPortalConfigurationId(stripe),
      return_url: `${origin}/thanks?session_id=${encodeURIComponent(sessionId)}`,
    });
    return Response.redirect(portal.url, 303);
  } catch (error) {
    console.error("[kape] portal failed:", errorSummary(error));
    return fail("paused=1");
  }
}
