import { NextResponse } from "next/server";
import { isGateSlug } from "@/lib/guidebook-gate-core";
import { cookieName, openSession, readCookie } from "@/lib/guidebook-gate-session";
import { stayFor } from "@/lib/guidebook-gate-access";

// Re-fetch a verified guest's stay card (dates, first name, door code inside the stay window).
// POST only, no-store, only for a valid sealed session cookie from a matched submission.
// The door code is never put in a URL, a log, Blob or localStorage.
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };

const byIp = new Map<string, { n: number; at: number }>();
const byRes = new Map<string, { n: number; at: number }>();
function over(m: Map<string, { n: number; at: number }>, k: string, max: number): boolean {
  const now = Date.now();
  const h = m.get(k);
  if (!h || now - h.at > 10 * 60_000) { m.set(k, { n: 1, at: now }); return false; }
  h.n += 1;
  return h.n > max;
}

export async function POST(req: Request) {
  let slug = "";
  try {
    slug = String(((await req.json()) as { slug?: unknown }).slug || "");
  } catch { /* handled below */ }
  if (!isGateSlug(slug)) return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE });
  const sess = openSession(readCookie(req.headers.get("cookie"), cookieName(slug)), slug);
  if (!sess) return NextResponse.json({ ok: true, stay: null }, { headers: NO_STORE }); // no Guesty call, nothing to guess
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (over(byIp, ip, 30) || over(byRes, sess.resId, 20)) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a few minutes." }, { status: 429, headers: NO_STORE });
  }
  try {
    return NextResponse.json({ ok: true, stay: await stayFor(sess) }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: true, stay: null }, { headers: NO_STORE });
  }
}
