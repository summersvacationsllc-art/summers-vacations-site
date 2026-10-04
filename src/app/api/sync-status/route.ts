import { NextResponse } from "next/server";
import { hourCT, loadLiveReport, todayCT } from "@/lib/live-report-json";

// Health of the daily guest sync → kiosk pipeline, computed live.
//   GET /api/sync-status            → 200 with { ok, errors, ... }
//   GET /api/sync-status?strict=1   → 503 when not ok (for uptime monitors)
// "lastVerify" is the last result written by the GitHub Actions verifier
// (public/reports/sync-status.json on main).
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Guest data for today should be live by this CT hour (Mac sync 5:30, GHA backup, monitor 7:15). */
const DUE_HOUR_CT = 8;

export async function GET(req: Request) {
  const strict = new URL(req.url).searchParams.get("strict") === "1";
  const now = new Date();
  const today = todayCT(now);
  const errors: string[] = [];
  const warnings: string[] = [];

  const [guest, lastVerify] = await Promise.all([
    loadLiveReport("guest-today.json"),
    loadLiveReport("sync-status.json"),
  ]);

  if (!guest) {
    errors.push("guest-today.json unavailable (GitHub and bundled copy both missing)");
  } else if (guest.date !== today) {
    const msg = `guest data is for ${guest.date ?? "unknown"}, today is ${today} (CT)`;
    if (hourCT(now) >= DUE_HOUR_CT) errors.push(`${msg}: sync overdue (due by ${DUE_HOUR_CT}:00 CT)`);
    else warnings.push(`${msg}: sync not due until ${DUE_HOUR_CT}:00 CT`);
  }
  if (guest?.candidates.github?.error) {
    warnings.push(`GitHub read failed (${guest.candidates.github.error}); serving bundled copy`);
  }
  const lv = lastVerify?.data as { ok?: boolean; checkedAt?: string; errors?: string[] } | undefined;
  if (lv && lv.ok === false) errors.push(`last verifier run failed at ${lv.checkedAt}: ${(lv.errors || []).join("; ")}`);

  const ok = errors.length === 0;
  const body = {
    ok,
    checkedAt: now.toISOString(),
    todayCT: today,
    guestData: guest
      ? { date: guest.date, generatedAt: guest.generatedAt, source: guest.source, candidates: guest.candidates }
      : null,
    lastVerify: lv ?? null,
    errors,
    warnings,
  };
  return NextResponse.json(body, {
    status: strict && !ok ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
