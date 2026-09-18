"use client";

import { useEffect, useState } from "react";
import type { ContractSummary, StoredContract } from "@/lib/contracts-store";
import type { OwnerInquiry } from "@/lib/owner-inquiries";
import { notifyBrianFromBrowser } from "@/lib/browser-mail";

export function ContractLog() {
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(false);
  const [tab, setTab] = useState<"inquiries" | "signed">("inquiries");
  const [inquiries, setInquiries] = useState<OwnerInquiry[] | null>(null);
  const [contracts, setContracts] = useState<ContractSummary[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<StoredContract | null>(null);
  const [openInq, setOpenInq] = useState<OwnerInquiry | null>(null);
  const [copied, setCopied] = useState("");
  const [mailNote, setMailNote] = useState("");
  const [direct, setDirect] = useState({ name: "", email: "", phone: "", address: "" });

  async function load() {
    setError("");
    const res = await fetch("/api/contracts/log", { credentials: "include" });
    if (res.status === 401) {
      setNeedPin(true);
      setInquiries(null);
      setContracts(null);
      return;
    }
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not load.");
      return;
    }
    setNeedPin(false);
    setInquiries(data.inquiries);
    setContracts(data.contracts);
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
    setError("");
    const res = await fetch(`/api/contracts/log/${encodeURIComponent(id)}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not open.");
      return;
    }
    setOpen(data.record);
  }

  async function logout() {
    await fetch("/api/contracts/log/login", { method: "DELETE", credentials: "include" });
    setInquiries(null);
    setContracts(null);
    setOpen(null);
    setOpenInq(null);
    setNeedPin(true);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
  }

  async function approve(id: string) {
    setError("");
    const res = await fetch(`/api/owner-inquiries/${encodeURIComponent(id)}/invite`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not approve.");
      return;
    }
    await copyUrl(data.url);
    await notifyBrianFromBrowser({
      subject: `Contract approved: ${openInq?.name || ""} — ${openInq?.address || ""}`,
      replyTo: openInq?.email,
      message: [
        data.emailed
          ? `The agreement link was emailed to ${openInq?.email}.`
          : `Could not email the owner from the server. Mail.app pump will send it from this Mac.`,
        "",
        data.url,
        "",
        "Open: https://mybransonvacation.com/contracts/log",
      ].join("\n"),
    });
    setMailNote(
      data.emailed
        ? `Emailed the contract link to ${openInq?.email || "the owner"}. Link also copied.`
        : `Link copied. Could not email the owner${data.emailError ? `: ${data.emailError}` : "."}`,
    );
    await load();
    setOpenInq((cur) =>
      cur && cur.id === id
        ? {
            ...cur,
            status: "approved",
            inviteToken: data.token,
            inviteEmailedAt: data.emailed ? new Date().toISOString() : null,
            inviteEmailError: data.emailed ? null : data.emailError || "email failed",
          }
        : cur,
    );
  }

  async function decline(id: string) {
    setError("");
    const res = await fetch(`/api/owner-inquiries/${encodeURIComponent(id)}/decline`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "" }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not decline.");
      return;
    }
    await load();
    setOpenInq(null);
  }

  async function directInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/owner-inquiries/direct-invite", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(direct),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setError(data.error || "Could not create invite.");
      return;
    }
    await copyUrl(data.url);
    await notifyBrianFromBrowser({
      subject: `Contract link created: ${direct.name} — ${direct.address}`,
      replyTo: direct.email,
      message: [
        data.emailed
          ? `The agreement link was emailed to ${direct.email}.`
          : `Could not email the owner from the server. Mail.app pump will send it from this Mac.`,
        "",
        data.url,
      ].join("\n"),
    });
    setMailNote(
      data.emailed
        ? `Emailed the contract link to ${direct.email}. Link also copied.`
        : `Link copied. Could not email the owner${data.emailError ? `: ${data.emailError}` : "."}`,
    );
    setDirect({ name: "", email: "", phone: "", address: "" });
  }

  if (open) {
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
        <div className="mx-auto max-w-3xl">
          <button type="button" className="text-sm font-semibold text-[#0369a1]" onClick={() => setOpen(null)}>
            ← Back
          </button>
          <h1 className="mt-3 font-display text-3xl">Signed agreement</h1>
          <p className="mt-1 text-sm text-[#0369a1]">
            {open.fields.subscriberName} · {open.fields.accommodationsAddress}
          </p>
          <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-[#bae6fd] bg-white p-6 text-[15px] leading-relaxed">
            {open.agreement}
          </pre>
          <button type="button" onClick={() => window.print()} className="mt-4 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">
            Print
          </button>
        </div>
      </main>
    );
  }

  if (openInq) {
    const url = openInq.inviteToken
      ? `https://mybransonvacation.com/contracts?invite=${openInq.inviteToken}`
      : "";
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
        <div className="mx-auto max-w-3xl">
          <button type="button" className="text-sm font-semibold text-[#0369a1]" onClick={() => setOpenInq(null)}>
            ← Back
          </button>
          <h1 className="mt-3 font-display text-3xl">{openInq.name}</h1>
          <p className="mt-1 text-sm text-[#0369a1]">
            {openInq.area ? `${openInq.area} · ` : ""}
            {openInq.address} · {openInq.source === "met" ? "already met" : "website"} · {openInq.status}
          </p>
          <p className="mt-3 text-sm">
            {openInq.email} · {openInq.phone || "no phone"}
          </p>
          {openInq.listingUrl ? (
            <p className="mt-2 text-sm">
              <a className="font-semibold text-[#0369a1] underline" href={openInq.listingUrl} target="_blank" rel="noreferrer">
                Listing link
              </a>
            </p>
          ) : null}
          <p className="mt-2 text-sm text-[#0369a1]">
            Sleeps {openInq.sleeps || "—"} · Beds {openInq.beds || "—"}
          </p>
          {openInq.notes ? <p className="mt-4 whitespace-pre-wrap rounded-xl border border-[#bae6fd] bg-white p-4 text-sm">{openInq.notes}</p> : null}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {openInq.photoPathnames.map((p) => (
              <img
                key={p}
                alt=""
                src={`/api/contracts/log/photo?path=${encodeURIComponent(p)}`}
                className="h-40 w-full rounded-xl object-cover"
              />
            ))}
          </div>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {openInq.status !== "declined" && openInq.status !== "signed" ? (
              <button type="button" onClick={() => approve(openInq.id)} className="rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">
                Approve and email contract
              </button>
            ) : null}
            {openInq.status === "pending" ? (
              <button type="button" onClick={() => decline(openInq.id)} className="rounded-full border border-[#bae6fd] px-5 py-2.5 text-sm font-semibold">
                Not a fit
              </button>
            ) : null}
          </div>
          {mailNote ? <p className="mt-3 text-sm text-[#0369a1]">{mailNote}</p> : null}
          {openInq.notifyError ? (
            <p className="mt-2 text-sm text-red-700">Brian notify: {openInq.notifyError}</p>
          ) : openInq.notifyVia ? (
            <p className="mt-2 text-sm text-[#0369a1]">Brian was notified via {openInq.notifyVia}.</p>
          ) : null}
          {url ? (
            <p className="mt-4 break-all text-sm text-[#0369a1]">
              {copied === url ? "Copied: " : "Link: "}
              {url}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">mybransonvacation.com/contracts/log</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Owner desk</h1>
        <p className="mt-3 max-w-2xl text-[#0369a1]">
          Review photos first. Approve only if the home can hold a 5-star stay. The contract link is private.
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
              className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-white px-3 py-2"
            />
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
            <button type="submit" className="mt-4 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">
              Open desk
            </button>
          </form>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => setTab("inquiries")}>
                Reviews {inquiries ? `(${inquiries.filter((i) => i.status === "pending").length} pending)` : ""}
              </button>
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => setTab("signed")}>
                Signed {contracts ? `(${contracts.length})` : ""}
              </button>
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => load()}>
                Refresh
              </button>
              <button
                type="button"
                className="font-semibold text-[#0369a1]"
                onClick={async () => {
                  const ok = await notifyBrianFromBrowser({
                    subject: "Summers Vacations desk — test email",
                    message:
                      "This is a test from the owner desk in your browser. If you see it, FormSubmit is activated for this site.",
                  });
                  setMailNote(ok ? "Test email sent to summersvacationsllc@gmail.com. Check inbox and spam." : "Test email did not send. Check spam for a FormSubmit confirmation link.");
                }}
              >
                Email me a test
              </button>
              <button type="button" className="font-semibold text-[#0369a1]" onClick={() => logout()}>
                Lock
              </button>
            </div>
            {mailNote ? <p className="mt-3 text-sm text-[#0369a1]">{mailNote}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

            {tab === "inquiries" ? (
              <>
                <form onSubmit={directInvite} className="mt-6 rounded-2xl border border-[#bae6fd] bg-white p-5">
                  <p className="text-sm font-bold">Already met them? Send a contract link without an application.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input required placeholder="Name" value={direct.name} onChange={(e) => setDirect({ ...direct, name: e.target.value })} className="rounded-lg border border-[#bae6fd] px-3 py-2" />
                    <input required type="email" placeholder="Email" value={direct.email} onChange={(e) => setDirect({ ...direct, email: e.target.value })} className="rounded-lg border border-[#bae6fd] px-3 py-2" />
                    <input placeholder="Phone" value={direct.phone} onChange={(e) => setDirect({ ...direct, phone: e.target.value })} className="rounded-lg border border-[#bae6fd] px-3 py-2" />
                    <input required placeholder="Property address" value={direct.address} onChange={(e) => setDirect({ ...direct, address: e.target.value })} className="rounded-lg border border-[#bae6fd] px-3 py-2" />
                  </div>
                  <button type="submit" className="mt-3 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">
                    Create link and email owner
                  </button>
                  {mailNote ? <p className="mt-2 text-xs text-[#0369a1]">{mailNote}</p> : null}
                  {copied ? <p className="mt-2 break-all text-xs text-[#0369a1]">Copied: {copied}</p> : null}
                </form>
                {inquiries === null ? (
                  <p className="mt-8 text-[#0369a1]">Loading…</p>
                ) : inquiries.length === 0 ? (
                  <p className="mt-8 text-[#0369a1]">No review requests yet.</p>
                ) : (
                  <ul className="mt-6 space-y-3">
                    {inquiries.map((it) => (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => setOpenInq(it)}
                          className="w-full rounded-2xl border border-[#bae6fd] bg-white p-4 text-left"
                        >
                          <p className="font-semibold">{it.name}</p>
                          <p className="text-sm text-[#0369a1]">
                            {it.area ? `${it.area} · ` : ""}
                            {it.address}
                          </p>
                          <p className="mt-1 text-xs text-[#0369a1]">
                            {it.status} · {it.source === "met" ? "already met" : "website"} · {it.photoPathnames.length} photos ·{" "}
                            {it.submittedAt.slice(0, 10)}
                            {it.notifyError ? " · Brian email failed" : it.notifyVia ? " · Brian emailed" : ""}
                            {it.inviteEmailedAt ? " · contract emailed" : ""}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : contracts === null ? (
              <p className="mt-8 text-[#0369a1]">Loading…</p>
            ) : contracts.length === 0 ? (
              <p className="mt-8 text-[#0369a1]">No signed agreements yet.</p>
            ) : (
              <ul className="mt-6 space-y-3">
                {contracts.map((it) => (
                  <li key={it.id}>
                    <button type="button" onClick={() => openOne(it.id)} className="w-full rounded-2xl border border-[#bae6fd] bg-white p-4 text-left">
                      <p className="font-semibold">{it.subscriberName}</p>
                      <p className="text-sm text-[#0369a1]">{it.accommodationsAddress}</p>
                      <p className="mt-1 text-xs text-[#0369a1]">
                        Signed {it.signatureDate || "—"} · {it.email}
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
