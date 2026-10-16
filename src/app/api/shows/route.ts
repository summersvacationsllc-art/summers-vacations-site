import { NextResponse } from "next/server";
import { loadLiveReport } from "@/lib/live-report-json";

// Today's show board for the guide (Shows tab, map pins, kiosk). Read at request
// time from the latest commit on GitHub main, falling back to the copy bundled in
// this deploy, the same way /api/guest-today works (see src/lib/live-report-json.ts).
// So a morning sync push (Mac or Actions bot) is live within ~5 min, no redeploy.
// shows-data.json is built from the day's shows scout by scripts/build_shows_from_scout.py.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Internal desk notes must never reach guests (e.g. the old "Deadline-guard:
// show grid carried/partial …" line that used to sit in freeEvents).
const DESK_NOTE = /deadline[- ]guard|carried\/partial|confirm box office/i;

function cleanFreeEvents(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => {
    if (typeof item === "string") return item.trim() !== "" && !DESK_NOTE.test(item);
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const name = String(o.name ?? o.title ?? "");
      return name.trim() !== "" && !DESK_NOTE.test(name);
    }
    return false;
  });
}

export async function GET() {
  const [shows, magazine] = await Promise.all([
    loadLiveReport("shows-data.json"),
    loadLiveReport("shows-magazine.json"),
  ]);
  if (!shows) {
    return NextResponse.json({ ok: false, error: "Shows data not available" }, { status: 500 });
  }
  const data: Record<string, unknown> = { ...shows.data };
  data.freeEvents = cleanFreeEvents(data.freeEvents);
  if (magazine) {
    const mag: Record<string, unknown> = { ...magazine.data };
    mag.free = cleanFreeEvents(mag.free);
    data.magazine = mag;
  }
  return NextResponse.json(
    { ok: true, ...data },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Shows-Data-Source": shows.source,
        "X-Shows-Data-Date": shows.date ?? "",
        "X-Shows-Magazine-Source": magazine?.source ?? "",
      },
    },
  );
}
