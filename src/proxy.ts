import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Guidebook links must never carry (or echo) a door code. Old links that were
 * already sent may still have ?code=...; drop that one param with a redirect and
 * keep every other param (name, conf, checkin, ...). 308 keeps it cache-friendly
 * for the same URL while the code never reaches the page.
 */
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  let stripped = false;
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase() === "code") {
      url.searchParams.delete(key);
      stripped = true;
    }
  }
  if (!stripped) return NextResponse.next();
  const res = NextResponse.redirect(url, 308);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export const config = {
  matcher: ["/guidebook/:path*"],
};
