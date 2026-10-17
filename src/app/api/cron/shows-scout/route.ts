import { NextResponse } from "next/server";
import { loadLiveReport, todayCT } from "@/lib/live-report-json";
import { XAI_RESPONSES_URL } from "@/lib/jeb";
import { buildBoard, nowCTIso, weekdayName } from "@/lib/shows-board";
import {
  MIN_SHOWS,
  blobConfigured,
  readCloudJson,
  writeCloud,
  type CloudStatus,
} from "@/lib/shows-cloud";

/**
 * Always-on Branson Shows Scout (replaces the Mac-only Hermes job, 2026-10-16).
 *
 * Schedule (vercel.json, UTC): 09:15 daily (4:15 AM CDT / 3:15 AM CST) and a
 * retry at 11:00 (6:00 AM CDT / 5:00 AM CST) that does nothing if today's list
 * is already in. Manual run:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://mybransonvacation.com/api/cron/shows-scout
 *   ?force=1   re-run even if today's list is already in
 *   ?dryRun=1  research + parse, return the result, publish nothing
 *
 * Steps: xAI Responses API + web_search writes today's scout markdown in the
 * format scripts/build_shows_from_scout.py reads → parse/build with the same
 * rules (src/lib/shows-board.ts) → validate (≥3 shows, today's date) → store in
 * the private Blob store. A failed or empty run never replaces the last good
 * list; it is recorded in shows-cloud/status.json and flagged in /api/sync-status.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 300;

const MODEL = process.env.SHOWS_SCOUT_MODEL?.trim() || "grok-4.20-0309-non-reasoning";
const SEARCH_TIMEOUT_MS = 240_000;

function authorized(req: Request): boolean | null {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return null;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function longDate(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const month = new Date(Date.UTC(y, m - 1, d)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `${weekdayName(day)}, ${month} ${d}, ${y}`;
}

function scoutPrompt(day: string): string {
  const when = longDate(day);
  return `You are the Branson Shows Scout for Summers Vacations (vacation rentals in Branson, Missouri).
Use web search NOW to find the live shows actually scheduled in Branson, MO on ${when} (${day}).

Check live calendars: SaveOnBranson daily show grid, discoverbranson.com, bransonshows.com/calendar, americanarenas.com, ConcertFix, Legends in Concert, Clay Cooper Theatre, The Mansion Theatre, Sight & Sound, Presleys', Hamner's, King's Castle, Grand Shanghai, Americana Theatre, Dolly Parton's Stampede.

RULES
- Never fabricate. Only list a show if a current listing shows it performing on ${day}.
- Do NOT carry forward a lineup from another day or from memory.
- A clock time only if a listing for ${day} shows it. If unsure, write the time as: Check times
- 8 to 16 shows if that many are confirmed. Fewer is fine; never pad.

OUTPUT: only this markdown, no preamble, no citation markers like [1]:

# 🎭 Shows & Entertainment — ${when}

One or two sentences about today's lineup.

## Today's Shows

**Show Name** – 7:30 PM
- Venue Name (street address)
- One-sentence description.
- Tickets from ~$45–$65
- Source: site1.com, site2.com (verified ${when})

FORMAT RULES: bold ONLY the show name; the en dash and the time go AFTER the closing ** (right: "**Anthems of Rock** – 8:00 PM", wrong: "**Anthems of Rock – 8:00 PM**"). One show per block, sorted by time. If the price is unknown write "Tickets available".

## Insider Tips
Two or three practical sentences for guests.

## Desk Note
Which sources you checked and anything you could not confirm.`;
}

type XaiResponse = {
  output_text?: string;
  output?: { type?: string; text?: string; content?: { type?: string; text?: string }[] }[];
};

function responseText(data: XaiResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const bits: string[] = [];
  for (const item of data.output || []) {
    if (item.type && item.type !== "message" && item.type !== "output_text") continue;
    if (typeof item.text === "string") bits.push(item.text);
    for (const c of item.content || []) if ((c.type === "output_text" || c.type === "text") && c.text) bits.push(c.text);
  }
  return bits.join("\n");
}

/** "**Name – 7:30 PM**" → "**Name** – 7:30 PM" (the parser wants only the name in bold). */
function unboldTimes(t: string): string {
  return t
    .split("\n")
    .map((line) => {
      const m = /^\*\*(.+)\s+[–—-]\s+([^–—*]+?)\*\*\s*$/.exec(line.trim());
      return m && !m[1].includes("**") ? `**${m[1].trim()}** – ${m[2].trim()}` : line;
    })
    .join("\n");
}

function tidyScout(text: string): string {
  let t = unboldTimes(text.replace(/\r\n/g, "\n"));
  const start = t.indexOf("# ");
  if (start > 0) t = t.slice(start);
  t = t
    .replace(/^```(?:markdown|md)?\s*$/gim, "")
    .replace(/\[\[\d+\]\]\([^)]+\)/g, "")
    .replace(/\s?\[\d+\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return t + "\n";
}

async function researchScout(day: string, key: string): Promise<string> {
  const r = await fetch(XAI_RESPONSES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      input: [{ role: "user", content: scoutPrompt(day) }],
      tools: [{ type: "web_search" }],
      max_output_tokens: 6000,
    }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`xAI search HTTP ${r.status}`);
  return tidyScout(responseText((await r.json()) as XaiResponse));
}

export async function GET(req: Request) {
  const auth = authorized(req);
  if (auth === null) return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  if (!auth) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const dryRun = url.searchParams.get("dryRun") === "1";
  const trigger = req.headers.get("user-agent")?.includes("vercel-cron") ? "vercel-cron" : "manual";
  const day = todayCT();
  const headers = { "Cache-Control": "no-store, max-age=0" };

  if (!blobConfigured()) return NextResponse.json({ ok: false, error: "Blob store not configured" }, { status: 503, headers });
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) return NextResponse.json({ ok: false, error: "XAI_API_KEY not configured" }, { status: 503, headers });

  const prev = (await readCloudJson("status.json")) as CloudStatus | null;
  if (!force && !dryRun && prev?.lastOkDate === day) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: `today's list already in (${prev.lastOkShowCount} shows at ${prev.lastOkAt})` },
      { headers },
    );
  }

  let scout = "";
  let message = "";
  let built: ReturnType<typeof buildBoard> | null = null;
  try {
    scout = await researchScout(day, key);
    const [prior, notes] = await Promise.all([
      readCloudJson("shows-data.json").then(async (c) => c ?? (await loadLiveReport("shows-data.json"))?.data ?? null),
      loadLiveReport("editor-notes.json").then((r) => r?.data ?? null),
    ]);
    if (scout.length < 400) throw new Error(`scout too short (${scout.length} chars)`);
    if (!scout.toLowerCase().includes(weekdayName(day).toLowerCase())) throw new Error("scout does not mention today's weekday");
    built = buildBoard({ day, scoutText: scout, scoutFile: `${day}.md`, prior, editorNotes: notes, pipeline: "vercel-cron" });
    if (built.showCount < MIN_SHOWS) throw new Error(`scout parsed to ${built.showCount} shows (< ${MIN_SHOWS})`);
    if (built.showCount > 40) throw new Error(`scout parsed to ${built.showCount} shows (> 40, looks wrong)`);
    message = `ok: ${built.showCount} shows`;
  } catch (e) {
    message = `failed: ${e instanceof Error ? e.message.slice(0, 200) : "unknown error"}`;
    built = null;
  }

  if (dryRun) {
    return NextResponse.json(
      { ok: !!built, dryRun: true, day, model: MODEL, message, showCount: built?.showCount ?? 0, shows: built?.showsData.shows ?? [], scout },
      { headers },
    );
  }

  const stamp = nowCTIso();
  if (built) {
    await writeCloud(`scouts/${day}.md`, scout, "text/markdown; charset=utf-8");
    await writeCloud("shows-magazine.json", JSON.stringify(built.magazine, null, 2) + "\n", "application/json");
    await writeCloud("shows-data.json", JSON.stringify(built.showsData, null, 2) + "\n", "application/json");
  } else if (scout) {
    await writeCloud(`scouts/${day}.rejected.md`, scout, "text/markdown; charset=utf-8").catch(() => {});
  }
  const status: CloudStatus = {
    lastRunAt: stamp,
    lastRunOk: !!built,
    lastRunDate: day,
    trigger,
    message,
    showCount: built?.showCount ?? 0,
    lastOkAt: built ? stamp : prev?.lastOkAt ?? null,
    lastOkDate: built ? day : prev?.lastOkDate ?? null,
    lastOkShowCount: built ? built.showCount : prev?.lastOkShowCount ?? null,
    model: MODEL,
  };
  await writeCloud("status.json", JSON.stringify(status, null, 2) + "\n", "application/json");
  return NextResponse.json(
    { ok: !!built, day, message, status, ...(built ? { listHash: built.showsData.listHash } : {}) },
    { status: built ? 200 : 502, headers },
  );
}
