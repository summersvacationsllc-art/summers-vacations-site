import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const catalogPath = join(process.cwd(), "public", "photos-catalog.json");
    const photos = JSON.parse(await readFile(catalogPath, "utf-8"));
    const list = Array.isArray(photos) ? photos : photos.photos || [];
    return NextResponse.json({ ok: true, photos: list, total: list.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), photos: [], total: 0 });
  }
}
