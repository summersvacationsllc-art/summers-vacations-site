import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "reports", "shows-data.json");
    const data = await readFile(path, "utf-8");
    return NextResponse.json({ ok: true, ...JSON.parse(data) });
  } catch {
    return NextResponse.json({ ok: false, error: "Shows data not available" }, { status: 500 });
  }
}