/**
 * Pure door-code display rules for the test guidebook.
 * America/Chicago: show from 7:00:00 AM on check-in day through 10:00:00 AM on checkout day.
 * No I/O. Never logs a code.
 */
import { chicagoInstant, isIsoDate } from "../stay-window";

export type CodePhase = "before" | "window" | "after";

export type DoorPanel =
  | { kind: "hidden" }
  | { kind: "before"; text: "Your door code will appear here at 7 AM on your arrival day." }
  | { kind: "fallback"; text: "Your door code will be in your booking messages before you arrive." }
  | { kind: "code"; text: string; code: string; place: string };

const BEFORE = "Your door code will appear here at 7 AM on your arrival day." as const;
const FALLBACK = "Your door code will be in your booking messages before you arrive." as const;
const CODE_RE = /^[0-9A-Za-z#*]{3,12}$/;

/** One GUEST code, or null. GUEST_BACKUP is ignored. Two different GUEST codes is treated as no code. */
export function pickGuestCode(json: unknown): string | null {
  const codes = (json as { codes?: unknown } | null)?.codes;
  if (!Array.isArray(codes)) return null;
  const found = new Set<string>();
  for (const c of codes) {
    const o = c as { code?: unknown; purpose?: unknown; status?: unknown };
    if (String(o?.purpose ?? "").toUpperCase() !== "GUEST") continue;
    if (/fail|error|delet|remov|expire|cancel|revok/i.test(String(o?.status ?? ""))) continue;
    const code = typeof o.code === "string" ? o.code.trim() : "";
    if (CODE_RE.test(code)) found.add(code);
  }
  if (found.size !== 1) return null;
  return [...found][0];
}

export function codePhase(checkIn: string, checkOut: string, now: number): CodePhase | null {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) return null;
  const start = chicagoInstant(checkIn, "07:00:00");
  const end = chicagoInstant(checkOut, "10:00:00");
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (now < start) return "before";
  if (now > end) return "after";
  return "window";
}

export function usableCode(code: string | null | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  return CODE_RE.test(trimmed) ? trimmed : null;
}

export function codeSentence(place: string, code: string): string {
  return `Your door code for ${place} is ${code}`;
}

/**
 * What the box shows. `lookupFailed` covers HTTP 204, no GUEST code, and Guesty errors
 * during the window. After checkout the box is hidden even if lookup failed.
 * A code is shown only inside the window, and only when lookup did not fail.
 */
export function doorPanel(input: {
  phase: CodePhase | null;
  code: string | null;
  place: string;
  lookupFailed: boolean;
}): DoorPanel {
  if (input.phase === "after") return { kind: "hidden" };
  if (input.phase === "before") return { kind: "before", text: BEFORE };
  if (input.phase === "window") {
    const code = input.lookupFailed ? null : usableCode(input.code);
    if (code) return { kind: "code", text: codeSentence(input.place, code), code, place: input.place };
    return { kind: "fallback", text: FALLBACK };
  }
  if (input.lookupFailed) return { kind: "fallback", text: FALLBACK };
  return { kind: "hidden" };
}
