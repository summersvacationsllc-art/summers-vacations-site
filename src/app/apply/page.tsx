import type { Metadata } from "next";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = {
  title: "Request a property review | Summers Vacations",
  description:
    "Ask Brian to review your Branson home before any co-hosting agreement. Selective book. 5-star standard.",
};

export default function ApplyPage() {
  return <ApplyForm />;
}
