/**
 * Test-route unit map. Listing ids here are the live Guesty ids.
 * guidebooks.ts still has stale ids for Rustic, Woodland, and the Penthouse;
 * this test does not change that file.
 *
 * Rustic was verified against /v1/listings on 2026-11-17 (phone-gate branch)
 * and is the id Brian confirmed on 2026-11-18.
 */

export type TestUnit = {
  slug: string;
  /** Shown in the door-code sentence, e.g. "Building 9, Unit 7". */
  place: string;
  listingId: string;
};

export const TEST_UNITS: Record<string, TestUnit> = {
  "rustic-ozark-retreat": {
    slug: "rustic-ozark-retreat",
    place: "Building 9, Unit 7",
    listingId: "68eeb5866f48330013c65a7a",
  },
};

export function testUnit(slug: string): TestUnit | null {
  return TEST_UNITS[slug] ?? null;
}
