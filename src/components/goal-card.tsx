import { creator, formatUSD } from "@/lib/config";

export function GoalCard({ raisedCents, ratio }: { raisedCents: number; ratio: number }) {
  const percent = Math.round(ratio * 100);
  return (
    <section aria-labelledby="goal-title" className="card card-lift p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Current goal</p>
          <h2 id="goal-title" className="mt-2 text-xl font-semibold sm:text-2xl">
            {creator.goal.title}
          </h2>
          <p className="mt-1 text-muted">{creator.goal.description}</p>
        </div>
        <p className="font-serif text-5xl leading-none text-roast italic" aria-hidden="true">
          {percent}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-labelledby="goal-title"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${formatUSD(raisedCents)} of ${formatUSD(creator.goal.targetCents)} raised`}
        className="mt-6 h-3 overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-roast to-crema transition-[width] duration-1000"
          style={{ width: `${Math.max(percent, raisedCents > 0 ? 2 : 0)}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-espresso">{formatUSD(raisedCents)}</span> raised of{" "}
        {formatUSD(creator.goal.targetCents)}
      </p>
    </section>
  );
}
