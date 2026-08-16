import type { Metadata } from "next";
import { Suspense } from "react";
import MapLoader from "./MapLoader";

export const metadata: Metadata = {
  title: "Branson Map | Live Cams, Shows & Lake | My Branson Vacation",
  description:
    "Interactive Branson map — live lake cams, marinas, Silver Dollar City, and theater tickets. Tap a pin for the name, venue, and a direct link.",
};

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f0f9ff] flex items-center justify-center text-[#0369a1] font-semibold">
          Loading the Branson map…
        </div>
      }
    >
      <MapLoader />
    </Suspense>
  );
}
