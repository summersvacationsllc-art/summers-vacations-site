import { NextResponse } from "next/server";
import { fetchGuestyListingPhotos } from "@/lib/guesty";

/** GET /api/photos?listingId=xxx */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId query parameter required" },
      { status: 400 }
    );
  }

  try {
    const photos = await fetchGuestyListingPhotos(listingId);
    return NextResponse.json({ ok: true, photos });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
