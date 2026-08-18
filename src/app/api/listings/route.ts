import { NextResponse } from "next/server";
import { fetchGuestyListings } from "@/lib/guesty";
import { guidebooks } from "@/data/guidebooks";
import { PROPERTIES, type PropertyCard } from "@/lib/site";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveSlug(guestyId: string, title: string, nickname: string): string {
  const byId = Object.values(guidebooks).find((gb) => gb.guestyListingId === guestyId);
  if (byId) return byId.slug;

  const titleLower = title.toLowerCase().trim();
  const nickLower = nickname.toLowerCase().trim();
  const byName = Object.values(guidebooks).find((gb) => {
    const n = gb.name.toLowerCase();
    const s = gb.shortName.toLowerCase();
    return n === titleLower || n === nickLower || s === titleLower || s === nickLower;
  });
  if (byName) return byName.slug;

  const byProp = PROPERTIES.find((p) => {
    const n = p.name.toLowerCase();
    return n === titleLower || n === nickLower || p.slug === slugify(title) || p.slug === slugify(nickname);
  });
  if (byProp) return byProp.slug;
  return slugify(nickname || title) || guestyId;
}

export type ListingCard = {
  guesty_id: string;
  name: string;
  nickname: string;
  accommodates: number;
  sleeps: string;
  slug: string;
  photo: string | null;
  photos: string[];
  tag?: string;
  beds?: string;
  area?: string;
  blurb?: string;
  badge?: string;
};

function fromCard(p: PropertyCard, guestyId = ""): ListingCard {
  return {
    guesty_id: guestyId,
    name: p.name,
    nickname: p.name,
    accommodates: Number(String(p.sleeps).replace(/[^\d]/g, "")) || 0,
    sleeps: p.sleeps,
    slug: p.slug,
    photo: p.photo,
    photos: p.photo ? [p.photo] : [],
    tag: p.tag,
    beds: p.beds,
    area: p.area,
    blurb: p.blurb,
    badge: p.badge,
  };
}

function staticListings(): ListingCard[] {
  return PROPERTIES.map((p) => {
    const gb = Object.values(guidebooks).find((g) => g.slug === p.slug);
    return fromCard(p, gb?.guestyListingId || "");
  });
}

let cache: { at: number; listings: ListingCard[] } | null = null;
const CACHE_MS = 30 * 60 * 1000;

/** GET /api/listings — Guesty when it works; static cards on 429 / outage. */
export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return NextResponse.json({ ok: true, listings: cache.listings, source: "cache" });
  }

  try {
    const listings = await fetchGuestyListings();
    const cards: ListingCard[] = listings
      .filter((listing) => listing.guesty_id)
      .map((listing) => {
        const slug = resolveSlug(listing.guesty_id, listing.title, listing.nickname);
        const hardcoded = PROPERTIES.find((p) => p.slug === slug);
        const name = listing.title || listing.nickname || hardcoded?.name || "Untitled";
        const sleeps = listing.accommodates > 0 ? String(listing.accommodates) : hardcoded?.sleeps || "?";
        return {
          guesty_id: listing.guesty_id,
          name,
          nickname: listing.nickname,
          accommodates: listing.accommodates,
          sleeps,
          slug,
          photo: hardcoded?.photo || null,
          photos: hardcoded?.photo ? [hardcoded.photo] : [],
          tag: hardcoded?.tag,
          beds: hardcoded?.beds,
          area: hardcoded?.area,
          blurb: hardcoded?.blurb,
          badge: hardcoded?.badge,
        };
      });

    const valid = cards.length ? cards : staticListings();
    cache = { at: Date.now(), listings: valid };
    return NextResponse.json({ ok: true, listings: valid, source: "guesty" });
  } catch (e) {
    const fallback = cache?.listings?.length ? cache.listings : staticListings();
    return NextResponse.json({
      ok: true,
      listings: fallback,
      source: cache ? "cache" : "static",
      note: e instanceof Error ? e.message : "Guesty unavailable",
    });
  }
}
