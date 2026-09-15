import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getContract } from "@/lib/contracts-store";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rec = await getContract(id);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, record: rec });
}
