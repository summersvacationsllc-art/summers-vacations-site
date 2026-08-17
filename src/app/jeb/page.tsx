import { Suspense } from "react";
import type { Metadata } from "next";
import JebTalk from "./JebTalk";

export const metadata: Metadata = {
  title: "Talk to Jeb · My Branson Vacation",
  description: "Jebediah — your friendly Ozark concierge at My Branson Vacation.",
};

export default function JebPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e] grid place-items-center">
          Fetchin&apos; Jeb…
        </main>
      }
    >
      <JebTalk />
    </Suspense>
  );
}
