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
  check_ins?: { property: string; guest: string; time?: string }[];
  check_outs?: { property: string; guest: string; time?: string }[];
  in_house?: { property: string; guest: string; check_out: string }[];
}

interface BusinessToday {
  ok?: boolean;
  date?: string;
  generated_at?: string;
  title?: string;
  actions?: string[];
  saas_bites?: { item?: string; action?: string; title?: string; status?: string }[];
  leads?: {
    date?: string;
    summary?: string;
    none_verified?: boolean;
    named?: string[];
    watch?: string[];
  };
  competitors?: {
    date?: string;
    owners_hear_first?: string;
    rows?: { name?: string; fee?: string; signal?: string; note?: string }[];
  };
  guest_experience?: { items?: { status?: string; item?: string }[] };
  guesty_sync?: { ok?: boolean; lastRun?: string; note?: string };
  monday?: {
    is_monday?: boolean;
    week_of?: string | null;
    bottom_line?: string;
    top3?: string[];
    one_liner?: string | null;
  };
  fleet_date?: string;
  guest_date?: string;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow p-5 border border-sky-100">
      {children}
    </section>
  );
}

export default function BusinessReport() {
  const [fleet, setFleet] = useState<FleetToday | null>(null);
  const [guest, setGuest] = useState<GuestToday | null>(null);
  const [biz, setBiz] = useState<BusinessToday | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/fleet-today", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/guest-today", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/business-today", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([f, g, b]) => {
        setFleet(f);
        setGuest(g);
        setBiz(b);
        if (!f && !g && !b) setErr("No report files yet");
      })
      .catch((e) => setErr(e?.message || "fetch failed"));
  }, []);

  if (err && !fleet && !guest)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6">
          Couldn’t load business report ({err}).
        </div>
      </main>
    );
  if (!fleet && !guest && !biz)
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 text-slate-500">
          Loading business report…
        </div>
      </main>
    );

  const turns = fleet?.turnovers || [];
  const unassigned = turns.filter((t) => !t.cleaner_assigned);
  const sameDay = turns.filter((t) => t.same_day);
  const h = guest?.headline || {};
  const date = biz?.date || fleet?.date || guest?.date || "";
  const monday = biz?.monday;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-[#0c4a6e]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between text-white">
          <Link href="/reports" className="text-[13px] font-semibold text-white no-underline">
            ← Reports
          </Link>
          <span className="text-[12px] text-sky-200">Business · Phone</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <div
          className="rounded-2xl p-6 shadow-lg text-white"
          style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}
        >
          <div className="text-[11px] uppercase tracking-wider opacity-90">
            Summers Vacations
          </div>
          <div className="text-2xl font-serif mt-1">Business Report</div>
          <div className="text-[13px] text-sky-100 mt-1">{date}</div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">in-house</div>
              <div className="text-2xl font-bold">
                {h.in_house_units ?? "—"}/{h.units_total ?? fleet?.units_total ?? "—"}
              </div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">turnovers</div>
              <div className="text-2xl font-bold">{h.turnovers ?? turns.length}</div>
            </div>
            <div className="bg-white/15 rounded-xl p-2">
              <div className="text-[10px] uppercase">same-day</div>
              <div className="text-2xl font-bold text-orange-200">
                {h.same_day_turnovers ?? sameDay.length}
              </div>
            </div>
          </div>
        </div>

        {biz?.actions && biz.actions.length > 0 && (
          <Card>
            <h2 className="font-serif text-lg text-[#0c4a6e]">Today’s board</h2>
            <ol className="mt-3 space-y-2 text-[14px] text-slate-800 list-decimal pl-5">
              {biz.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ol>
          </Card>
        )}

        {unassigned.length > 0 && (
          <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-5">
            <div className="inline-block bg-orange-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
              Cleaners unassigned
            </div>
            <h2 className="font-serif text-lg text-orange-900 mt-2">
              {unassigned.length} of {turns.length} turnovers waiting on a cleaner
            </h2>
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

        <Card>
          <h2 className="font-serif text-lg text-[#0c4a6e]">Fleet</h2>
          <div className="text-[12px] text-slate-500 mt-1">
            Check-ins {h.check_ins ?? "—"} · Check-outs {h.check_outs ?? "—"}
          </div>
          {(guest?.check_ins || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase text-sky-700">Arrivals</div>
              <ul className="mt-1 space-y-1 text-[14px]">
                {guest!.check_ins!.map((c, i) => (
                  <li key={i}>
                    <strong>{c.property}</strong> · {c.guest} {c.time ? `· ${c.time}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(guest?.check_outs || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase text-sky-700">Departures</div>
              <ul className="mt-1 space-y-1 text-[14px]">
                {guest!.check_outs!.map((c, i) => (
                  <li key={i}>
                    <strong>{c.property}</strong> · {c.guest} {c.time ? `· ${c.time}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {turns.length === 0 && (
            <p className="mt-3 text-[14px] text-slate-600">No turnovers scheduled in this snapshot.</p>
          )}
          {turns.length > 0 && (
            <ul className="mt-3 space-y-2 text-[14px]">
              {turns.map((t, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-slate-100 px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <strong>{t.property}</strong>
                  </div>
                  <div className="text-right text-[12px]">
                    <div>
                      {t.checkout} → {t.next_checkin}
                    </div>
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
          )}
          {(guest?.in_house || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-semibold uppercase text-sky-700">In house</div>
              <ul className="mt-1 space-y-1 text-[14px]">
                {guest!.in_house!.map((c, i) => (
                  <li key={i}>
                    <strong>{c.property}</strong> · {c.guest} · out {c.check_out}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {monday && (
          <Card>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
              Monday
            </div>
            <h2 className="font-serif text-lg text-[#0c4a6e] mt-1">Weekly rollup</h2>
            <div className="text-[12px] text-slate-500">
              Week of {monday.week_of || "—"}
              {monday.is_monday ? " · today is Monday" : ""}
            </div>
            {monday.one_liner && (
              <p className="mt-3 text-[14px] font-semibold text-slate-800">{monday.one_liner}</p>
            )}
            {monday.bottom_line && (
              <p className="mt-2 text-[13px] text-slate-700 leading-relaxed">{monday.bottom_line}</p>
            )}
            {(monday.top3 || []).length > 0 && (
              <ol className="mt-3 space-y-2 text-[13px] list-decimal pl-5 text-slate-800">
                {monday.top3!.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ol>
            )}
          </Card>
        )}

        {(biz?.saas_bites || []).length > 0 && (
          <Card>
            <h2 className="font-serif text-lg text-[#0c4a6e]">SaaS board</h2>
            <p className="text-[12px] text-slate-500">Cleaners app — today’s bites only</p>
            <ul className="mt-3 space-y-2 text-[14px]">
              {biz!.saas_bites!.map((b, i) => (
                <li key={i} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase font-semibold text-sky-700">{b.status}</div>
                  <div className="font-semibold">{b.title || b.item}</div>
                  <div className="text-[13px] text-slate-600">{b.action}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {biz?.leads && (
          <Card>
            <h2 className="font-serif text-lg text-[#0c4a6e]">Owner leads</h2>
            <div className="text-[12px] text-slate-500">Last hunt {biz.leads.date || "—"}</div>
            {(biz.leads.named || []).map((n, i) => (
              <p key={i} className="mt-2 text-[14px] font-semibold text-slate-800">
                LIVE · {n}
              </p>
            ))}
            {(biz.leads.watch || []).map((n, i) => (
              <p key={i} className="mt-2 text-[14px] text-slate-800">
                WATCH · {n}
              </p>
            ))}
            <p className="mt-2 text-[13px] text-slate-700">{biz.leads.summary}</p>
            <p className="mt-2 text-[12px] text-amber-800">
              Private FB groups and Messenger are invisible to Google. Paste a post to file it.
            </p>
          </Card>
        )}

        {biz?.competitors?.rows && biz.competitors.rows.length > 0 && (
          <Card>
            <h2 className="font-serif text-lg text-[#0c4a6e]">Competitors</h2>
            <p className="text-[12px] text-slate-500 mt-1">{biz.competitors.owners_hear_first}</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              {biz.competitors.rows.map((r, i) => (
                <li key={i} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="font-semibold text-[#0c4a6e]">{r.name}</div>
                  <div>{r.fee} · {r.signal}</div>
                  <div className="text-slate-500">{r.note}</div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">Fees marked VERIFY are not public. Summers: 15% + $50/mo tech.</p>
          </Card>
        )}

        {biz?.guest_experience?.items && (
          <Card>
            <h2 className="font-serif text-lg text-[#0c4a6e]">Guest experience</h2>
            <p className="text-[12px] text-slate-500">Standing enhancement board — always looking</p>
            <ul className="mt-3 space-y-2 text-[14px]">
              {biz.guest_experience.items.map((it, i) => (
                <li key={i} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="text-[10px] uppercase font-semibold text-sky-700">{it.status}</div>
                  {it.item}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {biz?.guesty_sync && (
          <p className="text-[10px] text-slate-400 text-center">
            Guesty lastRun {biz.guesty_sync.lastRun || "—"} · {biz.guesty_sync.note}
          </p>
        )}

        <p className="text-[10px] text-slate-400 text-center pb-6">
          {fleet?.sync_status || "Live snapshots"} · guest {biz?.guest_date || guest?.date} · fleet{" "}
          {biz?.fleet_date || fleet?.date}
        </p>
      </div>
    </main>
  );
}
