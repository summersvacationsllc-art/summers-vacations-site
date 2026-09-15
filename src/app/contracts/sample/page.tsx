import type { Metadata } from "next";
import { SAMPLE_FIELDS } from "@/lib/cohosting-agreement";
import { AgreementBody, PrintButton } from "../AgreementBody";

export const metadata: Metadata = {
  title: "Sample co-hosting agreement | Summers Vacations",
  robots: { index: false, follow: false },
};

export default function ContractSamplePage() {
  return (
    <main className="min-h-dvh bg-[#f0f9ff] px-4 py-8 text-[#0c4a6e]">
      <div className="mx-auto max-w-3xl">
        <p className="no-print text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">
          mybransonvacation.com/contracts/sample
        </p>
        <h1 className="mt-2 font-display text-4xl leading-none">Sample agreement</h1>
        <p className="mt-3 max-w-2xl text-[#0369a1]">
          This is a generic filled-in example so you can see how the contract reads on paper. Names, address, and dates
          are fake. It is not a real agreement and cannot be signed from this page.
        </p>
        <div className="no-print mt-5">
          <PrintButton label="Print this sample" />
        </div>
        <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          SAMPLE ONLY — Jane Q. Sample / 100 Sample Lane — not a real owner or listing.
        </p>
        <div className="mt-6">
          <AgreementBody fields={SAMPLE_FIELDS} />
        </div>
      </div>
    </main>
  );
}
