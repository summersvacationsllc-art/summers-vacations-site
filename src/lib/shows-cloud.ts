/**
 * Always-on Shows Scout storage (2026-10-16).
 *
 * The daily show list used to be researched only by the Hermes "Branson Shows
 * Scout" job on Brian's MacBook (4:15 AM CT). If the Mac was asleep, nothing new
 * was written. Now the scout also runs in Vercel Cron (/api/cron/shows-scout)
 * and the result lives in this project's private Vercel Blob store:
 *
 *   shows-cloud/shows-data.json       last GOOD board (validated, ≥3 shows)
 *   shows-cloud/shows-magazine.json   magazine built from that board
 *   shows-cloud/scouts/YYYY-MM-DD.md  the scout markdown for that day
 *   shows-cloud/status.json           last run result (no guest data)
 *
 * /api/shows reads the cloud board first and falls back to GitHub, then the
 * copy bundled in the deploy (see pickShowsBoard).
 */
import { get, put } from "@/lib/blob";
import { loadLiveReport, todayCT } from "@/lib/live-report-json";

export const CLOUD_PREFIX = "shows-cloud/";
export const MIN_SHOWS = 3;

type Json = Record<string, unknown>;

export type CloudStatus = {
  lastRunAt: string;
  lastRunOk: boolean;
  lastRunDate: string;
  trigger: string;
  message: string;
  showCount: number;
  lastOkAt: string | null;
  lastOkDate: string | null;
  lastOkShowCount: number | null;
  model: string;
};

export function blobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN || (!process.env.VERCEL && !!process.env.LOCAL_BLOB_DIR);
}

export async function readCloudText(name: string): Promise<string | null> {
  if (!blobConfigured()) return null;
  try {
    const res = await get(CLOUD_PREFIX + name, { access: "private", useCache: false } as { access: "private" });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return await new Response(res.stream).text();
  } catch {
    return null;
  }
}

export async function readCloudJson(name: string): Promise<Json | null> {
  const t = await readCloudText(name);
  if (!t) return null;
  try {
    const d = JSON.parse(t);
    return d && typeof d === "object" && !Array.isArray(d) ? (d as Json) : null;
  } catch {
    return null;
  }
}

export async function writeCloud(name: string, body: string, contentType: string): Promise<void> {
  await put(CLOUD_PREFIX + name, body, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

// ---------- reader used by /api/shows ----------
const memo: { at: number; data: Json | null; magazine: Json | null } = { at: 0, data: null, magazine: null };
const TTL_MS = 60_000;

async function loadCloudBoard(): Promise<{ data: Json | null; magazine: Json | null }> {
  if (Date.now() - memo.at < TTL_MS) return memo;
  const [data, magazine] = await Promise.all([readCloudJson("shows-data.json"), readCloudJson("shows-magazine.json")]);
  memo.at = Date.now();
  memo.data = data;
  memo.magazine = magazine;
  return memo;
}

function isGood(d: Json | null | undefined): boolean {
  if (!d) return false;
  const n = Array.isArray(d.shows) ? d.shows.length : 0;
  if (n < MIN_SHOWS) return false;
  return d.status === undefined || d.status === "fresh";
}

function genMs(d: Json | null | undefined): number {
  const g = d?.generated_at ?? d?.generated ?? d?.updated;
  const t = typeof g === "string" ? Date.parse(g) : NaN;
  return Number.isFinite(t) ? t : -Infinity;
}

export type ShowsBoard = {
  data: Json;
  magazine: Json | null;
  source: "cloud" | "github" | "bundled";
  date: string | null;
  magazineSource: string;
};

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`);
  return Number.isFinite(ms) ? Math.round(ms / 86_400_000) : Infinity;
}

/** Same labels scripts/build_shows_from_scout.py + tonight_in_branson.py use for a fallback board. */
function asFallback(data: Json, magazine: Json | null, today: string): { data: Json; magazine: Json | null } {
  const sd = String(data.scoutDate || data.date || "");
  const note = `Show list from the ${sd} scout (today's scout missing). Confirm times at the box office.`;
  const d: Json = { ...data, date: today, status: "fallback", scoutDate: sd, note };
  if (!magazine) return { data: d, magazine: null };
  const editor = { ...((magazine.editor as Json) || {}) };
  editor.note = `Show list from the ${sd} scout (today's not in yet). Confirm times at the box office.`;
  return { data: d, magazine: { ...magazine, date: today, pick: null, editor } };
}

/**
 * Freshest usable board. Order of preference:
 *   1. later calendar date
 *   2. on the same date, a validated board (fresh, ≥3 shows) beats an empty or
 *      fallback one, so a Mac/Actions sync that found no scout cannot blank the
 *      cloud list
 *   3. then the newer generated_at; ties go to the cloud board.
 * If that leaves a board that is empty/fallback while the last good cloud list
 * is at most 2 days old, the cloud list is served instead, labeled as a
 * fallback (no editor pick), matching the Python builder's --max-age-days 2.
 */
export async function pickShowsBoard(): Promise<ShowsBoard | null> {
  const [cloud, live, liveMag] = await Promise.all([
    loadCloudBoard(),
    loadLiveReport("shows-data.json"),
    loadLiveReport("shows-magazine.json"),
  ]);
  const today = todayCT();
  const c = cloud.data;
  const l = live?.data ?? null;
  const cd = typeof c?.date === "string" ? c.date : "";
  const ld = typeof l?.date === "string" ? l.date : "";
  let useCloud = false;
  if (c && !l) useCloud = true;
  else if (c && l) {
    if (cd !== ld) useCloud = cd > ld;
    else if (isGood(c) !== isGood(l)) useCloud = isGood(c);
    else useCloud = genMs(c) >= genMs(l);
    if (!useCloud && !isGood(l) && isGood(c) && daysBetween(cd, today) <= 2) useCloud = true;
  }
  if (useCloud && c) {
    const out = cd === today || !isGood(c) ? { data: c, magazine: cloud.magazine } : asFallback(c, cloud.magazine, today);
    return {
      data: out.data,
      magazine: out.magazine,
      source: "cloud",
      date: typeof out.data.date === "string" ? out.data.date : null,
      magazineSource: out.magazine ? "cloud" : "",
    };
  }
  if (!live) return null;
  return {
    data: live.data,
    magazine: liveMag?.data ?? null,
    source: live.source,
    date: live.date,
    magazineSource: liveMag?.source ?? "",
  };
}
