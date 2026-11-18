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
 * Do not run it until Brian approves writing tokens onto live reservations.
 * Run (only after that approval):
 *   npx tsx scripts/mint-guidebook-tokens.ts
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

/** Upcoming or in-house Rustic reservations whose token field is blank. */
export function reservationsToMint(rows: MintRow[], listingId: string, today: string): MintRow[] {
  return rows.filter((row) => {
    if (row.listingId !== listingId) return false;
    if (!/^[0-9a-f]{24}$/i.test(row.id)) return false;
    if (DEAD.has(row.status.toLowerCase())) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.checkOut) || row.checkOut < today) return false;
    return !row.fieldValue || !row.fieldValue.trim();
  });
}

export type MintResult = {
  enabled: boolean;
  scanned: number;
  minted: number;
  skipped: number;
  blocked: string | null;
};

export type GuestyMintClient = {
  get(path: string): Promise<Record<string, unknown> | null>;
  put(path: string, body: Record<string, unknown>): Promise<void>;
};

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
    const json = await client.get(
      `/v1/reservations?limit=100&skip=${skip}&fields=${fields}&filters=${encodeURIComponent(filters)}`,
    );
    if (!json) throw new Error("empty reservation list");
    const results = (json.results as Record<string, unknown>[]) || [];
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
        value = extra ? fieldValue(extra.customFields, fieldId) : "unreadable";
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
    if (results.length < 100 || skip >= Number(json.count ?? 0)) break;
  }
  return rows;
}

async function defaultClient(): Promise<GuestyMintClient> {
  const { guestyGetOptional, guestyPut } = await import("../guesty");
  return {
    get: (path) => guestyGetOptional(path),
    put: (path, body) => guestyPut(path, body),
  };
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
  const idle = { enabled: false, scanned: 0, minted: 0, skipped: 0, blocked: null };
  if (!mintEnabled(env)) return idle;
  const fieldId = readTokenFieldId(env);
  const unit = TEST_UNITS[MINT_SLUG];
  if (!fieldId || !unit) return { ...idle, blocked: "field-id" };
  if (!options?.client && (!env.GUESTY_CLIENT_ID || !env.GUESTY_CLIENT_SECRET)) {
    return { enabled: true, scanned: 0, minted: 0, skipped: 0, blocked: "credentials" };
  }
  const client = options?.client ?? await defaultClient();
  const today = options?.today ?? chicagoToday(new Date());
  const generate = options?.generateToken ?? generateGuidebookToken;
  let scanned = 0;
  try {
    const rows = await listMintRows(client, unit.listingId, fieldId, today);
    scanned = rows.length;
    const todo = reservationsToMint(rows, unit.listingId, today);
    let minted = 0;
    let skipped = scanned - todo.length;
    for (const row of todo) {
      const plan = planTokenWrite(row.id, fieldId, generate());
      try {
        await client.put(plan.path, plan.body);
        minted += 1;
      } catch (e) {
        skipped += 1;
        console.log("guidebook-token-mint: write failed", e instanceof Error ? e.message.slice(0, 120) : "error");
      }
    }
    console.log(`guidebook-token-mint: scanned=${scanned} minted=${minted} skipped=${skipped}`);
    return { enabled: true, scanned, minted, skipped, blocked: null };
  } catch (e) {
    console.log("guidebook-token-mint: read failed", e instanceof Error ? e.message.slice(0, 120) : "error");
    return { enabled: true, scanned, minted: 0, skipped: 0, blocked: "read-failed" };
  }
}
