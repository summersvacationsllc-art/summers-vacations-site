import { NextResponse } from "next/server";
import { loadLiveReport } from "@/lib/live-report-json";

// Live Guesty snapshot for the kiosk and /reports. The body is guest-today.json
// exactly as the daily guest sync wrote it, read at request time from the
// latest commit on GitHub main (falls back to the copy bundled in this deploy),
// so a sync push shows up without a Vercel redeploy. See src/lib/live-report-json.ts.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const report = await loadLiveReport("guest-today.json");
  if (!report) {
    return NextResponse.json(
      { ok: false, error: "guest-today.json not available yet" },
      { status: 503 },
    );
  }
  return new NextResponse(report.text, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "X-Guest-Data-Source": report.source,
      "X-Guest-Data-Date": report.date ?? "",
      "X-Guest-Data-Generated": report.generatedAt ?? "",
    },
  });
}
