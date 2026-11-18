import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, normalizeConf, nameMatches, decide, isAirbnbConf, maskPhone, type GateReservation } from "./guidebook-gate-core.ts";

test("phone normalization", () => {
  assert.equal(normalizePhone("(417) 555-0142"), "+14175550142");
  assert.equal(normalizePhone("1-417-555-0142"), "+14175550142");
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("555-0142"), null);
  assert.equal(normalizePhone("(111) 111-1111"), null);
  assert.equal(normalizePhone("417-155-0142"), null);
  assert.equal(normalizePhone("abc"), null);
  assert.equal(maskPhone("+14175550142"), "***0142");
});
test("conf", () => {
  assert.equal(normalizeConf(" hm abc123 "), "HMABC123");
  assert.equal(normalizeConf("x"), null);
  assert.equal(isAirbnbConf("HMXYZ12345"), true);
  assert.equal(isAirbnbConf("GY-abc"), false);
});
test("names", () => {
  const g = { fullName: "Jane Marie Doe", firstName: "Jane", lastName: "Doe" };
  assert.ok(nameMatches("Jane Doe", g));
  assert.ok(nameMatches("john doe", g)); // last name matches; first is a weak signal on purpose
  assert.ok(nameMatches("doe", g));
  assert.ok(nameMatches("Jane", g));
  assert.ok(!nameMatches("Jane Smith", g));
  assert.ok(!nameMatches("Bob", g));
  assert.ok(nameMatches("Jane Smyth", { fullName: "Jane Smith", firstName: "Jane", lastName: "Smith" }));
  assert.ok(!nameMatches("Jane Roe", { fullName: "Jane Doe", firstName: "Jane", lastName: "Doe" }));
});
const base: GateReservation = {
  id: "r1", listingId: "L1", status: "confirmed", confirmationCode: "GY-abc", checkOut: new Date(Date.now() + 5 * 86400_000).toISOString(),
  guestId: "g1", guest: { fullName: "Jane Doe", firstName: "Jane", lastName: "Doe" }, source: "manual",
};
const args = { slug: "x", listingId: "L1", name: "Jane Doe", phoneE164: "+14175550142", reservations: [base], guestPhones: [] as string[], nowMs: Date.now() };
test("decide: happy path writes", () => {
  const d = decide(args);
  assert.equal(d.result, "matched_written");
  assert.deepEqual(d.write, { guestId: "g1", phone: "+14175550142" });
});
test("decide: no write cases", () => {
  assert.equal(decide({ ...args, listingId: "L2" }).result, "review_unit_mismatch");
  assert.equal(decide({ ...args, name: "Zed Quark" }).result, "review_name_mismatch");
  assert.equal(decide({ ...args, reservations: [] }).result, "review_not_found");
  assert.equal(decide({ ...args, reservations: [{ ...base, status: "canceled" }] }).result, "review_inactive_reservation");
  assert.equal(decide({ ...args, reservations: [base, { ...base, id: "r2" }] }).result, "review_not_found");
  assert.equal(decide({ ...args, guestPhones: ["417-555-9999"] }).result, "review_existing_different_phone");
  assert.equal(decide({ ...args, guestPhones: ["+1 (417) 555-0142"] }).result, "matched_same_phone");
  const ab = decide({ ...args, reservations: [{ ...base, source: "airbnb2", confirmationCode: "HMAAAA1" }] });
  assert.equal(ab.result, "matched_airbnb_db_only");
  assert.equal(ab.write, null);
  for (const r of [decide({ ...args, listingId: "L2" }), decide({ ...args, name: "Zed Quark" })]) assert.equal(r.write, null);
});
