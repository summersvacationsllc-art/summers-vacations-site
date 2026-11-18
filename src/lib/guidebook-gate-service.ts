/**
 * Server-only: find the reservation from the guidebook link context (unit + dates, or typed name + stay window), decide, optionally
 * write the phone to the guest profile. The Guesty token stays in guesty.ts.
 *
 * Environment switches (only honored outside production):
 *   GUIDEBOOK_GATE_MOCK=1     -> canned fake reservations, no Guesty calls at all
 *   GUIDEBOOK_GATE_DRY_RUN=1  -> real reads, never write to a profile
 * In production a missing GUESTY_CLIENT_ID/SECRET means "lookup failed" (review list).
 */
import { guestyGet, guestyPut } from "@/lib/guesty";
import { getGuidebook } from "@/data/guidebooks";
import { addDays, ctDay, decide, isAirbnbConf, stayDays, isIsoDay, WINDOW_DAYS, type GateReservation, type GateResult } from "@/lib/guidebook-gate-core";

const nonProd = () => process.env.VERCEL_ENV !== "production";
const mockOn = () => nonProd() && process.env.GUIDEBOOK_GATE_MOCK === "1";
const dryRun = () => nonProd() && process.env.GUIDEBOOK_GATE_DRY_RUN === "1";

type RawGuest = Record<string, unknown>;

function phonesOf(g: RawGuest | null | undefined): string[] {
  if (!g) return [];
  const list = [g.phone, ...(Array.isArray(g.phones) ? g.phones : [])];
  return list
    .map((p) => (p && typeof p === "object" ? ((p as RawGuest).number ?? (p as RawGuest).phone) : p))
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);
}

function toReservation(r: Record<string, unknown>): GateReservation {
  const g = (r.guest as RawGuest) || {};
  const integ = (r.integration as RawGuest) || {};
  return {
    id: String(r._id ?? r.id ?? ""),
    listingId: String(r.listingId ?? ""),
    status: String(r.status ?? ""),
    confirmationCode: String(r.confirmationCode ?? ""),
    checkIn: String(r.checkIn ?? ""),
    checkOut: String(r.checkOut ?? ""),
    checkInLocalized: r.checkInDateLocalized ? String(r.checkInDateLocalized) : undefined,
    checkOutLocalized: r.checkOutDateLocalized ? String(r.checkOutDateLocalized) : undefined,
    guestId: String(r.guestId ?? g._id ?? ""),
    guest: {
      fullName: g.fullName ? String(g.fullName) : undefined,
      firstName: g.firstName ? String(g.firstName) : undefined,
      lastName: g.lastName ? String(g.lastName) : undefined,
      phone: g.phone ? String(g.phone) : undefined,
      phones: phonesOf(g),
    },
    source: String(r.source ?? integ.platform ?? ""),
  };
}

// ---- mock data (non-production only) --------------------------------------
// Fake stays for the preview. Dates are far in the future so they never touch real data.
function mockReservations(listingId: string, today: string): { rows: GateReservation[]; profiles: Record<string, string[]> } {
  const mk = (id: string, ci: string, co: string, full: string, extra: Partial<GateReservation> = {}): GateReservation => {
    const [first, ...rest] = full.split(" ");
    return {
      id, listingId, status: "confirmed", confirmationCode: `GY-${id.toUpperCase()}`, checkIn: ci, checkOut: co,
      checkInLocalized: ci, checkOutLocalized: co, guestId: `g-${id}`,
      guest: { fullName: full, firstName: first, lastName: rest.join(" ") }, source: "manual", ...extra,
    };
  };
  const soon = addDays(today, 3);
  const rows = [
    mk("m1", "2030-01-10", "2030-01-14", "Testy McTestface"),
    mk("m2", "2030-02-01", "2030-02-05", "Sam Samson"),
    mk("m3", "2030-03-01", "2030-03-04", "Dana Dup"),
    mk("m4", "2030-03-01", "2030-03-04", "Dave Dup"),
    mk("m5", "2030-04-01", "2030-04-05", "Airy Bnb", { source: "airbnb2", confirmationCode: "HMMOCK5555" }),
    mk("m6", "2030-05-01", "2030-05-05", "Diff Phone"),
    mk("m7", "2030-06-01", "2030-06-05", "Cancelled Carl", { status: "canceled" }),
    mk("m8", soon, addDays(soon, 4), "Windy Windham"),
    mk("m9", addDays(soon, 1), addDays(soon, 5), "Windy Windham"), // overlapping name: ambiguity in window mode
    mk("m10", addDays(today, 6), addDays(today, 9), "Winnie Winslow"),
    mk("m11", addDays(today, -1), addDays(today, 2), "Nolock Nelson"), // in house, lock unlinked (guest-code 204)
    mk("m12", today, addDays(today, 3), "Insidey Inman"), // in house, code shows
    mk("m13", addDays(today, 7), addDays(today, 10), "Airy Bnb", { source: "airbnb2", confirmationCode: "HMMOCK1313" }),
  ];
  return { rows, profiles: { "g-m2": ["+14175550100"], "g-m6": ["+14175550199"] } };
}

export async function processGateSubmission(opts: {
  slug: string;
  name: string; // what the guest typed
  phoneE164: string;
  checkin?: string; // from the guidebook link (YYYY-MM-DD), optional
  checkout?: string;
}): Promise<{
  result: GateResult;
  confirmationCode: string;
  matchBy: "dates" | "window";
  note?: string;
  /** Set only for a verified match (single confirmed stay, name OK). Drives the door-code session. */
  verified?: { resId: string; ci: string; co: string; airbnb: boolean };
}> {
  const gb = getGuidebook(opts.slug);
  const hasDates = isIsoDay(opts.checkin) && isIsoDay(opts.checkout);
  const matchBy: "dates" | "window" = hasDates ? "dates" : "window";
  const fail = (result: GateResult, note: string) => ({ result, confirmationCode: "", matchBy, note });
  if (!gb) return fail("review_no_match", "unknown unit");

  const today = ctDay(new Date().toISOString()) as string;
  let rows: GateReservation[] = [];
  let profile: string[] | null = null;
  let isMock = false;
  try {
    if (mockOn()) {
      isMock = true;
      if (hasDates && opts.checkin === "2030-09-09") throw new Error("mock lookup failure");
      rows = mockReservations(gb.guestyListingId, today).rows;
    } else {
      if (!process.env.GUESTY_CLIENT_ID || !process.env.GUESTY_CLIENT_SECRET) {
        return fail("review_lookup_failed", "Guesty credentials are not configured in this environment");
      }
      // Scope by listing, and by a date range around the stay; status and exact dates are re-checked in code.
      const lo = hasDates ? addDays(opts.checkin as string, -2) : addDays(today, -1);
      const hi = hasDates ? addDays(opts.checkin as string, 2) : addDays(today, WINDOW_DAYS + 1);
      const filters = JSON.stringify(
        hasDates
          ? [
              { field: "listingId", operator: "$eq", value: gb.guestyListingId },
              { field: "checkIn", operator: "$gte", value: `${lo}T00:00:00.000Z` },
              { field: "checkIn", operator: "$lte", value: `${hi}T23:59:59.000Z` },
            ]
          : [
              { field: "listingId", operator: "$eq", value: gb.guestyListingId },
              { field: "checkOut", operator: "$gte", value: `${lo}T00:00:00.000Z` },
              { field: "checkIn", operator: "$lte", value: `${hi}T23:59:59.000Z` },
            ],
      );
      const fields = [
        "listingId", "status", "confirmationCode", "checkIn", "checkOut", "checkInDateLocalized", "checkOutDateLocalized",
        "guestId", "source", "integration.platform",
        "guest._id", "guest.fullName", "guest.firstName", "guest.lastName", "guest.phone", "guest.phones",
      ].join(" ");
      const json = await guestyGet(`/v1/reservations?limit=50&sort=checkIn&fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}`);
      rows = ((json.results as Record<string, unknown>[]) || []).map(toReservation).filter((r) => r.listingId === gb.guestyListingId);
    }
  } catch (e) {
    return fail("review_lookup_failed", e instanceof Error ? e.message.slice(0, 120) : "lookup error");
  }

  // First pass picks the reservation; then (real mode only) read that guest's profile fresh before deciding on a write.
  const link = { checkin: opts.checkin, checkout: opts.checkout };
  const common = { typedName: opts.name, phoneE164: opts.phoneE164, link, reservations: rows, today, allowAirbnbWrite: process.env.GUIDEBOOK_GATE_WRITE_AIRBNB === "1" };
  let d = decide({ ...common, guestPhones: null });
  if (d.matched) {
    const m = d.matched;
    if (isMock) {
      profile = mockReservations(gb.guestyListingId, today).profiles[m.guestId] || [];
    } else if (m.guestId) {
      try {
        const g = await guestyGet(`/v1/guests-crud/${encodeURIComponent(m.guestId)}`);
        profile = phonesOf((g.guest as RawGuest) || g);
      } catch {
        return { result: "review_lookup_failed", confirmationCode: m.confirmationCode, matchBy, note: "could not read guest profile" };
      }
    }
    d = decide({ ...common, guestPhones: profile });
  }
  const code = d.matched?.confirmationCode || "";
  const days = d.matched ? stayDays(d.matched) : null;
  const verified = d.matched && days?.ci && days.co && d.result.startsWith("matched_") && d.matched.id
    ? { resId: d.matched.id, ci: days.ci, co: days.co, airbnb: /airbnb/i.test(d.matched.source || "") || isAirbnbConf(d.matched.confirmationCode || "") }
    : undefined;
  if (!d.write) return { result: d.result, confirmationCode: code, matchBy: d.matchBy, verified };
  if (isMock || dryRun()) return { result: "matched_dry_run", confirmationCode: code, matchBy, verified, note: isMock ? "mock mode: no Guesty call" : "dry run: no write" };
  try {
    const digits = d.write.phone.replace(/\D/g, ""); // Guesty wants area code, no plus sign
    await guestyPut(`/v1/guests-crud/${encodeURIComponent(d.write.guestId)}`, { phone: digits, phones: [digits] });
    return { result: "matched_written", confirmationCode: code, matchBy, verified };
  } catch (e) {
    return { result: "review_write_failed", confirmationCode: code, matchBy, note: e instanceof Error ? e.message.slice(0, 120) : "write error" };
  }
}
