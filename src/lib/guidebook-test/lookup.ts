/**
 * Server-only, read-only Guesty lookup for the test guidebook.
 * Resolves ?t=<token> to one reservation on this page's unit, then (only inside
 * the door-code window) GETs /v1/guest-code. The code is returned to the caller
 * and nowhere else: not logged, not stored, not cached.
 *
 * Does not import the token-write job. Does not PUT, POST, or PATCH.
 */
import { guestyGetOptional } from "@/lib/guesty";
import { todayCT } from "@/lib/live-report-json";
import { readTokenFieldId, tokensEqual } from "./token-job";
import { codePhase, pickGuestCode, type CodePhase } from "./display";
import type { TestUnit } from "./units";

const DEAD = new Set([
  "canceled",
  "cancelled",
  "declined",
  "expired",
  "inquiry",
  "closed",
  "awaiting_payment_canceled",
]);

const RES_ID = /^[0-9a-f]{24}$/i;

export type ResolvedStay = {
  checkIn: string;
  checkOut: string;
  phase: CodePhase;
  /** Present only inside the window, and only when a single GUEST code came back. */
  code: string | null;
  lookupFailed: boolean;
};

export type LookupResult =
  | { kind: "none" }
  | { kind: "guesty-error" }
  | { kind: "stay"; stay: ResolvedStay };

type Row = {
  id: string;
  listingId: string;
  checkIn: string;
  checkOut: string;
  fields: { fieldId: string; value: string }[];
  fieldsLoaded: boolean;
};

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function ctDate(iso: unknown): string | null {
  if (typeof iso !== "string") return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return todayCT(new Date(t));
}

function ymd(value: unknown, fallbackIso: unknown): string | null {
  const direct = typeof value === "string" ? value : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  return ctDate(fallbackIso);
}

function readFields(raw: unknown): { fieldId: string; value: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { fieldId: string; value: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const fieldId = String(o.fieldId ?? "");
    if (!fieldId || o.value == null) continue;
    out.push({ fieldId, value: String(o.value) });
  }
  return out;
}

function rowMatches(row: Row, token: string, fieldId: string): boolean {
  for (const field of row.fields) {
    if (field.fieldId !== fieldId) continue;
    if (field.value.length === token.length && tokensEqual(field.value, token)) return true;
  }
  return false;
}

async function listRows(listingId: string): Promise<Row[]> {
  const today = todayCT();
  const filters = JSON.stringify([
    { field: "checkOut", operator: "$gte", value: `${addDays(today, -3)}T00:00:00.000Z` },
    { field: "checkIn", operator: "$lte", value: `${addDays(today, 400)}T00:00:00.000Z` },
  ]);
  const fields = encodeURIComponent(
    "listingId status checkIn checkOut checkInDateLocalized checkOutDateLocalized customFields",
  );
  const rows: Row[] = [];
  let skip = 0;
  for (let page = 0; page < 8; page++) {
    const json = await guestyGetOptional(
      `/v1/reservations?limit=100&skip=${skip}&sort=checkIn&fields=${fields}&filters=${encodeURIComponent(filters)}`,
    );
    if (!json) throw new Error("empty reservation list");
    const results = (json.results as Record<string, unknown>[]) || [];
    for (const r of results) {
      const status = String(r.status ?? "").toLowerCase();
      if (DEAD.has(status)) continue;
      const id = String(r._id ?? "");
      const lid = String(r.listingId ?? "");
      if (lid !== listingId || !RES_ID.test(id)) continue;
      const checkIn = ymd(r.checkInDateLocalized, r.checkIn);
      const checkOut = ymd(r.checkOutDateLocalized, r.checkOut);
      if (!checkIn || !checkOut || checkOut <= checkIn) continue;
      const fieldsLoaded = Array.isArray(r.customFields);
      rows.push({
        id,
        listingId: lid,
        checkIn,
        checkOut,
        fields: fieldsLoaded ? readFields(r.customFields) : [],
        fieldsLoaded,
      });
    }
    skip += 100;
    if (results.length < 100 || skip >= Number(json.count ?? 0)) break;
  }
  return rows;
}

async function ensureFields(row: Row): Promise<void> {
  if (row.fieldsLoaded) return;
  const json = await guestyGetOptional(`/v1/reservations-v3/${row.id}/custom-fields`);
  row.fields = readFields(json?.customFields ?? json);
  row.fieldsLoaded = true;
}

async function guestCode(reservationId: string): Promise<string | null> {
  const json = await guestyGetOptional(
    `/v1/guest-code?reservationId=${encodeURIComponent(reservationId)}`,
  );
  return json ? pickGuestCode(json) : null;
}

/**
 * `none` = token is not this unit's stay (show the ordinary guidebook).
 * `guesty-error` = the read failed before we could decide (safe sentence, no code).
 * `stay` = one reservation on this unit. `lookupFailed` means the code itself
 * could not be read; the dates are still the reservation's dates.
 */
export async function lookupStay(unit: TestUnit, token: string, now = Date.now()): Promise<LookupResult> {
  const fieldId = readTokenFieldId();
  if (!fieldId) return { kind: "none" };
  if (!process.env.GUESTY_CLIENT_ID || !process.env.GUESTY_CLIENT_SECRET) {
    console.log("guidebook-test: guesty credentials unavailable");
    return { kind: "guesty-error" };
  }
  let rows: Row[];
  try {
    rows = await listRows(unit.listingId);
  } catch (e) {
    console.log("guidebook-test: reservation read failed", e instanceof Error ? e.message.slice(0, 160) : "error");
    return { kind: "guesty-error" };
  }

  const hits: Row[] = [];
  try {
    for (const row of rows) {
      if (row.listingId !== unit.listingId) continue;
      await ensureFields(row);
      if (rowMatches(row, token, fieldId)) hits.push(row);
    }
  } catch (e) {
    console.log("guidebook-test: custom-field read failed", e instanceof Error ? e.message.slice(0, 160) : "error");
    return { kind: "guesty-error" };
  }

  console.log(`guidebook-test: scanned=${rows.length} matched=${hits.length}`);
  if (hits.length !== 1) return { kind: "none" };

  const hit = hits[0];
  if (hit.listingId !== unit.listingId) return { kind: "none" };
  const phase = codePhase(hit.checkIn, hit.checkOut, now);
  if (!phase) return { kind: "none" };

  if (phase !== "window") {
    return {
      kind: "stay",
      stay: { checkIn: hit.checkIn, checkOut: hit.checkOut, phase, code: null, lookupFailed: false },
    };
  }

  try {
    const code = await guestCode(hit.id);
    console.log(`guidebook-test: code-lookup ${code ? "ok" : "empty"}`);
    return {
      kind: "stay",
      stay: {
        checkIn: hit.checkIn,
        checkOut: hit.checkOut,
        phase,
        code,
        lookupFailed: !code,
      },
    };
  } catch (e) {
    console.log("guidebook-test: guest-code read failed", e instanceof Error ? e.message.slice(0, 160) : "error");
    return {
      kind: "stay",
      stay: { checkIn: hit.checkIn, checkOut: hit.checkOut, phase, code: null, lookupFailed: true },
    };
  }
}
