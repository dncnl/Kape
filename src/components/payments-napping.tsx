import { Tasa } from "./tasa";

/** Shown instead of pay buttons when Stripe is unavailable (no keys, bad keys, expired sandbox). */
export function PaymentsNapping({
  loomUrl,
  compact = false,
}: {
  loomUrl: string | null;
  compact?: boolean;
}) {
  return (
    <div
      className={`card flex flex-col items-center text-center ${compact ? "gap-3 p-6" : "gap-4 p-8"}`}
    >
      <Tasa mood="sleepy" size={compact ? 96 : 132} />
      <div>
        <h3 className="text-xl font-semibold">
          Payments are <span className="font-serif font-normal italic">napping</span>
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-muted">
          The Stripe sandbox behind this demo is resting, so checkout is switched off. Everything
          you see below is sample data.
        </p>
      </div>
      {loomUrl && (
        <a href={loomUrl} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
          Watch the 2-minute walkthrough
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
