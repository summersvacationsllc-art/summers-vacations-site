import type { Metadata } from "next";
import { ContractForm } from "./ContractForm";

export const metadata: Metadata = {
  title: "Co-hosting agreement | Summers Vacations",
  description: "Fill in your listing details and send the Summers Vacations co-hosting agreement to Brian.",
  robots: { index: false, follow: false },
};

export default function ContractsPage() {
  return <ContractForm />;
}
