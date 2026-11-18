/**
 * Strip guest names and reservation / confirmation ids from public JSON
 * before it is sent to unauthenticated clients.
 *
 * The daily sync is supposed to omit these fields. This is the second gate:
 * a stale GitHub copy or an older writer cannot put them back on the public
 * /api/guest-today, /api/fleet-today, or /api/sync-status responses.
 */

const FORBIDDEN_KEYS = new Set([
  "guest",
  "guest_name",
  "guestName",
  "reservation_id",
  "reservationId",
  "guesty_reservation_id",
  "confirmationCode",
  "confirmation_code",
]);

export function hasForbiddenGuestKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenGuestKey);
  if (!value || typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key) || hasForbiddenGuestKey(child)) return true;
  }
  return false;
}

export function redactPublicJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPublicJson);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    out[key] = redactPublicJson(child);
  }
  return out;
}

/** Keep the original text when it is already safe, so clean files stay byte-identical. */
export function publicJsonResponseText(text: string): string {
  try {
    const data = JSON.parse(text) as unknown;
    if (!hasForbiddenGuestKey(data)) return text;
    return JSON.stringify(redactPublicJson(data));
  } catch {
    return text;
  }
}

function stripNameAt(value: string): string {
  const at = value.lastIndexOf(" @ ");
  return at >= 0 ? value.slice(at + 3).trim() : value;
}

function stripNameParen(value: string): string {
  const match = value.match(/^.*\(([^()]*)\)\s*$/);
  return match ? match[1].trim() : value;
}

/**
 * sync-status.json used to store "Guest Name @ Property" and
 * "Guest Name (Property)". Keep the property label only.
 */
export function redactSyncStatusRecord(value: unknown): unknown {
  const base = redactPublicJson(value);
  if (!base || typeof base !== "object" || Array.isArray(base)) return base;
  const record = base as Record<string, unknown>;
  if (Array.isArray(record.expectedInHouse)) {
    record.expectedInHouse = record.expectedInHouse.map((item) =>
      typeof item === "string" ? stripNameAt(item) : item,
    );
  }
  if (record.kioskUnits && typeof record.kioskUnits === "object" && !Array.isArray(record.kioskUnits)) {
    const units: Record<string, unknown> = {};
    for (const [unit, label] of Object.entries(record.kioskUnits as Record<string, unknown>)) {
      units[unit] = typeof label === "string" ? stripNameParen(label) : label;
    }
    record.kioskUnits = units;
  }
  if (Array.isArray(record.errors)) {
    record.errors = record.errors.map((err) =>
      typeof err === "string" ? err.replace(/\s*\(guest\s[^)]*\)/gi, "") : err,
    );
  }
  return record;
}
