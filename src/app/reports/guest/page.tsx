"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface GuestToday {
  date: string;
  generated_at?: string;
  headline?: {
    check_ins?: number;
    check_outs?: number;
    turnovers?: number;
    same_day_turnovers?: number;
    in_house_units?: number;
    units_total?: number;
  };
  check_ins?: { property: string; guest: string; time?: string; guests?: number; platform?: string }[];
  check_outs?: { property: string; guest: string; time?: string; guests?: number; platform?: string }[];
  in_house?: { property: string; guest: string; check_in: string; check_out: string; guests?: number; platform?: string; nights?: number }[];
  turnovers?: { property: string; checkout_time?: string; next_checkin?: string; status: string; same_day: boolean; cleaner_assigned: boolean; cleaner_note?: string }[];
  sync_notes?: { cleaner_app?: string; guesty_window?: string };
}

function Plat(p: string) {
  const s = (p || "").toLowerCase();
  if (s.includes("airbnb")) return "🏖️ Airbnb";
  if (s.includes("vrbo")) return "🏖️ Vrbo";
  if (s.includes("website") || s.includes("direct")) return "🔗 Direct";
  return "🏖️ OTA";
}

export default function GuestOps() {
  const [data, setData] = useState<GuestToday | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guest-today", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e?.message || "fetch failed"));
  }, []);

  if (err)
    return (
      <main className="min-h-screen bg-sky-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 text-slate-700">
          <p>Couldn’t load live ops ({err}). Try again in a moment.</p>
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="min-h-screen bg-sky-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 text-slate-500">
          Loading live ops…
        </div>
      </main>
    );

  const h = data.headline || {};
  const unassigned = (data.turnovers || []).filter((t) => !t.cleaner_assigned);
  const inHouse = (data.in_house || []).slice().sort((a, b) =>
    a.property.localeCompare(b.property),
  );

  return (
    <main className="min-h-screen bg-sky-50">
      <header className="sticky top-0 z-30 bg-[#0c4a6e]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between text-white">
          <Link href="/reports" className="text-[13px] font-semibold no-underline text-white">
            ← Reports
          </Link>
          <span className="text-[12px] text-sky-200">Guest Ops · Live</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div
          className="rounded-2xl p-6 shadow-lg text-white"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}
        >
          <div className="text-[11px] uppercase tracking-wider opacity-90">
            🛏️ Live Operations — Guesty Pro
          </div>
          <div className="text-2xl font-serif mt-1">{data.date}</div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">check-ins</div>
              <div className="text-2xl font-bold">{h.check_ins ?? 0}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">check-outs</div>
              <div className="text-2xl font-bold">{h.check_outs ?? 0}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">turnovers</div>
              <div className="text-2xl font-bold">{h.turnovers ?? 0}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">same-day</div>
              <div className="text-2xl font-bold text-orange-200">
                {h.same_day_turnovers ?? 0}
              </div>
            </div>
            <div className="bg-white/15 rounded-xl p-2 col-span-2">
              <div className="text-[10px] uppercase">in-house units</div>
              <div className="text-2xl font-bold">
                {h.in_house_units ?? 0} / {h.units_total ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {unassigned.length > 0 && (
          <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
            <div className="inline-block bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Cleaner-app sync wanted
            </div>
            <h2 className="font-serif text-lg text-orange-900 mt-2">
              {unassigned.length} turnover{unassigned.length > 1 ? "s" : ""} have
              no cleaner assigned
            </h2>
            <ul className="mt-2 space-y-1.5 text-[14px] text-orange-900">
              {unassigned.map((t, i) => (
                <li key={i}>
                  <strong>{t.property}</strong> — checkout {t.checkout_time} →{" "}
                  {t.next_checkin} — <em>{t.cleaner_note}</em>
                </li>
              ))}
            </ul>
            <a
              href="https://str-manager-one.vercel.app/ops"
              target="_blank"
              rel="noopener"
              className="inline-block mt-3 bg-orange-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg no-underline"
            >
              Open cleaners app →
            </a>
          </div>
        )}

        {(data.check_ins || []).length > 0 && (
          <section className="bg-white rounded-2xl shadow p-5 border border-sky-100">
            <h2 className="font-serif text-lg text-[#0c4a6e]">Check-ins today</h2>
            <ul className="mt-2 space-y-1 text-[14px]">
              {data.check_ins!.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    <strong>{r.property}</strong> · {r.guest}
                    {r.guests ? ` · ${r.guests} guests` : ""}
                  </span>
                  <span className="text-sky-700">
                    {r.time} · {Plat(r.platform || "")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(data.check_outs || []).length > 0 && (
          <section className="bg-white rounded-2xl shadow p-5 border border-sky-100">
            <h2 className="font-serif text-lg text-[#0c4a6e]">Check-outs today</h2>
            <ul className="mt-2 space-y-1 text-[14px]">
              {data.check_outs!.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    <strong>{r.property}</strong> · {r.guest}
                    {r.guests ? ` · ${r.guests} guests` : ""}
                  </span>
                  <span className="text-sky-700">
                    {r.time} · {Plat(r.platform || "")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {inHouse.length > 0 && (
          <section className="bg-white rounded-2xl shadow p-5 border border-sky-100">
            <h2 className="font-serif text-lg text-[#0c4a6e]">In-house tonight</h2>
            <ul className="mt-2 space-y-1.5 text-[14px]">
              {inHouse.map((r, i) => (
                <li key={i}>
                  <strong>{r.property}</strong> — {r.guest}
                  {r.nights != null ? ` · ${r.nights}n` : ""} · {Plat(r.platform || "")}
                  <div className="text-[11px] text-slate-500">
                    {r.check_in} → {r.check_out}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-[10px] text-slate-400 text-center">
          Live from Guesty Pro via str-manager-one · updated{" "}
          {data.generated_at?.replace("T", " ").slice(0, 16)} CT
        </p>
      </div>
    </main>
  );
}
