export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { ownerContractEmail, sendMail } from "@/lib/mail";
import {
  inviteUrl,
  newInquiryId,
  newInviteToken,
  saveInquiry,
  saveInvite,
  type OwnerInquiry,
} from "@/lib/owner-inquiries";

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

    // Keep a durable review card even for "already met" invites.
    const inquiryId = newInquiryId(name);
    const rec: OwnerInquiry = {
      id: inquiryId,
      submittedAt: new Date().toISOString(),
      source: "met",
      name,
      email,
      phone,
      address,
      area: "",
      listingUrl: "",
      sleeps: "",
      beds: "",
      notes: "Direct desk invite (already met). Review card kept for records.",
      photoPathnames: [],
      status: "approved",
      inviteToken: null,
      declinedNote: "",
      ip: "",
      notifyVia: null,
      notifyError: null,
      contractId: null,
      signedAt: null,
    };

    const token = newInviteToken();
    await saveInvite({
      token,
      inquiryId,
      name,
      email,
      phone,
      address,
      createdAt: new Date().toISOString(),
      usedAt: null,
      contractId: null,
    });
    rec.inviteToken = token;
    await saveInquiry(rec, true);

    const url = inviteUrl(token);
    const letter = ownerContractEmail({ name, address, url });
    const mailed = await sendMail({
      to: email,
      subject: letter.subject,
      text: letter.text,
      replyTo: EMAIL,
    });
    if (mailed.ok) {
      rec.inviteEmailedAt = new Date().toISOString();
      rec.inviteEmailError = null;
      await saveInquiry(rec, true);
      await sendMail({
        to: EMAIL,
        subject: `Contract link emailed: ${name} — ${address}`,
        text: [`The private agreement link was emailed to ${email}.`, "", `Link: ${url}`, `Review card id: ${inquiryId}`].join(
          "\n",
        ),
        replyTo: email,
      });
    } else {
      rec.inviteEmailError = mailed.error || "email failed";
      await saveInquiry(rec, true);
    }
    return NextResponse.json({
      ok: true,
      url,
      token,
      inquiryId,
      emailed: mailed.ok,
      emailError: mailed.ok ? null : mailed.error || "email failed",
      emailVia: mailed.ok ? mailed.via || null : null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed." }, { status: 500 });
  }
}
