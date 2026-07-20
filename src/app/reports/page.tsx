"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(ds: string): string {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

type ReportType = 'branson' | 'fleet';

function ReportsContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section') as ReportType | null;
  const lockedSection = (sectionParam === 'branson' || sectionParam === 'fleet') ? sectionParam : null;

  const [reports, setReports] = useState<string[]>(() => {
    const dates: string[] = [];
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dates.push(ds);
      d.setDate(d.getDate() - 1);
    }
    return dates;
  });
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportType>(lockedSection || 'branson');
  const [todayReport, setTodayReport] = useState<string>(todayStr());

  // Fallback: if today's report isn't generated yet, open the latest available
  // one instead of 404ing.
  useEffect(() => {
    fetch('/reports/manifest.json')
      .then(r => r.ok ? r.json() : null)
      .then(m => {
        if (!m) return;
        const t = todayStr();
        if (m.available && m.available.includes(t)) setTodayReport(t);
        else if (m.latest) setTodayReport(m.latest);
      })
      .catch(() => {});
  }, []);

  const reportUrl = (date: string) =>
    activeTab === 'fleet' ? `/reports/fleet-${date}.html` : `/reports/${date}.html`;

  const reportTitle = (date: string) =>
    activeTab === 'fleet' ? `${formatDate(date)} — Fleet Briefing` : `${formatDate(date)} — Branson Report`;

  const reportDesc = activeTab === 'fleet'
    ? 'STR ops, agents, BizDev, pipeline — full Hermes overview'
    : 'Fishing, shows, events, golf, dining — fresh every morning';

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0c4a6e]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#14b8a6)', color: '#fff' }}>SV</div>
            <span className="text-sm font-bold text-white">Daily Reports</span>
          </Link>
          <span className="text-[10px] text-sky-300">{todayStr()}</span>
        </div>
      </header>

      {/* Report type tabs — only show when not locked to a section */}
      {!lockedSection && (
        <div className="bg-white border-b border-sky-100">
          <div className="flex gap-1 px-4 py-2">
            {(['branson', 'fleet'] as ReportType[]).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex-1 text-[13px] font-bold py-2.5 rounded-lg border-none cursor-pointer transition-colors ${
                  activeTab === t
                    ? 'bg-[#0ea5e9] text-white'
                    : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                }`}>
                {t === 'branson' ? '🏖️ Branson' : '🛡️ Fleet'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Today's Report — big card */}
        <a href={reportUrl(todayReport)} target="_blank" rel="noopener"
          className="block rounded-xl px-4 py-5 no-underline shadow-lg"
          style={{ background: activeTab === 'fleet'
            ? 'linear-gradient(135deg,#0c4a6e,#1e3a5f)'
            : 'linear-gradient(135deg,#0ea5e9,#14b8a6)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1"
            style={{ color: activeTab === 'fleet' ? '#7dd3fc' : '#ecfeff' }}>
            {activeTab === 'fleet' ? '🛡️ Today' : '📰 Today'}
          </div>
          <div className="text-lg font-bold text-white"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            {reportTitle(todayReport)}
          </div>
          <div className="text-[12px] mt-1 text-sky-100">
            {reportDesc}
          </div>
          <div className="mt-3 text-[11px] font-semibold text-white/80">
            Tap to open →
          </div>
        </a>

        {/* Previous reports */}
        <h2 className="font-serif text-base text-[#0c4a6e] pt-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          📅 Previous Reports
        </h2>
        <div className="space-y-1">
          {reports.slice(1).map(date => (
            <a key={date} href={reportUrl(date)} target="_blank" rel="noopener"
              className="flex items-center gap-3 bg-white rounded-lg px-3.5 py-3 border border-sky-100 no-underline text-inherit hover:shadow-md hover:border-sky-200 transition-all">
              <span className="text-lg">{activeTab === 'fleet' ? '🛡️' : '📄'}</span>
              <span className="text-[13px] font-semibold text-[#0c4a6e] flex-1">{formatDate(date)}</span>
              <span className="text-sky-300 text-sm">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* Add to Home Screen tip */}
      {visible && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-[#0ea5e9] text-white rounded-xl px-4 py-3 text-center shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📲</span>
            <div className="flex-1 text-left">
              <div className="text-[12px] font-bold">Add to Home Screen</div>
              <div className="text-[10px] opacity-90">iPhone: Share → Add to Home Screen • Android: Menu → Add to Home Screen</div>
            </div>
            <button onClick={() => setVisible(false)} className="text-white/70 text-sm font-bold px-2">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <header className="sticky top-0 z-30 bg-[#0c4a6e]">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
            <span className="text-sm font-bold text-white">Daily Reports</span>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-8 text-center text-slate-500">Loading…</div>
      </main>
    }>
      <ReportsContent />
    </Suspense>
  );
}
