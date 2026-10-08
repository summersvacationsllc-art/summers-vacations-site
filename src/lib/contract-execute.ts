// Server-only: post-signature processing for every client-signed contract.
import { createHash } from "crypto";
import { EMAIL } from "@/lib/site";
import { sendMail, type MailResult } from "@/lib/mail";
import { buildContractPdf, contractFileBase, formatCentral } from "@/lib/contract-download";
import {
  claimOnce,
  readExecutedPdf,
  saveContract,
  saveExecutedPdf,
  type ContractExecution,
  type StoredContract,
} from "@/lib/contracts-store";
import { autoCountersignFlagOn, emailSignedCopyOn, templateFor } from "@/lib/contract-templates";
import { loadHostSignaturePng } from "@/lib/host-signature";

export const HOST_SIGNER = "Brian Summers, Summers Vacations LLC";

function emptyExecution(templateId: string): ContractExecution {
  return {
    templateId,
    status: "signed",
    countersignedAt: null,
    countersignedBy: null,
    countersignMethod: null,
    countersignSkipped: null,
    pdfPathname: null,
    pdfSha256: null,
    pdfBuiltAt: null,
    signerEmailedTo: [],
    signerEmailedAt: null,
    signerEmailVia: null,
    signerEmailError: null,
    brianEmailedAt: null,
    brianEmailVia: null,
    brianEmailError: null,
    resends: [],
  };
}

function signerEmails(rec: StoredContract): string[] {
  const list = [rec.fields.email]
    .map((e) => (e || "").trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return Array.from(new Set(list.map((e) => e.toLowerCase())));
}

function signerNames(rec: StoredContract): string {
  return [rec.fields.subscriberName, rec.fields.coSubscriberName].filter(Boolean).join(" and ") || "there";
}

export function signerCopyEmail(rec: StoredContract): { subject: string; text: string } {
  const countersigned = rec.execution?.status === "countersigned";
  const t = templateFor(rec.templateId);
  return {
    subject: `Your signed ${t.title} — ${rec.fields.accommodationsAddress}`,
    text: [
      `Hi ${signerNames(rec)},`,
      "",
      countersigned
        ? `Thank you for signing. Your ${t.title} for ${rec.fields.accommodationsAddress} is now fully executed. Brian Summers countersigned it for Summers Vacations LLC on ${formatCentral(rec.execution?.countersignedAt)}.`
        : `Thank you for signing. Attached is your signed copy of the ${t.title} for ${rec.fields.accommodationsAddress}.`,
      "",
      "Your copy is attached as a PDF. Please keep it for your records.",
      "",
      `Questions: call or text 314-565-0589, or reply to this email (${EMAIL}).`,
      "",
      "Brian Summers",
      "Summers Vacations",
    ].join("\n"),
  };
}

export function brianNoticeEmail(rec: StoredContract): { subject: string; text: string } {
  const ex = rec.execution;
  const f = rec.fields;
  const countersigned = ex?.status === "countersigned";
  const t = templateFor(rec.templateId);
  return {
    subject: `${countersigned ? "Signed + countersigned" : "Signed"}: ${t.title} — ${f.subscriberName} — ${f.accommodationsAddress}`,
    text: [
      countersigned
        ? `${f.subscriberName} signed the ${t.title}. Your signature was applied automatically (${formatCentral(ex?.countersignedAt)}). The executed PDF is attached.`
        : `${f.subscriberName} signed the ${t.title}. The client-signed PDF is attached.${ex?.countersignSkipped ? ` Not countersigned: ${ex.countersignSkipped}.` : ""}`,
      ex?.signerEmailedAt
        ? `The same PDF was emailed to ${ex.signerEmailedTo.join(", ")}.`
        : ex?.signerEmailError
          ? `The signer copy did NOT send (${ex.signerEmailError}). Resend it from the contract log.`
          : "The signer copy was not emailed.",
      "",
      `Log id: ${rec.id}`,
      "View: https://mybransonvacation.com/contracts/log",
      "",
      `Name: ${f.subscriberName}`,
      `Co-owner: ${f.coSubscriberName || "(none)"}`,
      `Email: ${f.email}`,
      `Phone: ${f.phone || "(none)"}`,
      `Mailing: ${f.mailingAddress || "(none)"}`,
      `Property: ${f.accommodationsAddress}`,
      `Start date: ${f.startDate}`,
      `Typed signature: ${f.signatureName} on ${f.signatureDate || "(no date)"}`,
      f.coSignatureName ? `Co-signature: ${f.coSignatureName} on ${f.coSignatureDate || "(no date)"}` : "",
      "",
      "—— AGREEMENT ——",
      "",
      rec.agreement,
    ]
      .filter((l, i, a) => l !== "" || a[i - 1] !== "")
      .join("\n"),
  };
}

async function persist(rec: StoredContract): Promise<void> {
  try {
    await saveContract(rec, true);
  } catch {
    /* the signed record already exists; execution status is extra */
  }
}

/**
 * Build (once) the PDF for a freshly signed contract, apply Brian's countersignature when allowed,
 * store the PDF with the record, and email it to the signer(s) and to Brian (one email each).
 * Safe to call more than once: a one-time claim blocks duplicate sends.
 */
export async function executeSignedContract(input: StoredContract): Promise<{
  record: StoredContract;
  brianEmailed: boolean;
  signerEmailed: boolean;
  countersigned: boolean;
  skippedDuplicate: boolean;
}> {
  const rec: StoredContract = { ...input, templateId: input.templateId || templateFor(null).id };
  const tmpl = templateFor(rec.templateId);

  if (rec.execution?.brianEmailedAt || rec.execution?.signerEmailedAt) {
    return {
      record: rec,
      brianEmailed: Boolean(rec.execution.brianEmailedAt),
      signerEmailed: Boolean(rec.execution.signerEmailedAt),
      countersigned: rec.execution.status === "countersigned",
      skippedDuplicate: true,
    };
  }

  const ex: ContractExecution = rec.execution ? { ...rec.execution } : emptyExecution(tmpl.id);
  rec.execution = ex;

  let sigPng: Buffer | null = null;
  if (!tmpl.autoCountersign) {
    ex.countersignSkipped = "this template is not set up for automatic countersignature";
  } else if (!autoCountersignFlagOn()) {
    ex.countersignSkipped = "automatic countersignature is off (AUTO_COUNTERSIGN is not true)";
  } else {
    sigPng = await loadHostSignaturePng();
    if (!sigPng) {
      ex.countersignSkipped = "Host signature image is not configured on the server";
    } else {
      ex.status = "countersigned";
      ex.countersignedAt = new Date().toISOString();
      ex.countersignedBy = HOST_SIGNER;
      ex.countersignMethod = "auto";
      ex.countersignSkipped = null;
    }
  }

  const pdf = await buildContractPdf(rec, { hostSignaturePng: sigPng });
  ex.pdfSha256 = createHash("sha256").update(pdf).digest("hex");
  ex.pdfBuiltAt = new Date().toISOString();
  try {
    ex.pdfPathname = await saveExecutedPdf(rec.id, pdf);
  } catch {
    ex.pdfPathname = null;
  }
  await persist(rec);

  if (!(await claimOnce(rec.id, "signed-copy-email"))) {
    return { record: rec, brianEmailed: false, signerEmailed: false, countersigned: ex.status === "countersigned", skippedDuplicate: true };
  }

  const filename = `${contractFileBase(rec)}${ex.status === "countersigned" ? "-executed" : "-signed"}.pdf`;
  const attachments = [{ filename, content: pdf, contentType: "application/pdf" }];

  const signers = signerEmails(rec);
  if (emailSignedCopyOn() && signers.length) {
    const letter = signerCopyEmail(rec);
    const r = await sendMail({ to: signers, subject: letter.subject, text: letter.text, replyTo: EMAIL, attachments });
    if (r.ok) {
      ex.signerEmailedTo = signers;
      ex.signerEmailedAt = new Date().toISOString();
      ex.signerEmailVia = r.via || null;
    } else {
      ex.signerEmailError = r.error || "email failed";
    }
  } else if (!emailSignedCopyOn()) {
    ex.signerEmailError = "signer copy turned off (EMAIL_SIGNED_COPY=false)";
  }

  const notice = brianNoticeEmail(rec);
  const b: MailResult = await sendMail({
    to: EMAIL,
    subject: notice.subject,
    text: notice.text,
    replyTo: rec.fields.email,
    attachments,
  });
  if (b.ok) {
    ex.brianEmailedAt = new Date().toISOString();
    ex.brianEmailVia = b.via || null;
  } else {
    ex.brianEmailError = b.error || "email failed";
  }
  await persist(rec);

  return {
    record: rec,
    brianEmailed: b.ok,
    signerEmailed: Boolean(ex.signerEmailedAt),
    countersigned: ex.status === "countersigned",
    skippedDuplicate: false,
  };
}

/**
 * Contract-log action: re-send the stored PDF. Never adds Brian's signature to a record that
 * was not already countersigned (older records get the client-signed PDF).
 */
export async function resendSignedCopy(
  input: StoredContract,
  target: "signer" | "brian" | "both",
): Promise<{ ok: boolean; to: string[]; error: string | null; record: StoredContract }> {
  const rec: StoredContract = { ...input, templateId: input.templateId || templateFor(null).id };
  const ex: ContractExecution = rec.execution
    ? { ...rec.execution, resends: [...(rec.execution.resends || [])] }
    : { ...emptyExecution(rec.templateId!), countersignSkipped: "signed before automatic countersignature existed" };
  rec.execution = ex;

  let pdf = await readExecutedPdf(rec);
  if (!pdf) {
    const sig = ex.status === "countersigned" ? await loadHostSignaturePng() : null;
    if (ex.status === "countersigned" && !sig) {
      return { ok: false, to: [], error: "Signature image missing; cannot rebuild the executed PDF.", record: rec };
    }
    pdf = await buildContractPdf(rec, { hostSignaturePng: sig });
    ex.pdfSha256 = createHash("sha256").update(pdf).digest("hex");
    ex.pdfBuiltAt = new Date().toISOString();
    try {
      ex.pdfPathname = await saveExecutedPdf(rec.id, pdf);
    } catch {
      /* send anyway */
    }
  }

  const filename = `${contractFileBase(rec)}${ex.status === "countersigned" ? "-executed" : "-signed"}.pdf`;
  const attachments = [{ filename, content: pdf, contentType: "application/pdf" }];
  const sent: string[] = [];
  const errors: string[] = [];

  if (target === "signer" || target === "both") {
    const to = signerEmails(rec);
    if (!to.length) errors.push("no valid signer email");
    else {
      const letter = signerCopyEmail(rec);
      const r = await sendMail({ to, subject: letter.subject, text: letter.text, replyTo: EMAIL, attachments });
      if (r.ok) sent.push(...to);
      else errors.push(r.error || "signer email failed");
      ex.resends.push({ at: new Date().toISOString(), to, via: r.via || null, error: r.ok ? null : r.error || "failed" });
    }
  }
  if (target === "brian" || target === "both") {
    const notice = brianNoticeEmail(rec);
    const r = await sendMail({
      to: EMAIL,
      subject: `(Resent) ${notice.subject}`,
      text: notice.text,
      replyTo: rec.fields.email,
      attachments,
    });
    if (r.ok) sent.push(EMAIL);
    else errors.push(r.error || "Brian email failed");
    ex.resends.push({ at: new Date().toISOString(), to: [EMAIL], via: r.via || null, error: r.ok ? null : r.error || "failed" });
  }
  await persist(rec);
  return { ok: errors.length === 0, to: sent, error: errors.join(" | ") || null, record: rec };
}
