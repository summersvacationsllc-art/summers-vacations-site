import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guidebook test",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function GuidebookTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
