import { NextResponse } from "next/server";
import { pickShowsBoard } from "@/lib/shows-cloud";

// Today's show board for the guide (Shows tab, map pins, kiosk). Read at request
// time, freshest first: the always-on cloud Shows Scout board (Vercel Cron →
// private Blob, see src/lib/shows-cloud.ts), then the latest commit on GitHub
// main, then the copy bundled in this deploy (src/lib/live-report-json.ts).
// No redeploy and no Mac needed for a new day's list.
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
  const board = await pickShowsBoard();
  if (!board) {
    return NextResponse.json({ ok: false, error: "Shows data not available" }, { status: 500 });
  }
  const data: Record<string, unknown> = { ...board.data };
  data.freeEvents = cleanFreeEvents(data.freeEvents);
  if (board.magazine) {
    const mag: Record<string, unknown> = { ...board.magazine };
    mag.free = cleanFreeEvents(mag.free);
    data.magazine = mag;
  }
  return NextResponse.json(
    { ok: true, ...data },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Shows-Data-Source": board.source,
        "X-Shows-Data-Date": board.date ?? "",
        "X-Shows-Magazine-Source": board.magazineSource,
      },
    },
  );
}
