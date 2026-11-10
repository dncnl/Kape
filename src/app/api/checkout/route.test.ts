import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const URL = "http://localhost:3000/api/checkout";

function post(fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return POST(
    new Request(URL, {
      method: "POST",
      body,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/checkout", () => {
  it("redirects invalid input back with a fixed error flag", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_51Abcdefghijkl");
    const res = await post({ coffees: "2" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/?error=invalid#support");
  });

  it("rejects unknown tiers like toString", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_51Abcdefghijkl");
    const res = await post({ tier: "toString" });
    expect(res.headers.get("location")).toBe("http://localhost:3000/?error=invalid#memberships");
  });

  it("pauses payments when no key is configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const res = await post({ coffees: "3" });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/?paused=1#support");
  });

  it("pauses payments for live keys rather than using them", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_51Abcdefghijkl");
    const res = await post({ coffees: "1" });
    expect(res.headers.get("location")).toBe("http://localhost:3000/?paused=1#support");
  });
});
