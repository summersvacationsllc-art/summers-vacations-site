"use client";

import { useState } from "react";
import { CONSENT_TEXT } from "@/lib/guidebook-gate-core";

type Props = {
  slug: string;
  unitName: string;
  prefillConf?: string;
  airbnbHint?: boolean;
  onDone: (how: "submitted" | "skipped") => void;
};

const box = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[16px] text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200";
const label = "block text-[13px] font-semibold text-slate-700 mb-1";

export default function GuidebookGate({ slug, unitName, prefillConf = "", airbnbHint = false, onDone }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [conf, setConf] = useState(prefillConf);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [forceDirect, setForceDirect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState("");
  const [canBypass, setCanBypass] = useState(false);

  const airbnb = !forceDirect && (airbnbHint || /^hm/i.test(conf.trim()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setFieldErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/guidebook-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, phone, conf, consent, website, mode: airbnb ? "airbnb-optional" : "required" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { onDone("submitted"); return; }
      if (r.status === 400) { setErr(d.error || "Please check the form."); setFieldErr(d.field || ""); return; }
      if (r.status === 429) { setErr(d.error || "Too many tries. Please wait a few minutes."); setCanBypass(true); return; }
      setErr("We couldn't save that just now. Please try again.");
      setCanBypass(true);
    } catch {
      setErr("We couldn't reach the server. Check your connection and try again.");
      setCanBypass(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-sky-50 px-4 py-8 flex justify-center">
      <div className="w-full max-w-md">
        <p className="text-[12px] font-bold uppercase tracking-wide text-sky-700 mb-1">{unitName} · Guest guidebook</p>
        {airbnb ? (
          <>
            <h1 className="text-[22px] leading-snug font-extrabold text-slate-900 m-0">Welcome! Your guidebook is ready.</h1>
            <p className="text-[15px] text-slate-700 mt-2 mb-4">
              Optional: share your name and number so we can reach you about future stays. You can skip this and go straight to the guidebook.
            </p>
            <button type="button" onClick={() => onDone("skipped")}
              className="w-full rounded-xl bg-sky-700 text-white font-bold text-[16px] py-3.5 mb-5 cursor-pointer border-0">
              Skip / Continue to guidebook
            </button>
          </>
        ) : (
          <>
            <h1 className="text-[22px] leading-snug font-extrabold text-slate-900 m-0">
              Please enter your name and phone number to unlock your reservation information.
            </h1>
            <p className="text-[14px] text-slate-600 mt-2 mb-4">Use the name and confirmation code from your booking.</p>
          </>
        )}

        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm" noValidate>
          <div className="mb-3">
            <label htmlFor="gg-name" className={label}>Your name</label>
            <input id="gg-name" className={box} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80}
              aria-invalid={fieldErr === "name"} />
          </div>
          <div className="mb-3">
            <label htmlFor="gg-phone" className={label}>Mobile phone</label>
            <input id="gg-phone" className={box} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel"
              autoComplete="tel" placeholder="417-555-0123" maxLength={30} aria-invalid={fieldErr === "phone"} />
          </div>
          <div className="mb-3">
            <label htmlFor="gg-conf" className={label}>
              Booking confirmation code{airbnb ? " (optional)" : ""}
            </label>
            <input id="gg-conf" className={box} value={conf} onChange={(e) => setConf(e.target.value)} autoCapitalize="characters"
              autoComplete="off" spellCheck={false} maxLength={30} aria-invalid={fieldErr === "conf"} />
            <p className="text-[12px] text-slate-500 mt-1 mb-0">It&apos;s in your booking message. Airbnb codes start with HM.</p>
          </div>

          {/* honeypot: hidden from people */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
            <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>

          <label className="flex gap-2.5 items-start text-[13px] text-slate-700 leading-snug mb-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{CONSENT_TEXT}</span>
          </label>

          <p className="text-[12px] text-slate-500 leading-snug mt-0 mb-3">
            We use your details to match your reservation and, only if you tick the box above, to send Branson deals. We never sell your number.
          </p>

          {err && <p role="alert" className="text-[14px] text-red-700 font-semibold mt-0 mb-3">{err}</p>}

          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-sky-700 text-white font-bold text-[16px] py-3.5 cursor-pointer border-0 disabled:opacity-60">
            {busy ? "One moment…" : airbnb ? "Share and continue" : "Unlock my reservation information"}
          </button>
          {canBypass && (
            <button type="button" onClick={() => onDone("skipped")}
              className="w-full mt-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-[15px] py-3 cursor-pointer">
              Continue to guidebook anyway
            </button>
          )}
        </form>

        {airbnb ? (
          <p className="text-center mt-4 text-[13px] text-slate-600">
            Not booked on Airbnb?{" "}
            <button type="button" onClick={() => { setForceDirect(true); setConf(""); }} className="underline text-sky-800 bg-transparent border-0 cursor-pointer p-0 text-[13px]">
              Enter your details instead
            </button>
          </p>
        ) : (
          <button type="button" onClick={() => onDone("skipped")}
            className="w-full mt-4 rounded-xl border-2 border-sky-700 bg-white text-sky-800 font-bold text-[15px] py-3 cursor-pointer">
            Booked on Airbnb? Continue without entering
          </button>
        )}
      </div>
    </div>
  );
}
