import type { Metadata } from "next";
import Link from "next/link";
import { BeanConfetti } from "@/components/bean-confetti";
import { Tasa } from "@/components/tasa";
import { APP_TAG } from "@/lib/checkout";
import { NAME_MAX, TIERS, creator, formatUSD } from "@/lib/config";
import { errorSummary } from "@/lib/data";
import { coffeeLabel } from "@/lib/format";
import { cleanText, isCheckoutSessionId, parseCoffeeCount, parseTier } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Salamat!",
  robots: { index: false },
};

type Summary =
  | { kind: "coffee"; name: string; coffees: number; amountCents: number; processing: boolean }
  | { kind: "tier"; name: string; tierName: string; amountCents: number; sessionId: string }
  | { kind: "generic" };

/** Reads the Checkout Session on the server. Amounts come from Stripe, never from the URL. */
async function loadSummary(raw: string | string[] | undefined): Promise<Summary> {
  if (!isCheckoutSessionId(raw)) return { kind: "generic" };
  const stripe = getStripe();
  if (!stripe) return { kind: "generic" };

  try {
    const session = await stripe.checkout.sessions.retrieve(raw);
    const meta = session.metadata ?? {};
    if (meta.app !== APP_TAG || session.status !== "complete") return { kind: "generic" };
    const name = cleanText(meta.name, NAME_MAX);
    const amountCents = session.amount_total ?? 0;

    if (session.mode === "subscription") {
      const tier = parseTier(meta.tier);
      if (!tier) return { kind: "generic" };
      return { kind: "tier", name, tierName: TIERS[tier].name, amountCents, sessionId: session.id };
    }

    const coffees = parseCoffeeCount(meta.coffees);
    if (!coffees) return { kind: "generic" };
    return {
      kind: "coffee",
      name,
      coffees,
      amountCents,
      processing: session.payment_status !== "paid",
    };
  } catch (error) {
    console.error("[kape] thanks page could not read session:", errorSummary(error));
    return { kind: "generic" };
  }
}

export default async function ThanksPage({ searchParams }: PageProps<"/thanks">) {
  const { session_id } = await searchParams;
  const summary = await loadSummary(session_id);
  const name = summary.kind !== "generic" && summary.name ? summary.name : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-10 pb-16 text-center sm:px-6">
      <BeanConfetti />
      <div className="fade-up">
        <Tasa mood="happy" size={170} />
      </div>

      <h1
        className="fade-up mt-6 text-[clamp(2.4rem,8vw,4rem)] leading-[1.05] font-semibold tracking-tight break-words"
        style={{ "--delay": "100ms" } as React.CSSProperties}
      >
        Salamat{name ? "," : ""}{" "}
        <span className="font-serif font-normal text-roast italic">{name ? `${name}!` : "talaga!"}</span>
      </h1>

      <div
        className="fade-up mt-5 max-w-lg text-lg text-muted"
        style={{ "--delay": "180ms" } as React.CSSProperties}
      >
        {summary.kind === "coffee" && (
          <p>
            You bought {creator.firstName}{" "}
            <strong className="font-semibold text-espresso">{coffeeLabel(summary.coffees)}</strong> (
            {formatUSD(summary.amountCents)}).{" "}
            {summary.processing
              ? "Your payment is still processing; your note will appear once it clears."
              : "Your note will show up on the wall in a few seconds."}
          </p>
        )}
        {summary.kind === "tier" && (
          <p>
            Welcome to the <strong className="font-semibold text-espresso">{summary.tierName}</strong>{" "}
            club. {formatUSD(summary.amountCents)} a month keeps {creator.firstName}&apos;s film rolling.
          </p>
        )}
        {summary.kind === "generic" && (
          <p>Every cup helps {creator.firstName} buy film, chemicals and the next bus ride out.</p>
        )}
      </div>

      <div
        className="fade-up mt-8 flex flex-wrap justify-center gap-3"
        style={{ "--delay": "260ms" } as React.CSSProperties}
      >
        {summary.kind === "tier" && (
          <form method="post" action="/api/portal">
            <input type="hidden" name="session_id" value={summary.sessionId} />
            <button type="submit" className="btn btn-primary">
              Manage membership
            </button>
          </form>
        )}
        <Link href="/#wall-title" className={`btn ${summary.kind === "tier" ? "btn-ghost" : "btn-primary"}`}>
          See the supporter wall
        </Link>
      </div>
    </div>
  );
}
