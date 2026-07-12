import { NextResponse } from "next/server";
import { fetchGuestyListings, fetchGuestyListingPhotos } from "@/lib/guesty";
import { guidebooks } from "@/data/guidebooks";
import { PROPERTIES } from "@/lib/site";

/** Turn a listing title/nickname into a URL slug. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Prefer stable slugs for known properties (guidebooks / hardcoded cards)
 * so existing /property/[slug] and guidebook routes keep working.
 */
function resolveSlug(
  guestyId: string,
  title: string,
  nickname: string
): string {
  const byId = Object.values(guidebooks).find(
    (gb) => gb.guestyListingId === guestyId
  );
  if (byId) return byId.slug;

  const titleLower = title.toLowerCase().trim();
  const nickLower = nickname.toLowerCase().trim();

  const byName = Object.values(guidebooks).find((gb) => {
    const n = gb.name.toLowerCase();
    const s = gb.shortName.toLowerCase();
    return (
      n === titleLower ||
      n === nickLower ||
      s === titleLower ||
      s === nickLower
    );
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

/** GET /api/listings — all Guesty listings with hero photos */
export async function GET() {
  try {
    const listings = await fetchGuestyListings();

    const withPhotos: ListingCard[] = await Promise.all(
      listings.map(async (listing) => {
        const photos = await fetchGuestyListingPhotos(listing.guesty_id);
        const slug = resolveSlug(
          listing.guesty_id,
          listing.title,
          listing.nickname
        );
        const hardcoded = PROPERTIES.find((p) => p.slug === slug);
        const photoUrls = photos.map((p) => p.url).filter(Boolean);
        const name =
          listing.title ||
          listing.nickname ||
          hardcoded?.name ||
          "Untitled";
        const sleeps =
          listing.accommodates > 0
            ? String(listing.accommodates)
            : hardcoded?.sleeps || "?";

        return {
          guesty_id: listing.guesty_id,
          name,
          nickname: listing.nickname,
          accommodates: listing.accommodates,
          sleeps,
          slug,
          photo: photoUrls[0] || hardcoded?.photo || null,
          photos: photoUrls,
          tag: hardcoded?.tag,
          beds: hardcoded?.beds,
          area: hardcoded?.area,
          blurb: hardcoded?.blurb,
          badge: hardcoded?.badge,
        };
      })
    );

    // Drop empty / invalid ids
    const valid = withPhotos.filter((l) => l.guesty_id);

    return NextResponse.json({ ok: true, listings: valid, source: "guesty" });
  } catch (e) {
    console.error("GET /api/listings failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
        // Client falls back to hardcoded PROPERTIES
        listings: [],
      },
      { status: 500 }
    );
  }
}
