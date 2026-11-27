import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { GATE_LISTING_IDS, CONSENT_TEXT, addDays } from "./guidebook-gate-core.ts";

const RES_ID = "507f1f77bcf86cd799439011";
const GUEST_ID = "607f1f77bcf86cd799439022";
const GUEST_CODE = "97531";
const PHONE = "+14175550142";

function ctToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

async function walk(dir: string): Promise<string[]> {
  const st = await stat(dir);
  if (!st.isDirectory()) return [dir];
  const names = await readdir(dir);
  const out: string[] = [];
  for (const name of names) out.push(...(await walk(path.join(dir, name))));
  return out;
}

function isGuesty(url: string): boolean {
  return url.includes("guesty.invalid") || url.includes("guesty.com");
}

test("submit stores the contact privately and makes no Guesty write", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "gg-"));
  const prev = {
    LOCAL_BLOB_DIR: process.env.LOCAL_BLOB_DIR,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    GUESTY_CLIENT_ID: process.env.GUESTY_CLIENT_ID,
    GUESTY_CLIENT_SECRET: process.env.GUESTY_CLIENT_SECRET,
    GUESTY_API_BASE_LOCAL_TEST: process.env.GUESTY_API_BASE_LOCAL_TEST,
    GUIDEBOOK_GATE_MOCK: process.env.GUIDEBOOK_GATE_MOCK,
    GUIDEBOOK_GATE_DRY_RUN: process.env.GUIDEBOOK_GATE_DRY_RUN,
    GUIDEBOOK_GATE_WRITE_AIRBNB: process.env.GUIDEBOOK_GATE_WRITE_AIRBNB,
    GUIDEBOOK_SESSION_SECRET: process.env.GUIDEBOOK_SESSION_SECRET,
  };
  process.env.LOCAL_BLOB_DIR = dir;
  delete process.env.VERCEL;
  process.env.VERCEL_ENV = "preview";
  process.env.GUESTY_CLIENT_ID = "test-client";
  process.env.GUESTY_CLIENT_SECRET = "test-secret";
  process.env.GUESTY_API_BASE_LOCAL_TEST = "https://guesty.invalid";
  delete process.env.GUIDEBOOK_GATE_MOCK;
  delete process.env.GUIDEBOOK_GATE_DRY_RUN;
  delete process.env.GUIDEBOOK_GATE_WRITE_AIRBNB;
  process.env.GUIDEBOOK_SESSION_SECRET = "test-only-session-secret-value";

  const tokenDir = path.join(dir, "guesty", "oauth");
  await mkdir(tokenDir, { recursive: true });
  await writeFile(path.join(tokenDir, "token.json"), JSON.stringify({
    value: "cached-test-token",
    exp: Date.now() + 3 * 24 * 3600_000,
  }));

  const ci = addDays(ctToday(), -1);
  const co = addDays(ctToday(), 3);
  const listingId = GATE_LISTING_IDS["rustic-ozark-retreat"];
  const reservation = {
    _id: RES_ID,
    listingId,
    status: "confirmed",
    confirmationCode: "GY-STORETEST",
    checkIn: `${ci}T22:00:00.000Z`,
    checkOut: `${co}T15:00:00.000Z`,
    checkInDateLocalized: ci,
    checkOutDateLocalized: co,
    guestId: GUEST_ID,
    source: "manual",
    guest: { _id: GUEST_ID, fullName: "Jane Doe", firstName: "Jane", lastName: "Doe" },
  };

  const calls: { method: string; url: string; hasBody: boolean }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();
    calls.push({ method, url, hasBody: init?.body != null && init.body !== "" });
    const pathname = new URL(url).pathname;
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { "content-type": "application/json" },
    });
    if (pathname.startsWith("/v1/reservations")) return json({ results: [reservation], count: 1 });
    if (pathname.startsWith("/v1/guests-crud/")) return json({ _id: GUEST_ID, fullName: "Jane Doe", firstName: "Jane", lastName: "Doe" });
    if (pathname === "/v1/guest-code") {
      return json({ codes: [{ code: GUEST_CODE, purpose: "GUEST", status: "ACTIVE" }] });
    }
    return new Response("", { status: 404 });
  };

  try {
    const serviceSrc = await readFile(new URL("./guidebook-gate-service.ts", import.meta.url), "utf8");
    assert.equal(serviceSrc.includes("guestyPut"), false);
    assert.equal(serviceSrc.includes("guestySend"), false);
    assert.equal(serviceSrc.includes("GUIDEBOOK_GATE_DRY_RUN"), false);
    assert.equal(serviceSrc.includes("GUIDEBOOK_GATE_WRITE_AIRBNB"), false);
    const storeSrc = await readFile(new URL("./guidebook-gate-store.ts", import.meta.url), "utf8");
    assert.equal(storeSrc.includes('access: "private"'), true);
    assert.equal(storeSrc.includes('access: "public"'), false);

    const { POST } = await import("../app/api/guidebook-gate/route.ts");
    const res = await POST(new Request("http://localhost/api/guidebook-gate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
      body: JSON.stringify({
        slug: "rustic-ozark-retreat",
        name: "Jane Doe",
        phone: "(417) 555-0142",
        checkin: ci,
        checkout: co,
        consent: true,
        mode: "required",
      }),
    }));
    const payload = await res.json() as { ok?: boolean; error?: string; stay?: { code?: string | null; state?: string } };
    assert.equal(res.status, 200, payload.error || "submit failed");
    assert.equal(payload.ok, true);
    assert.equal(payload.stay?.state, "ready");
    assert.equal(payload.stay?.code, GUEST_CODE);
    assert.notEqual(payload.stay?.code, PHONE.slice(-4));

    const guestyCalls = calls.filter((c) => isGuesty(c.url));
    assert.ok(guestyCalls.length >= 2, "expected Guesty reads");
    for (const c of guestyCalls) {
      assert.equal(c.method, "GET", new URL(c.url).pathname);
      assert.equal(c.hasBody, false, new URL(c.url).pathname);
      assert.equal(c.url.includes("0142"), false);
      assert.equal(c.url.toLowerCase().includes("jane"), false);
      assert.equal(c.url.includes(GUEST_CODE), false);
    }
    assert.equal(guestyCalls.some((c) => c.url.includes("/v1/guests-crud/") && c.method !== "GET"), false);
    assert.equal(guestyCalls.some((c) => new URL(c.url).pathname === "/v1/guest-code"), true);
    assert.equal(guestyCalls.some((c) => c.url.includes("/custom-fields") || c.url.includes("/notes")), false);

    const { listSubmissions, CONTACTS_PREFIX } = await import("./guidebook-gate-store.ts");
    const rows = await listSubmissions();
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row.unit, "rustic-ozark-retreat");
    assert.equal(row.firstName, "Jane");
    assert.equal(row.name, "Jane Doe");
    assert.equal(row.phone, PHONE);
    assert.equal(row.checkIn, ci);
    assert.equal(row.checkOut, co);
    assert.equal(row.linkCheckin, ci);
    assert.equal(row.linkCheckout, co);
    assert.equal(row.reservationId, RES_ID);
    assert.equal(row.result, "matched_external");
    assert.equal(row.consent, true);
    assert.equal(row.consentText, CONSENT_TEXT);
    assert.equal(row.codeShown, true);
    assert.equal(Number.isNaN(Date.parse(row.at)), false);
    assert.equal(JSON.stringify(row).includes(GUEST_CODE), false);

    const files = await walk(dir);
    const rel = (f: string) => path.relative(dir, f).split(path.sep).join("/");
    const subs = files.filter((f) => rel(f).startsWith(`${CONTACTS_PREFIX}/`) && rel(f).includes("/submissions/") && f.endsWith(".json"));
    assert.equal(subs.length, 1);
    const stray = files.filter((f) => f.endsWith(".json") && !rel(f).startsWith(`${CONTACTS_PREFIX}/`) && !rel(f).startsWith("guesty/"));
    assert.deepEqual(stray, []);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
