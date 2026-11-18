/**
 * Server-only storage for the guidebook phone gate: one private Vercel Blob per
 * submission (no read-modify-write races), kept OUTSIDE Guesty so an Airbnb
 * sync can never wipe a collected number. Previews write under their own prefix
 * so test data never mixes with production.
 */
import { createHash, randomBytes } from "crypto";
import { get as blobGet, put as blobPut, list as blobList } from "@/lib/blob";
import type { GateResult } from "@/lib/guidebook-gate-core";

export type GateSubmission = {
  id: string;
  at: string; // ISO UTC
  atCT: string; // America/Chicago, human readable
  env: string;
  unit: string;
  name: string;
  phone: string; // +E.164
  confirmationCode: string;
  consent: boolean;
  consentText: string | null; // exact text shown when consent was ticked
  consentVersion: string;
  mode: "required" | "airbnb-optional";
  result: GateResult;
  review: boolean;
  reviewNote?: string;
  ip: string;
  userAgent: string;
};

export function gateEnv(): string {
  return process.env.VERCEL_ENV === "production" ? "production" : process.env.VERCEL ? "preview" : "local";
}

function root(env = gateEnv()) {
  return `guidebook-gate/${env}`;
}

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN || (!process.env.VERCEL && !!process.env.LOCAL_BLOB_DIR);
}

export function chicagoStamp(d = new Date()): string {
  return d.toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "short", timeStyle: "medium" }) + " CT";
}

export async function saveSubmission(s: Omit<GateSubmission, "id" | "at" | "atCT" | "env">): Promise<GateSubmission> {
  if (!blobEnabled()) throw new Error("Blob store not configured");
  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}`;
  const full: GateSubmission = { ...s, id, at: now.toISOString(), atCT: chicagoStamp(now), env: gateEnv() };
  await blobPut(`${root()}/submissions/${id}.json`, JSON.stringify(full), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: false,
  });
  return full;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const res = await blobGet(pathname, { access: "private" });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  } catch {
    return null;
  }
}

export async function listSubmissions(max = 2000): Promise<GateSubmission[]> {
  if (!blobEnabled()) return [];
  const names: string[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const page = await blobList({ prefix: `${root()}/submissions/`, cursor, limit: 500 });
    for (const b of page.blobs) names.push(b.pathname);
    if (!page.hasMore || !page.cursor) break;
    cursor = page.cursor;
  }
  names.sort().reverse();
  const out: GateSubmission[] = [];
  for (let i = 0; i < Math.min(names.length, max); i += 20) {
    const rows = await Promise.all(names.slice(i, i + 20).map((n) => readJson<GateSubmission>(n)));
    for (const r of rows) if (r) out.push(r);
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** Best-effort shared per-IP hourly cap across instances (in addition to in-memory limits). */
export async function bumpHourly(ip: string, cap: number): Promise<boolean> {
  if (!blobEnabled()) return true;
  const key = createHash("sha256").update(ip).digest("hex").slice(0, 24);
  const hour = Math.floor(Date.now() / 3600_000);
  const p = `${root()}/rl/${hour}-${key}.json`;
  const cur = (await readJson<{ n: number }>(p))?.n ?? 0;
  if (cur >= cap) return false;
  try {
    await blobPut(p, JSON.stringify({ n: cur + 1 }), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch {
    /* best effort */
  }
  return true;
}

const CSV_COLS: (keyof GateSubmission)[] = [
  "at", "atCT", "env", "unit", "name", "phone", "confirmationCode", "consent", "consentVersion", "mode", "result", "review", "reviewNote", "ip",
];

function csvCell(v: unknown): string {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: GateSubmission[]): string {
  return [CSV_COLS.join(","), ...rows.map((r) => CSV_COLS.map((c) => csvCell(r[c])).join(","))].join("\n") + "\n";
}
