"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate(ds: string): string {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<string[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dates: string[] = [];
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      dates.push(ds);
      d.setDate(d.getDate() - 1);
    }
    setReports(dates);
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#2c1810]">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold" style={{ color: '#f5c842' }}>Daily Reports</span>
          </Link>
          <span className="text-[10px] text-amber-700">{todayStr()}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Today's Report — big card */}
        <a href={`/reports/${todayStr()}.html`} target="_blank" rel="noopener"
          className="block rounded-xl px-4 py-5 no-underline shadow-lg"
          style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mb-1">📰 Today</div>
          <div className="text-lg font-bold text-stone-900" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {formatDate(todayStr())} — Branson Report
          </div>
          <div className="text-[12px] text-amber-800 mt-1">Fishing, shows, events, golf, dining — fresh every morning</div>
          <div className="mt-3 text-[11px] font-semibold text-amber-800">Tap to open →</div>
        </a>

        {/* Previous reports */}
        <h2 className="font-serif text-base text-stone-700 pt-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          📅 Previous Reports
        </h2>
        <div className="space-y-1">
          {reports.slice(1).map(date => (
            <a key={date} href={`/reports/${date}.html`} target="_blank" rel="noopener"
              className="flex items-center gap-3 bg-white rounded-lg px-3.5 py-3 border border-stone-100 no-underline text-inherit hover:shadow-sm transition-shadow">
              <span className="text-lg">📄</span>
              <span className="text-[13px] font-semibold text-stone-800 flex-1">{formatDate(date)}</span>
              <span className="text-stone-300 text-sm">→</span>
            </a>
          ))}
        </div>
      </div>

      {/* Add to Home Screen tip */}
      {visible && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-amber-400 text-stone-900 rounded-xl px-4 py-3 text-center shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📲</span>
            <div className="flex-1 text-left">
              <div className="text-[12px] font-bold">Add to Home Screen</div>
              <div className="text-[10px]">iPhone: Share → Add to Home Screen • Android: Menu → Add to Home Screen</div>
            </div>
            <button onClick={() => setVisible(false)} className="text-stone-600 text-sm font-bold px-2">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}
