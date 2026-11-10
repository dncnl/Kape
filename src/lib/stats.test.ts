import { describe, expect, it } from "vitest";
import { sampleData } from "./sample";
import { computeStats, dailySeries, goalProgress } from "./stats";
import type { Member, Payment, Support } from "./supporters";

const NOW = Date.UTC(2026, 10, 10, 12, 0, 0); // 10 Nov 2026, 12:00 UTC
const DAY = 86_400_000;

const support = (over: Partial<Support>): Support => ({
  id: "s",
  createdAt: NOW,
  amountCents: 300,
  coffees: 1,
  name: "",
  note: "",
  isPrivate: false,
  status: "paid",
  ...over,
});

const member = (over: Partial<Member>): Member => ({
  id: "m",
  createdAt: NOW,
  tier: "regular",
  name: "",
  amountCents: 500,
  status: "active",
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  ...over,
});

describe("computeStats", () => {
  const supports = [
    support({ coffees: 3, amountCents: 900 }),
    support({ coffees: 5, amountCents: 1500, status: "refunded" }),
    support({ coffees: 1, amountCents: 300, createdAt: Date.UTC(2026, 9, 20) }),
  ];
  const members = [
    member({ amountCents: 500 }),
    member({ amountCents: 1500, tier: "barista" }),
    member({ amountCents: 500, cancelAtPeriodEnd: true }),
    member({ amountCents: 500, status: "past_due" }),
    member({ amountCents: 1500, status: "canceled" }),
  ];
  const payments: Payment[] = [
    { at: NOW, amountCents: 900, kind: "coffee" },
    { at: Date.UTC(2026, 9, 20), amountCents: 300, kind: "coffee" },
    { at: NOW - DAY, amountCents: 1500, kind: "membership" },
  ];
  const stats = computeStats({ supports, members, payments }, NOW, "UTC");

  it("sums lifetime and this month", () => {
    expect(stats.lifetimeCents).toBe(2700);
    expect(stats.monthCents).toBe(2400);
  });

  it("counts coffees from paid supports only", () => {
    expect(stats.coffees).toBe(4);
  });

  it("counts active members and MRR without scheduled cancellations", () => {
    expect(stats.activeMembers).toBe(3);
    expect(stats.mrrCents).toBe(2000);
  });

  it("builds a 30-day series ending today", () => {
    expect(stats.daily).toHaveLength(30);
    expect(stats.daily.at(-1)).toEqual({ date: "2026-11-10", cents: 900 });
    expect(stats.daily.at(-2)).toEqual({ date: "2026-11-09", cents: 1500 });
    expect(stats.daily[0].date).toBe("2026-10-12");
  });
});

describe("dailySeries", () => {
  it("ignores payments older than the window", () => {
    const series = dailySeries([{ at: NOW - 40 * DAY, amountCents: 999, kind: "coffee" }], NOW, 30, "UTC");
    expect(series.reduce((s, d) => s + d.cents, 0)).toBe(0);
  });

  it("buckets by the creator's time zone", () => {
    // 20:00 UTC on 9 Nov is already 10 Nov in Manila (UTC+8).
    const at = Date.UTC(2026, 10, 9, 20);
    const series = dailySeries([{ at, amountCents: 300, kind: "coffee" }], NOW, 30, "Asia/Manila");
    expect(series.find((d) => d.date === "2026-11-10")?.cents).toBe(300);
  });
});

describe("goalProgress", () => {
  it("uses paid supports and clamps to 1", () => {
    const { raisedCents, ratio } = goalProgress(
      [support({ amountCents: 60_000 }), support({ amountCents: 900, status: "refunded" })],
      120_000,
    );
    expect(raisedCents).toBe(60_000);
    expect(ratio).toBe(0.5);
    expect(goalProgress([support({ amountCents: 500_000 })], 120_000).ratio).toBe(1);
  });
});

describe("sampleData", () => {
  it("produces a believable demo", () => {
    const data = sampleData(NOW);
    const stats = computeStats(data, NOW);
    expect(data.supports.some((s) => s.status === "refunded")).toBe(true);
    expect(data.supports.some((s) => s.isPrivate)).toBe(true);
    expect(stats.activeMembers).toBeGreaterThan(0);
    expect(stats.daily.some((d) => d.cents > 0)).toBe(true);
  });
});
