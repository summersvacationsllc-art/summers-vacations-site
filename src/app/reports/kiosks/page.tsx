import type { Metadata } from "next";
import KioskStatusView from "./KioskStatusView";

// Unlisted internal page: kiosk tablet check-ins. Not linked from the site; noindex.
export const metadata: Metadata = {
  title: "Kiosk tablets · Status",
  robots: { index: false, follow: false, nocache: true },
};

export default function KioskStatusPage() {
  return <KioskStatusView />;
}
