import { test } from "node:test";
import assert from "node:assert/strict";
import { pickGuestCode } from "./guidebook-gate-core.ts";

process.env.GUIDEBOOK_SESSION_SECRET = "unit-test-secret-unit-test-secret-1234";
const { sealSession, openSession, cookieName, setCookieHeader, readCookie } = await import("./guidebook-gate-session.ts");

const sess = { slug: "rustic-ozark-retreat", resId: "abc123", ci: "2030-01-10", co: "2030-01-14", fn: "Testy", ab: false, exp: Date.now() + 86400_000 };

test("session seal/open", () => {
  const t = sealSession(sess)!;
  assert.ok(t && !t.includes("abc123") && !t.includes("Testy")); // opaque
  assert.deepEqual(openSession(t, "rustic-ozark-retreat"), sess);
  assert.equal(openSession(t, "woodland-retreat"), null); // wrong unit
  assert.equal(openSession(t.slice(0, -2) + "AA", "rustic-ozark-retreat"), null); // tampered
  assert.equal(openSession("garbage", "rustic-ozark-retreat"), null);
  const expired = sealSession({ ...sess, exp: Date.now() - 1 })!;
  assert.equal(openSession(expired, "rustic-ozark-retreat"), null);
});
test("cookie header", () => {
  const h = setCookieHeader("rustic-ozark-retreat", "tok", Date.now() + 86400_000);
  assert.ok(h.includes("HttpOnly") && h.includes("SameSite=Strict") && h.includes("Path=/api/guidebook-gate"));
  assert.equal(readCookie(`a=1; ${cookieName("rustic-ozark-retreat")}=tok; b=2`, cookieName("rustic-ozark-retreat")), "tok");
});
test("pickGuestCode: GUEST only", () => {
  const mk = (codes: unknown[]) => ({ codes, locks: [] });
  assert.equal(pickGuestCode(mk([{ code: "9999", purpose: "GUEST_BACKUP", status: "ACTIVE" }, { code: "0000", purpose: "GUEST", status: "ACTIVE" }])), "0000");
  assert.equal(pickGuestCode(mk([{ code: "9999", purpose: "GUEST_BACKUP", status: "ACTIVE" }])), null);
  assert.equal(pickGuestCode(mk([{ code: "0000", purpose: "GUEST", status: "FAILED" }])), null);
  assert.equal(pickGuestCode(mk([])), null);
  assert.equal(pickGuestCode(null), null);
  assert.equal(pickGuestCode({}), null);
  assert.equal(pickGuestCode(mk([{ code: "bad code!", purpose: "GUEST", status: "ACTIVE" }])), null);
});
