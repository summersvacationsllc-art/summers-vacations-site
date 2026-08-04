import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Branson Live Guide | Summers Vacations",
  description:
    "Free live Branson guide — shows, dining, fishing, golf, and family stays from Summers Vacations. Shareable city card (not a unit door-code link).",
  openGraph: {
    title: "Branson Live Guide | Summers Vacations",
    description:
      "Unlock live Branson intel and our family stays. Perfect to share — no unit codes here.",
    type: "website",
  },
};

export default function BransonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
