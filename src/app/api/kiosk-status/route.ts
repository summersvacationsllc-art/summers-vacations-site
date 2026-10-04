import { NextResponse } from "next/server";
import { kioskStatus } from "@/lib/kiosk-heartbeat";

// Which kiosk tablets have checked in recently.
//   GET /api/kiosk-status           → 200 { ok, units: [{ unit, status, lastSeenCT, battery, ... }], probes }
//   GET /api/kiosk-status?strict=1  → 503 when any unit is offline (>60 min or never seen), for uptime monitors
// status: online (<10 min) · quiet (10–60 min) · offline (>60 min or never seen)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const strict = new URL(req.url).searchParams.get("strict") === "1";
  try {
    const body = await kioskStatus();
    return NextResponse.json(body, {
      status: strict && !body.ok ? 503 : 200,
      headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "status failed" },
      { status: strict ? 503 : 500, headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" } },
    );
  }
}
