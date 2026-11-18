/**
 * Server-only: look up a reservation by confirmation code, decide, optionally
 * write the phone to the guest profile. The Guesty token stays in guesty.ts.
 *
 * Environment switches (only honored outside production):
 *   GUIDEBOOK_GATE_MOCK=1     -> canned fake reservations, no Guesty calls at all
 *   GUIDEBOOK_GATE_DRY_RUN=1  -> real reads, never write to a profile
 * In production a missing GUESTY_CLIENT_ID/SECRET means "lookup failed" (review list).
 */
import { guestyGet, guestyPut } from "@/lib/guesty";
import { getGuidebook } from "@/data/guidebooks";
import { decide, type GateReservation, type GateResult } from "@/lib/guidebook-gate-core";

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
    checkOut: String(r.checkOut ?? ""),
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
function mockReservations(conf: string, listingId: string): { rows: GateReservation[]; profile: string[] } {
  const future = new Date(Date.now() + 5 * 86400_000).toISOString();
  const base: GateReservation = {
    id: "mock-res", listingId, status: "confirmed", confirmationCode: conf, checkOut: future, guestId: "mock-guest",
    guest: { fullName: "Testy McTestface", firstName: "Testy", lastName: "McTestface" }, source: "manual",
  };
  if (conf === "TESTMATCH1") return { rows: [base], profile: [] };
  if (conf === "TESTSAMEPH1") return { rows: [base], profile: ["+14175550100"] };
  if (conf === "TESTDIFFPH1") return { rows: [base], profile: ["+14175550199"] };
  if (conf === "TESTWRONGUNIT") return { rows: [{ ...base, listingId: "some-other-listing" }], profile: [] };
  if (conf === "HMTESTAIRBNB1") return { rows: [{ ...base, source: "airbnb2" }], profile: [] };
  return { rows: [], profile: [] };
}

export async function processGateSubmission(opts: {
  slug: string;
  name: string;
  phoneE164: string;
  conf: string; // "" when none given (Airbnb optional mode)
}): Promise<{ result: GateResult; note?: string }> {
  const gb = getGuidebook(opts.slug);
  if (!gb) return { result: "review_unit_mismatch", note: "unknown unit" };
  if (!opts.conf) return { result: "unverified_no_code" };

  let rows: GateReservation[] = [];
  let profile: string[] | null = null;
  let isMock = false;
  try {
    if (mockOn()) {
      isMock = true;
      const m = mockReservations(opts.conf, gb.guestyListingId);
      rows = m.rows;
      profile = m.profile;
    } else {
      if (!process.env.GUESTY_CLIENT_ID || !process.env.GUESTY_CLIENT_SECRET) {
        return { result: "review_lookup_failed", note: "Guesty credentials are not configured in this environment" };
      }
      const filters = JSON.stringify([{ field: "confirmationCode", operator: "$eq", value: opts.conf }]);
      const fields = [
        "listingId", "status", "confirmationCode", "checkIn", "checkOut", "guestId", "source", "integration.platform",
        "guest._id", "guest.fullName", "guest.firstName", "guest.lastName", "guest.phone", "guest.phones",
      ].join(" ");
      const json = await guestyGet(`/v1/reservations?limit=5&fields=${encodeURIComponent(fields)}&filters=${encodeURIComponent(filters)}`);
      rows = ((json.results as Record<string, unknown>[]) || []).map(toReservation)
        .filter((r) => r.confirmationCode.toUpperCase() === opts.conf);
      if (rows.length === 1 && rows[0].guestId) {
        try {
          const g = await guestyGet(`/v1/guests-crud/${encodeURIComponent(rows[0].guestId)}`);
          profile = phonesOf((g.guest as RawGuest) || g);
        } catch {
          return { result: "review_lookup_failed", note: "could not read guest profile" };
        }
      }
    }
  } catch (e) {
    return { result: "review_lookup_failed", note: e instanceof Error ? e.message.slice(0, 120) : "lookup error" };
  }

  const d = decide({
    slug: opts.slug,
    listingId: gb.guestyListingId,
    name: opts.name,
    phoneE164: opts.phoneE164,
    reservations: rows,
    guestPhones: profile,
    nowMs: Date.now(),
    allowAirbnbWrite: process.env.GUIDEBOOK_GATE_WRITE_AIRBNB === "1",
  });
  if (!d.write) return { result: d.result };
  if (isMock || dryRun()) return { result: "matched_dry_run", note: isMock ? "mock mode: no Guesty call" : "dry run: no write" };
  try {
    const digits = d.write.phone.replace(/\D/g, ""); // Guesty wants area code, no plus sign
    await guestyPut(`/v1/guests-crud/${encodeURIComponent(d.write.guestId)}`, { phone: digits, phones: [digits] });
    return { result: "matched_written" };
  } catch (e) {
    return { result: "review_write_failed", note: e instanceof Error ? e.message.slice(0, 120) : "write error" };
  }
}
