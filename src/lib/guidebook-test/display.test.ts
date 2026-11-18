import assert from "node:assert/strict";
import test from "node:test";
import { chicagoInstant } from "../stay-window";
import { guidebookTestAllowed, parseDemoStage, tokenFromQuery, TOKEN_RE } from "./access";
import { codePhase, doorPanel, pickGuestCode } from "./display";
import { commitTokenWrite, generateGuidebookToken, planTokenWrite, tokensEqual } from "./token-job";

const PLACE = "Building 9, Unit 7";

test("chicago 7 AM on a standard-time morning is 13:00 UTC", () => {
  assert.equal(chicagoInstant("2026-11-20", "07:00:00"), Date.parse("2026-11-20T13:00:00.000Z"));
  assert.equal(chicagoInstant("2026-11-23", "10:00:00"), Date.parse("2026-11-23T16:00:00.000Z"));
});

test("code window is 7:00 AM check-in through 10:00 AM checkout, America/Chicago", () => {
  const ci = "2026-11-20";
  const co = "2026-11-23";
  const start = chicagoInstant(ci, "07:00:00");
  const end = chicagoInstant(co, "10:00:00");
  assert.equal(codePhase(ci, co, start - 1), "before");
  assert.equal(codePhase(ci, co, start), "window");
  assert.equal(codePhase(ci, co, end), "window");
  assert.equal(codePhase(ci, co, end + 1000), "after");
  assert.equal(codePhase("2026-11-23", "2026-11-20", start), null);
});

test("pickGuestCode keeps a single GUEST code and drops backup or ambiguous codes", () => {
  const wrap = (codes: unknown[]) => ({ codes });
  assert.equal(
    pickGuestCode(wrap([
      { code: "9999", purpose: "GUEST_BACKUP", status: "ACTIVE" },
      { code: "1234", purpose: "GUEST", status: "ACTIVE" },
    ])),
    "1234",
  );
  assert.equal(pickGuestCode(wrap([{ code: "9999", purpose: "GUEST_BACKUP", status: "ACTIVE" }])), null);
  assert.equal(pickGuestCode(wrap([{ code: "1234", purpose: "GUEST", status: "FAILED" }])), null);
  assert.equal(pickGuestCode(wrap([
    { code: "1234", purpose: "GUEST", status: "ACTIVE" },
    { code: "5678", purpose: "GUEST", status: "ACTIVE" },
  ])), null);
  assert.equal(pickGuestCode(wrap([{ code: "1234", purpose: "GUEST", status: "ACTIVE" }, { code: "1234", purpose: "GUEST", status: "SET" }])), "1234");
  assert.equal(pickGuestCode(null), null);
  assert.equal(pickGuestCode({}), null);
});

test("door box copy follows the stay window and never invents a code", () => {
  assert.equal(doorPanel({ phase: "before", code: "1234", place: PLACE, lookupFailed: false }).kind, "before");
  const shown = doorPanel({ phase: "window", code: "1234", place: PLACE, lookupFailed: false });
  assert.equal(shown.kind, "code");
  if (shown.kind === "code") assert.equal(shown.text, "Your door code for Building 9, Unit 7 is 1234");
  assert.equal(doorPanel({ phase: "window", code: null, place: PLACE, lookupFailed: true }).kind, "fallback");
  assert.equal(doorPanel({ phase: "window", code: "1234", place: PLACE, lookupFailed: true }).kind, "fallback");
  assert.equal(doorPanel({ phase: "after", code: "1234", place: PLACE, lookupFailed: false }).kind, "hidden");
  assert.equal(doorPanel({ phase: "after", code: null, place: PLACE, lookupFailed: true }).kind, "hidden");
  assert.equal(doorPanel({ phase: null, code: null, place: PLACE, lookupFailed: true }).kind, "fallback");
  assert.equal(doorPanel({ phase: null, code: null, place: PLACE, lookupFailed: false }).kind, "hidden");
  const before = doorPanel({ phase: "before", code: null, place: PLACE, lookupFailed: false });
  if (before.kind === "before") {
    assert.equal(before.text, "Your door code will appear here at 7 AM on your arrival day.");
  }
  const failed = doorPanel({ phase: "window", code: null, place: PLACE, lookupFailed: true });
  if (failed.kind === "fallback") {
    assert.equal(failed.text, "Your door code will be in your booking messages before you arrive.");
  }
});

test("the test route stays off production hosts and production deployments", () => {
  assert.equal(guidebookTestAllowed("preview", "summers-vacations-git-test.vercel.app"), true);
  assert.equal(guidebookTestAllowed("development", "localhost:3000"), true);
  assert.equal(guidebookTestAllowed(undefined, "localhost:3000"), true);
  assert.equal(guidebookTestAllowed("production", "mybransonvacation.com"), false);
  assert.equal(guidebookTestAllowed("preview", "www.mybransonvacation.com"), false);
  assert.equal(guidebookTestAllowed("preview", "mybransonvacation.com"), false);
  assert.equal(guidebookTestAllowed("production", "something.vercel.app"), false);
});

test("demo stages and tokens", () => {
  assert.equal(parseDemoStage("window"), "window");
  assert.equal(parseDemoStage("failed"), "failed");
  assert.equal(parseDemoStage("0000"), null);
  assert.equal(parseDemoStage("code"), null);
  const token = generateGuidebookToken();
  assert.match(token, TOKEN_RE);
  assert.equal(tokenFromQuery(token).token, token);
  assert.equal(tokenFromQuery(token).strip, false);
  assert.equal(tokenFromQuery("1234").token, null);
  assert.equal(tokenFromQuery("1234").strip, true);
  assert.equal(tokenFromQuery(undefined).strip, false);
  assert.equal(tokensEqual(token, token), true);
  assert.equal(tokensEqual(token, generateGuidebookToken()), false);
});

test("the token job plans a custom-field write and refuses to perform it", () => {
  const token = "a".repeat(43);
  const plan = planTokenWrite("68eeb5866f48330013c65a7a", "68eeb5866f48330013c65a7b", token);
  assert.equal(plan.method, "PUT");
  assert.equal(plan.path, "/v1/reservations-v3/68eeb5866f48330013c65a7a/custom-fields");
  assert.deepEqual(plan.body.customFields, [{ fieldId: "68eeb5866f48330013c65a7b", value: token }]);
  assert.throws(() => commitTokenWrite(plan), /Refusing to write to Guesty/);
});
