import { NextResponse } from "next/server";
import {
  CONSENT_TEXT, CONSENT_VERSION, isGateSlug, needsReview,
  isIsoDay, normalizeName, normalizePhone, type GateResult,
} from "@/lib/guidebook-gate-core";
import { processGateSubmission } from "@/lib/guidebook-gate-service";
import { stayFor } from "@/lib/guidebook-gate-access";
import { sealSession, setCookieHeader, type GateSession } from "@/lib/guidebook-gate-session";
import { bumpHourly, saveSubmission } from "@/lib/guidebook-gate-store";

// Guidebook name + phone gate (pilot units). A verified stay may include the door code
// already on file in Guesty. The typed phone is saved only in the private promotions
// store. This route makes no write call to Guesty.
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };

const mem = new Map<string, { n: number; at: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const h = mem.get(ip);
  if (!h || now - h.at > 10 * 60_000) { mem.set(ip, { n: 1, at: now }); return false; }
  h.n += 1;
  return h.n > 8;
}

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  if (limited(ip) || !(await bumpHourly(ip, 25))) {
    return NextResponse.json({ ok: false, error: "Too many tries. Please wait a few minutes and try again." }, { status: 429, headers: NO_STORE });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400, headers: NO_STORE });
  }
  // Honeypot: real people never fill this in. Pretend success, store nothing.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  }
  const slug = String(body.slug || "");
  if (!isGateSlug(slug)) return NextResponse.json({ ok: false, error: "Unknown guidebook." }, { status: 400, headers: NO_STORE });
  const mode = body.mode === "airbnb-optional" ? "airbnb-optional" : "required";
  const name = normalizeName(body.name);
  const phone = normalizePhone(body.phone);
  const checkin = isIsoDay(body.checkin) ? body.checkin : "";
  const checkout = isIsoDay(body.checkout) && checkin && body.checkout > checkin ? body.checkout : "";
  if (!name) return NextResponse.json({ ok: false, field: "name", error: "Please enter your name." }, { status: 400, headers: NO_STORE });
  if (!phone) return NextResponse.json({ ok: false, field: "phone", error: "Please enter a valid mobile number, like 417-555-0123." }, { status: 400, headers: NO_STORE });
  const consent = body.consent === true;

  // Dates only count when both are present and valid; otherwise match by typed name + stay window.
  const linkDates = checkin && checkout ? { checkin, checkout } : { checkin: "", checkout: "" };
  let result: GateResult;
  let note: string | undefined;
  let confirmationCode = "";
  let reservationId = "";
  let checkIn = linkDates.checkin;
  let checkOut = linkDates.checkout;
  let verified: { resId: string; ci: string; co: string; airbnb: boolean } | undefined;
  let matchBy: "dates" | "window" = linkDates.checkin ? "dates" : "window";
  try {
    ({ result, note, confirmationCode, matchBy, verified, reservationId, checkIn, checkOut } = await processGateSubmission({ slug, name, phoneE164: phone, ...linkDates }));
  } catch {
    result = "review_lookup_failed";
    note = "unexpected error";
  }
  // Verified match only: sealed httpOnly session + (inside the stay window) the guest's door code.
  // Everything else (skip, no match, review cases) gets a plain OK and no code.
  let stay: Awaited<ReturnType<typeof stayFor>> | null = null;
  let cookie: string | null = null;
  if (verified) {
    const sess: GateSession = {
      slug, resId: verified.resId, ci: verified.ci, co: verified.co, ab: verified.airbnb,
      fn: (name.split(/\s+/)[0] || "").replace(/[^\p{L}'’-]/gu, "").slice(0, 30),
      exp: Date.parse(`${verified.co}T00:00:00Z`) + 3 * 86400_000,
    };
    const token = sealSession(sess);
    if (token) {
      cookie = setCookieHeader(slug, token, sess.exp);
      try { stay = await stayFor(sess); } catch { stay = null; }
    }
  }
  try {
    await saveSubmission({
      unit: slug, firstName: name.split(/\s+/)[0] || "", name, phone, reservationId, confirmationCode,
      checkIn, checkOut, linkCheckin: linkDates.checkin, linkCheckout: linkDates.checkout, matchBy, consent,
      consentText: consent ? CONSENT_TEXT : null, consentVersion: CONSENT_VERSION,
      mode, result, codeShown: !!stay?.code, review: needsReview(result), reviewNote: note,
      ip, userAgent: (req.headers.get("user-agent") || "").slice(0, 200),
    });
  } catch {
    // The private copy is the only copy. If it cannot be saved, say so. Never log the submission.
    console.error("guidebook-gate: save failed");
    return NextResponse.json({ ok: false, error: "Something went wrong saving that. Please try again." }, { status: 500, headers: NO_STORE });
  }
  // Unit and result only. Never log a name, phone, token, reservation id, or door code.
  console.log(`guidebook-gate: unit=${slug} result=${result} consent=${consent} by=${matchBy}`);
  const res = NextResponse.json(stay ? { ok: true, stay } : { ok: true }, { headers: NO_STORE });
  if (cookie) res.headers.append("Set-Cookie", cookie);
  return res;
}
