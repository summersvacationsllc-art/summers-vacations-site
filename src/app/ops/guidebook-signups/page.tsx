import type { Metadata } from "next";
import { SignupsAdmin } from "./SignupsAdmin";

export const metadata: Metadata = {
  title: "Guidebook signups | Summers Vacations",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SignupsAdmin />;
}
