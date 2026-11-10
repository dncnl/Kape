import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE, cookieOptions, getDashboardPassword, hashPassword, verifyPassword } from "@/lib/auth";

export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  let input: FormDataEntryValue | null = null;
  try {
    input = (await request.formData()).get("password");
  } catch {
    // fall through to the failure redirect
  }

  const password = getDashboardPassword();
  if (!password || !verifyPassword(input, password)) {
    return NextResponse.redirect(`${origin}/dashboard?login=failed`, 303);
  }

  const response = NextResponse.redirect(`${origin}/dashboard`, 303);
  response.cookies.set(DASHBOARD_COOKIE, hashPassword(password), cookieOptions(request));
  return response;
}
