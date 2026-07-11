"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────
type Direction = "in" | "out";

interface ScanEntry {
  id: string;
  barcode: string;
  property: string;
  direction: Direction;
  timestamp: string;
}

const LS_KEY = "supply-scans";

// ── Property list (synced with homepage) ───────────────
const PROPERTIES = [
  "The Penthouse",
  "Rustic Ozark Retreat",
  "Woodland Retreat",
  "Modern Charmer",
  "Pretty Peacock",
  "Double Condo",
  "Branson Family Haven",
];

// ── Helpers ────────────────────────────────────────────
function loadScans(): ScanEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScans(entries: ScanEntry[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

function ts(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Page ───────────────────────────────────────────────
export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [property, setProperty] = useState(PROPERTIES[0]);
  const [direction, setDirection] = useState<Direction>("out");
  const [scans, setScans] = useState<ScanEntry[]>(() => loadScans());
  const [flash, setFlash] = useState<string | null>(null); // last scan feedback
  const [error, setError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const initAttempted = useRef(false);

  // Init scanner once component mounts (client-only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initAttempted.current) return;
    initAttempted.current = true;
    scannerRef.current = new Html5Qrcode("qr-reader");
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  // ── Start scanning ──────────────────────────────────
  const startScanning = useCallback(async () => {
    if (!scannerRef.current) return;
    setError(null);
    try {
      await scannerRef.current.start(
        { facingMode: "environment" }, // rear camera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          // on scan success
          const entry: ScanEntry = {
            id: crypto.randomUUID(),
            barcode: decodedText,
            property,
            direction,
            timestamp: ts(),
          };
          setScans((prev) => {
            const next = [entry, ...prev];
            saveScans(next);
            return next;
          });
          setFlash(decodedText);
          // vibrate briefly on mobile
          navigator.vibrate?.(100);
          // clear flash after 1.5s
          setTimeout(() => setFlash(null), 1500);
        },
        () => {
          // on scan error (quiet — happens constantly with no barcode in frame)
        }
      );
      setScanning(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Camera access denied or unavailable");
    }
  }, [property, direction]);

  // ── Stop scanning ───────────────────────────────────
  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch {}
    setScanning(false);
  }, []);

  // ── Delete a scan ───────────────────────────────────
  const deleteScan = (id: string) => {
    setScans((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveScans(next);
      return next;
    });
  };

  // ── Export CSV ──────────────────────────────────────
  const exportCSV = () => {
    const header = "Barcode,Property,Direction,Timestamp";
    const rows = scans.map(
      (s) => `"${s.barcode}","${s.property}","${s.direction}","${s.timestamp}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `supply-scans-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Clear all ───────────────────────────────────────
  const clearAll = () => {
    if (!confirm("Delete all scan history?")) return;
    setScans([]);
    saveScans([]);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-stone-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 no-underline text-stone-800"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold"
              style={{
                background: "linear-gradient(135deg,#f5c842,#e8b832)",
                color: "#2c1810",
              }}
            >
              SV
            </div>
            <span className="text-sm font-bold">Supply Scanner</span>
          </Link>
          <span className="text-[10px] text-stone-400">
            {scans.length} scan{scans.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* ── Controls ────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
          {/* Property picker */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
              Property
            </label>
            <select
              value={property}
              onChange={(e) => setProperty(e.target.value)}
              disabled={scanning}
              className="w-full mt-1 px-3 py-2.5 rounded-lg border border-stone-200 text-sm bg-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
            >
              {PROPERTIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Direction toggle */}
          <div>
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">
              Direction
            </label>
            <div className="flex gap-2 mt-1">
              {(["out", "in"] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  disabled={scanning}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 ${
                    direction === d
                      ? d === "out"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-green-50 border-green-300 text-green-700"
                      : "bg-white border-stone-200 text-stone-500"
                  }`}
                >
                  {d === "out" ? "📤 Using / Restocking" : "📥 Receiving / Buying"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Camera Viewfinder ───────────────────────── */}
        <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
          {/* Viewfinder */}
          <div
            id="qr-reader"
            className="aspect-[4/3] w-full"
          />

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
              <span className="text-2xl mb-2">📷</span>
              <p className="text-sm font-semibold mb-1">Camera Unavailable</p>
              <p className="text-xs text-white/70 mb-3">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  startScanning();
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-stone-900 text-sm font-semibold"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Scan feedback flash */}
          {flash && (
            <div className="absolute bottom-4 left-4 right-4 bg-amber-400 text-stone-900 rounded-lg px-4 py-2.5 text-sm font-bold text-center animate-pulse shadow-lg">
              ✅ Scanned: {flash}
            </div>
          )}

          {/* Start/Stop button overlay */}
          {!error && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={scanning ? stopScanning : startScanning}
                className={`px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  scanning
                    ? "bg-red-500 text-white"
                    : "bg-amber-400 text-stone-900"
                }`}
              >
                {scanning ? "⏹ Stop" : "📷 Start Scanning"}
              </button>
            </div>
          )}
        </div>

        {/* ── Scan History ────────────────────────────── */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-stone-100">
            <h2 className="text-sm font-bold text-stone-700">Scan History</h2>
            <div className="flex gap-2">
              <button
                onClick={exportCSV}
                disabled={scans.length === 0}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40"
              >
                📥 Export CSV
              </button>
              <button
                onClick={clearAll}
                disabled={scans.length === 0}
                className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
              >
                🗑 Clear
              </button>
            </div>
          </div>

          {scans.length === 0 ? (
            <div className="px-4 py-10 text-center text-stone-400 text-sm">
              <div className="text-3xl mb-2">📱</div>
              <p className="font-semibold">No scans yet</p>
              <p className="text-xs mt-1">
                Start scanning barcodes on your supplies
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-50 max-h-96 overflow-y-auto">
              {scans.map((scan) => (
                <li
                  key={scan.id}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-stone-50 transition-colors"
                >
                  {/* Direction icon */}
                  <span className="text-lg mt-0.5 flex-shrink-0">
                    {scan.direction === "out" ? "📤" : "📥"}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-stone-800 truncate">
                      {scan.barcode}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        {scan.property}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {scan.timestamp}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteScan(scan.id)}
                    className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                    aria-label="Delete scan"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
