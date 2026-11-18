/**
 * Read-only check: does a test unit's upcoming reservations have a GUEST lock code?
 * Prints counts and HTTP statuses only. Never prints a code, a token, or a guest name.
 *
 * Usage: GUESTY_CLIENT_ID=... GUESTY_CLIENT_SECRET=... node scripts/guidebook-test-lock-check.mjs
 * This script only GETs. It has no write path.
 */
const LISTING = process.argv[2] || "68eeb5866f48330013c65a7a";
const BASE = "https://open-api.guesty.com";

if (!process.env.GUESTY_CLIENT_ID || !process.env.GUESTY_CLIENT_SECRET) {
  console.log(JSON.stringify({ ok: false, reason: "missing GUESTY_CLIENT_ID or GUESTY_CLIENT_SECRET" }));
  process.exit(2);
}

async function token() {
  const res = await fetch(`${BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "open-api",
      client_id: process.env.GUESTY_CLIENT_ID,
      client_secret: process.env.GUESTY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`auth ${res.status}`);
  const json = await res.json();
  if (!json.access_token) throw new Error("auth empty");
  return json.access_token;
}

function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const filters = JSON.stringify([
  { field: "listingId", operator: "$eq", value: LISTING },
  { field: "checkOut", operator: "$gte", value: `${addDays(today, -1)}T00:00:00.000Z` },
  { field: "checkIn", operator: "$lte", value: `${addDays(today, 120)}T00:00:00.000Z` },
]);

const access = await token();
const listRes = await fetch(
  `${BASE}/v1/reservations?limit=25&fields=${encodeURIComponent("listingId status checkOutDateLocalized")}&filters=${encodeURIComponent(filters)}`,
  { headers: { Authorization: `Bearer ${access}`, accept: "application/json" } },
);
if (!listRes.ok) {
  console.log(JSON.stringify({ ok: false, reason: "reservation list failed", status: listRes.status }));
  process.exit(1);
}
const list = await listRes.json();
const dead = new Set(["canceled", "cancelled", "declined", "expired", "inquiry", "closed"]);
const rows = (list.results || []).filter((r) => r && r.listingId === LISTING && !dead.has(String(r.status || "").toLowerCase()));

let withGuest = 0;
let noContent = 0;
let errors = 0;
const statuses = [];
for (const row of rows.slice(0, 8)) {
  const id = String(row._id || "");
  if (!/^[0-9a-f]{24}$/i.test(id)) continue;
  const res = await fetch(`${BASE}/v1/guest-code?reservationId=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${access}`, accept: "application/json" },
  });
  statuses.push(res.status);
  if (res.status === 204) {
    noContent += 1;
    continue;
  }
  if (!res.ok) {
    errors += 1;
    continue;
  }
  const body = await res.json().catch(() => null);
  const codes = Array.isArray(body?.codes) ? body.codes : [];
  const guest = codes.some((c) => String(c?.purpose || "").toUpperCase() === "GUEST" && c?.code);
  if (guest) withGuest += 1;
}

console.log(JSON.stringify({
  ok: true,
  listingId: LISTING,
  upcoming: rows.length,
  checked: Math.min(rows.length, 8),
  withGuestPurpose: withGuest,
  http204: noContent,
  errors,
  statuses,
}));
