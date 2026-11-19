/**
 * Admin auth for the guidebook signups view. Same pattern as the Owner desk
 * (/contracts/log): one PIN in CONTRACTS_LOG_PIN, httpOnly cookie holding an
 * HMAC of it. A different salt keeps this cookie separate from the contracts one.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const GATE_ADMIN_COOKIE = "sv_gate_admin";

function pin(): string {
  return (process.env.CONTRACTS_LOG_PIN || "").trim();
}
function token(): string {
  const p = pin();
  return p ? createHmac("sha256", p).update("guidebook-gate-admin-v1").digest("hex") : "";
}
function eq(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function gatePinMatches(input: string): boolean {
  const p = pin();
  return !!p && eq(input.trim(), p);
}
export function isGateAdmin(req: Request): boolean {
  const t = token();
  if (!t) return false;
  const m = (req.headers.get("cookie") || "").match(/(?:^|; )sv_gate_admin=([^;]*)/);
  return !!m && eq(decodeURIComponent(m[1]), t);
}
export function gateAuthCookie(): string {
  const parts = [`${GATE_ADMIN_COOKIE}=${token()}`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=604800"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
export function gateClearCookie(): string {
  return `${GATE_ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
