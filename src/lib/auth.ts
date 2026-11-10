import { createHash, timingSafeEqual } from "node:crypto";

export const DASHBOARD_COOKIE = "kape_dashboard";
export const SESSION_SECONDS = 8 * 60 * 60;

/** The cookie holds a SHA-256 hash, never the password itself. */
export function hashPassword(password: string): string {
  return createHash("sha256").update(`kape-dashboard:${password}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // Different lengths can't match; compare against itself to keep timing flat.
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function getDashboardPassword(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD;
  return pw && pw.length > 0 ? pw : null;
}

/** Checks a submitted password against DASHBOARD_PASSWORD. */
export function verifyPassword(input: unknown, password: string | null): boolean {
  if (!password || typeof input !== "string" || input.length === 0 || input.length > 512) return false;
  return safeEqualHex(hashPassword(input), hashPassword(password));
}

/** Checks the cookie value against the hash of DASHBOARD_PASSWORD. */
export function isAuthorizedCookie(cookieValue: string | undefined, password: string | null): boolean {
  if (!password || !cookieValue || !/^[a-f0-9]{64}$/.test(cookieValue)) return false;
  return safeEqualHex(cookieValue, hashPassword(password));
}

export function cookieOptions(request: Request) {
  const url = new URL(request.url);
  const secure =
    url.protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
