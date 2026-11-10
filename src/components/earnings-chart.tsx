import { formatUSD } from "@/lib/config";
import type { DailyPoint } from "@/lib/stats";

const W = 600;
const H = 180;
const GAP = 2; // px surface gap between adjacent bars (in viewBox units ≈ px at ~600px wide)

function niceMax(cents: number): number {
  if (cents <= 0) return 1000;
  const dollars = cents / 100;
  const pow = 10 ** Math.floor(Math.log10(dollars));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= dollars) ?? 10 * pow;
  return step * 100;
}

function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    Date.UTC(y, m - 1, d),
  );
}

/**
 * 30-day daily earnings. Bars in SVG; axis text in HTML so it stays small and
 * readable at any width. Each day has a full-height hover target with a <title> tooltip.
 */
export function EarningsChart({ daily }: { daily: DailyPoint[] }) {
  const max = niceMax(Math.max(0, ...daily.map((d) => d.cents)));
  const slot = W / daily.length;
  const barW = Math.max(1, slot - GAP);
  const total = daily.reduce((s, d) => s + d.cents, 0);
  const mid = daily[Math.floor(daily.length / 2)];

  return (
    <figure className="card p-6 sm:p-8">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Daily earnings, last 30 days</h2>
        <p className="text-sm text-muted">
          {formatUSD(total)} total · coffees and memberships
        </p>
      </figcaption>

      <div className="mt-6 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="flex h-44 flex-col justify-between text-right text-xs text-muted tabular-nums sm:h-52">
          <span>{formatUSD(max)}</span>
          <span>{formatUSD(max / 2)}</span>
          <span>$0</span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-44 w-full overflow-visible sm:h-52"
          role="img"
          aria-label={`Bar chart of daily earnings for the last 30 days, ${formatUSD(total)} in total.`}
        >
          {/* Recessive grid */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={0}
              x2={W}
              y1={H * t}
              y2={H * t}
              stroke="var(--color-line)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={t === 1 ? undefined : "3 4"}
            />
          ))}

          {daily.map((d, i) => {
            const h = d.cents > 0 ? Math.max(3, (d.cents / max) * H) : 0;
            const x = i * slot + GAP / 2;
            const r = Math.min(4, barW / 2, h);
            const y = H - h;
            const label = `${shortDate(d.date)}: ${formatUSD(d.cents, { cents: d.cents % 100 !== 0 })}`;
            return (
              <g key={d.date} className="group">
                <title>{label}</title>
                {/* Hit target bigger than the mark */}
                <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
                <rect
                  x={i * slot}
                  y={0}
                  width={slot}
                  height={H}
                  className="fill-roast/0 transition-colors group-hover:fill-roast/[0.06]"
                />
                {h > 0 && (
                  <path
                    // Rounded data-end at the top, square at the baseline.
                    d={`M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${H} Z`}
                    className="fill-roast transition-colors group-hover:fill-crema"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div />
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{shortDate(daily[0].date)}</span>
          <span className="hidden sm:inline">{shortDate(mid.date)}</span>
          <span>Today</span>
        </div>
      </div>
    </figure>
  );
}
