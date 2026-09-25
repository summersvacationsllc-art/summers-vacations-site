import type { Metadata } from "next";
import { getInvite } from "@/lib/owner-inquiries";
import { ContractForm, type InitialInvite } from "./ContractForm";

export const metadata: Metadata = {
  title: "Co-hosting agreement | Summers Vacations",
  description: "Fill in your listing details and send the Summers Vacations co-hosting agreement to Brian.",
  robots: { index: false, follow: false },
};

/** Invite is checked on the server so a valid ?invite= link is not a blank client shell. */
export const dynamic = "force-dynamic";

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.invite;
  const invite = (Array.isArray(raw) ? raw[0] : raw || "").trim();

  let initialInvite: InitialInvite;
  if (!invite) {
    initialInvite = {
      state: "bad",
      error: "Brian sends this agreement only after he reviews the property.",
    };
  } else {
    try {
      const inv = await getInvite(invite);
      if (!inv) {
        initialInvite = { state: "bad", error: "This link is not valid." };
      } else if (inv.usedAt) {
        initialInvite = { state: "bad", error: "This agreement link was already used." };
      } else {
        initialInvite = {
          state: "ok",
          name: inv.name || "",
          email: inv.email || "",
          phone: inv.phone || "",
          address: inv.address || "",
        };
      }
    } catch {
      initialInvite = { state: "bad", error: "Could not check this link. Try again in a moment." };
    }
  }

  return <ContractForm invite={invite} initialInvite={initialInvite} />;
}
