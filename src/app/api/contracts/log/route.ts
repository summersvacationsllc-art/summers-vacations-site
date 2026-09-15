import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { listContracts } from "@/lib/contracts-store";

export async function GET(req: Request) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  try {
    const items = await listContracts();
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load the log." }, { status: 500 });
  }
}
