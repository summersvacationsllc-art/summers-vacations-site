"use client";

import { useEffect, useState } from "react";
import type { ContractSummary } from "@/lib/contracts-store";
import type { StoredContract } from "@/lib/contracts-store";

export function ContractLog() {
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(false);
  const [items, setItems] = useState<ContractSummary[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<StoredContract | null>(null);
  const [loadingId, setLoadingId] = useState("");

  async function load() {
    setError("");
    const res = await fetch("/api/contracts/log", { credentials: "include" });
    if (res.status === 401) {
      setNeedPin(true);
      setItems(null);
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not load.");
      return;
    }
    setNeedPin(false);
    setItems(data.items);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load."));
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/contracts/log/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Wrong PIN.");
      return;
    }
    setPin("");
    await load();
  }

  async function openOne(id: string) {
    setLoadingId(id);
    setError("");
    try {
      const res = await fetch(`/api/contracts/log/${encodeURIComponent(id)}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not open.");
        return;
      }
      setOpen(data.record);
    } finally {
      setLoadingId("");
    }
  }

  async function logout() {
    await fetch("/api/contracts/log/login", { method: "DELETE", credentials: "include" });
    setItems(null);
    setOpen(null);
    setNeedPin(true);
  }

  if (open) {
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
        <div className="mx-auto max-w-3xl">
          <button type="button" className="text-sm font-semibold text-[#0369a1]" onClick={() => setOpen(null)}>
            ← Back to log
          </button>
          <h1 className="mt-3 font-display text-3xl">Signed agreement</h1>
          <p className="mt-1 text-sm text-[#0369a1]">
            {open.fields.subscriberName} · {open.fields.accommodationsAddress} · logged {open.submittedAt}
          </p>
          <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-[#bae6fd] bg-white p-6 text-[15px] leading-relaxed text-[#0f172a]">
            {open.agreement}
          </pre>
          <p className="mt-4 text-xs text-[#0369a1]">
            Email copy: {open.emailVia || "not sent"}
            {open.emailError ? ` (${open.emailError})` : ""}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-4 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Print
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">mybransonvacation.com/contracts/log</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Signed agreements</h1>
        <p className="mt-3 max-w-2xl text-[#0369a1]">
          These stay in Summers Vacations storage even if the notification email is deleted. Not on the guest menu.
        </p>

        {needPin ? (
          <form onSubmit={login} className="mt-8 max-w-sm rounded-2xl border border-[#bae6fd] bg-white p-5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#0369a1]">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-white px-3 py-2 text-[#0c4a6e] outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#7dd3fc]"
            />
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
            <button type="submit" className="mt-4 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">
              Open log
            </button>
          </form>
        ) : (
          <>
            <div className="mt-4 flex gap-3 text-sm">
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => load()}>
                Refresh
              </button>
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => logout()}>
                Lock
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            {items === null ? (
              <p className="mt-8 text-[#0369a1]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="mt-8 text-[#0369a1]">No signed agreements yet.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {items.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => openOne(it.id)}
                      className="w-full rounded-2xl border border-[#bae6fd] bg-white p-4 text-left shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]"
                    >
                      <p className="font-semibold">{it.subscriberName || "(no name)"}</p>
                      <p className="text-sm text-[#0369a1]">{it.accommodationsAddress}</p>
                      <p className="mt-1 text-xs text-[#0369a1]">
                        Signed {it.signatureDate || "—"} as {it.signatureName || "—"} · {it.email} · logged{" "}
                        {it.submittedAt.slice(0, 10)}
                        {loadingId === it.id ? " · opening…" : ""}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
