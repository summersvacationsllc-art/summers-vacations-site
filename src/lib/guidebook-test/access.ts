/**
 * Who may open the test guidebook, and how ?t= / ?demo= are read.
 * The door code is never accepted as a query param.
 */

/** 32-byte base64url, no padding (43 characters). */
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

export const DEMO_STAGES = ["before", "window", "after", "failed"] as const;
export type DemoStage = (typeof DEMO_STAGES)[number];

const PRODUCTION_HOSTS = new Set([
  "mybransonvacation.com",
  "www.mybransonvacation.com",
]);

function hostname(hostHeader: string | null): string {
  return (hostHeader || "").split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
}

/**
 * Preview and local only. A production deployment, or any request whose host is
 * the live site (including a preview that was aliased onto it), does not serve
 * this page.
 */
export function guidebookTestAllowed(vercelEnv: string | undefined, hostHeader: string | null): boolean {
  if (PRODUCTION_HOSTS.has(hostname(hostHeader))) return false;
  if (vercelEnv === "production") return false;
  return vercelEnv === "preview" || vercelEnv === "development" || !vercelEnv;
}

export function parseDemoStage(raw: string | undefined): DemoStage | null {
  if (!raw) return null;
  return (DEMO_STAGES as readonly string[]).includes(raw) ? (raw as DemoStage) : null;
}

/** A well-formed token, or null. `strip` means the param is not a token and must leave the URL. */
export function tokenFromQuery(raw: string | undefined): { token: string | null; strip: boolean } {
  if (raw == null || raw === "") return { token: null, strip: false };
  if (TOKEN_RE.test(raw)) return { token: raw, strip: false };
  return { token: null, strip: true };
}

export function firstQuery(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/** True when any param is named "code" (any casing). The value is not returned. */
export function hasCodeParam(keys: string[]): boolean {
  return keys.some((k) => k.toLowerCase() === "code");
}
