import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

const PROPERTY_SLUGS = [
  "penthouse",
  "rustic-ozark-retreat",
  "woodland-retreat",
  "modern-charmer",
  "pretty-peacock",
  "double-condo",
  "branson-family-haven",
];

export async function GET() {
  const photos: Record<string, string> = {};

  for (const slug of PROPERTY_SLUGS) {
    try {
      const dir = join(process.cwd(), "public", "property-photos", slug);
      const files = await readdir(dir);
      const images = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("."));
      if (images.length > 0) {
        photos[slug] = `/property-photos/${slug}/${images[0]}`;
      }
    } catch {
      // folder missing or empty — skip
    }
  }

  return NextResponse.json({ ok: true, photos });
}