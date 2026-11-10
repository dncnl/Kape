import type { Member, Payment, Support } from "./supporters";

export const DEFAULT_TIME_ZONE = "Asia/Manila";
const DAY_MS = 86_400_000;

export type DailyPoint = { date: string; cents: number };

export type Stats = {
  lifetimeCents: number;
  monthCents: number;
  coffees: number;
  activeMembers: number;
  mrrCents: number;
  daily: DailyPoint[];
};

/** YYYY-MM-DD in the given time zone. */
export function dayKey(at: number, timeZone = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

function monthKey(at: number, timeZone: string): string {
  return dayKey(at, timeZone).slice(0, 7);
}

/** Oldest first, `days` entries ending today. */
export function dailySeries(
  payments: Payment[],
  now: number,
  days = 30,
  timeZone = DEFAULT_TIME_ZONE,
): DailyPoint[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(now - i * DAY_MS, timeZone);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }
  const totals = new Map(keys.map((k) => [k, 0]));
  for (const p of payments) {
    const key = dayKey(p.at, timeZone);
    const current = totals.get(key);
    if (current !== undefined) totals.set(key, current + p.amountCents);
  }
  return keys.map((date) => ({ date, cents: totals.get(date) ?? 0 }));
}

export function computeStats(
  input: { supports: Support[]; members: Member[]; payments: Payment[] },
  now: number,
  timeZone = DEFAULT_TIME_ZONE,
): Stats {
  const thisMonth = monthKey(now, timeZone);
  let lifetimeCents = 0;
  let monthCents = 0;
  for (const p of input.payments) {
    lifetimeCents += p.amountCents;
    if (monthKey(p.at, timeZone) === thisMonth) monthCents += p.amountCents;
  }

  const coffees = input.supports
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.coffees, 0);

  const active = input.members.filter((m) => m.status === "active");
  // MRR counts members who will keep paying: scheduled cancellations are excluded.
  const mrrCents = active
    .filter((m) => !m.cancelAtPeriodEnd)
    .reduce((sum, m) => sum + m.amountCents, 0);

  return {
    lifetimeCents,
    monthCents,
    coffees,
    activeMembers: active.length,
    mrrCents,
    daily: dailySeries(input.payments, now, 30, timeZone),
  };
}

/** Goal progress from paid (non-refunded) coffee supports, 0..1. */
export function goalProgress(supports: Support[], targetCents: number): {
  raisedCents: number;
  ratio: number;
} {
  const raisedCents = supports
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amountCents, 0);
  const ratio = targetCents > 0 ? Math.min(1, Math.max(0, raisedCents / targetCents)) : 0;
  return { raisedCents, ratio };
}
