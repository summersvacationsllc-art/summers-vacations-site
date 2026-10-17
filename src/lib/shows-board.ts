/**
 * Shows board builder: TypeScript port of scripts/build_shows_from_scout.py
 * plus the magazine half of scripts/tonight_in_branson.py.
 *
 * Used by the always-on cloud Shows Scout (/api/cron/shows-scout). Same rules
 * as the Python builder:
 *   - show names/times come ONLY from the scout markdown (never carried forward)
 *   - a show without a confirmed clock time gets "Check times"
 *   - dedupe by normalized name + time, sort by time, "Check times" last
 *   - the prior board is used only to enrich venues (lat/lng/address/url/type);
 *     it never adds a show
 * Keep this file in step with the two Python scripts (same regexes/order).
 * Pure functions only (no Next/Vercel imports) so it can be tested in Node.
 */
import { createHash } from "crypto";

export type Row = Record<string, unknown> & { name: string; time: string };
type Json = Record<string, unknown>;

const DASH = String.raw`\s*[–—-]\s*`;
const CLOCK = /^\s*(\d{1,2}(?::\d{2})?\s*[AaPp]\.?[Mm]\.?)/;
const HEDGE = /typically|usually|approx|around|tba|tbd|check|varies|evening|afternoon|morning|window/i;
const VENUEISH = /theat|hall|center|centre|castle|jubilee|arena|playhouse|mansion|landing|resort|church|park|opry|palace|auditorium/i;
const PAREN_HEDGE = /confirm|select|some |may |check|\bor\b|slot|varies|tba|tbd|active|dates/i;
const STOP_HEADINGS = /^##\s+(insider|desk note|notes|tips|sources|free|outdoor|indoor)/i;
const HEADING_ROW = new RegExp(String.raw`^\*\*([^*]{2,90}?)\*\*` + DASH + "(.+)$");
const BULLET_ROW = new RegExp(String.raw`^[-*]\s+\*\*([^*]{2,90}?)\*\*` + DASH + "(.+)$");
const HAS_BOLD_DASH = new RegExp(String.raw`\*\*` + DASH);

const STRIP_CHARS = " -–—:;,.";
function strip(s: string, chars = STRIP_CHARS): string {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a++;
  while (b > a && chars.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

export function clean(s: string): string {
  const t = (s || "").replace(/\*\*|__|`/g, "");
  return strip(t.replace(/\s+/g, " "));
}

export function normTime(raw: string): [string, boolean] {
  raw = (raw || "").trim();
  const m = CLOCK.exec(raw);
  if (m && !HEDGE.test(raw.slice(0, m.index))) {
    let t = m[1].toUpperCase().replace(/\./g, "").replace(/ /g, "");
    t = t.replace(/(AM|PM)$/, " $1");
    if (!t.includes(":")) t = t.replace(" ", ":00 ");
    return [t, true];
  }
  return ["Check times", false];
}

function splitVenueAddr(text: string): [string, string] {
  text = clean(text);
  const m = /^(.*?)\s*\(([^)]*\d[^)]*)\)\s*$/.exec(text);
  if (m) return [clean(m[1]), clean(m[2])];
  return [text, ""];
}

function parsePrice(text: string): string {
  const m = /\$\s?\d+(?:\s*[–—-]\s*\$?\s?\d+)?/.exec(text);
  return m ? m[0].replace(/ /g, "") : "";
}

function parseHeadingLine(line: string): Row[] {
  const parts = line.trim().split(/\s+\/\s+(?=\*\*)/);
  const out: Row[] = [];
  for (const part of parts) {
    const m = HEADING_ROW.exec(part.trim());
    if (!m || m[1].trim().endsWith(":")) continue;
    const name = clean(m[1]);
    const rest = m[2].trim();
    let [time, confirmed] = normTime(rest);
    let venue = "";
    const vm = /\(([^()]*[A-Za-z][^()]*)\)\s*$/.exec(rest);
    if (vm) {
      const inner = vm[1];
      if (PAREN_HEDGE.test(inner)) {
        confirmed = false;
        time = "Check times";
      } else if (VENUEISH.test(inner) && !/\d{1,2}:\d{2}|typically/i.test(inner)) {
        venue = clean(inner);
      }
    }
    const row: Row = { name, time, _confirmed: confirmed, venue };
    if (!confirmed) row.timeNote = clean(rest).slice(0, 80);
    out.push(row);
  }
  return out;
}

export function parseScout(text: string): Row[] {
  const shows: Row[] = [];
  let venueHdr: [string, string] = ["", ""];
  let last: Row[] = [];
  let inShows = true;
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.trimEnd().trim();
    if (!s) continue;
    if (s.startsWith("## ")) {
      inShows = !STOP_HEADINGS.test(s);
      last = [];
      venueHdr = ["", ""];
      continue;
    }
    if (!inShows) continue;
    if (s.startsWith("### ")) {
      venueHdr = splitVenueAddr(s.slice(4));
      last = [];
      continue;
    }
    const mb = BULLET_ROW.exec(s);
    if (mb && venueHdr[0] && !/^(additional|other|recurring)/i.test(venueHdr[0])) {
      const name = clean(mb[1]);
      const rest = mb[2];
      const [time, confirmed] = normTime(rest);
      let desc = "";
      const dm = /\(([^)]{15,})\)\s*\.?\s*$/.exec(rest);
      if (dm && !/\d{1,2}:\d{2}/.test(dm[1])) desc = clean(dm[1]);
      const row: Row = { name, time, _confirmed: confirmed, venue: venueHdr[0], venueAddress: venueHdr[1], desc };
      if (!confirmed) row.timeNote = clean(rest).slice(0, 80);
      shows.push(row);
      last = [];
      continue;
    }
    if (s.startsWith("**") && HAS_BOLD_DASH.test(s)) {
      const rows = parseHeadingLine(s);
      shows.push(...rows);
      last = rows;
      continue;
    }
    if (last.length === 1 && /^[-*]\s+/.test(s)) {
      const b = clean(s.replace(/^[-*]\s+/, ""));
      const row = last[0];
      if (b.toLowerCase().startsWith("source")) {
        const i = b.indexOf(":");
        row.sources = clean(i >= 0 ? b.slice(i + 1) : b);
      } else if (/ticket|\$\d|seats|sold out|available/i.test(b)) {
        if (!("price" in row)) row.price = parsePrice(b);
        if (!("ticketNote" in row)) row.ticketNote = b.slice(0, 140);
      } else if (!row.venue && /theat|hall|arena|music|castle|jubilee|\(\d/i.test(b)) {
        [row.venue, row.venueAddress] = splitVenueAddr(b);
      } else if (!row.desc) {
        row.desc = b.slice(0, 220);
      }
    }
  }
  return shows;
}

export function nameKey(name: string): string {
  let n = name.toLowerCase().replace(/[’']/g, "");
  n = n.replace(/[^a-z0-9 ]/g, " ");
  n = n.replace(/\b(the|show|a|and|tribute)\b/g, " ");
  return n.replace(/\s+/g, " ").trim();
}

function venueKey(v: string): string {
  let s = (v || "").toLowerCase().replace(/[’']/g, "");
  s = s.replace(/[^a-z0-9 ]/g, " ");
  s = s.replace(/\b(the|theatre|theater|for|performing|arts)\b/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

export function parseMinutes(t: unknown): number | null {
  if (!t || typeof t !== "string") return null;
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(t);
  const toH = (h: number, ap: string) => (ap === "PM" && h !== 12 ? h + 12 : ap === "AM" && h === 12 ? 0 : h);
  if (!m) {
    const m2 = /(\d{1,2})\s*(AM|PM)/i.exec(t);
    if (!m2) return null;
    return toH(Number(m2[1]), m2[2].toUpperCase()) * 60;
  }
  return toH(Number(m[1]), m[3].toUpperCase()) * 60 + Number(m[2]);
}

function dedupe(rows: Row[]): Row[] {
  const byKey = new Map<string, Row>();
  for (const r of rows) {
    const k = `${nameKey(r.name)}|${r._confirmed ? parseMinutes(r.time) : null}`;
    const old = byKey.get(k);
    if (old) {
      for (const f of ["venue", "venueAddress", "desc", "price", "sources", "ticketNote"]) {
        if (!old[f] && r[f]) old[f] = r[f];
      }
    } else {
      byKey.set(k, r);
    }
  }
  const out = [...byKey.values()];
  const confirmed = new Set(out.filter((r) => r._confirmed).map((r) => nameKey(r.name)));
  return out.filter((r) => r._confirmed || !confirmed.has(nameKey(r.name)));
}

function enrichFromPrior(rows: Row[], prior: Json | null): Row[] {
  const byVenue = new Map<string, Json>();
  const byName = new Map<string, Json>();
  const priorShows = Array.isArray(prior?.shows) ? (prior!.shows as Json[]) : [];
  for (const s of priorShows) {
    if (s.venue && !byVenue.has(venueKey(String(s.venue)))) byVenue.set(venueKey(String(s.venue)), s);
    if (s.name && !byName.has(nameKey(String(s.name)))) byName.set(nameKey(String(s.name)), s);
  }
  for (const r of rows) {
    const v = byVenue.get(venueKey(String(r.venue || "")));
    if (v) {
      for (const f of ["lat", "lng"]) if (v[f] !== undefined && v[f] !== null && !(f in r)) r[f] = v[f];
      if (v.venueAddress && !("venueAddress" in r)) r.venueAddress = v.venueAddress;
      if (v.url && !("url" in r)) r.url = v.url;
    }
    const n = byName.get(nameKey(r.name));
    if (n) for (const f of ["type", "url"]) if (n[f] && !(f in r)) r[f] = n[f];
    if (!r.venueAddress) delete r.venueAddress;
  }
  return rows;
}

// ---------- tonight_in_branson.py port ----------
const VAGUE_VENUE = /^(theater venue|various|various\s*\/.*|tbd|check.*|venue)$/i;
const CHIP_RULES: [RegExp, string, string][] = [
  [/magic|illusion|reza|hamner|rick thomas/i, "magic", "🪄"],
  [/acrobat|circus|shanghai/i, "thrill", "🤸"],
  [/dinner|mystery|stampede|chuckwagon/i, "dinner", "🍽️"],
  [/comedy|baldknobber|jubilee/i, "comedy", "😂"],
  [/narnia|family|kids|children/i, "family", "👨‍👩‍👧"],
  [/outdoor|shepherd of the hills|drama/i, "outdoor", "🌙"],
  [/irish|celtic|tenor/i, "music", "🎶"],
  [/80|rock|anthem|legends|tribute|elvis|patsy|country|clay cooper|presley/i, "classic", "🎸"],
];

function bucketFor(mins: number | null): string {
  if (mins === null) return "anytime";
  if (mins < 16 * 60) return "matinee";
  if (mins < 19 * 60) return "late_afternoon";
  return "evening";
}

function classify(s: Json): [string, string] {
  const own = ["name", "type", "tag"].map((k) => String(s[k] ?? "")).join(" ");
  const more = ["desc", "why"].map((k) => String(s[k] ?? "")).join(" ");
  const venue = String(s.venue ?? "");
  for (const blob of [own, more, venue]) for (const [rx, chip, icon] of CHIP_RULES) if (rx.test(blob)) return [chip, icon];
  return ["music", "🎭"];
}

function urlIsSpecific(url: unknown): boolean {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return false;
  const u = url.toLowerCase();
  if (u.includes("showbydate.cfm")) return false;
  return !/bransonshows\.com\/?$/.test(u);
}

export function enrichShows(shows: Json[]): Json[] {
  const out = shows.map((raw) => {
    const s: Json = { ...raw };
    const mins = parseMinutes(s.time);
    s._mins = mins;
    s.sortMinutes = mins;
    s.bucket = bucketFor(mins);
    const [chip, icon] = classify(s);
    s.chip = chip;
    s.icon = icon;
    s.for = chip;
    s.ticketOk = urlIsSpecific(s.url);
    const venue = String(s.venue || "").trim();
    if (venue && VAGUE_VENUE.test(venue)) s.venueNote = "Confirm venue";
    return s;
  });
  out.sort((a, b) => {
    const an = a.sortMinutes === null ? 1 : 0;
    const bn = b.sortMinutes === null ? 1 : 0;
    if (an !== bn) return an - bn;
    const d = Number(a.sortMinutes || 0) - Number(b.sortMinutes || 0);
    if (d) return d;
    const x = String(a.name || "");
    const y = String(b.name || "");
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return out;
}

function pyJsonPairs(rows: Json[]): string {
  // Matches Python json.dumps([(name, time), ...], ensure_ascii=False)
  return "[" + rows.map((r) => `[${JSON.stringify(r.name)}, ${JSON.stringify(r.time)}]`).join(", ") + "]";
}

export function listHash(rows: Json[]): string {
  return createHash("sha1").update(pyJsonPairs(rows), "utf8").digest("hex").slice(0, 12);
}

/** ISO timestamp in America/Chicago with offset, like Python isoformat(timespec="seconds"). */
export function nowCTIso(now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  const offMin = Math.round((local - Math.floor(now.getTime() / 1000) * 1000) / 60000);
  const sign = offMin >= 0 ? "+" : "-";
  const a = Math.abs(offMin);
  const off = `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${off}`;
}

const WEEKDAY_PACKS: [string, string][] = [
  ["Monday matinees, then the Strip lights up", "Early week is tribute-and-magic friendly — grab a 2 PM seat, dinner, then an 8 o’clock curtain."],
  ["Tuesday ticket window", "Good night to lock seats before the weekend rush. Matinee for heat escape, evening for the mainstage."],
  ["Midweek on the 76", "Hump-day boards mix country classics, illusion, and family productions — confirm times at the box office."],
  ["Thursday warm-up", "Pre-weekend energy on the Strip. Pick one matinee or go straight to an evening show."],
  ["Friday night Branson", "Curtains stack after dinner. Arrive early for parking; popular houses sell the best seats first."],
  ["Saturday full board", "Biggest day of the week for live entertainment — matinees for kids, evening for date night."],
  ["Sunday show day", "Family-friendly boards and indoor A/C picks. Verify Sunday times — some houses run a different schedule."],
];

/** Monday=0 … Sunday=6 for a YYYY-MM-DD calendar date. */
function weekdayIndex(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function weekdayName(day: string): string {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][weekdayIndex(day)];
}

export function scoutBlurb(text: string): string {
  if (!text) return "";
  const m = /## Notes\s*\n+([\s\S]+?)(?:\n## |\n---|$(?![\s\S]))/i.exec(text);
  if (m) {
    const para = m[1].replace(/\s+/g, " ").trim();
    if (para.length > 40) return strip(para.slice(0, 420), " .") + (para.length > 420 ? "…" : "");
  }
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (line.length > 80 && !line.startsWith("#") && !line.startsWith("**Research")) return line.slice(0, 420);
  }
  return "";
}

function pickFromEditor(notes: Json, shows: Json[]): Json | null {
  const feat = notes.featured && typeof notes.featured === "object" ? (notes.featured as Json) : null;
  if (!feat) return null;
  const title = String(feat.title || "").trim();
  if (!title) return null;
  const tlow = title.toLowerCase();
  const toks = (tlow.match(/[a-z0-9]{4,}/g) || []).slice(0, 3);
  const match = shows.find((s) => {
    const n = String(s.name || "").toLowerCase();
    return tlow.includes(n) || n.includes(tlow) || toks.some((t) => n.includes(t));
  });
  if (!match) return null;
  return {
    title,
    when: feat.when || match.time || "",
    where: feat.where || match.venue || "",
    why: feat.why || "",
    url: feat.url || (urlIsSpecific(match.url) ? match.url : "") || "",
    source: "night-editor",
  };
}

const WHY: Record<string, string> = {
  magic: "Illusion and live stage craft — a sure crowd-pleaser.",
  outdoor: "Ozarks outdoor drama — check weather and arrive early.",
  classic: "Core Branson mainstage energy.",
  family: "Easy multi-age pick.",
  dinner: "Show + supper in one outing.",
  thrill: "High-visual spectacle.",
  comedy: "Laughs without homework.",
  music: "Live music on the 76.",
};

function pickFromList(shows: Json[]): Json | null {
  if (!shows.length) return null;
  const ranked = shows.map((s) => {
    let score = 0;
    const mins = s._mins as number | null;
    if (mins !== null && mins !== undefined && mins >= 19 * 60) score += 3;
    if (urlIsSpecific(s.url)) score += 2;
    if (["magic", "outdoor", "classic", "family"].includes(String(s.chip || ""))) score += 1;
    const venue = String(s.venue || "");
    if (venue && !VAGUE_VENUE.test(venue.trim())) score += 1;
    return { score, mins: mins ?? 99 * 60, s };
  });
  ranked.sort((a, b) => b.score - a.score || a.mins - b.mins);
  const s = ranked[0].s;
  return {
    title: s.name || "Tonight’s pick",
    when: s.time || "",
    where: s.venue || "",
    why: WHY[String(s.chip || "")] || "Solid board pick — confirm at the box office.",
    url: s.url || "",
    source: "desk",
  };
}

function buildBuckets(shows: Json[]): Json[] {
  const order: [string, string, string][] = [
    ["matinee", "Matinee", "Before 4 PM"],
    ["late_afternoon", "Late afternoon", "4–7 PM"],
    ["evening", "Evening", "7 PM and after"],
    ["anytime", "Time TBA", "Confirm box office"],
  ];
  const out: Json[] = [];
  for (const [id, label, blurb] of order) {
    const items = shows.filter((s) => s.bucket === id);
    if (!items.length) continue;
    out.push({
      id, label, blurb, count: items.length,
      shows: items.map((s) => ({
        name: s.name, time: s.time, venue: s.venue, type: s.type ?? null, url: s.url || "",
        chip: s.chip, icon: s.icon, ticketOk: s.ticketOk, desc: s.desc || s.why || "", price: s.price || "",
      })),
    });
  }
  return out;
}

export type BuiltBoard = { showsData: Json; magazine: Json; showCount: number };

/**
 * Build shows-data.json + shows-magazine.json for `day` from today's scout text.
 * Same output shape tonight_in_branson.py writes after build_shows_from_scout.py.
 */
export function buildBoard(opts: {
  day: string;
  scoutText: string;
  scoutFile: string;
  prior: Json | null;
  editorNotes: Json | null;
  pipeline: string;
  now?: Date;
}): BuiltBoard {
  const { day, scoutText, scoutFile, prior, pipeline } = opts;
  const stamp = nowCTIso(opts.now);
  let rows = dedupe(parseScout(scoutText));
  rows = enrichFromPrior(rows, prior);
  for (const r of rows) delete r._confirmed;
  const enriched = enrichShows(rows);
  const shows = enriched.map((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith("_"))));

  // magazine (fresh board: scout date == day by construction)
  const notes = opts.editorNotes || {};
  const featOk = notes.for === day;
  const pick = (featOk ? pickFromEditor(notes, enriched) : null) || pickFromList(enriched);
  const wd = WEEKDAY_PACKS[weekdayIndex(day)];
  let hed = wd[0];
  let deck = wd[1];
  if (featOk && notes.headline) hed = String(notes.headline).trim() || hed;
  if (featOk && notes.lede) deck = String(notes.lede).trim() || deck;
  const blurb = scoutBlurb(scoutText).replace(/\*\*/g, "");
  if (blurb && !featOk) deck = blurb;
  const chips: Json[] = [];
  for (const s of enriched) {
    const c = String(s.chip || "");
    if (c && !chips.some((x) => x.id === c)) chips.push({ id: c, label: c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()), count: 0 });
  }
  for (const c of chips) c.count = enriched.filter((s) => s.chip === c.id).length;
  const indoor = featOk && Array.isArray(notes.indoor)
    ? (notes.indoor as Json[]).filter((it) => it && it.name).map((it) => ({ name: it.name, detail: it.detail || "", url: it.url || "" }))
    : [];
  const sourceBits = [...(featOk ? ["night editor"] : []), `scout ${scoutFile}`, "shows-data board"];
  const magazine: Json = {
    date: day,
    kicker: "Tonight in Branson",
    brand: "The daily board",
    hed,
    deck,
    pick,
    buckets: buildBuckets(enriched),
    chips,
    indoor,
    free: [],
    tomorrow: "Boards reshuffle overnight — open this tab tomorrow for a fresh pick and times.",
    editor: {
      stamp: "Tonight in Branson desk",
      checked: day,
      note: `Times and seats change — confirm at the box office before you drive. Sources: ${sourceBits.join(", ")}. Scout prose on file.`,
    },
    counts: { shows: shows.length, withTickets: shows.filter((s) => s.ticketOk).length },
    generated_at: stamp,
    pipeline,
  };
  const showsData: Json = {
    date: day,
    shows,
    freeEvents: [],
    magazineBuilt: day,
    last_verified: stamp,
    status: "fresh",
    scoutDate: day,
    scoutFile,
    source: "scout",
    pipeline,
    listHash: listHash(shows),
    generated_at: stamp,
  };
  return { showsData, magazine, showCount: shows.length };
}
