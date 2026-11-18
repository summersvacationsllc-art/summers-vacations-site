/**
 * Token mint for the Rustic guidebook link.
 *
 * DISABLED unless both of these are set:
 *   GUIDEBOOK_TOKEN_MINT=rustic-ozark-retreat
 *   GUIDEBOOK_TOKEN_FIELD_ID=<Guesty custom field id>
 *
 * Any other GUIDEBOOK_TOKEN_MINT value, including "1" or "true", does nothing.
 * The job only considers the Rustic Ozark Retreat listing. It never overwrites
 * a custom field that already has a value. It does not log the token.
 *
 * Run it only from POST /api/guidebook-test/mint on a Vercel preview, with
 * GUIDEBOOK_MINT_KEY. Do not run it as a local script: the Guesty secrets are
 * not available outside that preview.
 *
 * Guesty message variable, confirmed in the product: {{guidebook_link_token}}
 * Link shape: /guidebook-test/rustic-ozark-retreat?t={{guidebook_link_token}}
 * on this preview. The go-live URL is not this test route.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { TEST_UNITS } from "./units";

export const GUIDEBOOK_TOKEN_FIELD_NAME = "Guidebook link token";
export const GUIDEBOOK_TOKEN_VARIABLE = "{{guidebook_link_token}}";
export const MINT_FLAG = "GUIDEBOOK_TOKEN_MINT";
export const MINT_SLUG = "rustic-ozark-retreat";

const DEAD = new Set([
  "canceled",
  "cancelled",
  "declined",
  "expired",
  "inquiry",
  "closed",
  "awaiting_payment_canceled",
]);

type EnvLike = { [key: string]: string | undefined };

export function mintEnabled(env: EnvLike = process.env): boolean {
  return env.GUIDEBOOK_TOKEN_MINT === MINT_SLUG;
}

/** The custom-field id from the environment. Never hardcoded. */
export function readTokenFieldId(env: EnvLike = process.env): string | null {
  const id = (env.GUIDEBOOK_TOKEN_FIELD_ID || "").trim();
  return /^[0-9a-f]{24}$/i.test(id) ? id : null;
}

export function tokenWritePath(reservationId: string): string {
  return `/v1/reservations-v3/${reservationId}/custom-fields`;
}

export type TokenWritePlan = {
  method: "PUT";
  path: string;
  body: { customFields: [{ fieldId: string; value: string }] };
};

export function generateGuidebookToken(): string {
  return randomBytes(32).toString("base64url");
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function planTokenWrite(reservationId: string, fieldId: string, token: string): TokenWritePlan {
  return {
    method: "PUT",
    path: tokenWritePath(reservationId),
    body: { customFields: [{ fieldId, value: token }] },
  };
}

export type MintRow = {
  id: string;
  listingId: string;
  status: string;
  checkOut: string;
  /** Null when this reservation has no value for the token field. */
  fieldValue: string | null;
};

/** Confirmed Rustic stays that have not checked out, whose token field is blank. */
export function reservationsToMint(rows: MintRow[], listingId: string, today: string): MintRow[] {
  return rows.filter((row) => {
    if (row.listingId !== listingId) return false;
    if (!/^[0-9a-f]{24}$/i.test(row.id)) return false;
    if (row.status.toLowerCase() !== "confirmed") return false;
    if (DEAD.has(row.status.toLowerCase())) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.checkOut) || row.checkOut < today) return false;
    return !row.fieldValue || !row.fieldValue.trim();
  });
}

export type MintResult = {
  enabled: boolean;
  scanned: number;
  written: number;
  skipped: number;
  errors: number;
  statuses: Record<string, number>;
  blocked: string | null;
};

export type GuestyCall = { status: number; body: Record<string, unknown> | null };

export type GuestyMintClient = {
  get(path: string): Promise<GuestyCall>;
  put(path: string, body: Record<string, unknown>): Promise<GuestyCall>;
};

/** Counts the route is allowed to return. No tokens or reservation ids. */
export function mintPublicCounts(result: MintResult): {
  written: number;
  skipped: number;
  errors: number;
  statuses: Record<string, number>;
} {
  return {
    written: result.written,
    skipped: result.skipped,
    errors: result.errors,
    statuses: result.statuses,
  };
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function chicagoToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function fieldValue(raw: unknown, fieldId: string): string | null {
  if (!Array.isArray(raw)) return null;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (String(o.fieldId ?? "") !== fieldId) continue;
    return o.value == null ? "" : String(o.value);
  }
  return null;
}

function ymd(value: unknown): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

async function listMintRows(client: GuestyMintClient, listingId: string, fieldId: string, today: string): Promise<MintRow[]> {
  const filters = JSON.stringify([
    { field: "checkOut", operator: "$gte", value: `${addDays(today, -1)}T00:00:00.000Z` },
    { field: "checkIn", operator: "$lte", value: `${addDays(today, 400)}T00:00:00.000Z` },
  ]);
  const fields = encodeURIComponent("listingId status checkOutDateLocalized customFields");
  const rows: MintRow[] = [];
  let skip = 0;
  for (let page = 0; page < 8; page++) {
    const res = await client.get(
      `/v1/reservations?limit=100&skip=${skip}&fields=${fields}&filters=${encodeURIComponent(filters)}`,
    );
    if (res.status < 200 || res.status >= 300 || !res.body) {
      throw Object.assign(new Error("reservation list failed"), { status: res.status });
    }
    const results = (res.body.results as Record<string, unknown>[]) || [];
    for (const r of results) {
      const id = String(r._id ?? "");
      const lid = String(r.listingId ?? "");
      if (lid !== listingId || !/^[0-9a-f]{24}$/i.test(id)) continue;
      let value: string | null;
      if (Array.isArray(r.customFields)) {
        value = fieldValue(r.customFields, fieldId);
      } else {
        const extra = await client.get(`/v1/reservations-v3/${id}/custom-fields`);
        // A failed read must not be treated as blank, or a later write could replace a token.
        value = extra.status >= 200 && extra.status < 300 ? fieldValue(extra.body?.customFields, fieldId) : "unreadable";
      }
      rows.push({
        id,
        listingId: lid,
        status: String(r.status ?? ""),
        checkOut: ymd(r.checkOutDateLocalized),
        fieldValue: value,
      });
    }
    skip += 100;
    if (results.length < 100 || skip >= Number(res.body.count ?? 0)) break;
  }
  return rows;
}

async function defaultClient(): Promise<GuestyMintClient> {
  const { guestySend } = await import("../guesty");
  return {
    get: (path) => guestySend("GET", path),
    put: (path, body) => guestySend("PUT", path, body),
  };
}

/** Read-only list of Rustic reservations. Does not write. Field values stay in memory. */
export async function readRusticReservationRows(options?: {
  env?: EnvLike;
  today?: string;
  client?: GuestyMintClient;
}): Promise<{ ok: true; rows: MintRow[]; today: string } | { ok: false }> {
  const env = options?.env ?? process.env;
  const fieldId = readTokenFieldId(env);
  const unit = TEST_UNITS[MINT_SLUG];
  if (!fieldId || !unit || unit.listingId !== "68eeb5866f48330013c65a7a") return { ok: false };
  if (!options?.client && (!env.GUESTY_CLIENT_ID || !env.GUESTY_CLIENT_SECRET)) return { ok: false };
  const client = options?.client ?? await defaultClient();
  const today = options?.today ?? chicagoToday(new Date());
  try {
    const rows = await listMintRows(client, unit.listingId, fieldId, today);
    return { ok: true, rows, today };
  } catch {
    return { ok: false };
  }
}

/**
 * Writes a fresh token onto each eligible Rustic reservation.
 * Returns immediately, with no Guesty call, unless the flag and field id are set.
 */
export async function mintRusticGuidebookTokens(options?: {
  env?: EnvLike;
  today?: string;
  client?: GuestyMintClient;
  generateToken?: () => string;
}): Promise<MintResult> {
  const env = options?.env ?? process.env;
  const idle: MintResult = { enabled: false, scanned: 0, written: 0, skipped: 0, errors: 0, statuses: {}, blocked: null };
  if (!mintEnabled(env)) return idle;
  const fieldId = readTokenFieldId(env);
  const unit = TEST_UNITS[MINT_SLUG];
  if (!fieldId || !unit || unit.listingId !== "68eeb5866f48330013c65a7a") {
    return { ...idle, blocked: "field-id" };
  }
  if (!options?.client && (!env.GUESTY_CLIENT_ID || !env.GUESTY_CLIENT_SECRET)) {
    return { enabled: true, scanned: 0, written: 0, skipped: 0, errors: 1, statuses: {}, blocked: "credentials" };
  }
  const client = options?.client ?? await defaultClient();
  const statuses: Record<string, number> = {};
  const note = (status: number) => {
    const key = String(status);
    statuses[key] = (statuses[key] || 0) + 1;
  };
  const tracked: GuestyMintClient = {
    async get(path) {
      const res = await client.get(path);
      note(res.status);
      return res;
    },
    async put(path, body) {
      const res = await client.put(path, body);
      note(res.status);
      return res;
    },
  };
  const today = options?.today ?? chicagoToday(new Date());
  const generate = options?.generateToken ?? generateGuidebookToken;
  let scanned = 0;
  try {
    const rows = await listMintRows(tracked, unit.listingId, fieldId, today);
    scanned = rows.length;
    const todo = reservationsToMint(rows, unit.listingId, today);
    let written = 0;
    let errors = 0;
    const skipped = scanned - todo.length;
    for (const row of todo) {
      const plan = planTokenWrite(row.id, fieldId, generate());
      const res = await tracked.put(plan.path, plan.body);
      if (res.status >= 200 && res.status < 300) written += 1;
      else errors += 1;
    }
    console.log(`guidebook-token-mint: scanned=${scanned} written=${written} skipped=${skipped} errors=${errors}`);
    return { enabled: true, scanned, written, skipped, errors, statuses, blocked: null };
  } catch (e) {
    console.log("guidebook-token-mint: read failed", e instanceof Error ? e.message.slice(0, 120) : "error");
    return { enabled: true, scanned, written: 0, skipped: 0, errors: 1, statuses, blocked: "read-failed" };
  }
}
