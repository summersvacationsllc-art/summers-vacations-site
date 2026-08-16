"use client";

import dynamic from "next/dynamic";

const BransonMap = dynamic(() => import("./BransonMap"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center text-[#0369a1] font-semibold">
      Loading the Branson map…
    </div>
  ),
});

export default function MapLoader() {
  return <BransonMap />;
}
