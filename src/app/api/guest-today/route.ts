import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

// Live Guesty snapshot for /reports — read straight from guest-today.json,
// which the ozark-report cron rebuilds each morning. No fabricated data.
// `cache: "no-store"` so the page always renders fresh numbers.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "reports", "guest-today.json");
    const data = await readFile(path, "utf-8");
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "guest-today.json not available yet" },
      { status: 503 },
    );
  }
}
