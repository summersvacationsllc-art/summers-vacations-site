"use client";

import dynamic from "next/dynamic";

const BransonMap = dynamic(() => import("./BransonMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[360px] flex items-center justify-center text-[#0369a1] text-sm font-semibold">
      Loading map…
    </div>
  ),
});

/**
 * Guidebook property slug → our neighborhood-level "Our stays" pin
 * (street pin only — never a unit address).
 */
function stayPinFor(property?: string): string | undefined {
  if (!property) return undefined;
  if (property === "branson-family-haven") return "stays-indian-point";
  return "stays-branson-west"; // every Notch Lane condo, incl. scotts-unit
}

export default function GuideMap({ property }: { property?: string }) {
  return <BransonMap embed stayId={stayPinFor(property)} />;
}
