import { NextResponse } from "next/server";
import { parseHeartbeat, saveHeartbeat } from "@/lib/kiosk-heartbeat";

// Silent "check-in" from kiosk tablets (public/kiosk.html), every ~3 min.
//   POST /api/kiosk-heartbeat  { unit, deviceId, version, battery, ... }
// One small private Blob record per device, overwritten each time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" };

export async function POST(req: Request) {
  let raw: unknown = null;
  try {
    const text = await req.text();
    if (text.length > 4096) return NextResponse.json({ ok: false, error: "too large" }, { status: 413, headers: NO_STORE });
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400, headers: NO_STORE });
  }
  const rec = parseHeartbeat(raw, req.headers.get("user-agent") || "");
  if (!rec) return NextResponse.json({ ok: false, error: "bad heartbeat" }, { status: 400, headers: NO_STORE });
  try {
    const { stored } = await saveHeartbeat(rec);
    return NextResponse.json(
      { ok: true, stored, unit: rec.unit, deviceId: rec.deviceId, probe: rec.probe, receivedAt: rec.receivedAt },
      { headers: NO_STORE },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "store failed" },
      { status: 500, headers: NO_STORE },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { ok: true, hint: "POST heartbeats here; see /api/kiosk-status" },
    { headers: NO_STORE },
  );
}
