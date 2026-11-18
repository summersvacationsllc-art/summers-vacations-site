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

export function normalizeConf(raw: unknown): string | null {
  const s = String(raw ?? "").replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9-]{4,24}$/.test(s)) return null;
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
  | "unverified_no_code"
  | "review_name_mismatch"
  | "review_unit_mismatch"
  | "review_existing_different_phone"
  | "review_not_found"
  | "review_inactive_reservation"
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
  checkOut: string; // ISO date or timestamp
  guestId: string;
  guest: { fullName?: string; firstName?: string; lastName?: string; phone?: string; phones?: string[] };
  source: string; // e.g. airbnb2, vrbo, manual, website
};

const DEAD = new Set(["canceled", "cancelled", "declined", "expired", "inquiry", "closed", "awaiting_payment_canceled"]);

export type Decision = {
  result: GateResult;
  /** Only set when a profile write is allowed (caller still honors dry-run). */
  write: { guestId: string; phone: string } | null;
};

/**
 * Decide what to do. `guestPhones` is what the guest PROFILE currently holds
 * (fetched fresh), `reservations` are all rows Guesty returned for the code.
 */
export function decide(opts: {
  slug: string;
  listingId: string;
  name: string;
  phoneE164: string;
  reservations: GateReservation[];
  guestPhones: string[] | null;
  nowMs: number;
  allowAirbnbWrite?: boolean;
}): Decision {
  const live = opts.reservations.filter((r) => !DEAD.has(String(r.status || "").toLowerCase()));
  if (!opts.reservations.length) return { result: "review_not_found", write: null };
  if (!live.length) return { result: "review_inactive_reservation", write: null };
  if (live.length > 1) return { result: "review_not_found", write: null }; // ambiguous code
  const r = live[0];
  const co = Date.parse(r.checkOut);
  if (Number.isFinite(co) && co < opts.nowMs - 3 * 86400_000) return { result: "review_inactive_reservation", write: null };
  if (r.listingId !== opts.listingId) return { result: "review_unit_mismatch", write: null };
  if (!nameMatches(opts.name, r.guest)) return { result: "review_name_mismatch", write: null };
  const profile = opts.guestPhones ?? [r.guest.phone, ...(r.guest.phones || [])].filter(Boolean) as string[];
  const existing = profile.map(phoneKey).filter(Boolean);
  const want = phoneKey(opts.phoneE164);
  if (existing.length) {
    if (existing.includes(want)) return { result: "matched_same_phone", write: null };
    return { result: "review_existing_different_phone", write: null };
  }
  const airbnb = /airbnb/i.test(r.source || "") || isAirbnbConf(r.confirmationCode || "");
  if (airbnb && !opts.allowAirbnbWrite) return { result: "matched_airbnb_db_only", write: null };
  if (!r.guestId) return { result: "review_lookup_failed", write: null };
  return { result: "matched_written", write: { guestId: r.guestId, phone: opts.phoneE164 } };
}
