import { creator } from "@/lib/config";

/** Six abstract film frames drawn with CSS gradients. No stock photos. */
export function RecentRolls() {
  return (
    <section aria-labelledby="rolls-title" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">From the contact sheet</p>
          <h2 id="rolls-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
            Recent <span className="font-serif font-normal italic">rolls</span>
          </h2>
        </div>
        <p className="hidden font-mono text-xs text-muted sm:block">KODAK PORTRA 400 · 36 EXP</p>
      </div>

      <div className="film-strip mt-6 rounded-3xl bg-espresso px-3 py-7 sm:px-5">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {creator.rolls.map((roll) => (
            <li key={roll.frame} className="group min-w-0">
              <figure>
                <div
                  className="aspect-[3/2] rounded-md ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: `radial-gradient(120% 80% at 30% 20%, ${roll.from}cc 0%, transparent 60%), linear-gradient(${roll.angle}deg, ${roll.from} 0%, ${roll.via} 48%, ${roll.to} 100%)`,
                  }}
                  role="img"
                  aria-label={`Abstract frame: ${roll.caption}`}
                />
                <figcaption className="mt-2 flex items-baseline justify-between gap-2 text-milk/80">
                  <span className="truncate text-xs">{roll.caption}</span>
                  <span className="shrink-0 font-mono text-[11px] text-crema">{roll.frame}A</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
