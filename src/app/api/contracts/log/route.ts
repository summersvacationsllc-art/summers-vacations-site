import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { listInquiries } from "@/lib/owner-inquiries";
import { listContracts } from "@/lib/contracts-store";

export async function GET(req: Request) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  try {
    const [inquiries, contracts] = await Promise.all([listInquiries(), listContracts()]);
    return NextResponse.json({ ok: true, inquiries, contracts });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load the log." }, { status: 500 });
  }
}
