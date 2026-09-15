import type { Metadata } from "next";
import { ContractLog } from "./ContractLog";

export const metadata: Metadata = {
  title: "Owner desk | Summers Vacations",
  robots: { index: false, follow: false },
};

export default function ContractsLogPage() {
  return <ContractLog />;
}
