import { NextResponse } from "next/server";
import { fetchGuestyReviews } from "@/lib/guesty";

// All Summers Vacations Guesty listing IDs
const LISTING_IDS = [
  "68eeb58d873b002c39d38657", // The Penthouse
  "68eeb5866f48002c3d470a6c", // Rustic Ozark Retreat
  "68eecd33a359002c338a2a55", // Woodland Retreat
  "696679519399002c92ac4ec4", // Modern Charmer
  "699911d27b1a001efccbf235", // Pretty Peacock
  "68eeb561cce1002c364dfb89", // Double Condo
  "6993c5d31547001e711bc7ed", // Branson Family Haven
];

export async function GET() {
  try {
    const reviews = await fetchGuestyReviews(LISTING_IDS, 20);
    // Only return 5-star reviews — we're a Superhost with 4 years running
    const fiveStar = reviews.filter((r) => r.rating >= 5);
    return NextResponse.json({ ok: true, reviews: fiveStar });
  } catch {
    return NextResponse.json({ ok: false, reviews: [] }, { status: 500 });
  }
}
