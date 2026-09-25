export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import { sendMail } from "@/lib/mail";
import {
  EMPTY_FIELDS,
  renderedAgreement,
  type ContractFields,
} from "@/lib/cohosting-agreement";
import { clientIp, newContractId, saveContract } from "@/lib/contracts-store";
import { getInquiry, getInvite, saveInquiry, saveInvite } from "@/lib/owner-inquiries";

const FIELD_KEYS = Object.keys(EMPTY_FIELDS) as (keyof ContractFields)[];

function str(v: unknown, max = 500): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (str(body.website, 80)) {
      return NextResponse.json({ ok: true });
    }

    const inviteToken = str(body.invite, 80);
    const inv = await getInvite(inviteToken);
    if (!inv) {
      return NextResponse.json(
        { ok: false, error: "This agreement is only available from the private link Brian sends after he reviews the home." },
        { status: 403 },
      );
    }
    if (inv.usedAt) {
      return NextResponse.json({ ok: false, error: "This agreement link was already used." }, { status: 410 });
    }

    const fields: ContractFields = { ...EMPTY_FIELDS };
    for (const k of FIELD_KEYS) {
      fields[k] = str(body[k], k === "mailingAddress" || k === "accommodationsAddress" ? 400 : 200);
    }

    const agreed = body.agreed === true;
    if (!fields.subscriberName || !fields.email || !fields.accommodationsAddress || !fields.startDate) {
      return NextResponse.json(
        { ok: false, error: "Name, email, property address, and start date are required." },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }
    if (!agreed || !fields.signatureName) {
      return NextResponse.json(
        { ok: false, error: "Type your name as signature and check that you agree." },
        { status: 400 },
      );
    }

    const agreement = renderedAgreement(fields);
    const id = newContractId(fields.subscriberName);
    const recordBase = {
      id,
      submittedAt: new Date().toISOString(),
      ip: clientIp(req),
      userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
      fields,
      agreement,
    };

    try {
      await saveContract({ ...recordBase, emailVia: null, emailError: null });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Could not save the signed agreement. Try again or email Brian directly." },
        { status: 502 },
      );
    }

    const subject = `Co-hosting agreement: ${fields.subscriberName} — ${fields.accommodationsAddress}`;
    const text = [
      "A new owner submitted the co-hosting agreement.",
      "",
      `Log id: ${id}`,
      `View: https://mybransonvacation.com/contracts/log`,
      "",
      `Name: ${fields.subscriberName}`,
      `Co-owner: ${fields.coSubscriberName || "(none)"}`,
      `Email: ${fields.email}`,
      `Phone: ${fields.phone || "(none)"}`,
      `Mailing: ${fields.mailingAddress || "(none)"}`,
      `Property: ${fields.accommodationsAddress}`,
      `Start date: ${fields.startDate}`,
      `Typed signature: ${fields.signatureName} on ${fields.signatureDate || "(no date)"}`,
      fields.coSignatureName
        ? `Co-signature: ${fields.coSignatureName} on ${fields.coSignatureDate || "(no date)"}`
        : "",
      "",
      "—— AGREEMENT ——",
      "",
      agreement,
    ]
      .filter(Boolean)
      .join("\n");

    let emailVia: string | null = null;
    let emailError: string | null = null;
    const delivered = await sendMail({
      to: EMAIL,
      subject,
      text,
      replyTo: fields.email,
    });
    if (delivered.ok) emailVia = delivered.via || "email";
    else emailError = delivered.error || "email failed";

    try {
      await saveContract({ ...recordBase, emailVia, emailError }, true);
    } catch {
      /* already stored; email status is extra */
    }

    inv.usedAt = new Date().toISOString();
    inv.contractId = id;
    try {
      await saveInvite(inv, true);
      if (inv.inquiryId) {
        const inq = await getInquiry(inv.inquiryId);
        if (inq) {
          inq.status = "signed";
          await saveInquiry(inq, true);
        }
      }
    } catch {
      /* contract is stored */
    }

    return NextResponse.json({ ok: true, id, emailed: Boolean(emailVia) });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to process." }, { status: 500 });
  }
}
