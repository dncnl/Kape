"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

/** Fixed copy only. URL text is never echoed onto the page. */
const MESSAGES = {
  canceled: "No worries, checkout was canceled. Tasa will keep the cup warm.",
  paused: "Payments are napping right now, so checkout is switched off. Please try again later.",
  invalid: "Something in that form didn't look right. Pick 1, 3 or 5 coffees (or a membership) and try again.",
} as const;

export function Notice() {
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  const key: keyof typeof MESSAGES | null =
    params.get("error") === "invalid"
      ? "invalid"
      : params.get("paused") === "1"
        ? "paused"
        : params.get("canceled") === "1"
          ? "canceled"
          : null;

  if (!key || dismissed) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
      <div
        role="status"
        className="card flex items-start justify-between gap-4 border-crema/50 px-5 py-4"
      >
        <p>{MESSAGES[key]}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="-m-1 shrink-0 rounded-full p-1 text-muted hover:text-espresso"
          aria-label="Dismiss notice"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
