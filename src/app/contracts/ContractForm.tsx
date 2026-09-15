"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  AGREEMENT_SECTIONS,
  EMPTY_FIELDS,
  fill,
  type ContractFields,
} from "@/lib/cohosting-agreement";

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  name: keyof ContractFields;
  value: string;
  onChange: (k: keyof ContractFields, v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="mt-1 w-full rounded-lg border border-[#bae6fd] bg-white px-3 py-2 text-[#0c4a6e] outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#7dd3fc]"
      />
    </label>
  );
}

function FormInner() {
  const sp = useSearchParams();
  const [fields, setFields] = useState<ContractFields>(() => ({
    ...EMPTY_FIELDS,
    accommodationsAddress: sp.get("address") || "",
    subscriberName: sp.get("name") || "",
    email: sp.get("email") || "",
    phone: sp.get("phone") || "",
  }));
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof ContractFields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const filledSections = useMemo(
    () => AGREEMENT_SECTIONS.map((s) => ({ ...s, body: fill(s.body, fields) })),
    [fields],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || "";
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, agreed, website }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Could not send.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-12 text-[#0c4a6e]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#bae6fd] bg-white p-8 shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">Summers Vacations</p>
          <h1 className="mt-2 font-display text-3xl">Sent to Brian</h1>
          <p className="mt-3 text-[#0369a1]">
            Your filled co-hosting agreement is on its way to Summers Vacations. Print a copy for your records, then
            Brian will countersign.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-6 rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Print my copy
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">mybransonvacation.com/contracts</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Co-hosting agreement</h1>
        <p className="mt-3 max-w-2xl text-[#0369a1]">
          Fill in your details. The agreement below updates as you type. Send it to Brian when you are ready. This is
          not legal advice.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <fieldset className="rounded-2xl border border-[#bae6fd] bg-white p-5 shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]">
            <legend className="px-1 text-sm font-bold text-[#0c4a6e]">Your listing</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Property address"
                  name="accommodationsAddress"
                  value={fields.accommodationsAddress}
                  onChange={set}
                  required
                  autoComplete="street-address"
                />
              </div>
              <Field label="Start date" name="startDate" value={fields.startDate} onChange={set} type="date" required />
              <Field
                label="Your full name"
                name="subscriberName"
                value={fields.subscriberName}
                onChange={set}
                required
                autoComplete="name"
              />
              <Field
                label="Co-owner name (if any)"
                name="coSubscriberName"
                value={fields.coSubscriberName}
                onChange={set}
              />
              <Field
                label="Email"
                name="email"
                value={fields.email}
                onChange={set}
                type="email"
                required
                autoComplete="email"
              />
              <Field label="Phone" name="phone" value={fields.phone} onChange={set} type="tel" autoComplete="tel" />
              <div className="sm:col-span-2">
                <Field
                  label="Mailing address"
                  name="mailingAddress"
                  value={fields.mailingAddress}
                  onChange={set}
                  autoComplete="address-line1"
                />
              </div>
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          </fieldset>

          <article className="rounded-2xl border border-[#bae6fd] bg-white p-6 text-[15px] leading-relaxed text-[#0f172a] print:border-0 print:shadow-none">
            <h2 className="font-display text-2xl text-[#0c4a6e]">Summers Vacations LLC</h2>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0369a1]">Co-Hosting Agreement</p>
            {filledSections.map((s) => (
              <section key={s.heading || s.body.slice(0, 24)} className="mt-6 whitespace-pre-wrap">
                {s.heading ? <h3 className="mb-2 font-display text-lg text-[#0c4a6e]">{s.heading}</h3> : null}
                <p>{s.body}</p>
              </section>
            ))}
          </article>

          <fieldset className="rounded-2xl border border-[#bae6fd] bg-white p-5">
            <legend className="px-1 text-sm font-bold">Sign and send</legend>
            <p className="mb-4 text-sm text-[#0369a1]">
              Typing your name is your electronic signature on this agreement. Brian countersigns after he receives it.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Type your name as signature"
                name="signatureName"
                value={fields.signatureName}
                onChange={set}
                required
              />
              <Field
                label="Signature date"
                name="signatureDate"
                value={fields.signatureDate}
                onChange={set}
                type="date"
                required
              />
              <Field
                label="Co-owner signature (if any)"
                name="coSignatureName"
                value={fields.coSignatureName}
                onChange={set}
              />
              <Field
                label="Co-owner date"
                name="coSignatureDate"
                value={fields.coSignatureDate}
                onChange={set}
                type="date"
              />
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span>
                I have read this co-hosting agreement, I have the right to rent this property, and I intend my typed
                name as my signature.
              </span>
            </label>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-5 rounded-full bg-[#0c4a6e] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send to Brian"}
            </button>
          </fieldset>
        </form>
      </div>
    </main>
  );
}

export function ContractForm() {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-[#f0f9ff] p-8 text-[#0c4a6e]">Loading agreement…</main>}>
      <FormInner />
    </Suspense>
  );
}
