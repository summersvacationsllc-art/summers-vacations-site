/**
 * Server-only: find ONE guest's stay dates for the guidebook page.
 *
 * Data source: Guesty Open API reservations (existing GUESTY_CLIENT_ID/SECRET),
 * because the daily guest sync (guest-today.json) only covers today's in-house
 * guests, while guidebook links go out at booking and 3 days before arrival.
 *
 * Returns only {checkin, checkout} for a single unambiguous match. Never returns
 * names, phones, emails or other reservations.
 */
import { guestyGet } from "@/lib/guesty";
import { guidebooks, getGuidebook } from "@/data/guidebooks";
import { PROPERTIES } from "@/lib/site";
import { todayCT } from "@/lib/live-report-json";

type Res = {
  slug: string | null;
  checkin: string;
  checkout: string;
  conf: string[];
  phoneLast4: string[];
  first: string;
};

const DEAD = new Set(["canceled", "cancelled", "declined", "expired", "inquiry", "closed", "awaiting_payment_canceled"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const CACHE_MS = 5 * 60_000;
let cache: { at: number; rows: Res[] } | null = null;
let listingCache: { at: number; map: Map<string, string | null> } | null = null;

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Guesty listing (id/title/nickname) -> guidebook slug, same rules as /api/listings. */
export function slugForListing(id: string, title: string, nickname: string): string | null {
  const byId = Object.values(guidebooks).find((gb) => gb.guestyListingId === id);
  if (byId) return byId.slug;
  for (const n of [nickname, title]) {
    if (!n) continue;
    const gb = getGuidebook(n.trim());
    if (gb) return gb.slug;
  }
  const t = title.toLowerCase().trim();
  const n = nickname.toLowerCase().trim();
  const prop = PROPERTIES.find((p) => {
    const aliases = (p.guestyAliases || []).map((a) => a.toLowerCase().trim());
    return p.name.toLowerCase() === t || p.name.toLowerCase() === n ||
      p.slug === slugify(title) || p.slug === slugify(nickname) || aliases.includes(t) || aliases.includes(n);
  });
  if (prop && guidebooks[prop.slug]) return prop.slug;
  const s = slugify(nickname || title);
  return guidebooks[s] ? s : null;
}

function ctDate(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return todayCT(new Date(t));
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function last4(p: unknown): string | null {
  const digits = String(p ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? digits.slice(-4) : null;
}

function firstToken(s: unknown): string {
  return String(s ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z\s'-]/g, "").trim().split(/[\s'-]+/)[0] || "";
}

async function listingSlugs(): Promise<Map<string, string | null>> {
  if (listingCache && Date.now() - listingCache.at < 6 * 3600_000) return listingCache.map;
  const map = new Map<string, string | null>();
  let skip = 0;
  for (let page = 0; page < 5; page++) {
    const json = await guestyGet(`/v1/listings?limit=100&skip=${skip}&fields=${encodeURIComponent("title nickname")}`);
    const results = (json.results as Record<string, unknown>[]) || [];
    for (const r of results) {
      const id = String(r._id ?? r.id ?? "");
      if (id) map.set(id, slugForListing(id, String(r.title ?? ""), String(r.nickname ?? "")));
    }
    skip += 100;
    if (results.length < 100 || skip >= Number(json.count ?? 0)) break;
  }
  listingCache = { at: Date.now(), map };
  return map;
}

async function loadReservations(): Promise<Res[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const slugs = await listingSlugs();
  const today = todayCT();
  const filters = JSON.stringify([
    { field: "checkOut", operator: "$gte", value: `${addDays(today, -2)}T00:00:00.000Z` },
    { field: "checkIn", operator: "$lte", value: `${addDays(today, 550)}T00:00:00.000Z` },
  ]);
  const fields = [
    "listingId", "status", "confirmationCode", "checkIn", "checkOut",
    "checkInDateLocalized", "checkOutDateLocalized",
    "guest.firstName", "guest.fullName", "guest.phone", "guest.phones",
  ].join(" ");
  const rows: Res[] = [];
  let skip = 0;
  for (let page = 0; page < 10; page++) {
    const json = await guestyGet(
      `/v1/reservations?limit=100&skip=${skip}&sort=checkIn&fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}`,
    );
    const results = (json.results as Record<string, unknown>[]) || [];
    for (const r of results) {
      const status = String(r.status ?? "").toLowerCase();
      if (DEAD.has(status)) continue;
      const ci = ISO.test(String(r.checkInDateLocalized ?? "")) ? String(r.checkInDateLocalized) : ctDate(r.checkIn);
      const co = ISO.test(String(r.checkOutDateLocalized ?? "")) ? String(r.checkOutDateLocalized) : ctDate(r.checkOut);
      if (!ci || !co || co <= ci) continue;
      const g = (r.guest as Record<string, unknown>) || {};
      const phones = [g.phone, ...(Array.isArray(g.phones) ? g.phones : [])]
        .map((p) => last4(typeof p === "object" && p ? (p as Record<string, unknown>).number ?? (p as Record<string, unknown>).phone : p))
        .filter((x): x is string => !!x);
      const lid = String(r.listingId ?? "");
      rows.push({
        slug: slugs.get(lid) ?? null,
        checkin: ci,
        checkout: co,
        conf: [r.confirmationCode, r._id].filter(Boolean).map((c) => String(c).trim().toLowerCase()),
        phoneLast4: [...new Set(phones)],
        first: firstToken(g.firstName || g.fullName),
      });
    }
    skip += 100;
    if (results.length < 100 || skip >= Number(json.count ?? 0)) break;
  }
  cache = { at: Date.now(), rows };
  // Diagnostics without guest data: counts per property only.
  const per: Record<string, number> = {};
  for (const r of rows) per[r.slug ?? "unmapped"] = (per[r.slug ?? "unmapped"] || 0) + 1;
  console.log("guidebook-stay: loaded", rows.length, "stays", JSON.stringify(per),
    "withPhone", rows.filter((r) => r.phoneLast4.length).length,
    "withName", rows.filter((r) => r.first).length,
    "listings", slugs.size);
  return rows;
}

export type StayQuery = { property: string; code?: string; name?: string; conf?: string };
export type StayMatch = { checkin: string; checkout: string };

export async function findGuidebookStay(q: StayQuery): Promise<StayMatch | null> {
  const gb = getGuidebook(q.property);
  if (!gb) return null;
  const code = (q.code || "").replace(/\D/g, "");
  const conf = (q.conf || "").trim().toLowerCase();
  const name = firstToken(q.name);
  if (!conf && code.length < 4 && name.length < 2) return null;
  const rows = (await loadReservations()).filter((r) => r.slug === gb.slug);
  const byName = (list: Res[]) => (name ? list.filter((r) => r.first && r.first === name) : list);

  let hits: Res[] = [];
  if (conf) hits = byName(rows.filter((r) => r.conf.includes(conf)));
  if (!hits.length && code.length >= 4) hits = byName(rows.filter((r) => r.phoneLast4.includes(code.slice(-4))));
  // Name-only links (e.g. Scott's unit has no code param): property + first name, must be unique.
  if (!hits.length && !conf && code.length < 4 && name.length >= 2) {
    hits = byName(rows);
    if (hits.length !== 1) return null;
  }
  if (!hits.length) return null;
  // Ambiguous (door-code collision across different stays) -> no match.
  const keys = new Set(hits.map((h) => `${h.checkin}|${h.checkout}`));
  if (keys.size !== 1) return null;
  return { checkin: hits[0].checkin, checkout: hits[0].checkout };
}
