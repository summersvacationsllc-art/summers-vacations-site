import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const path = join(process.cwd(), "public", "reports", "fleet-today.json");
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
      { ok: false, error: "fleet-today.json not available yet" },
      { status: 503 },
    );
  }
}
