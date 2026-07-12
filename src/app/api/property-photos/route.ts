import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

const SLUG_TO_FOLDER: Record<string, string> = {
  "the-penthouse": "penthouse",
  "rustic-ozark-retreat": "rustic-ozark-retreat",
  "woodland-retreat": "woodland-retreat",
  "modern-charmer": "modern-charmer",
  "pretty-peacock": "pretty-peacock",
  "double-condo": "double-condo",
  "branson-family-haven": "branson-family-haven",
};

export async function GET() {
  const photos: Record<string, string> = {};
  const gallery: { src: string; alt: string }[] = [];

  for (const [slug, folder] of Object.entries(SLUG_TO_FOLDER)) {
    try {
      const dir = join(process.cwd(), "public", "property-photos", folder);
      const files = await readdir(dir);
      const images = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f) && !f.startsWith("."));
      if (images.length > 0) {
        photos[slug] = `/property-photos/${folder}/${images[0]}`;
        // Add all images to gallery
        for (const img of images) {
          gallery.push({
            src: `/property-photos/${folder}/${img}`,
            alt: `${folder.replace(/-/g, " ")} photo`,
          });
        }
      }
    } catch {
      // folder missing or empty — skip
    }
  }

  return NextResponse.json({ ok: true, photos, gallery });
}