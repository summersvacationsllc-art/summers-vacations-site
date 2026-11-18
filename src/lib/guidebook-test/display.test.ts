import assert from "node:assert/strict";
import test from "node:test";
import { chicagoInstant } from "../stay-window";
import { demoStatesAllowed, guidebookTestAllowed, mintKeyMatches, mintRouteAllowed, parseDemoStage, tokenFromQuery, TOKEN_RE } from "./access";
import { codePhase, doorPanel, pickGuestCode } from "./display";
import { verifyRusticGuidebookTokens } from "./lookup";
import { generateGuidebookToken, mintEnabled, mintPublicCounts, mintRusticGuidebookTokens, planTokenWrite, readTokenFieldId, reservationsToMint, tokensEqual, type GuestyMintClient, type MintRow } from "./token-job";

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

test("the Rustic page is served on the live host and demo states are not", () => {
  assert.equal(guidebookTestAllowed("preview", "summers-vacations-git-test.vercel.app"), true);
  assert.equal(guidebookTestAllowed("development", "localhost:3000"), true);
  assert.equal(guidebookTestAllowed(undefined, "localhost:3000"), true);
  assert.equal(guidebookTestAllowed("production", "mybransonvacation.com"), true);
  assert.equal(guidebookTestAllowed("production", "www.mybransonvacation.com"), true);
  assert.equal(demoStatesAllowed("preview", "branch.vercel.app"), true);
  assert.equal(demoStatesAllowed("development", "localhost:3000"), true);
  assert.equal(demoStatesAllowed("production", "something.vercel.app"), false);
  assert.equal(demoStatesAllowed("preview", "www.mybransonvacation.com"), false);
  assert.equal(demoStatesAllowed("preview", "mybransonvacation.com"), false);
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

test("the token job plans a custom-field write and stays disabled without the Rustic flag", async () => {
  const token = "a".repeat(43);
  const plan = planTokenWrite("68eeb5866f48330013c65a7a", "68eeb5866f48330013c65a7b", token);
  assert.equal(plan.method, "PUT");
  assert.equal(plan.path, "/v1/reservations-v3/68eeb5866f48330013c65a7a/custom-fields");
  assert.deepEqual(plan.body.customFields, [{ fieldId: "68eeb5866f48330013c65a7b", value: token }]);
  assert.equal(mintEnabled({}), false);
  assert.equal(mintEnabled({ GUIDEBOOK_TOKEN_MINT: "1" }), false);
  assert.equal(mintEnabled({ GUIDEBOOK_TOKEN_MINT: "true" }), false);
  assert.equal(mintEnabled({ GUIDEBOOK_TOKEN_MINT: "woodland-retreat" }), false);
  assert.equal(mintEnabled({ GUIDEBOOK_TOKEN_MINT: "rustic-ozark-retreat" }), true);
  assert.equal(readTokenFieldId({}), null);
  assert.equal(readTokenFieldId({ GUIDEBOOK_TOKEN_FIELD_ID: "not-an-id" }), null);
  assert.equal(readTokenFieldId({ GUIDEBOOK_TOKEN_FIELD_ID: "68eeb5866f48330013c65a7b" }), "68eeb5866f48330013c65a7b");

  let calls = 0;
  const client: GuestyMintClient = {
    get: async () => { calls += 1; return { status: 200, body: { results: [], count: 0 } }; },
    put: async () => { calls += 1; return { status: 200, body: null }; },
  };
  const off = await mintRusticGuidebookTokens({ env: {}, client });
  assert.equal(off.enabled, false);
  assert.equal(calls, 0);
  const wrong = await mintRusticGuidebookTokens({
    env: { GUIDEBOOK_TOKEN_MINT: "true", GUIDEBOOK_TOKEN_FIELD_ID: "68eeb5866f48330013c65a7b" },
    client,
  });
  assert.equal(wrong.enabled, false);
  assert.equal(calls, 0);
  const missingField = await mintRusticGuidebookTokens({
    env: { GUIDEBOOK_TOKEN_MINT: "rustic-ozark-retreat" },
    client,
  });
  assert.equal(missingField.blocked, "field-id");
  assert.equal(calls, 0);
});

test("mint selects only blank upcoming Rustic reservations and writes one token each", async () => {
  const rustic = "68eeb5866f48330013c65a7a";
  const other = "68eeb5866f48330013c65a7c";
  const fieldId = "68eeb5866f48330013c65a7b";
  const rows: MintRow[] = [
    { id: "aaaaaaaaaaaaaaaaaaaaaaaa", listingId: rustic, status: "confirmed", checkOut: "2026-11-20", fieldValue: null },
    { id: "bbbbbbbbbbbbbbbbbbbbbbbb", listingId: rustic, status: "confirmed", checkOut: "2026-11-20", fieldValue: "already-set" },
    { id: "cccccccccccccccccccccccc", listingId: rustic, status: "canceled", checkOut: "2026-11-20", fieldValue: null },
    { id: "dddddddddddddddddddddddd", listingId: rustic, status: "confirmed", checkOut: "2026-11-01", fieldValue: null },
    { id: "eeeeeeeeeeeeeeeeeeeeeeee", listingId: other, status: "confirmed", checkOut: "2026-11-20", fieldValue: null },
    { id: "ffffffffffffffffffffffff", listingId: rustic, status: "reserved", checkOut: "2026-11-20", fieldValue: null },
  ];
  assert.deepEqual(reservationsToMint(rows, rustic, "2026-11-18").map((r) => r.id), ["aaaaaaaaaaaaaaaaaaaaaaaa"]);

  const puts: { path: string; body: Record<string, unknown> }[] = [];
  const stored = new Map<string, string>();
  const listBody = () => ({
    status: 200,
    body: {
      count: 3,
      results: [
        { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", listingId: rustic, status: "confirmed", checkOutDateLocalized: "2026-11-20", customFields: stored.has("aaaaaaaaaaaaaaaaaaaaaaaa") ? [{ fieldId, value: stored.get("aaaaaaaaaaaaaaaaaaaaaaaa") }] : [] },
        { _id: "bbbbbbbbbbbbbbbbbbbbbbbb", listingId: rustic, status: "confirmed", checkOutDateLocalized: "2026-11-22", customFields: [{ fieldId, value: "keep" }] },
        { _id: "ffffffffffffffffffffffff", listingId: rustic, status: "reserved", checkOutDateLocalized: "2026-11-22", customFields: [] },
        { _id: "eeeeeeeeeeeeeeeeeeeeeeee", listingId: other, status: "confirmed", checkOutDateLocalized: "2026-11-22", customFields: [] },
      ],
    },
  });
  const client: GuestyMintClient = {
    get: async () => listBody(),
    put: async (path, body) => {
      puts.push({ path, body });
      const value = (body.customFields as { value: string }[])[0].value;
      stored.set("aaaaaaaaaaaaaaaaaaaaaaaa", value);
      return { status: 200, body: null };
    },
  };
  const env = {
    GUIDEBOOK_TOKEN_MINT: "rustic-ozark-retreat",
    GUIDEBOOK_TOKEN_FIELD_ID: fieldId,
    GUESTY_CLIENT_ID: "present",
    GUESTY_CLIENT_SECRET: "present",
  };
  const result = await mintRusticGuidebookTokens({
    env,
    today: "2026-11-18",
    client,
    generateToken: () => "a".repeat(43),
  });
  assert.equal(result.enabled, true);
  assert.equal(result.written, 1);
  assert.equal(result.errors, 0);
  assert.equal(puts.length, 1);
  assert.equal(puts[0].path, "/v1/reservations-v3/aaaaaaaaaaaaaaaaaaaaaaaa/custom-fields");
  assert.deepEqual(puts[0].body, { customFields: [{ fieldId, value: "a".repeat(43) }] });
  const again = await mintRusticGuidebookTokens({ env, today: "2026-11-18", client, generateToken: () => "b".repeat(43) });
  assert.equal(again.written, 0);
  assert.equal(puts.length, 1);
  const pub = JSON.stringify(mintPublicCounts(result));
  assert.equal(pub.includes("a".repeat(43)), false);
  assert.equal(pub.includes("aaaaaaaaaaaaaaaaaaaaaaaa"), false);
  assert.deepEqual(Object.keys(JSON.parse(pub)).sort(), ["errors", "skipped", "statuses", "written"]);
});

test("mint and verify run on preview or production only when the Rustic flag is set", () => {
  assert.equal(mintRouteAllowed({ vercelEnv: "preview", hostHeader: "branch.vercel.app", mintFlag: "rustic-ozark-retreat" }), true);
  assert.equal(mintRouteAllowed({ vercelEnv: "production", hostHeader: "www.mybransonvacation.com", mintFlag: "rustic-ozark-retreat" }), true);
  assert.equal(mintRouteAllowed({ vercelEnv: "production", hostHeader: "mybransonvacation.com", mintFlag: "rustic-ozark-retreat" }), true);
  assert.equal(mintRouteAllowed({ vercelEnv: "development", hostHeader: "localhost:3000", mintFlag: "rustic-ozark-retreat" }), false);
  assert.equal(mintRouteAllowed({ vercelEnv: "preview", hostHeader: "branch.vercel.app", mintFlag: "1" }), false);
  assert.equal(mintRouteAllowed({ vercelEnv: "production", hostHeader: "www.mybransonvacation.com", mintFlag: undefined }), false);
  assert.equal(mintKeyMatches("correct-horse", "correct-horse"), true);
  assert.equal(mintKeyMatches("correct-horse", "correct-horses"), false);
  assert.equal(mintKeyMatches("wrong", "correct-horse"), false);
  assert.equal(mintKeyMatches(null, "correct-horse"), false);
  assert.equal(mintKeyMatches("correct-horse", ""), false);
});

test("verify counts token resolution and returns no token", async () => {
  const token = "c".repeat(43);
  const other = "d".repeat(43);
  const counts = await verifyRusticGuidebookTokens({
    today: "2026-11-18",
    rows: [
      { id: "aaaaaaaaaaaaaaaaaaaaaaaa", listingId: "68eeb5866f48330013c65a7a", status: "confirmed", checkOut: "2026-11-20", fieldValue: token },
      { id: "bbbbbbbbbbbbbbbbbbbbbbbb", listingId: "68eeb5866f48330013c65a7a", status: "confirmed", checkOut: "2026-11-21", fieldValue: other },
      { id: "cccccccccccccccccccccccc", listingId: "68eeb5866f48330013c65a7a", status: "confirmed", checkOut: "2026-11-21", fieldValue: null },
      { id: "dddddddddddddddddddddddd", listingId: "68eeb5866f48330013c65a7a", status: "canceled", checkOut: "2026-11-21", fieldValue: token },
      { id: "eeeeeeeeeeeeeeeeeeeeeeee", listingId: "68eeb5866f48330013c65a7c", status: "confirmed", checkOut: "2026-11-21", fieldValue: token },
    ],
    lookup: async (value) => value === token
      ? { kind: "stay", stay: { reservationId: "aaaaaaaaaaaaaaaaaaaaaaaa", checkIn: "2026-11-18", checkOut: "2026-11-20", phase: "window", code: "9999", lookupFailed: false } }
      : { kind: "none" },
  });
  assert.deepEqual(counts, { tokensFound: 2, resolved: 1, failed: 1 });
  const pub = JSON.stringify(counts);
  assert.equal(pub.includes(token), false);
  assert.equal(pub.includes("9999"), false);
  assert.deepEqual(Object.keys(JSON.parse(pub)).sort(), ["failed", "resolved", "tokensFound"]);
});
