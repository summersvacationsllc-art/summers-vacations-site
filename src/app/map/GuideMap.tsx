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

export default function GuideMap() {
  return <BransonMap embed />;
}
