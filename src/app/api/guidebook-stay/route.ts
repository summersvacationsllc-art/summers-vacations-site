import { NextResponse } from "next/server";
import { findGuidebookStay } from "@/lib/guidebook-stay";

// Guidebook stay lookup: for one guest's link with no usable dates, return ONLY
// that stay's {checkin, checkout} from Guesty. Requires property + (door code or
// confirmation code, or a first name that matches exactly one stay); a name,
// when given, must match the guest's first name.
// Any miss, ambiguity or error is a generic 404 — the page then keeps its old
// behavior. Never returns guest names, phones, emails or other reservations.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };
const hits = new Map<string, { n: number; at: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > 10 * 60_000) { hits.set(ip, { n: 1, at: now }); return false; }
  h.n += 1;
  return h.n > 30;
}

function miss() {
  return NextResponse.json({ ok: false }, { status: 404, headers: NO_STORE });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const p = (k: string) => (u.searchParams.get(k) || "").slice(0, 80);
  const property = p("property");
  const code = p("code");
  const name = p("name");
  const conf = p("conf") || p("confirmation");
  if (!property || (!code && !conf && !name)) return miss();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (limited(ip)) return NextResponse.json({ ok: false }, { status: 429, headers: NO_STORE });
  try {
    const stay = await findGuidebookStay({ property, code, name, conf });
    if (!stay) return miss();
    return NextResponse.json(
      { ok: true, checkin: stay.checkin, checkout: stay.checkout, checkinTime: null },
      { headers: NO_STORE },
    );
  } catch {
    return miss();
  }
}
