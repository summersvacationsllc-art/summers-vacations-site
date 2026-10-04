"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Battery = { level: number; charging: boolean | null; src: string } | null;
type Device = {
  deviceId: string;
  unit: string;
  lastSeenCT: string;
  ageMinutes: number;
  status: "online" | "quiet" | "offline";
  version: string | null;
  battery: Battery;
  unitSource: string | null;
};
type Unit = {
  unit: string;
  name: string;
  status: "online" | "quiet" | "offline";
  neverSeen: boolean;
  lastSeenCT: string | null;
  ageMinutes: number | null;
  deviceId: string | null;
  version: string | null;
  battery: Battery;
  unitSource: string | null;
  device: { fully: boolean | null; screen: { w: number; h: number } | null; uptimeSec: number | null } | null;
  otherDevices: Device[];
};
type Status = {
  ok: boolean;
  checkedAtCT: string;
  counts: { online: number; quiet: number; offline: number; neverSeen: number };
  units: Unit[];
  probes: Device[];
};

const BADGE: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-800",
  quiet: "bg-amber-100 text-amber-800",
  offline: "bg-rose-100 text-rose-800",
};

function ago(min: number | null): string {
  if (min == null) return "";
  if (min < 1) return "just now";
  if (min < 60) return `${Math.round(min)} min ago`;
  if (min < 48 * 60) return `${Math.round(min / 6) / 10} h ago`;
  return `${Math.round(min / 1440)} d ago`;
}

function dev(u: Unit): string {
  const d = u.device;
  if (!d) return "";
  const parts: string[] = [];
  if (d.fully != null) parts.push(d.fully ? "Fully Kiosk" : "browser");
  if (d.screen?.w) parts.push(`${d.screen.w}×${d.screen.h}`);
  if (d.uptimeSec != null) parts.push(`page up ${d.uptimeSec < 3600 ? Math.round(d.uptimeSec / 60) + " min" : Math.round(d.uptimeSec / 360) / 10 + " h"}`);
  return parts.join(" · ");
}

function bat(b: Battery): string {
  if (!b) return "—";
  return `${b.level}%${b.charging ? " ⚡" : ""}`;
}

export default function KioskStatusView() {
  const [data, setData] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/kiosk-status", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setErr(null); })
      .catch((e) => setErr(e?.message || "fetch failed"));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <main className="min-h-screen bg-sky-50">
      <header className="sticky top-0 z-30 bg-[#0c4a6e]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between text-white">
          <Link href="/reports" className="text-[13px] font-semibold no-underline text-white">
            ← Reports
          </Link>
          <span className="text-[12px] text-sky-200">Kiosk tablets · Live</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {err && (
          <div className="bg-white rounded-2xl shadow p-4 text-rose-700 text-sm">
            Couldn’t load kiosk status ({err}). Retrying every minute.
          </div>
        )}
        {!data && !err && (
          <div className="bg-white rounded-2xl shadow p-6 text-slate-500">Loading kiosk check-ins…</div>
        )}
        {data && (
          <>
            <section className="bg-white rounded-2xl shadow p-4">
              <h1 className="text-lg font-bold text-slate-800">Kiosk tablet check-ins</h1>
              <p className="text-[13px] text-slate-500 mt-1">
                Checked {data.checkedAtCT} · {data.counts.online} online · {data.counts.quiet} quiet ·{" "}
                {data.counts.offline} offline{data.counts.neverSeen ? ` (${data.counts.neverSeen} never seen)` : ""}
              </p>
              <p className="text-[12px] text-slate-400 mt-1">
                Tablets check in every ~3 min. Online &lt; 10 min · Quiet 10–60 min · Offline &gt; 60 min or never seen.
              </p>
            </section>

            <section className="bg-white rounded-2xl shadow overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Last seen (CT)</th>
                    <th className="px-3 py-2">Battery</th>
                    <th className="px-3 py-2 hidden sm:table-cell">Version</th>
                  </tr>
                </thead>
                <tbody>
                  {data.units.map((u) => (
                    <tr key={u.unit} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {u.deviceId ? `device ${u.deviceId.slice(0, 8)}` : u.unit}
                          {u.unitSource && u.unitSource !== "url" ? ` · unit from ${u.unitSource}` : ""}
                          {u.otherDevices.length ? ` · +${u.otherDevices.length} older device(s)` : ""}
                        </div>
                        {u.device && <div className="text-[11px] text-slate-400">{dev(u)}</div>}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${BADGE[u.status]}`}>
                          {u.neverSeen ? "never seen" : u.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {u.lastSeenCT ? (
                          <>
                            {u.lastSeenCT.replace(/ CT$/, "")}
                            <div className="text-[11px] text-slate-400">{ago(u.ageMinutes)}</div>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{bat(u.battery)}</td>
                      <td className="px-3 py-2 text-slate-500 hidden sm:table-cell font-mono text-[12px]">
                        {u.version || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {data.probes.length > 0 && (
              <section className="bg-white rounded-2xl shadow p-4">
                <h2 className="text-[13px] font-semibold text-slate-600">Test probes (excluded from unit status)</h2>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-500">
                  {data.probes.map((p) => (
                    <li key={p.deviceId}>
                      <span className="font-mono">{p.deviceId}</span> · unit {p.unit} · {p.lastSeenCT} ({ago(p.ageMinutes)})
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-slate-400">Probe records auto-delete after 24 h.</p>
              </section>
            )}

            <p className="text-[11px] text-slate-400 px-1">
              JSON: <a className="underline" href="/api/kiosk-status">/api/kiosk-status</a> · uptime monitors:{" "}
              <a className="underline" href="/api/kiosk-status?strict=1">/api/kiosk-status?strict=1</a> (503 if any unit offline)
            </p>
          </>
        )}
      </div>
    </main>
  );
}
