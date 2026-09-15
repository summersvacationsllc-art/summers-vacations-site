"use client";

import { AGREEMENT_SECTIONS, fill, type ContractFields } from "@/lib/cohosting-agreement";

export function AgreementBody({ fields }: { fields: ContractFields }) {
  return (
    <article className="agreement-print rounded-2xl border border-[#bae6fd] bg-white p-6 text-[15px] leading-relaxed text-[#0f172a]">
      <h2 className="font-display text-2xl text-[#0c4a6e]">Summers Vacations LLC</h2>
      <p className="text-sm font-semibold uppercase tracking-wide text-[#0369a1]">Co-Hosting Agreement</p>
      {AGREEMENT_SECTIONS.map((s) => {
        const body = fill(s.body, fields);
        return (
          <section key={s.heading || body.slice(0, 24)} className="mt-6 whitespace-pre-wrap">
            {s.heading ? <h3 className="mb-2 font-display text-lg text-[#0c4a6e]">{s.heading}</h3> : null}
            <p>{body}</p>
          </section>
        );
      })}
    </article>
  );
}

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white"
    >
      {label}
    </button>
  );
}
