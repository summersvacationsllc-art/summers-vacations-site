"use client";

import { useEffect, useState } from "react";
import type { ContractSummary, StoredContract } from "@/lib/contracts-store";
import type { OwnerInquiry } from "@/lib/owner-inquiries";
import { notifyBrianFromBrowser } from "@/lib/browser-mail";
import { ownerContractMailto } from "@/lib/mail";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function openOwnerMailto(opts: { name: string; email: string; address: string; url: string }) {
  const href = ownerContractMailto(opts);
  window.location.href = href;
}

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
  const [busy, setBusy] = useState(false);
  const [direct, setDirect] = useState({ name: "", email: "", phone: "", address: "" });
  const [lastInvite, setLastInvite] = useState<{
    url: string;
    name: string;
    email: string;
    address: string;
    emailed: boolean;
  } | null>(null);

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
    setLastInvite(null);
    setNeedPin(true);
  }

  async function finishInvite(opts: {
    url: string;
    name: string;
    email: string;
    address: string;
    emailed: boolean;
    emailError?: string | null;
    subject: string;
  }) {
    setLastInvite({
      url: opts.url,
      name: opts.name,
      email: opts.email,
      address: opts.address,
      emailed: opts.emailed,
    });
    const didCopy = await copyText(opts.url);
    if (didCopy) setCopied(opts.url);
    else setCopied("");

    if (!opts.emailed && opts.email) {
      openOwnerMailto({
        name: opts.name,
        email: opts.email,
        address: opts.address,
        url: opts.url,
      });
    }

    await notifyBrianFromBrowser({
      subject: opts.subject,
      replyTo: opts.email,
      message: [
        opts.emailed
          ? `The agreement link was emailed to ${opts.email}.`
          : `Server could not email the owner${opts.emailError ? ` (${opts.emailError})` : ""}. Mail.app / mailto was opened from this device with the letter + link.`,
        "",
        opts.url,
        "",
        "Open: https://mybransonvacation.com/contracts/log",
      ].join("\n"),
    });

    setMailNote(
      opts.emailed
        ? `Emailed the contract link to ${opts.email}. ${didCopy ? "Link also copied." : "Copy failed — use the blue link below."}`
        : `Mail app opened to email ${opts.email} (server email not configured). ${didCopy ? "Link also copied." : "Copy failed — use the blue link below."}`,
    );
  }

  async function approve(id: string) {
    setError("");
    setBusy(true);
    setMailNote("");
    try {
      const res = await fetch(`/api/owner-inquiries/${encodeURIComponent(id)}/invite`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not approve.");
        return;
      }
      const name = openInq?.name || "";
      const email = openInq?.email || "";
      const address = openInq?.address || "";
      await finishInvite({
        url: data.url,
        name,
        email,
        address,
        emailed: Boolean(data.emailed),
        emailError: data.emailError,
        subject: `Contract approved: ${name} — ${address}`,
      });
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
    } catch {
      setError("Network error while approving. Try again.");
    } finally {
      setBusy(false);
    }
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
    setBusy(true);
    setMailNote("");
    try {
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
      await finishInvite({
        url: data.url,
        name: direct.name,
        email: direct.email,
        address: direct.address,
        emailed: Boolean(data.emailed),
        emailError: data.emailError,
        subject: `Contract link created: ${direct.name} — ${direct.address}`,
      });
      setDirect({ name: "", email: "", phone: "", address: "" });
    } catch {
      setError("Network error while creating invite. Try again.");
    } finally {
      setBusy(false);
    }
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
      : lastInvite?.url || "";
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
              <button
                type="button"
                disabled={busy}
                onClick={() => approve(openInq.id)}
                className="rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Working…" : "Approve and send contract"}
              </button>
            ) : null}
            {openInq.status === "pending" ? (
              <button type="button" onClick={() => decline(openInq.id)} className="rounded-full border border-[#bae6fd] px-5 py-2.5 text-sm font-semibold">
                Not a fit
              </button>
            ) : null}
            {url ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyText(url);
                    setCopied(ok ? url : "");
                    setMailNote(ok ? "Link copied." : "Copy failed — tap the blue link, or long-press to copy.");
                  }}
                  className="rounded-full border border-[#bae6fd] px-5 py-2.5 text-sm font-semibold"
                >
                  Copy link
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openOwnerMailto({
                      name: openInq.name,
                      email: openInq.email,
                      address: openInq.address,
                      url,
                    })
                  }
                  className="rounded-full border border-[#bae6fd] px-5 py-2.5 text-sm font-semibold"
                >
                  Open in Mail
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#bae6fd] px-5 py-2.5 text-sm font-semibold"
                >
                  Open contract
                </a>
              </>
            ) : null}
          </div>
          {mailNote ? <p className="mt-3 text-sm text-[#0369a1]">{mailNote}</p> : null}
          {openInq.notifyError ? (
            <p className="mt-2 text-sm text-red-700">Brian notify: {openInq.notifyError}</p>
          ) : openInq.notifyVia ? (
            <p className="mt-2 text-sm text-[#0369a1]">Brian was notified via {openInq.notifyVia}.</p>
          ) : null}
          {url ? (
            <p className="mt-4 break-all text-sm">
              <span className="text-[#0369a1]">{copied === url ? "Copied — " : "Private link: "}</span>
              <a className="font-semibold text-[#0284c7] underline" href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
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
            {lastInvite ? (
              <div className="mt-4 rounded-2xl border border-[#bae6fd] bg-white p-4 text-sm">
                <p className="font-semibold">Last contract link — {lastInvite.name}</p>
                <p className="mt-1 break-all">
                  <a className="font-semibold text-[#0284c7] underline" href={lastInvite.url} target="_blank" rel="noreferrer">
                    {lastInvite.url}
                  </a>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#bae6fd] px-4 py-2 text-xs font-semibold"
                    onClick={async () => {
                      const ok = await copyText(lastInvite.url);
                      setMailNote(ok ? "Link copied." : "Copy failed — use the blue link.");
                    }}
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#bae6fd] px-4 py-2 text-xs font-semibold"
                    onClick={() => openOwnerMailto(lastInvite)}
                  >
                    Open in Mail
                  </button>
                  <a
                    href={lastInvite.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#bae6fd] px-4 py-2 text-xs font-semibold"
                  >
                    Open contract
                  </a>
                </div>
              </div>
            ) : null}
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
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-3 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {busy ? "Working…" : "Create link and email owner"}
                  </button>
                  {mailNote ? <p className="mt-2 text-xs text-[#0369a1]">{mailNote}</p> : null}
                  {copied ? (
                    <p className="mt-2 break-all text-xs">
                      <span className="text-[#0369a1]">Copied — </span>
                      <a className="font-semibold text-[#0284c7] underline" href={copied} target="_blank" rel="noreferrer">
                        {copied}
                      </a>
                    </p>
                  ) : null}
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
