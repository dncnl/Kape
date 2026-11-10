import { afterEach, describe, expect, it, vi } from "vitest";
import { getStripe, isTestKey } from "./stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isTestKey", () => {
  it("accepts sandbox secret and restricted keys", () => {
    expect(isTestKey("sk_test_51Abcdefghijkl")).toBe(true);
    expect(isTestKey("rk_test_51Abcdefghijkl")).toBe(true);
  });

  it("refuses live keys, publishable keys and junk", () => {
    for (const bad of ["sk_live_51Abcdefghijkl", "rk_live_51Abcdefghijkl", "pk_test_51Abcdefghijkl", "", "sk_test_"]) {
      expect(isTestKey(bad), bad).toBe(false);
    }
    expect(isTestKey(undefined)).toBe(false);
  });
});

describe("getStripe", () => {
  it("returns null for a live key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_51Abcdefghijkl");
    expect(getStripe()).toBeNull();
  });

  it("returns null when the key is missing", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(getStripe()).toBeNull();
  });

  it("returns a client for a test key", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_51Abcdefghijkl");
    expect(getStripe()).not.toBeNull();
  });
});
