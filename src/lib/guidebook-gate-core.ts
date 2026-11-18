/**
 * Pure helpers for the guidebook name + phone gate (no imports, unit-testable).
 * Pilot units only. Never log full phones; callers redact with maskPhone().
 */

/** Guidebook slugs that show the gate. Everything else is untouched. */
export const GATE_SLUGS = ["rustic-ozark-retreat", "woodland-retreat"] as const;
export type GateSlug = (typeof GATE_SLUGS)[number];

export function isGateSlug(s: string): s is GateSlug {
  return (GATE_SLUGS as readonly string[]).includes(s);
}

export const CONSENT_VERSION = "2026-11-17-v1";
export const CONSENT_TEXT =
  "Yes, Summers Vacations may contact me at this number with Branson deals and offers. Consent isn't required to stay. Msg & data rates may apply; reply STOP to opt out.";

export function normalizeName(raw: unknown): string | null {
  const s = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (s.length < 2 || s.length > 80) return null;
  if (!/[A-Za-z\u00C0-\u024F]/.test(s)) return null;
  return s;
}

/** Returns +E.164 or null. US numbers: 10 digits, or 11 with a leading 1. */
export function normalizePhone(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s || s.length > 30) return null;
  if (/[^0-9()+\-.\s]/.test(s)) return null;
  const intl = s.startsWith("+");
  const d = s.replace(/\D/g, "");
  let e164: string;
  if (intl) {
    if (d.length < 8 || d.length > 15) return null;
    e164 = `+${d}`;
  } else if (d.length === 10) {
    e164 = `+1${d}`;
  } else if (d.length === 11 && d.startsWith("1")) {
    e164 = `+${d}`;
  } else {
    return null;
  }
  if (e164.startsWith("+1")) {
    const nat = e164.slice(2);
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(nat)) return null;
    if (/^(\d)\1+$/.test(nat)) return null;
  }
  return e164;
}

export function maskPhone(p: string): string {
  const d = String(p || "").replace(/\D/g, "");
  return d.length >= 4 ? `***${d.slice(-4)}` : "***";
}

/** Last 10 digits, for "is it the same number" checks. */
export function phoneKey(raw: unknown): string {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.slice(-10);
}

export function isAirbnbConf(conf: string): boolean {
  return /^HM[A-Z0-9]{4,}$/.test(conf);
}

function fold(s: string): string {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s'-]/g, " ");
}

function tokens(s: string): string[] {
  return fold(s).split(/[\s'-]+/).filter((t) => t.length > 0);
}

function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function tokenEq(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 5) return lev(a, b) <= 1;
  return false;
}

/**
 * Reasonable name match: the entered name must agree with the guest's name.
 * 2+ entered words: the last word must match the guest's last name (a typo of
 * one letter is fine on names of 5+ letters). One word: it must match the
 * guest's first or last name.
 */
export function nameMatches(entered: string, guest: { fullName?: string; firstName?: string; lastName?: string }): boolean {
  const e = tokens(entered);
  if (!e.length) return false;
  const full = tokens(guest.fullName || `${guest.firstName || ""} ${guest.lastName || ""}`);
  const gFirst = tokens(guest.firstName || "")[0] || full[0] || "";
  const gLast = tokens(guest.lastName || "").pop() || (full.length > 1 ? full[full.length - 1] : "");
  if (!full.length && !gFirst && !gLast) return false;
  if (e.length >= 2) {
    const eLast = e[e.length - 1];
    if (gLast && tokenEq(eLast, gLast)) return true;
    // Guests sometimes list "Smith, Jane" or middle names: accept any shared token of 4+ letters after the first.
    return full.slice(1).some((t) => t.length >= 4 && e.slice(1).some((x) => tokenEq(x, t)));
  }
  return (!!gFirst && tokenEq(e[0], gFirst)) || (!!gLast && tokenEq(e[0], gLast));
}

export type GateResult =
  | "matched_written"
  | "matched_dry_run"
  | "matched_same_phone"
  | "matched_airbnb_db_only"
  | "review_name_mismatch"
  | "review_no_match"
  | "review_ambiguous"
  | "review_existing_different_phone"
  | "review_lookup_failed"
  | "review_write_failed";

export function needsReview(r: GateResult): boolean {
  return r.startsWith("review_");
}

export type GateReservation = {
  id: string;
  listingId: string;
  status: string;
  confirmationCode: string;
  checkIn: string; // ISO timestamp or date
  checkOut: string;
  checkInLocalized?: string; // YYYY-MM-DD at the property
  checkOutLocalized?: string;
  guestId: string;
  guest: { fullName?: string; firstName?: string; lastName?: string; phone?: string; phones?: string[] };
  source: string; // e.g. airbnb2, vrbo, manual, website
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDay(s: unknown): s is string {
  return typeof s === "string" && ISO_DAY.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`));
}

/** YYYY-MM-DD in America/Chicago for a timestamp (or the date itself if it is already a plain date). */
export function ctDay(v: string): string | null {
  if (ISO_DAY.test(v)) return v;
  const t = Date.parse(v);
  if (!Number.isFinite(t)) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(t));
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function stayDays(r: GateReservation): { ci: string | null; co: string | null } {
  const ci = r.checkInLocalized && ISO_DAY.test(r.checkInLocalized) ? r.checkInLocalized : ctDay(r.checkIn);
  const co = r.checkOutLocalized && ISO_DAY.test(r.checkOutLocalized) ? r.checkOutLocalized : ctDay(r.checkOut);
  return { ci, co };
}

/** Days ahead (and the day before today) counted as "active or upcoming" when the link has no dates. */
export const WINDOW_DAYS = 14;

export type Decision = {
  result: GateResult;
  matched: GateReservation | null;
  matchBy: "dates" | "window";
  /** Only set when a profile write is allowed (caller still honors dry-run). */
  write: { guestId: string; phone: string } | null;
};

/**
 * Decide what to do. `reservations` are the listing's rows Guesty returned for
 * the lookup (already scoped to this unit). Only CONFIRMED stays count.
 * With link dates: exactly one stay with those dates. Without: stays active or
 * starting within WINDOW_DAYS whose guest name matches what was typed; exactly one.
 * `guestPhones` is what the guest PROFILE holds (fetched fresh), or null.
 */
export function decide(opts: {
  typedName: string;
  phoneE164: string;
  link: { checkin?: string; checkout?: string };
  reservations: GateReservation[];
  guestPhones: string[] | null;
  today: string; // YYYY-MM-DD, property time
  allowAirbnbWrite?: boolean;
}): Decision {
  const hasDates = isIsoDay(opts.link.checkin) && isIsoDay(opts.link.checkout);
  const matchBy: "dates" | "window" = hasDates ? "dates" : "window";
  const out = (result: GateResult, matched: GateReservation | null = null, write: Decision["write"] = null): Decision =>
    ({ result, matched, matchBy, write });

  const live = opts.reservations.filter((r) => String(r.status || "").toLowerCase() === "confirmed");
  let r: GateReservation;
  if (hasDates) {
    const hits = live.filter((x) => {
      const d = stayDays(x);
      return d.ci === opts.link.checkin && d.co === opts.link.checkout;
    });
    if (hits.length === 0) return out("review_no_match");
    if (hits.length > 1) return out("review_ambiguous");
    r = hits[0];
    if (!nameMatches(opts.typedName, r.guest)) return out("review_name_mismatch", r);
  } else {
    const horizon = addDays(opts.today, WINDOW_DAYS);
    const inWindow = live.filter((x) => {
      const d = stayDays(x);
      return !!d.ci && !!d.co && d.co >= opts.today && d.ci <= horizon;
    });
    if (inWindow.length === 0) return out("review_no_match");
    const named = inWindow.filter((x) => nameMatches(opts.typedName, x.guest));
    if (named.length === 0) return out("review_name_mismatch", inWindow.length === 1 ? inWindow[0] : null);
    if (named.length > 1) return out("review_ambiguous");
    r = named[0];
  }
  const profile = opts.guestPhones ?? ([r.guest.phone, ...(r.guest.phones || [])].filter(Boolean) as string[]);
  const existing = profile.map(phoneKey).filter(Boolean);
  const want = phoneKey(opts.phoneE164);
  if (existing.length) {
    return existing.includes(want) ? out("matched_same_phone", r) : out("review_existing_different_phone", r);
  }
  const airbnb = /airbnb/i.test(r.source || "") || isAirbnbConf(r.confirmationCode || "");
  if (airbnb && !opts.allowAirbnbWrite) return out("matched_airbnb_db_only", r);
  if (!r.guestId) return out("review_lookup_failed", r);
  return out("matched_written", r, { guestId: r.guestId, phone: opts.phoneE164 });
}

/**
 * Pick the guest's door code from a Guesty /v1/guest-code response.
 * Purpose GUEST only (never GUEST_BACKUP). Returns null for empty/unlinked/failed.
 */
export function pickGuestCode(json: unknown): string | null {
  const codes = (json as { codes?: unknown } | null)?.codes;
  if (!Array.isArray(codes)) return null;
  for (const c of codes) {
    const o = c as { code?: unknown; purpose?: unknown; status?: unknown };
    if (String(o?.purpose ?? "").toUpperCase() !== "GUEST") continue;
    if (/fail|error|delet|remov|expire|cancel|revok/i.test(String(o?.status ?? ""))) continue;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    if (/^[0-9A-Za-z#*]{3,12}$/.test(code)) return code;
  }
  return null;
}
