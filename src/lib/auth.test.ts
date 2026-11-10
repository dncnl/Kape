import { describe, expect, it } from "vitest";
import { SESSION_SECONDS, cookieOptions, hashPassword, isAuthorizedCookie, verifyPassword } from "./auth";

describe("dashboard auth", () => {
  it("hashes with SHA-256 and never stores the password", () => {
    const hash = hashPassword("kapeng-barako");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("kapeng-barako");
  });

  it("verifies the right password only", () => {
    expect(verifyPassword("kapeng-barako", "kapeng-barako")).toBe(true);
    expect(verifyPassword("kapeng-barak", "kapeng-barako")).toBe(false);
    expect(verifyPassword("", "kapeng-barako")).toBe(false);
    expect(verifyPassword("anything", null)).toBe(false);
    expect(verifyPassword(undefined, "x")).toBe(false);
  });

  it("accepts only a cookie matching the current password hash", () => {
    const pw = "kapeng-barako";
    expect(isAuthorizedCookie(hashPassword(pw), pw)).toBe(true);
    expect(isAuthorizedCookie(hashPassword("old-password"), pw)).toBe(false);
    expect(isAuthorizedCookie(pw, pw)).toBe(false);
    expect(isAuthorizedCookie(undefined, pw)).toBe(false);
    expect(isAuthorizedCookie(hashPassword(pw), null)).toBe(false);
  });

  it("sets httpOnly, lax, 8-hour cookies, secure on https", () => {
    const http = cookieOptions(new Request("http://localhost:3000/api/dashboard/login"));
    expect(http).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false, maxAge: SESSION_SECONDS });
    expect(SESSION_SECONDS).toBe(28_800);
    expect(cookieOptions(new Request("https://kape.vercel.app/api/dashboard/login")).secure).toBe(true);
    const proxied = new Request("http://internal/api/dashboard/login", { headers: { "x-forwarded-proto": "https" } });
    expect(cookieOptions(proxied).secure).toBe(true);
  });
});
