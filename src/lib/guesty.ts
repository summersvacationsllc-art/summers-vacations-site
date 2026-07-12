/**
 * Guesty API client for the booking site.
 * Photos fetched from Guesty Open API.
 * Requires GUESTY_CLIENT_ID and GUESTY_CLIENT_SECRET env vars.
 */

const GUESTY_BASE = "https://open-api.guesty.com";

// Simple in-memory token cache (server-side only, resets on cold start)
let memToken: { value: string; exp: number } | null = null;

async function guestyAuth(): Promise<string> {
  const now = Date.now();
  if (memToken && memToken.exp > now + 5 * 60_000) return memToken.value;

  const clientId = process.env.GUESTY_CLIENT_ID || "";
  const clientSecret = process.env.GUESTY_CLIENT_SECRET || "";

  const res = await fetch(`${GUESTY_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "open-api",
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok)
    throw new Error(`Guesty auth failed: ${res.status} ${await res.text()}`);

  const json = await res.json();
  const exp = now + (json.expires_in ?? 86400) * 1000;
  memToken = { value: json.access_token, exp };
  return json.access_token;
}

async function guestyGet(path: string): Promise<Record<string, unknown>> {
  const token = await guestyAuth();
  const res = await fetch(`${GUESTY_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    } as HeadersInit,
  });
  if (!res.ok)
    throw new Error(`Guesty GET ${path} failed: ${res.status} ${await res.text()}`);
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
