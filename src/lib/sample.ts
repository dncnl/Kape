import { COFFEE_PRICE_CENTS, TIERS, type TierId } from "./config";
import type { Member, Payment, Support } from "./supporters";
import { supportsToPayments } from "./supporters";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

type SeedSupport = {
  hoursAgo: number;
  coffees: 1 | 3 | 5;
  name: string;
  note: string;
  isPrivate?: boolean;
  refunded?: boolean;
};

const SEED_SUPPORTS: SeedSupport[] = [
  { hoursAgo: 3, coffees: 3, name: "Bea R.", note: "That fiesta series stopped me mid-scroll. Buy all the Portra!" },
  { hoursAgo: 9, coffees: 1, name: "Paolo", note: "Salamat sa inspiration. Shooting my first roll this weekend." },
  { hoursAgo: 20, coffees: 5, name: "Tita Lorna", note: "Proud of you, anak. Para sa lens!" },
  { hoursAgo: 30, coffees: 1, name: "", note: "", isPrivate: true },
  { hoursAgo: 46, coffees: 3, name: "Jun & Carla", note: "We framed your Mt. Arayat print in our sala." },
  { hoursAgo: 70, coffees: 1, name: "Kiko", note: "Kape muna bago scan." },
  { hoursAgo: 95, coffees: 3, name: "Andrea M.", note: "Your lola's kitchen photos made me call mine." },
  { hoursAgo: 130, coffees: 1, name: "R.", note: "", refunded: true },
  { hoursAgo: 160, coffees: 5, name: "Miguel", note: "For the darkroom fund. Keep going." },
  { hoursAgo: 210, coffees: 1, name: "Sam", note: "Grain looks so good on these." },
  { hoursAgo: 280, coffees: 3, name: "Hannah", note: "Discovered you through the Clark zine. Hooked." },
  { hoursAgo: 350, coffees: 1, name: "Someone kind", note: "My secret is safe with Tasa.", isPrivate: true },
  { hoursAgo: 430, coffees: 3, name: "Dindo", note: "Tricycle series is my favourite." },
  { hoursAgo: 520, coffees: 1, name: "Leah", note: "One coffee, many thanks." },
  { hoursAgo: 610, coffees: 5, name: "Carlo V.", note: "Get that 35mm!" },
  { hoursAgo: 690, coffees: 1, name: "Nina", note: "" },
];

type SeedMember = {
  daysAgo: number;
  tier: TierId;
  name: string;
  status?: Member["status"];
  cancelAtPeriodEnd?: boolean;
};

const SEED_MEMBERS: SeedMember[] = [
  { daysAgo: 4, tier: "barista", name: "Tita Lorna" },
  { daysAgo: 12, tier: "regular", name: "Paolo" },
  { daysAgo: 25, tier: "regular", name: "Hannah", cancelAtPeriodEnd: true },
  { daysAgo: 40, tier: "barista", name: "Miguel" },
  { daysAgo: 55, tier: "regular", name: "Jo", status: "past_due" },
  { daysAgo: 80, tier: "regular", name: "Ella", status: "canceled" },
];

export type CreatorData = {
  supports: Support[];
  members: Member[];
  payments: Payment[];
};

/** Demo data anchored to `now`, so the chart and "this month" always look alive. */
export function sampleData(now: number): CreatorData {
  const supports: Support[] = SEED_SUPPORTS.map((s, i) => ({
    id: `sample_support_${i + 1}`,
    createdAt: now - s.hoursAgo * HOUR,
    amountCents: s.coffees * COFFEE_PRICE_CENTS,
    coffees: s.coffees,
    name: s.name,
    note: s.note,
    isPrivate: s.isPrivate ?? false,
    status: s.refunded ? "refunded" : "paid",
  }));

  const members: Member[] = SEED_MEMBERS.map((m, i) => ({
    id: `sample_member_${i + 1}`,
    createdAt: now - m.daysAgo * DAY,
    tier: m.tier,
    name: m.name,
    amountCents: TIERS[m.tier].priceCents,
    status: m.status ?? "active",
    cancelAtPeriodEnd: m.cancelAtPeriodEnd ?? false,
    currentPeriodEnd:
      m.status === "canceled" ? null : now + (30 - (m.daysAgo % 30)) * DAY,
  }));

  // Membership invoices: one per month since joining, while the member was paying.
  const membershipPayments: Payment[] = members.flatMap((m) => {
    const out: Payment[] = [];
    const ageDays = Math.floor((now - m.createdAt) / DAY);
    const paidMonths = m.status === "canceled" ? 1 : Math.floor(ageDays / 30) + 1;
    for (let k = 0; k < paidMonths; k++) {
      out.push({ at: m.createdAt + k * 30 * DAY, amountCents: m.amountCents, kind: "membership" });
    }
    return out;
  });

  return {
    supports,
    members,
    payments: [...supportsToPayments(supports), ...membershipPayments],
  };
}
