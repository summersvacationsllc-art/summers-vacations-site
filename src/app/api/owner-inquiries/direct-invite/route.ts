export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { ownerContractEmail, sendMail } from "@/lib/mail";
import { inviteUrl, newInviteToken, saveInvite } from "@/lib/owner-inquiries";

function str(v: unknown, max = 400): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export async function POST(req: Request) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  try {
    const body = await req.json();
    const name = str(body.name, 200);
    const email = str(body.email, 200);
    const phone = str(body.phone, 40);
    const address = str(body.address, 400);
    if (!name || !email || !address) {
      return NextResponse.json({ ok: false, error: "Name, email, and address are required." }, { status: 400 });
    }
    const token = newInviteToken();
    await saveInvite({
      token,
      inquiryId: null,
      name,
      email,
      phone,
      address,
      createdAt: new Date().toISOString(),
      usedAt: null,
      contractId: null,
    });
    const url = inviteUrl(token);
    const letter = ownerContractEmail({ name, address, url });
    const mailed = await sendMail({
      to: email,
      subject: letter.subject,
      text: letter.text,
      replyTo: EMAIL,
    });
    if (mailed.ok) {
      await sendMail({
        to: EMAIL,
        subject: `Contract link emailed: ${name} — ${address}`,
        text: [`The private agreement link was emailed to ${email}.`, "", `Link: ${url}`].join("\n"),
        replyTo: email,
      });
    }
    return NextResponse.json({
      ok: true,
      url,
      token,
      emailed: mailed.ok,
      emailError: mailed.ok ? null : mailed.error || "email failed",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed." }, { status: 500 });
  }
}
