import { NextResponse } from "next/server";
import { fetchGuestyListings } from "@/lib/guesty";

/** GET /api/listings — returns all listings from Guesty */
export async function GET() {
  try {
    const listings = await fetchGuestyListings();
    return NextResponse.json({ ok: true, listings });
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
