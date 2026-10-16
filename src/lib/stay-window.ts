/**
 * Guidebook stay window: when the door code / Wi-Fi show and when the page
 * flips to the Branson city guide. Pure functions (no React) so they can be
 * tested with an injected `now`.
 *
 * Date sources and their time policy:
 *   - "url-iso"  raw YYYY-MM-DD from the link (the original format). Uses the
 *                original device-local times, widened so it is never stricter:
 *                reveal = earlier of (7 AM device-local, 7 AM Central),
 *                end    = later   of (10 AM device-local, 10 AM Central).
 *                For a Central-time device this is exactly the old behavior.
 *   - "url-text" Guesty-style text dates ("Oct 20th, 2026"), parsed here.
 *   - "lookup"   real stay from /api/guidebook-stay (Guesty reservation).
 *                Both of these use America/Chicago times (7 AM / 10 AM CT).
 *   - "raw"      anything unparseable: kept verbatim so the page behaves exactly
 *                as before (Invalid Date comparisons are all false).
 */

export type DateSource = "url-iso" | "url-text" | "lookup" | "raw";
export type StayDate = { value: string; source: DateSource };

const TZ = "America/Chicago";
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

function validYMD(y: number, m: number, d: number): string | null {
  if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isIsoDate(s: string | null | undefined): s is string {
  if (!s || !ISO_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  return validYMD(y, m, d) === s;
}

/**
 * Parse Guesty's text date ("Oct 20th, 2026", "October 1st 2026",
 * "Tue, Oct 20th, 2026", "Oct. 2nd, 2026", also "10/20/2026").
 * Returns YYYY-MM-DD or null. Tolerates leftover URL encoding (%20, +).
 */
export function parseGuestyTextDate(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input);
  for (let i = 0; i < 2 && /%[0-9a-f]{2}/i.test(s); i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  s = s.replace(/\+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  // "Month D(st|nd|rd|th)?, YYYY" with optional leading weekday
  let m = s.match(/^(?:[a-z]{3,9}\.?,?\s+)?([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (m && MONTHS[m[1]] !== undefined) return validYMD(Number(m[3]), MONTHS[m[1]], Number(m[2]));
  // "D(st|nd|rd|th)? Month YYYY"
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3,9})\.?,?\s+(\d{4})$/);
  if (m && MONTHS[m[2]] !== undefined) return validYMD(Number(m[3]), MONTHS[m[2]], Number(m[1]));
  // US numeric M/D/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return validYMD(Number(m[3]), Number(m[1]), Number(m[2]));
  return null;
}

/** Classify a checkin/checkout URL value. Empty -> null. */
export function normalizeStayDate(raw: string | null | undefined): StayDate | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const s = String(raw);
  if (isIsoDate(s)) return { value: s, source: "url-iso" };
  const t = parseGuestyTextDate(s);
  if (t) return { value: t, source: "url-text" };
  return { value: s, source: "raw" };
}

/** UTC offset (ms) of America/Chicago at a given instant. */
function tzOffsetMs(at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asUTC - at;
}

/** Epoch ms for YYYY-MM-DD at HH:MM:SS wall-clock time in America/Chicago. */
export function chicagoInstant(ymd: string, hms: string): number {
  if (!isIsoDate(ymd) || !/^\d{2}:\d{2}:\d{2}$/.test(hms)) return NaN;
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, mi, se] = hms.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, se);
  let t = guess - tzOffsetMs(guess);
  t = guess - tzOffsetMs(t); // second pass handles DST edges
  return t;
}

/** Device-local instant, exactly as the original page computed it. */
function localInstant(value: string, hms: string): number {
  return new Date(value + "T" + hms).getTime();
}

function instant(d: StayDate, hms: string, prefer: "earlier" | "later"): number {
  if (d.source === "raw") return localInstant(d.value, hms); // NaN for junk, as before
  const ct = chicagoInstant(d.value, hms);
  if (d.source === "url-iso") {
    const local = localInstant(d.value, hms);
    if (Number.isNaN(local)) return ct;
    return prefer === "earlier" ? Math.min(local, ct) : Math.max(local, ct);
  }
  return ct;
}

// Convert "4:00 PM" -> "16:00:00" (same as the page's original helper)
export function convertTime(t: string): string {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return "16:00:00";
  let h = parseInt(m[1]);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}:00`;
}

/** Same rule the page used on load: checkout decides, checkin-only = guest, none = Branson. */
export function stayMode(checkin: StayDate | null, checkout: StayDate | null, now: number): "guest" | "branson" {
  if (checkout) {
    const co = instant(checkout, "10:00:00", "later");
    return now > co ? "branson" : "guest";
  }
  if (checkin) return "guest";
  return "branson";
}

export type DoorState = "before" | "early" | "ready" | "after";

export function doorWindow(
  checkin: StayDate | null,
  checkout: StayDate | null,
  checkinTime: string,
  now: number,
): { state: DoorState; ciDate: number; ciTime: string } {
  const ciTime = checkinTime || "4:00 PM";
  if (!(checkin && checkout)) return { state: "ready", ciDate: NaN, ciTime };
  const ciDate = instant(checkin, "07:00:00", "earlier"); // 7AM — code visible
  const ciActive = instant(checkin, convertTime(ciTime), "earlier"); // actual check-in
  const co = instant(checkout, "10:00:00", "later"); // 10AM checkout
  let state: DoorState = "ready";
  if (now < ciDate) state = "before";
  else if (now < ciActive) state = "early";
  else if (now > co) state = "after";
  return { state, ciDate, ciTime };
}

/** "Tue, Oct 20" for a stay date (calendar date, timezone-proof). */
export function stayDateLabel(d: StayDate | null, fallbackInstant: number): string {
  const opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  if (d && d.source !== "raw" && isIsoDate(d.value)) {
    const [y, m, day] = d.value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  }
  return new Date(fallbackInstant).toLocaleDateString("en-US", opts);
}
