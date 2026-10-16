/**
 * Guesty API client for the booking site.
 * Photos fetched from Guesty Open API.
 * Requires GUESTY_CLIENT_ID and GUESTY_CLIENT_SECRET env vars.
 */

import { get as blobGet, put as blobPut } from "@/lib/blob";

const GUESTY_BASE =
  (!process.env.VERCEL && process.env.GUESTY_API_BASE_LOCAL_TEST?.trim()) || "https://open-api.guesty.com";

/*
 * ONE shared OAuth token for every serverless instance.
 *
 * Guesty allows only 5 token requests per client per 24h, and every Vercel
 * instance used to request its own on cold start (-> 429s). Now:
 *   1. in-memory copy (per instance),
 *   2. shared copy in the site's private Vercel Blob store,
 *   3. only when both are missing/near expiry: one instance takes a
 *      create-once lock blob for the current 15-minute slot and requests a
 *      token; others wait briefly for it to appear in Blob.
 *   4. a 429 writes a shared cooldown (from Guesty's ratelimit-reset /
 *      Retry-After) so no instance asks again before Guesty will answer.
 * Callers already fall back (static listings, empty reviews/photos, guidebook
 * keeps its URL-only behavior) when this throws. The token is never logged.
 */
const TOKEN_BLOB = "guesty/oauth/token.json";
const COOLDOWN_BLOB = "guesty/oauth/cooldown.json";
const LOCK_PREFIX = "guesty/oauth/lock-";
const LOCK_SLOT_MS = 15 * 60_000;
const REFRESH_EARLY_MS = 45 * 60_000; // refresh 45 min before expiry
const MIN_USE_MS = 5 * 60_000; // never hand out a token with < 5 min left

type StoredToken = { value: string; exp: number };
let memToken: StoredToken | null = null;
let memCooldownUntil = 0;
let inflight: Promise<string> | null = null;

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN || (!process.env.VERCEL && !!process.env.LOCAL_BLOB_DIR);
}

async function readJson<T>(pathname: string): Promise<T | null> {
  if (!blobEnabled()) return null;
  try {
    const res = await blobGet(pathname, { access: "private" });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  } catch {
    return null;
  }
}

async function writeJson(pathname: string, data: unknown, overwrite: boolean): Promise<boolean> {
  if (!blobEnabled()) return overwrite; // no shared store: behave as before
  try {
    await blobPut(pathname, JSON.stringify(data), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: overwrite,
      cacheControlMaxAge: 60,
    });
    return true;
  } catch {
    return false;
  }
}

function usable(t: StoredToken | null, now: number, margin: number): boolean {
  return !!t && typeof t.value === "string" && !!t.value && Number(t.exp) - margin > now;
}

async function sharedToken(): Promise<StoredToken | null> {
  return readJson<StoredToken>(TOKEN_BLOB);
}

async function requestNewToken(): Promise<StoredToken> {
  const clientId = process.env.GUESTY_CLIENT_ID || "";
  const clientSecret = process.env.GUESTY_CLIENT_SECRET || "";
  const res = await fetch(`${GUESTY_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "open-api",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
    cache: "no-store",
  });
  const remaining = res.headers.get("x-ratelimit-remaining-day") ?? res.headers.get("ratelimit-remaining");
  if (res.status === 429) {
    const reset = Number(res.headers.get("ratelimit-reset") || res.headers.get("retry-after") || 0);
    const waitS = Number.isFinite(reset) && reset > 0 ? Math.min(reset, 86_400) : 3600;
    const until = Date.now() + waitS * 1000 + 30_000;
    memCooldownUntil = until;
    await writeJson(COOLDOWN_BLOB, { until, setAt: Date.now() }, true);
    console.warn(`Guesty token quota exhausted (429); next token slot in ~${waitS}s (until ${new Date(until).toISOString()})`);
    throw new Error("Guesty auth failed: 429 (token quota; cooling down)");
  }
  if (!res.ok) throw new Error(`Guesty auth failed: ${res.status}`);
  const json = await res.json();
  const now = Date.now();
  const tok: StoredToken = { value: String(json.access_token || ""), exp: now + Number(json.expires_in ?? 86400) * 1000 };
  if (!tok.value) throw new Error("Guesty auth failed: empty token");
  console.log(`Guesty token issued; expires ${new Date(tok.exp).toISOString()}; token requests left today: ${remaining ?? "?"}`);
  await writeJson(TOKEN_BLOB, tok, true);
  return tok;
}

async function acquireToken(): Promise<string> {
  const now = Date.now();
  if (memToken && usable(memToken, now, REFRESH_EARLY_MS)) return memToken.value;

  const shared = await sharedToken();
  if (shared && usable(shared, now, REFRESH_EARLY_MS)) {
    memToken = shared;
    return shared.value;
  }
  // Something better than nothing: an older token that is still valid.
  const fallback: StoredToken | null = [memToken, shared].find((t) => usable(t, now, MIN_USE_MS)) || null;

  if (memCooldownUntil > now) {
    if (fallback) return fallback.value;
    throw new Error("Guesty auth cooling down (token quota)");
  }
  const cd = await readJson<{ until: number }>(COOLDOWN_BLOB);
  if (cd && Number(cd.until) > now) {
    memCooldownUntil = Number(cd.until);
    if (fallback) return fallback.value;
    throw new Error("Guesty auth cooling down (token quota)");
  }

  // One requester per 15-minute slot across all instances (create-once blob).
  const slot = Math.floor(now / LOCK_SLOT_MS);
  const gotLock = await writeJson(`${LOCK_PREFIX}${slot}.json`, { at: now }, false);
  if (!gotLock) {
    // Another instance is (or was) fetching: wait briefly for it to publish.
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const t = await sharedToken();
      if (t && usable(t, Date.now(), MIN_USE_MS)) {
        memToken = t;
        return t.value;
      }
    }
    if (fallback) return fallback.value;
    throw new Error("Guesty auth: token refresh in progress elsewhere");
  }
  try {
    const tok = await requestNewToken();
    memToken = tok;
    return tok.value;
  } catch (e) {
    if (fallback) return fallback.value;
    throw e;
  }
}

async function guestyAuth(): Promise<string> {
  if (memToken && usable(memToken, Date.now(), REFRESH_EARLY_MS)) return memToken.value;
  if (!inflight) inflight = acquireToken().finally(() => { inflight = null; });
  return inflight;
}

/** Drop a token Guesty rejected (401) so the next call re-reads/refreshes. */
async function invalidateToken(bad: string) {
  if (memToken?.value === bad) memToken = null;
  const shared = await sharedToken();
  if (shared?.value === bad) await writeJson(TOKEN_BLOB, { value: "", exp: 0 }, true);
}

export async function guestyGet(path: string): Promise<Record<string, unknown>> {
  const token = await guestyAuth();
  const res = await fetch(`${GUESTY_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    } as HeadersInit,
  });
  if (res.status === 401) await invalidateToken(token);
  if (!res.ok)
    throw new Error(`Guesty GET ${path.split("?")[0]} failed: ${res.status}`);
  return res.json();
}

export interface GuestyPhoto {
  url: string;
  caption?: string;
  id?: string;
}

/** Fetch photos for a specific Guesty listing. */
export async function fetchGuestyListingPhotos(
  guestyListingId: string
): Promise<GuestyPhoto[]> {
  if (!guestyListingId) return [];
  try {
    const json = (await guestyGet(
      `/v1/listings/${guestyListingId}?fields=photos`
    )) as Record<string, unknown>;
    const photosRaw =
      (json.photos as unknown[]) ||
      ((json.data as Record<string, unknown>)?.photos as unknown[]) ||
      [];
    return (photosRaw as Record<string, unknown>[])
      .map((p: unknown) => {
        const photo = p as Record<string, unknown>;
        return {
          url:
            (photo.url as string) ||
            (photo.thumbnail_url as string) ||
            (photo.original_url as string) ||
            "",
          caption: (photo.caption as string) || (photo.name as string) || "",
          id: String(photo._id || photo.id || ""),
        };
      })
      .filter((p) => p.url);
  } catch (e) {
    console.error("Failed to fetch Guesty photos:", e);
    return [];
  }
}

export interface GuestyListing {
  guesty_id: string;
  title: string;
  nickname: string;
  accommodates: number;
}

/** Fetch all listings from Guesty (paginated). */
export async function fetchGuestyListings(): Promise<GuestyListing[]> {
  const out: GuestyListing[] = [];
  let skip = 0;
  const limit = 100;
  const fields = encodeURIComponent("title nickname accommodates");

  for (let page = 0; page < 10; page++) {
    const json = await guestyGet(
      `/v1/listings?limit=${limit}&skip=${skip}&fields=${fields}`
    );
    const results = (json.results as Record<string, unknown>[]) || [];
    for (const r of results) {
      out.push({
        guesty_id: String(r._id ?? r.id ?? ""),
        title: String(r.title ?? r.nickname ?? "Untitled"),
        nickname: String(r.nickname ?? ""),
        accommodates: Number(r.accommodates ?? 0),
      });
    }
    const count = Number(json.count ?? 0);
    skip += limit;
    if (results.length < limit || skip >= count) break;
  }
  return out;
}

export interface GuestyReview {
  reviewerName: string;
  body: string;
  rating: number; // 1-5
  channel: string;
  createdAt: string;
  listingId: string;
}

/** Fetch reviews across all listings, optionally filtered by listing IDs. */
export async function fetchGuestyReviews(
  listingIds: string[],
  limit = 20
): Promise<GuestyReview[]> {
  if (!listingIds.length) return [];
  try {
    const all: GuestyReview[] = [];
    // Fetch reviews for each listing
    for (const listingId of listingIds) {
      const json = await guestyGet(
        `/v1/reviews?listingId=${listingId}&limit=${Math.ceil(limit / listingIds.length)}&includeCustomChannels=false`
      );
      const results = (json.results as Record<string, unknown>[]) || [];
      for (const r of results) {
        const contents = (r.contents as Record<string, unknown>) || {};
        all.push({
          reviewerName: String(contents.reviewerName || r.reviewerName || "Guest"),
          body: String(contents.body || r.bodyText || ""),
          rating: Math.round(Number(contents.rating || r.rating || 5) / 2), // Guesty doubles ratings
          channel: String(r.channelId || ""),
          createdAt: String(r.createdAt || r.updatedAt || ""),
          listingId: String(r.listingId || listingId),
        });
      }
    }
    // Sort by newest first, take top N
    return all
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  } catch (e) {
    console.error("Failed to fetch Guesty reviews:", e);
    return [];
  }
}
