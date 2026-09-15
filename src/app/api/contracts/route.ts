import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import {
  EMPTY_FIELDS,
  renderedAgreement,
  type ContractFields,
} from "@/lib/cohosting-agreement";

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
    const subject = `Co-hosting agreement: ${fields.subscriberName} — ${fields.accommodationsAddress}`;
    const text = [
      "A new owner submitted the co-hosting agreement.",
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

    const delivered = await deliver(subject, text, fields.email, fields.subscriberName);
    if (!delivered.ok) {
      return NextResponse.json(
        { ok: false, error: delivered.error || "Could not send. Try again or email Brian directly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, via: delivered.via });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to process." }, { status: 500 });
  }
}

async function deliver(
  subject: string,
  text: string,
  replyTo: string,
  fromName: string,
): Promise<{ ok: boolean; via?: string; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY || "";
  if (resendKey) {
    const from = process.env.EMAIL_FROM || "Summers Vacations <summersvacationsllc@gmail.com>";
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [EMAIL],
        reply_to: replyTo,
        subject,
        text,
      }),
    });
    if (r.ok) return { ok: true, via: "resend" };
    return { ok: false, error: "Email provider rejected the message." };
  }

  const fs = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "box",
      name: fromName,
      email: replyTo,
      message: text,
    }),
  });
  if (fs.ok) return { ok: true, via: "formsubmit" };
  return { ok: false, error: "Could not reach the mail service." };
}
