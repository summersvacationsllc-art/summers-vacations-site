import { NextResponse } from "next/server";
import {
  CONSENT_TEXT, CONSENT_VERSION, isGateSlug, maskPhone, needsReview,
  normalizeConf, normalizeName, normalizePhone, isAirbnbConf, type GateResult,
} from "@/lib/guidebook-gate-core";
import { processGateSubmission } from "@/lib/guidebook-gate-service";
import { bumpHourly, saveSubmission } from "@/lib/guidebook-gate-store";

// Guidebook name + phone gate (pilot units). The browser only ever sees {ok}.
// It never learns whether a reservation matched, so it cannot be used to probe codes.
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
  const rawConf = String(body.conf ?? "").trim();
  const conf = rawConf ? normalizeConf(rawConf) : "";
  if (!name) return NextResponse.json({ ok: false, field: "name", error: "Please enter your name." }, { status: 400, headers: NO_STORE });
  if (!phone) return NextResponse.json({ ok: false, field: "phone", error: "Please enter a valid mobile number, like 417-555-0123." }, { status: 400, headers: NO_STORE });
  if (conf === null) return NextResponse.json({ ok: false, field: "conf", error: "That confirmation code doesn't look right. Check your booking message." }, { status: 400, headers: NO_STORE });
  if (!conf && mode === "required") return NextResponse.json({ ok: false, field: "conf", error: "Please enter your booking confirmation code." }, { status: 400, headers: NO_STORE });
  const consent = body.consent === true;

  let result: GateResult;
  let note: string | undefined;
  try {
    ({ result, note } = await processGateSubmission({ slug, name, phoneE164: phone, conf: conf || "" }));
  } catch {
    result = "review_lookup_failed";
    note = "unexpected error";
  }
  try {
    await saveSubmission({
      unit: slug, name, phone, confirmationCode: conf || "", consent,
      consentText: consent ? CONSENT_TEXT : null, consentVersion: CONSENT_VERSION,
      mode, result, review: needsReview(result), reviewNote: note,
      ip, userAgent: (req.headers.get("user-agent") || "").slice(0, 200),
    });
  } catch (e) {
    // The copy outside Guesty is the point of this form: if it cannot be saved, say so.
    console.error("guidebook-gate: save failed:", e instanceof Error ? e.message.slice(0, 120) : "error");
    return NextResponse.json({ ok: false, error: "Something went wrong saving that. Please try again." }, { status: 500, headers: NO_STORE });
  }
  // Redacted diagnostics only.
  console.log(`guidebook-gate: ${slug} ${result} phone=${maskPhone(phone)} consent=${consent} airbnbCode=${conf ? isAirbnbConf(conf) : false}`);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
