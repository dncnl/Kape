import { buildCheckoutParams } from "@/lib/checkout";
import { errorSummary } from "@/lib/data";
import { parseSupportForm } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

function back(origin: string, query: string, hash = "support"): Response {
  return Response.redirect(`${origin}/?${query}#${hash}`, 303);
}

/**
 * Plain form POST (works without JavaScript).
 * The browser sends a coffee count or a tier id; prices are looked up on the server.
 */
export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(origin, "error=invalid");
  }

  const hash = form.has("tier") ? "memberships" : "support";
  const support = parseSupportForm(form);
  if (!support) return back(origin, "error=invalid", hash);

  const stripe = getStripe();
  if (!stripe) return back(origin, "paused=1", hash);

  try {
    const session = await stripe.checkout.sessions.create(buildCheckoutParams(support, origin));
    if (!session.url) return back(origin, "paused=1", hash);
    return Response.redirect(session.url, 303);
  } catch (error) {
    console.error("[kape] checkout failed:", errorSummary(error));
    return back(origin, "paused=1", hash);
  }
}
