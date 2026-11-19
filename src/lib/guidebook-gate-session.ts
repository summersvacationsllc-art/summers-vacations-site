/**
 * Short-lived sealed session for a VERIFIED guidebook visitor (matched reservation).
 * AES-256-GCM, so the cookie value is both unreadable and tamper-proof; it is httpOnly,
 * so page scripts can never read it. It holds only the reservation id and stay days,
 * never a door code. Import-free so it can be unit tested.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export type GateSession = { slug: string; resId: string; ci: string; co: string; fn: string; ab: boolean; exp: number };

function key(): Buffer | null {
  const s = (process.env.GUIDEBOOK_SESSION_SECRET || "").trim();
  if (s.length < 24) return null;
  return createHash("sha256").update(`guidebook-session-v1:${s}`).digest();
}

export function sessionEnabled(): boolean {
  return key() !== null;
}

export function cookieName(slug: string): string {
  return `sv_gb_access_${slug.replace(/[^a-z0-9-]/g, "")}`;
}

export function sealSession(s: GateSession): string | null {
  const k = key();
  if (!k) return null;
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(s), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64url");
}

export function openSession(token: string, slug: string, nowMs = Date.now()): GateSession | null {
  const k = key();
  if (!k || !token || token.length > 1000) return null;
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 29) return null;
    const d = createDecipheriv("aes-256-gcm", k, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    const s = JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8")) as GateSession;
    if (s.slug !== slug || typeof s.resId !== "string" || !s.resId || !(s.exp > nowMs)) return null;
    return s;
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string): string {
  const m = (header || "").match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : "";
}

export function setCookieHeader(slug: string, token: string, exp: number): string {
  const maxAge = Math.max(60, Math.min(45 * 86400, Math.floor((exp - Date.now()) / 1000)));
  const parts = [`${cookieName(slug)}=${token}`, "Path=/api/guidebook-gate", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
