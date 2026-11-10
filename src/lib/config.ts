/**
 * All creator content lives here. Swap this file to make Kape someone else's page.
 * Money is integer cents (USD).
 */

export const COFFEE_PRICE_CENTS = 300;
export const COFFEE_OPTIONS = [1, 3, 5] as const;
export type CoffeeCount = (typeof COFFEE_OPTIONS)[number];

export const NAME_MAX = 40;
export const NOTE_MAX = 280;

export const TIERS = {
  regular: {
    id: "regular",
    name: "Regular",
    priceCents: 500,
    tagline: "A cup every month",
    perks: [
      "Monthly contact sheet from the latest roll",
      "Early look at new series",
      "Your name on the supporter wall",
    ],
  },
  barista: {
    id: "barista",
    name: "Barista",
    priceCents: 1500,
    tagline: "Keep the darkroom warm",
    perks: [
      "Everything in Regular",
      "One signed 4×6 print each quarter",
      "Vote on where the next roll gets shot",
      "Behind-the-scenes notes on every scan",
    ],
  },
} as const;

export type TierId = keyof typeof TIERS;
export type Tier = (typeof TIERS)[TierId];
export const TIER_IDS = Object.keys(TIERS) as TierId[];

export const creator = {
  name: "Mara Santos",
  firstName: "Mara",
  initials: "MS",
  role: "Film photographer",
  location: "Pampanga, Philippines",
  headline: {
    sans: "Buy Mara a coffee,",
    serif: "keep the film rolling.",
  },
  bio: "I shoot 35mm around Central Luzon: tricycle drivers at dawn, fiesta lights in San Fernando, my lola's kitchen. Every coffee helps buy film, chemicals and the occasional bus ride to somewhere new.",
  goal: {
    title: "A new 35mm lens",
    description: "A fast 35mm f/2 for low-light street work after sundown.",
    targetCents: 120_000,
  },
  rolls: [
    { frame: "04", caption: "Clark, golden hour", from: "#E9B872", via: "#C8834A", to: "#5A3A26", angle: 160 },
    { frame: "11", caption: "Angeles market", from: "#F2D7B6", via: "#B97B56", to: "#3B2A20", angle: 200 },
    { frame: "17", caption: "Mt. Arayat haze", from: "#D9E0D4", via: "#8FA08A", to: "#3E4A3C", angle: 180 },
    { frame: "22", caption: "Parol workshop", from: "#F7D9A8", via: "#D4664A", to: "#4A1F17", angle: 135 },
    { frame: "28", caption: "Lola's kitchen", from: "#EADBC8", via: "#A98467", to: "#2E241D", angle: 225 },
    { frame: "33", caption: "Pampanga River", from: "#CFE0E3", via: "#6E8E96", to: "#22313A", angle: 190 },
  ],
} as const;

export const site = {
  name: "Kape",
  description: `Buy ${creator.firstName} a coffee. A Stripe-powered tip jar for Filipino creators.`,
  footer:
    "Demo project for portfolio purposes. Payments run in Stripe test mode. Mara Santos is a fictional creator.",
} as const;

export function formatUSD(cents: number, opts: { cents?: boolean } = {}): string {
  const showCents = opts.cents ?? cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(cents / 100);
}
