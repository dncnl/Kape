import { coffeeLabel, timeAgo } from "@/lib/format";
import { ANONYMOUS, type WallEntry } from "@/lib/supporters";
import { CupIcon } from "./cup-icon";
import { Tasa } from "./tasa";

export function SupporterWall({ entries, now }: { entries: WallEntry[]; now: number }) {
  return (
    <section aria-labelledby="wall-title" className="mx-auto max-w-6xl px-4 sm:px-6">
      <p className="eyebrow">Supporter wall</p>
      <h2 id="wall-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
        Kind words, <span className="font-serif font-normal italic">warm cups</span>
      </h2>

      {entries.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <Tasa mood="idle" size={110} />
          <p className="text-lg font-medium">No coffees yet. Tasa is waiting by the window.</p>
          <p className="text-muted">Be the first to leave a note.</p>
        </div>
      ) : (
        <ul className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {entries.map((entry) => (
            <li key={entry.id} className="card card-lift mb-4 break-inside-avoid p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-sm font-semibold text-roast ring-1 ring-line"
                >
                  {entry.displayName === ANONYMOUS ? (
                    <CupIcon className="size-5" />
                  ) : (
                    entry.displayName.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {entry.displayName}{" "}
                    <span className="font-normal text-muted">bought {coffeeLabel(entry.coffees)}</span>
                  </p>
                  <p className="text-xs text-muted">
                    <time dateTime={new Date(entry.createdAt).toISOString()}>
                      {timeAgo(entry.createdAt, now)}
                    </time>
                  </p>
                </div>
              </div>
              {entry.note && (
                <p className="mt-3 font-serif text-xl leading-snug break-words italic">
                  “{entry.note}”
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
