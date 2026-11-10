import { describe, expect, it } from "vitest";
import {
  cleanText,
  isCheckoutSessionId,
  parseCoffeeCount,
  parseSupportForm,
  parseTier,
} from "./pricing";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("parseCoffeeCount", () => {
  it("accepts 1, 3 and 5", () => {
    expect(parseCoffeeCount("1")).toBe(1);
    expect(parseCoffeeCount("3")).toBe(3);
    expect(parseCoffeeCount("5")).toBe(5);
    expect(parseCoffeeCount(3)).toBe(3);
  });

  it("rejects 2 coffees and other counts", () => {
    for (const bad of ["2", "0", "4", "6", "10", "-1", "3.0", "1e0", " 3 x", "", "03"]) {
      expect(parseCoffeeCount(bad), bad).toBeNull();
    }
  });

  it("rejects non-strings", () => {
    expect(parseCoffeeCount(null)).toBeNull();
    expect(parseCoffeeCount(undefined)).toBeNull();
    expect(parseCoffeeCount({ valueOf: () => 3 })).toBeNull();
    expect(parseCoffeeCount(["3"])).toBeNull();
  });
});

describe("parseTier", () => {
  it("accepts known tiers", () => {
    expect(parseTier("regular")).toBe("regular");
    expect(parseTier("barista")).toBe("barista");
  });

  it("rejects unknown tiers, including inherited Object keys", () => {
    for (const bad of [
      "toString",
      "constructor",
      "__proto__",
      "hasOwnProperty",
      "valueOf",
      "Regular",
      "gold",
      "",
    ]) {
      expect(parseTier(bad), bad).toBeNull();
    }
    expect(parseTier(1)).toBeNull();
  });
});

describe("parseSupportForm", () => {
  it("prices coffees on the server", () => {
    const req = parseSupportForm(form({ coffees: "3", name: "Bea", note: "Para sa film!" }));
    expect(req).toEqual({
      kind: "coffee",
      coffees: 3,
      amountCents: 900,
      name: "Bea",
      note: "Para sa film!",
      isPrivate: false,
    });
  });

  it("ignores tampered amounts sent by the client", () => {
    const req = parseSupportForm(
      form({ coffees: "1", amount: "1", unit_amount: "1", price: "0.01", amountCents: "1" }),
    );
    expect(req?.amountCents).toBe(300);
  });

  it("rejects 2 coffees", () => {
    expect(parseSupportForm(form({ coffees: "2" }))).toBeNull();
  });

  it("rejects unknown tiers, including toString", () => {
    expect(parseSupportForm(form({ tier: "toString" }))).toBeNull();
    expect(parseSupportForm(form({ tier: "platinum" }))).toBeNull();
  });

  it("prices tiers on the server", () => {
    expect(parseSupportForm(form({ tier: "barista", name: "Lorna", amount: "1" }))).toEqual({
      kind: "tier",
      tier: "barista",
      amountCents: 1500,
      name: "Lorna",
    });
  });

  it("requires exactly one of coffees or tier", () => {
    expect(parseSupportForm(form({}))).toBeNull();
    expect(parseSupportForm(form({ coffees: "1", tier: "regular" }))).toBeNull();
  });

  it("reads the privacy toggle", () => {
    expect(parseSupportForm(form({ coffees: "1", private: "on" }))).toMatchObject({
      isPrivate: true,
    });
  });

  it("caps name at 40 and note at 280 characters", () => {
    const req = parseSupportForm(
      form({ coffees: "1", name: "n".repeat(100), note: "x".repeat(1000) }),
    );
    expect(req?.kind).toBe("coffee");
    if (req?.kind !== "coffee") return;
    expect(req.name).toHaveLength(40);
    expect(req.note).toHaveLength(280);
  });
});

describe("cleanText", () => {
  it("collapses whitespace and strips control characters", () => {
    expect(cleanText("  hi\n\tthere\u0000 ", 40)).toBe("hi there");
  });

  it("does not split emoji when truncating", () => {
    expect(cleanText("☕☕☕", 2)).toBe("☕☕");
  });

  it("returns empty string for non-strings", () => {
    expect(cleanText(undefined, 10)).toBe("");
    expect(cleanText(42, 10)).toBe("");
  });
});

describe("isCheckoutSessionId", () => {
  it("accepts sandbox session ids only", () => {
    expect(isCheckoutSessionId("cs_test_a1B2c3D4e5F6g7H8")).toBe(true);
    expect(isCheckoutSessionId("cs_live_a1B2c3D4e5F6g7H8")).toBe(false);
    expect(isCheckoutSessionId("cs_test_<script>")).toBe(false);
    expect(isCheckoutSessionId("cs_test_abc")).toBe(false);
    expect(isCheckoutSessionId(undefined)).toBe(false);
  });
});
