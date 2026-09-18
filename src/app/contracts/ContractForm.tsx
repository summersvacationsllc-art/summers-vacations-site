"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  EMPTY_FIELDS,
  type ContractFields,
} from "@/lib/cohosting-agreement";
import { AgreementBody, PrintButton } from "./AgreementBody";
import { notifyBrianFromBrowser } from "@/lib/browser-mail";

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
  const invite = sp.get("invite") || "";
  const [inviteState, setInviteState] = useState<"loading" | "ok" | "bad">("loading");
  const [inviteError, setInviteError] = useState("");
  const [fields, setFields] = useState<ContractFields>({ ...EMPTY_FIELDS });
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invite) {
      setInviteState("bad");
      setInviteError("Brian sends this agreement only after he reviews the property.");
      return;
    }
    fetch(`/api/contracts/invite?token=${encodeURIComponent(invite)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setInviteState("bad");
          setInviteError(data.error || "This link is not valid.");
          return;
        }
        setFields((f) => ({
          ...f,
          subscriberName: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          accommodationsAddress: data.address || "",
        }));
        setInviteState("ok");
      })
      .catch(() => {
        setInviteState("bad");
        setInviteError("Could not check this link.");
      });
  }, [invite]);

  const set = (k: keyof ContractFields, v: string) => setFields((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value || "";
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, agreed, website, invite }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Could not send.");
        return;
      }
      await notifyBrianFromBrowser({
        subject: `Co-hosting agreement signed: ${fields.subscriberName} — ${fields.accommodationsAddress}`,
        replyTo: fields.email,
        message: [
          "An owner signed the co-hosting agreement.",
          "",
          "Open: https://mybransonvacation.com/contracts/log",
          `Name: ${fields.subscriberName}`,
          `Email: ${fields.email}`,
          `Property: ${fields.accommodationsAddress}`,
        ].join("\n"),
      });
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
            Your filled co-hosting agreement is saved in the Summers Vacations contract log and emailed to Brian. Print
            a copy for your records, then Brian will countersign.
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

  if (inviteState !== "ok") {
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-12 text-[#0c4a6e]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#bae6fd] bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">Summers Vacations</p>
          <h1 className="mt-2 font-display text-3xl">
            {inviteState === "loading" ? "Checking your link…" : "Review comes first"}
          </h1>
          {inviteState === "bad" ? (
            <>
              <p className="mt-3 text-[#0369a1]">{inviteError}</p>
              <p className="mt-3 text-[#0369a1]">
                Summers Vacations only co-hosts homes that already run at a 5-star level, or can get there. Request a
                property review and Brian will send the agreement if it is a fit.
              </p>
              <a
                href="/apply"
                className="mt-6 inline-block rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Request a property review
              </a>
            </>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="no-print text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">mybransonvacation.com/contracts</p>
        <h1 className="no-print mt-2 font-display text-4xl leading-none">Co-hosting agreement</h1>
        <p className="no-print mt-3 max-w-2xl text-[#0369a1]">
          Brian approved this property for review. Fill in any blanks. The agreement below updates as you type. Print a
          copy to read offline, then sign when you are ready. This is not legal advice.
        </p>
        <div className="no-print mt-4">
          <PrintButton label="Print this agreement" />
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-8">
          <fieldset className="no-print rounded-2xl border border-[#bae6fd] bg-white p-5 shadow-[0_10px_24px_-18px_rgba(2,132,199,.55)]">
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

          <AgreementBody fields={fields} />

          <fieldset className="no-print rounded-2xl border border-[#bae6fd] bg-white p-5">
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
