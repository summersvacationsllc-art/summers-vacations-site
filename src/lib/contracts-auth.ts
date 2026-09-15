import { createHmac, timingSafeEqual } from "crypto";

export const CONTRACTS_COOKIE = "sv_contracts_log";

export function contractsPin(): string {
  return (process.env.CONTRACTS_LOG_PIN || "").trim();
}

function tokenFor(pin: string): string {
  return createHmac("sha256", pin).update("contracts-log-v1").digest("hex");
}

export function cookieToken(): string {
  const pin = contractsPin();
  if (!pin) return "";
  return tokenFor(pin);
}

export function pinMatches(input: string): boolean {
  const pin = contractsPin();
  if (!pin) return false;
  const a = Buffer.from(input.trim());
  const b = Buffer.from(pin);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isContractsAuthed(req: Request): boolean {
  const expected = cookieToken();
  if (!expected) return false;
  const raw = req.headers.get("cookie") || "";
  const m = raw.match(/(?:^|; )sv_contracts_log=([^;]*)/);
  if (!m) return false;
  const got = decodeURIComponent(m[1]);
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function setAuthCookieHeader(): string {
  const token = cookieToken();
  const parts = [
    `${CONTRACTS_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearAuthCookieHeader(): string {
  return `${CONTRACTS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
