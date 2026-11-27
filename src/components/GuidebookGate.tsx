"use client";

import { useState } from "react";
import { CONSENT_TEXT } from "@/lib/guidebook-gate-core";

export type StayInfo = {
  firstName: string;
  ci: string;
  co: string;
  airbnb: boolean;
  state: "before" | "ready" | "after" | "unavailable";
  code: string | null;
};

type Props = {
  slug: string;
  /** Stay dates from the guidebook link (YYYY-MM-DD), when the link has usable ones. */
  checkin?: string;
  checkout?: string;
  airbnbHint?: boolean;
  /** Called after a successful submit. `stay` is null unless the booking was verified. */
  onSubmitted: (stay: StayInfo | null) => void;
  onSkip: () => void;
};

const box = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[16px] text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-200";
const label = "block text-[13px] font-semibold text-slate-700 mb-1";

/** Inline card that unlocks the stay card. The rest of the guidebook is never blocked. */
export default function GuidebookGate({ slug, checkin = "", checkout = "", airbnbHint = false, onSubmitted, onSkip }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [forceDirect, setForceDirect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const airbnb = !forceDirect && airbnbHint;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/guidebook-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, phone, checkin, checkout, consent, website, mode: airbnb ? "airbnb-optional" : "required" }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { onSubmitted(d.stay ?? null); return; }
      if (r.status === 400) { setErr(d.error || "Please check the form."); return; }
      setErr(r.status === 429 ? (d.error || "Too many tries. Please wait a few minutes.") : "We couldn't save that just now. Please try again.");
    } catch {
      setErr("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="gg-title" className="mx-3.5 mt-[-10px] relative z-10 rounded-2xl bg-white border border-sky-200 shadow-lg p-4">
      <h2 id="gg-title" className="text-[19px] leading-snug font-extrabold text-sky-950 m-0" style={{ fontFamily: "'DM Serif Display', serif" }}>
        Your Branson guidebook, yours to keep
      </h2>
      <p className="text-[13.5px] text-slate-700 mt-1.5 mb-3 leading-snug">
        Browse shows, dining, fishing reports and events anytime, during your stay and long after you head home.
      </p>

      {airbnb ? (
        <p className="text-[13.5px] text-slate-800 font-semibold mt-0 mb-3 leading-snug bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
          Booked on Airbnb? Your door code and check-in details are in your Airbnb messages. You can also add your name and number here to see them on this page (optional).
        </p>
      ) : null}
      {airbnb ? (
        <button type="button" onClick={onSkip}
          className="w-full mb-3 rounded-xl border-2 border-sky-700 bg-white text-sky-800 font-bold text-[15px] py-2.5 cursor-pointer">
          Skip for now
        </button>
      ) : (
        <>
          <p className="text-[15px] text-slate-900 font-bold mt-0 mb-1 leading-snug">
            Please enter your name and phone number to unlock your reservation information.
          </p>
          <p className="text-[12.5px] text-slate-600 mt-0 mb-3 leading-snug">
            This unlocks your door code and stay details for this trip. Everything else here stays open to you year-round.
          </p>
        </>
      )}

      <form onSubmit={submit} noValidate>
        <div className="mb-3">
          <label htmlFor="gg-name" className={label}>Your name</label>
          <input id="gg-name" className={box} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
        </div>
        <div className="mb-3">
          <label htmlFor="gg-phone" className={label}>Mobile phone</label>
          <input id="gg-phone" className={box} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel"
            autoComplete="tel" placeholder="417-555-0123" maxLength={30} />
        </div>

        {/* honeypot: hidden from people */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}>
          <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>

        <label className="flex gap-2.5 items-start text-[12.5px] text-slate-700 leading-snug mb-3 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{CONSENT_TEXT}</span>
        </label>

        <p className="text-[11.5px] text-slate-500 leading-snug mt-0 mb-3">
          We use your details to match your reservation and, only if you tick the box above, to send Branson deals. We never sell your number.
        </p>

        {err && <p role="alert" className="text-[14px] text-red-700 font-semibold mt-0 mb-3">{err}</p>}

        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-sky-700 text-white font-bold text-[16px] py-3.5 cursor-pointer border-0 disabled:opacity-60">
          {busy ? "One moment…" : "Unlock my stay info"}
        </button>
      </form>

      {airbnb ? (
        <>
          <p className="text-center mt-3 mb-0 text-[12.5px] text-slate-600">
            Not booked on Airbnb?{" "}
            <button type="button" onClick={() => setForceDirect(true)} className="underline text-sky-800 bg-transparent border-0 cursor-pointer p-0 text-[12.5px]">
              Enter your details instead
            </button>
          </p>
        </>
      ) : (
        <button type="button" onClick={onSkip}
          className="w-full mt-2.5 rounded-xl border-2 border-sky-700 bg-white text-sky-800 font-bold text-[14.5px] py-2.5 cursor-pointer">
          Booked on Airbnb? Skip for now
        </button>
      )}
    </section>
  );
}
