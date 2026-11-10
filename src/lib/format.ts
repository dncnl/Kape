const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400_000],
  ["month", 30 * 86_400_000],
  ["week", 7 * 86_400_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function timeAgo(at: number, now: number): string {
  const diff = at - now;
  for (const [unit, ms] of STEPS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function formatDate(at: number, timeZone = "Asia/Manila"): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone }).format(at);
}

export function coffeeLabel(n: number): string {
  return `${n} ${n === 1 ? "coffee" : "coffees"}`;
}

/** Only https links are used for LOOM_URL. */
export function safeExternalUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
