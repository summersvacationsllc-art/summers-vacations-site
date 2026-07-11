import { NextResponse } from "next/server";
import { readdirSync } from "fs";
import { join } from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") || "";

  try {
    const dir = join(process.cwd(), "public", "property-photos", slug);
    const files = readdirSync(dir).filter(f => /\.(jpg|jpeg|png|PNG|webp)$/i.test(f));
    const photos = files.map(f => `/property-photos/${slug}/${f}`);
    return NextResponse.json({ ok: true, photos, total: photos.length });
  } catch {
    return NextResponse.json({ ok: false, photos: [], total: 0 });
  }
}