import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

async function readJson(name: string) {
  const path = join(process.cwd(), "public", "reports", name);
  return JSON.parse(await readFile(path, "utf-8"));
}

// Keep backward compatibility — serve the unified shows data + magazine
export async function GET() {
  try {
    const data = await readJson("shows-data.json");
    try {
      data.magazine = await readJson("shows-magazine.json");
    } catch {
      /* optional */
    }
    return NextResponse.json({ ok: true, ...data });
  } catch {
    return NextResponse.json({ ok: false, error: "Shows data not available" }, { status: 500 });
  }
}
