import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Read a public/reports/*.json snapshot at REQUEST time, preferring whichever
 * copy is fresher:
 *   1. the latest commit on GitHub main (raw.githubusercontent.com — public repo,
 *      no token), which every guest sync (GitHub Actions bot or Mac/Hermes)
 *      pushes to, and
 *   2. the copy bundled into this Vercel deployment.
 *
 * Why: the daily guest sync commits fresh guest data to GitHub, but Vercel is
 * not Git-connected, so the bundled copy only changes when someone runs
 * `vercel --prod`. On 2026-10-02 the kiosk lost a guest name because of that.
 * Reading from GitHub means a sync push is live within ~5 min (raw CDN cache)
 * with no redeploy. If GitHub is unreachable we fall back to the bundled file.
 */

export const REPORTS_RAW_BASE =
  process.env.REPORTS_RAW_BASE?.trim() ||
  "https://raw.githubusercontent.com/summersvacationsllc-art/summers-vacations-site/main/public/reports";

export type ReportSource = "github" | "bundled";

export type LoadedReport = {
  text: string;
  data: Record<string, unknown>;
  source: ReportSource;
  date: string | null;
  generatedAt: string | null;
  /** Diagnostics: what each candidate looked like. */
  candidates: Partial<Record<ReportSource, { date: string | null; generatedAt: string | null; error?: string }>>;
};

type Candidate = { text: string; data: Record<string, unknown> };

const memo = new Map<string, { at: number; value: Candidate | null; error?: string }>();
const REMOTE_TTL_MS = 60_000;

function parse(text: string): Candidate | null {
  try {
    const data = JSON.parse(text);
    if (data && typeof data === "object" && !Array.isArray(data)) return { text, data };
  } catch {}
  return null;
}

function dateOf(d: Record<string, unknown> | undefined): string | null {
  const v = d?.date;
  return typeof v === "string" ? v : null;
}

function genOf(d: Record<string, unknown> | undefined): string | null {
  const v = d?.generated_at ?? d?.generated ?? d?.updated;
  return typeof v === "string" ? v : null;
}

/** Sort key: calendar date first, then generated_at instant. */
function freshness(c: Candidate | null): [string, number] {
  if (!c) return ["", -Infinity];
  const g = genOf(c.data);
  const t = g ? Date.parse(g) : NaN;
  return [dateOf(c.data) || "", Number.isFinite(t) ? t : -Infinity];
}

async function fetchRemote(name: string): Promise<{ value: Candidate | null; error?: string }> {
  const hit = memo.get(name);
  if (hit && Date.now() - hit.at < REMOTE_TTL_MS) return hit;
  let value: Candidate | null = null;
  let error: string | undefined;
  try {
    const res = await fetch(`${REPORTS_RAW_BASE}/${name}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
      headers: { "User-Agent": "mybransonvacation-live-reports" },
    });
    if (res.ok) {
      value = parse(await res.text());
      if (!value) error = "invalid JSON";
    } else {
      error = `HTTP ${res.status}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message.slice(0, 120) : "fetch failed";
  }
  const entry = { at: Date.now(), value, error };
  memo.set(name, entry);
  return entry;
}

async function readBundled(name: string): Promise<Candidate | null> {
  try {
    return parse(await readFile(join(process.cwd(), "public", "reports", name), "utf-8"));
  } catch {
    return null;
  }
}

export async function loadLiveReport(name: string): Promise<LoadedReport | null> {
  if (!/^[a-z0-9-]+\.json$/i.test(name)) throw new Error("bad report name");
  const [remote, bundled] = await Promise.all([fetchRemote(name), readBundled(name)]);
  const r = remote.value;
  const candidates: LoadedReport["candidates"] = {
    github: { date: dateOf(r?.data), generatedAt: genOf(r?.data), ...(remote.error ? { error: remote.error } : {}) },
    bundled: { date: dateOf(bundled?.data), generatedAt: genOf(bundled?.data) },
  };
  if (!r && !bundled) return null;
  const [rd, rt] = freshness(r);
  const [bd, bt] = freshness(bundled);
  const useRemote = !!r && (!bundled || rd > bd || (rd === bd && rt >= bt));
  const pick = (useRemote ? r : bundled) as Candidate;
  return {
    text: pick.text,
    data: pick.data,
    source: useRemote ? "github" : "bundled",
    date: dateOf(pick.data),
    generatedAt: genOf(pick.data),
    candidates,
  };
}

/** Today's calendar date in America/Chicago (YYYY-MM-DD). */
export function todayCT(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Current hour (0-23) in America/Chicago. */
export function hourCT(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hourCycle: "h23" }).format(now),
  );
}
