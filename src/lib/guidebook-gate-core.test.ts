import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, nameMatches, decide, isAirbnbConf, maskPhone, ctDay, addDays, type GateReservation } from "./guidebook-gate-core.ts";

test("phone normalization", () => {
  assert.equal(normalizePhone("(417) 555-0142"), "+14175550142");
  assert.equal(normalizePhone("1-417-555-0142"), "+14175550142");
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("555-0142"), null);
  assert.equal(normalizePhone("(111) 111-1111"), null);
  assert.equal(normalizePhone("417-155-0142"), null);
  assert.equal(normalizePhone("abc"), null);
  assert.equal(maskPhone("+14175550142"), "***0142");
  assert.equal(isAirbnbConf("HMXYZ12345"), true);
  assert.equal(isAirbnbConf("GY-abc"), false);
});
test("dates", () => {
  assert.equal(ctDay("2026-12-01T05:30:00.000Z"), "2026-11-30"); // evening before in Chicago
  assert.equal(ctDay("2026-12-01"), "2026-12-01");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});
test("names", () => {
  const g = { fullName: "Jane Marie Doe", firstName: "Jane", lastName: "Doe" };
  assert.ok(nameMatches("Jane Doe", g));
  assert.ok(nameMatches("doe", g));
  assert.ok(nameMatches("Jane", g));
  assert.ok(!nameMatches("Jane Smith", g));
  assert.ok(!nameMatches("Bob", g));
  assert.ok(nameMatches("Jane Smyth", { fullName: "Jane Smith", firstName: "Jane", lastName: "Smith" }));
  assert.ok(!nameMatches("Jane Roe", { fullName: "Jane Doe", firstName: "Jane", lastName: "Doe" }));
});

const TODAY = "2026-11-17";
const mk = (id: string, ci: string, co: string, full: string, extra: Partial<GateReservation> = {}): GateReservation => {
  const [first, ...rest] = full.split(" ");
  return { id, listingId: "L1", status: "confirmed", confirmationCode: `GY-${id}`, checkIn: ci, checkOut: co, guestId: `g-${id}`,
    guest: { fullName: full, firstName: first, lastName: rest.join(" ") }, source: "manual", ...extra };
};
const base = { typedName: "Jane Doe", phoneE164: "+14175550142", guestPhones: [] as string[], today: TODAY };

test("dates mode: single confirmed match writes (to be done by caller)", () => {
  const d = decide({ ...base, link: { checkin: "2026-12-01", checkout: "2026-12-05" }, reservations: [mk("a", "2026-12-01", "2026-12-05", "Jane Doe"), mk("b", "2026-12-06", "2026-12-09", "Zed Roe")] });
  assert.equal(d.result, "matched_written");
  assert.equal(d.matchBy, "dates");
  assert.equal(d.matched?.confirmationCode, "GY-a");
  assert.deepEqual(d.write, { guestId: "g-a", phone: "+14175550142" });
});
test("dates mode: no write cases", () => {
  const link = { checkin: "2026-12-01", checkout: "2026-12-05" };
  const r = mk("a", "2026-12-01", "2026-12-05", "Jane Doe");
  assert.equal(decide({ ...base, link, reservations: [mk("a", "2026-12-02", "2026-12-05", "Jane Doe")] }).result, "review_no_match");
  assert.equal(decide({ ...base, link, reservations: [] }).result, "review_no_match");
  assert.equal(decide({ ...base, link, reservations: [{ ...r, status: "canceled" }] }).result, "review_no_match");
  assert.equal(decide({ ...base, link, reservations: [{ ...r, status: "inquiry" }] }).result, "review_no_match");
  assert.equal(decide({ ...base, link, reservations: [r, mk("b", "2026-12-01", "2026-12-05", "Jane Doe")] }).result, "review_ambiguous");
  const mm = decide({ ...base, link, typedName: "Zed Quark", reservations: [r] });
  assert.equal(mm.result, "review_name_mismatch");
  assert.equal(mm.write, null);
  assert.equal(decide({ ...base, link, guestPhones: ["417-555-9999"], reservations: [r] }).result, "review_existing_different_phone");
  assert.equal(decide({ ...base, link, guestPhones: ["+1 (417) 555-0142"], reservations: [r] }).result, "matched_same_phone");
  const ab = decide({ ...base, link, reservations: [{ ...r, source: "airbnb2" }] });
  assert.equal(ab.result, "matched_airbnb_db_only");
  assert.equal(ab.write, null);
  assert.equal(decide({ ...base, link, reservations: [{ ...r, source: "manual", confirmationCode: "HMAAAA11" }] }).result, "matched_airbnb_db_only");
  assert.equal(decide({ ...base, link, reservations: [{ ...r, guestId: "" }] }).result, "review_lookup_failed");
});
test("dates mode: uses localized dates when present", () => {
  const link = { checkin: "2026-12-01", checkout: "2026-12-05" };
  const r = mk("a", "2026-12-01T17:00:00.000Z", "2026-12-05T16:00:00.000Z", "Jane Doe", { checkInLocalized: "2026-12-01", checkOutLocalized: "2026-12-05" });
  assert.equal(decide({ ...base, link, reservations: [r] }).result, "matched_written");
  // no localized fields: falls back to Chicago date of the timestamp
  const r2 = mk("a", "2026-12-02T04:00:00.000Z", "2026-12-05T16:00:00.000Z", "Jane Doe");
  assert.equal(decide({ ...base, link, reservations: [r2] }).result, "matched_written");
});
test("window mode: typed name + stay in the next 14 days", () => {
  const link = {};
  const soon = mk("a", "2026-11-20", "2026-11-24", "Jane Doe");
  const d = decide({ ...base, link, reservations: [soon, mk("far", "2026-12-20", "2026-12-24", "Jane Doe")] });
  assert.equal(d.result, "matched_written");
  assert.equal(d.matchBy, "window");
  assert.equal(d.matched?.id, "a");
  // in house now counts
  assert.equal(decide({ ...base, link, reservations: [mk("h", "2026-11-15", "2026-11-19", "Jane Doe")] }).result, "matched_written");
  // already checked out / too far out
  assert.equal(decide({ ...base, link, reservations: [mk("p", "2026-11-10", "2026-11-16", "Jane Doe")] }).result, "review_no_match");
  assert.equal(decide({ ...base, link, reservations: [mk("f", "2026-12-20", "2026-12-24", "Jane Doe")] }).result, "review_no_match");
  // name does not match the only stay in the window
  const nm = decide({ ...base, link, typedName: "Pat Quill", reservations: [soon] });
  assert.equal(nm.result, "review_name_mismatch");
  assert.equal(nm.write, null);
  // two stays whose guests both match the typed name
  assert.equal(decide({ ...base, link, reservations: [soon, mk("b", "2026-11-25", "2026-11-28", "Joan Doe")] , typedName: "Doe"}).result, "review_ambiguous");
  // two stays, only one matches the name: unambiguous
  assert.equal(decide({ ...base, link, reservations: [soon, mk("b", "2026-11-25", "2026-11-28", "Zed Roe")] }).result, "matched_written");
  // half a link (one date) falls back to window mode
  assert.equal(decide({ ...base, link: { checkin: "2026-11-20" }, reservations: [soon] }).matchBy, "window");
});
