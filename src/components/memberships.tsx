import { NAME_MAX, TIERS, TIER_IDS, formatUSD } from "@/lib/config";
import { PaymentsNapping } from "./payments-napping";

export function Memberships({ live, loomUrl }: { live: boolean; loomUrl: string | null }) {
  return (
    <section
      id="memberships"
      aria-labelledby="memberships-title"
      className="mx-auto max-w-6xl scroll-mt-8 px-4 sm:px-6"
    >
      <p className="eyebrow">Memberships</p>
      <h2 id="memberships-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
        Become a <span className="font-serif font-normal italic">regular</span>
      </h2>
      <p className="mt-2 max-w-xl text-muted">
        A monthly cup keeps the film budget steady. Cancel anytime from the membership portal.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {TIER_IDS.map((id) => {
          const tier = TIERS[id];
          const featured = id === "barista";
          return (
            <article
              key={id}
              aria-labelledby={`tier-${id}`}
              className={`card card-lift flex min-w-0 flex-col p-6 sm:p-8 ${featured ? "ring-1 ring-crema/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id={`tier-${id}`} className="text-xl font-semibold">
                    {tier.name}
                  </h3>
                  <p className="text-muted">{tier.tagline}</p>
                </div>
                {featured && (
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium text-roast ring-1 ring-line">
                    Most loved
                  </span>
                )}
              </div>
              <p className="mt-5">
                <span className="font-serif text-5xl italic">{formatUSD(tier.priceCents)}</span>
                <span className="text-muted"> / month</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-crema" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {live && (
                <form method="post" action="/api/checkout" className="mt-auto pt-7">
                  <input type="hidden" name="tier" value={id} />
                  <label htmlFor={`tier-name-${id}`} className="text-sm font-medium">
                    Your name <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    id={`tier-name-${id}`}
                    name="name"
                    maxLength={NAME_MAX}
                    autoComplete="nickname"
                    className="field mt-1.5"
                    placeholder="How Mara should thank you"
                  />
                  <button type="submit" className={`btn mt-4 w-full ${featured ? "btn-primary" : "btn-ghost"}`}>
                    Join as {tier.name} · {formatUSD(tier.priceCents)}/mo
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </div>

      {!live && (
        <div className="mt-5">
          <PaymentsNapping loomUrl={loomUrl} compact />
        </div>
      )}
    </section>
  );
}
