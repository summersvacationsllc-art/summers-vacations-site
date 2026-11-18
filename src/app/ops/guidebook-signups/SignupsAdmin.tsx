"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string; at: string; atCT: string; unit: string; name: string; phone: string; confirmationCode: string; linkCheckin?: string; linkCheckout?: string; matchBy?: string;
  consent: boolean; mode: string; result: string; review: boolean; reviewNote?: string;
};

export function SignupsAdmin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [env, setEnv] = useState("");
  const [tab, setTab] = useState<"review" | "all">("review");

  const load = useCallback(async () => {
    const r = await fetch("/api/guidebook-gate/admin", { cache: "no-store" });
    if (r.status === 401) { setAuthed(false); return; }
    const d = await r.json();
    if (d.ok) { setRows(d.rows); setEnv(d.env); setAuthed(true); } else setErr(d.error || "Could not load.");
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/guidebook-gate/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    if (!r.ok) { setErr("Wrong PIN."); return; }
    setPin("");
    await load();
  }

  if (authed === null) return <p style={{ padding: 24 }}>Loading…</p>;
  if (!authed) {
    return (
      <form onSubmit={login} style={{ maxWidth: 320, margin: "80px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 20 }}>Guidebook signups</h1>
        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN" autoFocus
          style={{ width: "100%", padding: 10, fontSize: 16, margin: "12px 0", border: "1px solid #bbb", borderRadius: 8 }} />
        <button type="submit" style={{ padding: "10px 16px", fontSize: 16, borderRadius: 8, border: 0, background: "#0369a1", color: "#fff" }}>Sign in</button>
        {err && <p style={{ color: "#b91c1c" }}>{err}</p>}
      </form>
    );
  }
  const shown = tab === "review" ? rows.filter((r) => r.review) : rows;
  const th = { textAlign: "left" as const, padding: "6px 8px", borderBottom: "2px solid #ddd", whiteSpace: "nowrap" as const };
  const td = { padding: "6px 8px", borderBottom: "1px solid #eee", verticalAlign: "top" as const };
  return (
    <div style={{ padding: 16, fontFamily: "system-ui", fontSize: 14 }}>
      <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Guidebook signups <small style={{ color: "#666" }}>({env})</small></h1>
      <p style={{ color: "#555", marginTop: 0 }}>Promotions list only. Do not text anyone without their consent box ticked.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 12px" }}>
        <button onClick={() => setTab("review")} style={{ fontWeight: tab === "review" ? 700 : 400 }}>Review list ({rows.filter((r) => r.review).length})</button>
        <button onClick={() => setTab("all")} style={{ fontWeight: tab === "all" ? 700 : 400 }}>All submissions ({rows.length})</button>
        <a href="/api/guidebook-gate/admin?format=csv">Download CSV (all)</a>
        <a href="/api/guidebook-gate/admin?format=csv&only=review">CSV (review only)</a>
        <button onClick={() => void load()}>Refresh</button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 900 }}>
          <thead><tr>{["When", "Unit", "Name", "Phone", "Code (from reservation)", "Link dates", "Promo OK", "Form", "Result", "Note"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} style={r.review ? { background: "#fff7ed" } : undefined}>
                <td style={td}>{r.atCT}</td><td style={td}>{r.unit}</td><td style={td}>{r.name}</td><td style={td}>{r.phone}</td>
                <td style={td}>{r.confirmationCode || "—"}</td>
                <td style={td}>{r.linkCheckin ? `${r.linkCheckin} → ${r.linkCheckout}` : "none (name + window)"}</td><td style={td}>{r.consent ? "yes" : "no"}</td>
                <td style={td}>{r.mode === "airbnb-optional" ? "Airbnb optional" : "required"}</td>
                <td style={td}>{r.result}</td><td style={td}>{r.reviewNote || ""}</td>
              </tr>
            ))}
            {!shown.length && <tr><td style={td} colSpan={10}>Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
