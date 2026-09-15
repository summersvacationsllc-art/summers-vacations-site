import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getInquiry, saveInquiry } from "@/lib/owner-inquiries";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rec = await getInquiry(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  let note = "";
  try {
    const body = await req.json();
    if (typeof body.note === "string") note = body.note.trim().slice(0, 400);
  } catch {
    /* no body */
  }
  rec.status = "declined";
  rec.declinedNote = note;
  await saveInquiry(rec, true);
  return NextResponse.json({ ok: true });
}
