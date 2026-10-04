import { del, get, list, put } from "@vercel/blob";

/**
 * Kiosk tablet heartbeats ("check-ins"), stored in the project's existing
 * private Vercel Blob store: one small JSON record per device, overwritten on
 * every beat. The blob's own `uploadedAt` (from list()) is the authoritative
 * last-seen time, so status never depends on the tablet's clock.
 *
 *   kiosk-heartbeats/<unit>/<deviceId>.json   real tablets
 *   kiosk-heartbeats/_probes/<deviceId>.json  test / automation probes (excluded)
 */

export const KIOSK_UNITS: { slug: string; name: string }[] = [
  { slug: "the-penthouse", name: "The Penthouse" },
  { slug: "rustic-ozark-retreat", name: "Rustic Ozark Retreat" },
  { slug: "double-condo", name: "Double Condo" },
  { slug: "branson-family-haven", name: "Branson Family Haven (Indian Point)" },
  { slug: "woodland-retreat", name: "Woodland Retreat" },
  { slug: "scotts-unit", name: "No-Stairs Condo (Scott's unit)" },
];
const UNIT_SET = new Set(KIOSK_UNITS.map((u) => u.slug));

export const PREFIX = "kiosk-heartbeats/";
const PROBE_DIR = "_probes";

export const ONLINE_MIN = 10;
export const QUIET_MIN = 60;
/** Probe records are deleted after this long; stale real-device records after 30 days. */
const PROBE_TTL_MS = 24 * 3600 * 1000;
const DEVICE_TTL_MS = 30 * 24 * 3600 * 1000;

export type HeartbeatRecord = {
  unit: string;
  unitSource: string;
  deviceId: string;
  probe: boolean;
  version: string;
  reason: string;
  screen: { w: number; h: number; vw: number; vh: number; dpr: number; page: number } | null;
  visible: string;
  online: boolean;
  battery: { level: number; charging: boolean | null; src: string } | null;
  fully: boolean;
  uptimeSec: number;
  ua: string;
  receivedAt: string;
};

const str = (v: unknown, max: number, re = /[^A-Za-z0-9._ :/()-]/g) =>
  typeof v === "string" ? v.replace(re, "").slice(0, max) : "";
const num = (v: unknown, lo: number, hi: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : 0;
};

/** Validate + sanitize an incoming beat. Returns null when it should be rejected. */
export function parseHeartbeat(raw: unknown, ua: string): HeartbeatRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const unit = str(b.unit, 40, /[^a-z0-9-]/g);
  const deviceId = str(b.deviceId, 64, /[^a-z0-9-]/g);
  if (!deviceId || deviceId.length < 4) return null;
  const probe =
    b.probe === true || deviceId.startsWith("probe-") || unit === "test-probe" || !UNIT_SET.has(unit);
  // Unknown units are only accepted when explicitly marked as a probe.
  if (!UNIT_SET.has(unit) && !(b.probe === true || deviceId.startsWith("probe-") || unit === "test-probe")) {
    return null;
  }
  const s = b.screen && typeof b.screen === "object" ? (b.screen as Record<string, unknown>) : null;
  const bat = b.battery && typeof b.battery === "object" ? (b.battery as Record<string, unknown>) : null;
  return {
    unit: unit || "unknown",
    unitSource: str(b.unitSource, 12, /[^a-z]/g) || "unknown",
    deviceId,
    probe,
    version: str(b.version, 16, /[^A-Za-z0-9]/g),
    reason: str(b.reason, 16, /[^a-z]/g),
    screen: s
      ? {
          w: num(s.w, 0, 10000),
          h: num(s.h, 0, 10000),
          vw: num(s.vw, 0, 10000),
          vh: num(s.vh, 0, 10000),
          dpr: num(s.dpr, 0, 10),
          page: num(s.page, -1, 20),
        }
      : null,
    visible: str(b.visible, 12, /[^a-z]/g),
    online: b.online !== false,
    battery:
      bat && Number.isFinite(Number(bat.level))
        ? {
            level: Math.round(num(bat.level, 0, 100)),
            charging: typeof bat.charging === "boolean" ? bat.charging : null,
            src: str(bat.src, 8, /[^a-z]/g),
          }
        : null,
    fully: b.fully === true,
    uptimeSec: Math.round(num(b.uptimeSec, 0, 1e9)),
    ua: str(ua, 160, /[^A-Za-z0-9._ ;:/()+,-]/g),
    receivedAt: new Date().toISOString(),
  };
}

function pathFor(rec: HeartbeatRecord): string {
  return rec.probe ? `${PREFIX}${PROBE_DIR}/${rec.deviceId}.json` : `${PREFIX}${rec.unit}/${rec.deviceId}.json`;
}

// Per-instance write throttle so a misbehaving page can't hammer Blob writes.
const lastWrite = new Map<string, number>();
const MIN_WRITE_GAP_MS = 60 * 1000;

export async function saveHeartbeat(rec: HeartbeatRecord): Promise<{ stored: boolean; path: string }> {
  const path = pathFor(rec);
  const now = Date.now();
  const prev = lastWrite.get(path) || 0;
  if (now - prev < MIN_WRITE_GAP_MS) return { stored: false, path };
  lastWrite.set(path, now);
  if (lastWrite.size > 500) lastWrite.clear();
  await put(path, JSON.stringify(rec), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  return { stored: true, path };
}

export type DeviceStatus = {
  deviceId: string;
  unit: string;
  lastSeen: string;
  lastSeenCT: string;
  ageMinutes: number;
  status: "online" | "quiet" | "offline";
  version: string | null;
  battery: HeartbeatRecord["battery"];
  online: boolean | null;
  visible: string | null;
  unitSource: string | null;
  uptimeSec: number | null;
  screen: HeartbeatRecord["screen"];
  fully: boolean | null;
  ua: string | null;
};

export type UnitStatus = {
  unit: string;
  name: string;
  status: "online" | "quiet" | "offline";
  neverSeen: boolean;
  lastSeen: string | null;
  lastSeenCT: string | null;
  ageMinutes: number | null;
  deviceId: string | null;
  version: string | null;
  battery: HeartbeatRecord["battery"];
  unitSource: string | null;
  /** Diagnostics from the latest beat (no PII): kiosk app, screen, uptime, browser UA. */
  device: { fully: boolean | null; screen: HeartbeatRecord["screen"]; uptimeSec: number | null; online: boolean | null; visible: string | null; ua: string | null } | null;
  otherDevices: DeviceStatus[];
};

export function fmtCT(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d) + " CT"
  );
}

function classify(ageMin: number): "online" | "quiet" | "offline" {
  if (ageMin < ONLINE_MIN) return "online";
  if (ageMin <= QUIET_MIN) return "quiet";
  return "offline";
}

async function readRecord(pathname: string): Promise<HeartbeatRecord | null> {
  try {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as HeartbeatRecord;
  } catch {
    return null;
  }
}

export async function kioskStatus(now = new Date()) {
  const blobs: { pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const b of page.blobs) blobs.push({ pathname: b.pathname, uploadedAt: new Date(b.uploadedAt) });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const stale: string[] = [];
  const live = blobs.filter((b) => {
    const isProbe = b.pathname.startsWith(`${PREFIX}${PROBE_DIR}/`);
    const age = now.getTime() - b.uploadedAt.getTime();
    if (age > (isProbe ? PROBE_TTL_MS : DEVICE_TTL_MS)) {
      stale.push(b.pathname);
      return false;
    }
    return true;
  });
  if (stale.length) {
    try {
      await del(stale);
    } catch {
      /* cleanup is best-effort (del is free) */
    }
  }

  const devices: DeviceStatus[] = await Promise.all(
    live.map(async (b) => {
      const rec = await readRecord(b.pathname);
      const parts = b.pathname.slice(PREFIX.length).replace(/\.json$/, "").split("/");
      const ageMinutes = Math.max(0, Math.round(((now.getTime() - b.uploadedAt.getTime()) / 60000) * 10) / 10);
      return {
        deviceId: rec?.deviceId || parts[1] || parts[0],
        unit: rec?.unit || parts[0],
        lastSeen: b.uploadedAt.toISOString(),
        lastSeenCT: fmtCT(b.uploadedAt),
        ageMinutes,
        status: classify(ageMinutes),
        version: rec?.version || null,
        battery: rec?.battery ?? null,
        online: rec ? rec.online : null,
        visible: rec?.visible || null,
        unitSource: rec?.unitSource || null,
        uptimeSec: rec?.uptimeSec ?? null,
        screen: rec?.screen ?? null,
        fully: rec ? rec.fully : null,
        ua: rec?.ua || null,
        _probe: b.pathname.startsWith(`${PREFIX}${PROBE_DIR}/`),
      } as DeviceStatus & { _probe: boolean };
    }),
  );

  const probes = (devices as (DeviceStatus & { _probe: boolean })[])
    .filter((d) => d._probe)
    .map(({ _probe, ...d }) => { void _probe; return d; })
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  const real = (devices as (DeviceStatus & { _probe: boolean })[])
    .filter((d) => !d._probe)
    .map(({ _probe, ...d }) => { void _probe; return d; });

  const units: UnitStatus[] = KIOSK_UNITS.map((u) => {
    const mine = real.filter((d) => d.unit === u.slug).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    const top = mine[0];
    if (!top) {
      return {
        unit: u.slug, name: u.name, status: "offline", neverSeen: true,
        lastSeen: null, lastSeenCT: null, ageMinutes: null, deviceId: null,
        version: null, battery: null, unitSource: null, device: null, otherDevices: [],
      };
    }
    return {
      unit: u.slug, name: u.name, status: top.status, neverSeen: false,
      lastSeen: top.lastSeen, lastSeenCT: top.lastSeenCT, ageMinutes: top.ageMinutes,
      deviceId: top.deviceId, version: top.version, battery: top.battery,
      unitSource: top.unitSource,
      device: { fully: top.fully, screen: top.screen, uptimeSec: top.uptimeSec, online: top.online, visible: top.visible, ua: top.ua },
      otherDevices: mine.slice(1),
    };
  });

  const counts = {
    online: units.filter((u) => u.status === "online").length,
    quiet: units.filter((u) => u.status === "quiet").length,
    offline: units.filter((u) => u.status === "offline").length,
    neverSeen: units.filter((u) => u.neverSeen).length,
  };
  return {
    ok: counts.offline === 0,
    checkedAt: now.toISOString(),
    checkedAtCT: fmtCT(now),
    thresholds: { onlineUnderMinutes: ONLINE_MIN, quietUpToMinutes: QUIET_MIN },
    counts,
    units,
    probes,
    note: "Probes (test/automation beats: ?probe=, deviceId probe-*, unit test-probe) are listed separately and never count toward a unit. They auto-delete after 24h.",
  };
}
