"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FleetToday {
  date: string;
  units_total?: number;
  sync_status?: string;
  turnovers?: {
    property: string;
    checkout?: string;
    next_checkin?: string;
    status: string;
    same_day: boolean;
    cleaner_assigned: boolean;
    reservation_id?: string;
  }[];
}

export default function FleetLive() {
  const [data, setData] = useState<FleetToday | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fleet-today", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e?.message || "fetch failed"));
  }, []);

  if (err)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6">
          Couldn’t load fleet ({err}).
        </div>
      </main>
    );
  if (!data)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 text-slate-500">
          Loading fleet…
        </div>
      </main>
    );

  const turns = data.turnovers || [];
  const unassigned = turns.filter((t) => !t.cleaner_assigned);
  const sameDay = turns.filter((t) => t.same_day);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-[#0c4a6e]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between text-white">
          <Link href="/reports" className="text-[13px] font-semibold text-white no-underline">
            ← Reports
          </Link>
          <span className="text-[12px] text-sky-200">Fleet · Live</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div
          className="rounded-2xl p-6 shadow-lg text-white"
          style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}
        >
          <div className="text-[11px] uppercase tracking-wider opacity-90">
            🛡️ Fleet Ops — Live from Guesty
          </div>
          <div className="text-2xl font-serif mt-1">{data.date}</div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">portfolio</div>
              <div className="text-2xl font-bold">{data.units_total ?? "—"} units</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">turnovers</div>
              <div className="text-2xl font-bold">{turns.length}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">same-day</div>
              <div className="text-2xl font-bold text-orange-200">
                {sameDay.length}
              </div>
            </div>
          </div>
        </div>

        {unassigned.length > 0 && (
          <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
            <div className="inline-block bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Cleaners unassigned
            </div>
            <h2 className="font-serif text-lg text-orange-900 mt-2">
              {unassigned.length} of {turns.length} turnovers waiting on a cleaner
            </h2>
            <ul className="mt-2 space-y-1 text-[14px] text-orange-900">
              {unassigned.map((t, i) => (
                <li key={i}>
                  <strong>{t.property}</strong> · checkout {t.checkout} →{" "}
                  {t.next_checkin} · {t.status}
                </li>
              ))}
            </ul>
            <a
              href="https://str-manager-one.vercel.app/ops"
              target="_blank"
              rel="noopener"
              className="inline-block mt-3 bg-orange-700 text-white text-[13px] font-semibold px-4 py-2 rounded-lg no-underline"
            >
              Assign in cleaners app →
            </a>
          </div>
        )}

        <section className="bg-white rounded-2xl shadow p-5 border border-slate-200">
          <h2 className="font-serif text-lg text-[#0c4a6e]">Today’s turnovers</h2>
          <ul className="mt-3 space-y-2 text-[14px]">
            {turns.map((t, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-100 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <strong>{t.property}</strong>
                  <div className="text-[11px] text-slate-500">
                    res {(t.reservation_id || "").slice(-6)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px]">{t.checkout} → {t.next_checkin}</div>
                  <div
                    className="text-[10px] font-semibold mt-0.5"
                    style={{ color: t.cleaner_assigned ? "#16a34a" : "#ea580c" }}
                  >
                    {t.cleaner_assigned ? "CLEANER ASSIGNED" : "CLEANER UNASSIGNED"}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-[10px] text-slate-400 text-center">
          {data.sync_status} · updated{" "}
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} CT
        </p>
      </div>
    </main>
  );
}
