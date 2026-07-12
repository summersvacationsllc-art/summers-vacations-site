import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import { join } from "path";

const FOLDER_LABELS: Record<string, string> = {
  sdc: "Silver Dollar City",
  lake: "Table Rock Lake",
  shows: "Branson Shows",
  outdoors: "Ozark Outdoors",
  fishing: "Fishing Fun",
  landing: "Branson Landing",
  golf: "Branson Golf",
  coasters: "Mountain Coasters",
};

export async function GET() {
  try {
    const base = join(process.cwd(), "public", "adventure-photos");
    const photos: { src: string; label: string }[] = [];

    const entries = await readdir(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const folder = entry.name;
      const label = FOLDER_LABELS[folder] || folder;
      const folderPath = join(base, folder);
      const files = await readdir(folderPath);
      for (const file of files) {
        if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
          photos.push({
            src: `/adventure-photos/${folder}/${file}`,
            label,
          });
        }
      }
    }

    // Also check root-level files
    const rootFiles = await readdir(base);
    for (const file of rootFiles) {
      if (/\.(jpg|jpeg|png|webp|gif)$/i.test(file)) {
        // Skip if it's a directory name (already handled)
        const fullPath = join(base, file);
        const s = await stat(fullPath);
        if (s.isFile()) {
          photos.push({ src: `/adventure-photos/${file}`, label: "Branson Adventure" });
        }
      }
    }

    return NextResponse.json({ ok: true, photos });
  } catch {
    return NextResponse.json({ ok: false, photos: [] }, { status: 500 });
  }
}