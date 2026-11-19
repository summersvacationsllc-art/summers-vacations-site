/**
 * Server-only: decide whether a verified session may see its door code right now,
 * and fetch it from Guesty (purpose GUEST only). The code is returned to the caller
 * and nowhere else: not logged, not stored, not cached.
 */
import { guestyGetOptional } from "@/lib/guesty";
import { doorWindow } from "@/lib/stay-window";
import { pickGuestCode } from "@/lib/guidebook-gate-core";
import type { GateSession } from "@/lib/guidebook-gate-session";

const nonProd = () => process.env.VERCEL_ENV !== "production";
const mockOn = () => nonProd() && process.env.GUIDEBOOK_GATE_MOCK === "1";

export type AccessState = "before" | "ready" | "after" | "unavailable";
export type Access = { eligible: true; state: AccessState; code: string | null };

/** "before" = not yet 7 AM on check-in day, "after" = past 10 AM checkout. */
export function windowState(s: Pick<GateSession, "ci" | "co">, nowMs = Date.now()): "before" | "ready" | "after" {
  const w = doorWindow({ value: s.ci, source: "lookup" }, { value: s.co, source: "lookup" }, "", nowMs);
  return w.state === "before" ? "before" : w.state === "after" ? "after" : "ready";
}

async function fetchCode(resId: string): Promise<string | null> {
  if (mockOn()) {
    if (resId === "m11") return null; // mock: lock unlinked/offline (204)
    return pickGuestCode({
      codes: [
        { code: "9999", purpose: "GUEST_BACKUP", status: "ACTIVE", startsAt: null, endsAt: null, lockIds: [] },
        { code: "0000", purpose: "GUEST", status: "ACTIVE", startsAt: null, endsAt: null, lockIds: [] },
      ],
    });
  }
  if (!process.env.GUESTY_CLIENT_ID || !process.env.GUESTY_CLIENT_SECRET) return null;
  if (!/^[0-9a-f]{24}$/i.test(resId)) return null;
  try {
    const json = await guestyGetOptional(`/v1/guest-code?reservationId=${encodeURIComponent(resId)}`);
    return json ? pickGuestCode(json) : null;
  } catch {
    return null; // fall back to the "sent in your booking messages" sentence
  }
}

export async function accessFor(s: GateSession): Promise<Access> {
  const state = windowState(s);
  if (state !== "ready") return { eligible: true, state, code: null };
  const code = await fetchCode(s.resId);
  return { eligible: true, state: code ? "ready" : "unavailable", code };
}

export type StayPayload = { firstName: string; ci: string; co: string; airbnb: boolean; state: AccessState; code: string | null };

/** What the browser gets for a verified session (POST responses only, always no-store). */
export async function stayFor(s: GateSession): Promise<StayPayload> {
  const a = await accessFor(s);
  return { firstName: s.fn, ci: s.ci, co: s.co, airbnb: s.ab, state: a.state, code: a.code };
}
