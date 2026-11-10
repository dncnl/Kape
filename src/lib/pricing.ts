import {
  COFFEE_OPTIONS,
  COFFEE_PRICE_CENTS,
  NAME_MAX,
  NOTE_MAX,
  TIERS,
  type CoffeeCount,
  type TierId,
} from "./config";

/**
 * Everything the browser can ask for. Note what is missing: amounts.
 * Prices are looked up here on the server and nowhere else.
 */
export type SupportRequest =
  | {
      kind: "coffee";
      coffees: CoffeeCount;
      amountCents: number;
      name: string;
      note: string;
      isPrivate: boolean;
    }
  | {
      kind: "tier";
      tier: TierId;
      amountCents: number;
      name: string;
    };

/** Accepts only the exact strings "1", "3" or "5" (or those numbers). */
export function parseCoffeeCount(input: unknown): CoffeeCount | null {
  if (typeof input !== "string" && typeof input !== "number") return null;
  const raw = String(input).trim();
  if (!/^[0-9]$/.test(raw)) return null;
  const n = Number(raw);
  return (COFFEE_OPTIONS as readonly number[]).includes(n) ? (n as CoffeeCount) : null;
}

/** Own-property lookup, so `toString`, `__proto__` and friends are rejected. */
export function parseTier(input: unknown): TierId | null {
  if (typeof input !== "string") return null;
  return Object.hasOwn(TIERS, input) ? (input as TierId) : null;
}

export function coffeeAmountCents(coffees: CoffeeCount): number {
  return coffees * COFFEE_PRICE_CENTS;
}

/** Collapse whitespace, drop control characters, cap length. */
export function cleanText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  return Array.from(
    input
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, max)
    .join("")
    .trim();
}

function isChecked(value: unknown): boolean {
  return value === "on" || value === "true" || value === "1";
}

type FormLike = { get(name: string): unknown };

/**
 * Turns a posted form into a SupportRequest, or null if anything is off.
 * Any `amount`, `price` or `unit_amount` field the client sends is ignored.
 */
export function parseSupportForm(form: FormLike): SupportRequest | null {
  const tierField = form.get("tier");
  const coffeeField = form.get("coffees");

  // Exactly one of the two must be present.
  const hasTier = tierField !== null && tierField !== undefined && tierField !== "";
  const hasCoffee = coffeeField !== null && coffeeField !== undefined && coffeeField !== "";
  if (hasTier === hasCoffee) return null;

  const name = cleanText(form.get("name"), NAME_MAX);

  if (hasTier) {
    const tier = parseTier(tierField);
    if (!tier) return null;
    return { kind: "tier", tier, amountCents: TIERS[tier].priceCents, name };
  }

  const coffees = parseCoffeeCount(coffeeField);
  if (!coffees) return null;
  return {
    kind: "coffee",
    coffees,
    amountCents: coffeeAmountCents(coffees),
    name,
    note: cleanText(form.get("note"), NOTE_MAX),
    isPrivate: isChecked(form.get("private")),
  };
}

const SESSION_ID = /^cs_test_[A-Za-z0-9]{8,200}$/;

/** Checkout Session ids from URLs or forms must look like sandbox ids. */
export function isCheckoutSessionId(input: unknown): input is string {
  return typeof input === "string" && SESSION_ID.test(input);
}
