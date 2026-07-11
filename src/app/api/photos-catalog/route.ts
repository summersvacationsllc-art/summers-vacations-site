import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

interface CatalogPhoto {
  url: string;
  thumb: string;
  title: string;
  category: string;
  source: string;
}

export async function GET() {
  try {
    const catalogPath = join(process.env.HOME || "/Users/briansummers", "projects/branson-content-engine/branson-photo-catalog.md");
    const content = readFileSync(catalogPath, "utf-8");
    const photos: CatalogPhoto[] = [];
    let currentCategory = "General";

    for (const line of content.split("\n")) {
      // Track category
      const catMatch = line.match(/^### (.+)/);
      if (catMatch) {
        currentCategory = catMatch[1].replace(/[#*]/g, "").trim();
        continue;
      }

      // Parse table rows: | # | Subject | Site | Description | URL |
      const rowMatch = line.match(/^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(Unsplash|Pexels|Wikimedia\s*Commons?|Wikimedia)\s*\|/i);
      if (!rowMatch) continue;

      const subject = rowMatch[1].replace(/\*\*/g, "").trim();
      const source = rowMatch[2].trim();

      // Extract photo URL
      let url = "";
      let thumb = "";

      // Unsplash
      const unsplashMatch = line.match(/unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/i);
      if (unsplashMatch) {
        const id = unsplashMatch[1];
        url = `https://unsplash.com/photos/${id}/download?force=true&w=1200`;
        thumb = `https://unsplash.com/photos/${id}/download?force=true&w=400`;
      }

      // Pexels
      const pexelsMatch = line.match(/pexels\.com\/photo\/(\d+)/i);
      if (pexelsMatch) {
        const id = pexelsMatch[1];
        url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
        thumb = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400`;
      }

      // Wikimedia Commons direct URLs
      const wikiMatch = line.match(/upload\.wikimedia\.org\/[^\s|)]+/i);
      if (wikiMatch) {
        url = `https://${wikiMatch[0]}`;
        thumb = url;
      }

      if (url) {
        photos.push({
          url,
          thumb,
          title: subject,
          category: currentCategory,
          source,
        });
      }
    }

    return NextResponse.json({ ok: true, photos, total: photos.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), photos: [], total: 0 });
  }
}
