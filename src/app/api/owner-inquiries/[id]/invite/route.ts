import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { ownerContractEmail, sendMail } from "@/lib/mail";
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
  const url = inviteUrl(token);
  const letter = ownerContractEmail({ name: rec.name, address: rec.address, url });
  const mailed = await sendMail({
    to: rec.email,
    subject: letter.subject,
    text: letter.text,
    replyTo: EMAIL,
  });
  rec.inviteEmailedAt = mailed.ok ? new Date().toISOString() : null;
  rec.inviteEmailError = mailed.ok ? null : mailed.error || "email failed";
  await saveInquiry(rec, true);
  if (mailed.ok) {
    await sendMail({
      to: EMAIL,
      subject: `Contract link emailed: ${rec.name} — ${rec.address}`,
      text: [
        `The private agreement link was emailed to ${rec.email}.`,
        "",
        `Desk: https://mybransonvacation.com/contracts/log`,
        `Link: ${url}`,
      ].join("\n"),
      replyTo: rec.email,
    });
  }
  return NextResponse.json({
    ok: true,
    url,
    token,
    emailed: mailed.ok,
    emailError: rec.inviteEmailError,
  });
}
