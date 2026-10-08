export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import { sendMail } from "@/lib/mail";
import {
  EMPTY_FIELDS,
  renderedAgreement,
  type ContractFields,
} from "@/lib/cohosting-agreement";
import { clientIp, newContractId, saveContract, type StoredContract } from "@/lib/contracts-store";
import { executeSignedContract } from "@/lib/contract-execute";
import { OWNER_COHOSTING_TEMPLATE_ID } from "@/lib/contract-templates";
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

    let inquiryId: string | null = inv.inquiryId || null;
    let inquirySnapshot: StoredContract["inquirySnapshot"] = null;
    if (inv.inquiryId) {
      try {
        const inq = await getInquiry(inv.inquiryId);
        if (inq) {
          inquiryId = inq.id;
          inquirySnapshot = {
            name: inq.name,
            email: inq.email,
            phone: inq.phone,
            address: inq.address,
            area: inq.area,
            listingUrl: inq.listingUrl,
            sleeps: inq.sleeps,
            beds: inq.beds,
            notes: inq.notes,
            source: inq.source,
            photoCount: inq.photoPathnames?.length || 0,
            submittedAt: inq.submittedAt,
          };
        }
      } catch {
        /* optional */
      }
    }

    const recordBase = {
      id,
      templateId: OWNER_COHOSTING_TEMPLATE_ID,
      submittedAt: new Date().toISOString(),
      ip: clientIp(req),
      userAgent: (req.headers.get("user-agent") || "").slice(0, 300),
      fields,
      agreement,
      inquiryId,
      inquirySnapshot,
    };

    try {
      await saveContract({ ...recordBase, emailVia: null, emailError: null });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Could not save the signed agreement. Try again or email Brian directly." },
        { status: 502 },
      );
    }

    // Post-signature: build the signed PDF, apply Brian's automatic countersignature when allowed
    // (owner co-hosting template + AUTO_COUNTERSIGN=true), store it, and email it to the signer(s)
    // and to Brian — one email each, guarded against duplicates.
    let emailed = false;
    let signerEmailed = false;
    let countersigned = false;
    try {
      const result = await executeSignedContract({
        ...recordBase,
        emailVia: null,
        emailError: null,
      });
      emailed = result.brianEmailed;
      signerEmailed = result.signerEmailed;
      countersigned = result.countersigned;
      if (!result.skippedDuplicate) {
        const ex = result.record.execution;
        await saveContract(
          {
            ...result.record,
            emailVia: ex?.brianEmailVia || null,
            emailError: ex?.brianEmailError || null,
          },
          true,
        ).catch(() => {});
      }
    } catch {
      // Never lose Brian's notice: fall back to the plain-text notice.
      const delivered = await sendMail({
        to: EMAIL,
        subject: `Co-hosting agreement: ${fields.subscriberName} — ${fields.accommodationsAddress}`,
        text: [
          "A new owner submitted the co-hosting agreement. (The signed PDF could not be built; download it from the log.)",
          "",
          `Log id: ${id}`,
          `View: https://mybransonvacation.com/contracts/log`,
          "",
          agreement,
        ].join("\n"),
        replyTo: fields.email,
      });
      emailed = delivered.ok;
      await saveContract(
        { ...recordBase, emailVia: delivered.ok ? delivered.via || "email" : null, emailError: delivered.ok ? null : delivered.error || "email failed" },
        true,
      ).catch(() => {});
    }

    inv.usedAt = new Date().toISOString();
    inv.contractId = id;
    try {
      await saveInvite(inv, true);
      if (inv.inquiryId) {
        const inq = await getInquiry(inv.inquiryId);
        if (inq) {
          inq.status = "signed";
          inq.contractId = id;
          inq.signedAt = new Date().toISOString();
          await saveInquiry(inq, true);
        }
      }
    } catch {
      /* contract is stored */
    }

    return NextResponse.json({ ok: true, id, emailed, signerEmailed, countersigned });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to process." }, { status: 500 });
  }
}
