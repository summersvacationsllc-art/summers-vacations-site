import assert from "node:assert/strict";
import test from "node:test";
import {
  hasForbiddenGuestKey,
  publicJsonResponseText,
  redactSyncStatusRecord,
} from "../../src/lib/public-guest-redaction.ts";

const NAME = "Casey Placeholder";
const RES = "res_placeholder";

test("public json drops guest names and reservation ids but keeps party size and dates", () => {
  const raw = JSON.stringify({
    date: "2026-11-18",
    in_house: [
      {
        property: "Example Cabin",
        guest: NAME,
        guests: 4,
        reservation_id: RES,
        check_in: "2026-11-18",
        check_out: "2026-11-20",
      },
    ],
    turnovers: [{ property: "Example Cabin", guesty_reservation_id: RES, same_day: false }],
  });
  const text = publicJsonResponseText(raw);
  const data = JSON.parse(text);
  assert.equal(hasForbiddenGuestKey(data), false);
  assert.equal(JSON.stringify(data).includes(NAME), false);
  assert.equal(JSON.stringify(data).includes(RES), false);
  assert.equal(data.in_house[0].property, "Example Cabin");
  assert.equal(data.in_house[0].guests, 4);
  assert.equal(data.in_house[0].check_in, "2026-11-18");
  assert.equal(data.turnovers[0].same_day, false);
});

test("already-clean json is returned unchanged", () => {
  const raw = '{\n  "date": "2026-11-18",\n  "guests": 2\n}\n';
  assert.equal(publicJsonResponseText(raw), raw);
});

test("sync status keeps property labels and drops name decorations", () => {
  const cleaned = redactSyncStatusRecord({
    ok: true,
    todayCT: "2026-11-18",
    expectedInHouse: [`${NAME} @ Example Cabin`],
    kioskUnits: { "example-cabin": `${NAME} (Example Cabin)`, vacant: null },
    errors: [`kiosk has no unit matching Guesty property 'Example Cabin' (guest ${NAME})`],
    showsHealth: { ok: true, message: "board fresh" },
  }) as {
    ok: boolean;
    expectedInHouse: string[];
    kioskUnits: Record<string, string | null>;
    errors: string[];
    showsHealth: { message: string };
  };
  assert.equal(cleaned.ok, true);
  assert.deepEqual(cleaned.expectedInHouse, ["Example Cabin"]);
  assert.equal(cleaned.kioskUnits["example-cabin"], "Example Cabin");
  assert.equal(cleaned.kioskUnits.vacant, null);
  assert.equal(cleaned.errors[0].includes(NAME), false);
  assert.equal(cleaned.errors[0].includes("Example Cabin"), true);
  assert.equal(cleaned.showsHealth.message, "board fresh");
  assert.equal(JSON.stringify(cleaned).includes(NAME), false);
});
