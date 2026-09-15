import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getInquiry, inviteUrl, newInviteToken, saveInquiry, saveInvite } from "@/lib/owner-inquiries";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const rec = await getInquiry(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (rec.status === "declined") {
    return NextResponse.json({ ok: false, error: "This request was declined." }, { status: 400 });
  }

  const token = rec.inviteToken || newInviteToken();
  await saveInvite(
    {
      token,
      inquiryId: rec.id,
      name: rec.name,
      email: rec.email,
      phone: rec.phone,
      address: rec.address,
      createdAt: new Date().toISOString(),
      usedAt: null,
      contractId: null,
    },
    Boolean(rec.inviteToken),
  );
  rec.status = "approved";
  rec.inviteToken = token;
  await saveInquiry(rec, true);
  const url = inviteUrl(token);
  return NextResponse.json({ ok: true, url, token });
}
