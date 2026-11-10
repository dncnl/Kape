import { NextResponse } from "next/server";
import { DASHBOARD_COOKIE, cookieOptions } from "@/lib/auth";

export async function POST(request: Request): Promise<Response> {
  const response = NextResponse.redirect(`${new URL(request.url).origin}/dashboard`, 303);
  response.cookies.set(DASHBOARD_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
