import nodemailer from "nodemailer";
import { EMAIL } from "@/lib/site";
import { ownerContractEmail, ownerContractMailto } from "@/lib/contract-mail-copy";

export type MailResult = { ok: boolean; via?: string; error?: string };

/** File attached to an outgoing email (e.g. a signed contract PDF). */
export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

export { ownerContractEmail, ownerContractMailto };

/** True From for owners — Brian's Gmail. */
const GMAIL_FROM = `Summers Vacations <${EMAIL}>`;
/** Resend only allows verified domains (not @gmail.com). */
const RESEND_FROM_DEFAULT = "Summers Vacations <operations@summers-vacations.com>";

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function isGmailAddress(from: string): boolean {
  return /@gmail\.com\b/i.test(from);
}

/** Gmail SMTP with app password — From = summersvacationsllc@gmail.com */
async function sendViaGmail(opts: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<MailResult> {
  const user = env("GMAIL_SMTP_USER") || EMAIL;
  const pass = env("GMAIL_APP_PASSWORD") || env("GMAIL_SMTP_PASS");
  if (!pass || pass === "[SENSITIVE]") {
    return { ok: false, error: "Gmail SMTP not configured." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: GMAIL_FROM,
      to: opts.to.join(", "),
      replyTo: opts.replyTo || EMAIL,
      subject: opts.subject,
      text: opts.text,
      attachments: (opts.attachments || []).map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return { ok: true, via: "gmail" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gmail SMTP failed.";
    return { ok: false, error: msg.slice(0, 200) };
  }
}

async function sendViaResend(opts: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<MailResult> {
  const resendKey = env("RESEND_API_KEY");
  if (!resendKey || resendKey === "[SENSITIVE]") {
    return { ok: false, error: "Resend not configured." };
  }

  let from = env("EMAIL_FROM") || RESEND_FROM_DEFAULT;
  if (isGmailAddress(from)) from = RESEND_FROM_DEFAULT;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      reply_to: opts.replyTo || EMAIL,
      subject: opts.subject,
      text: opts.text,
      ...(opts.attachments?.length
        ? {
            attachments: opts.attachments.map((a) => ({
              filename: a.filename,
              content: a.content.toString("base64"),
            })),
          }
        : {}),
    }),
  });
  if (r.ok) return { ok: true, via: "resend" };
  let detail = "Email provider rejected the message.";
  try {
    const j = (await r.json()) as { message?: string };
    if (j.message) detail = j.message.slice(0, 200);
  } catch {
    /* keep default */
  }
  return { ok: false, error: detail };
}

/**
 * Transactional mail.
 * 1) Gmail SMTP → From summersvacationsllc@gmail.com (preferred)
 * 2) Resend → From operations@summers-vacations.com, Reply-To Gmail
 * 3) FormSubmit → Brian only
 */
/**
 * Local testing only: when MAIL_DRY_RUN_DIR is set (and not running on Vercel), nothing is sent.
 * The message (and any attachments) is written to that folder instead.
 */
async function writeDryRun(opts: {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<MailResult | null> {
  const dir = env("MAIL_DRY_RUN_DIR");
  if (!dir || process.env.VERCEL) return null;
  const { mkdir, writeFile } = await import("fs/promises");
  const path = await import("path");
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = opts.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  const base = path.join(dir, `${stamp}-${slug}`);
  const files: { filename: string; bytes: number; savedAs: string }[] = [];
  for (const [i, a] of (opts.attachments || []).entries()) {
    const savedAs = `${base}-att${i + 1}-${a.filename.replace(/[^A-Za-z0-9._-]/g, "_")}`;
    await writeFile(savedAs, a.content);
    files.push({ filename: a.filename, bytes: a.content.length, savedAs });
  }
  await writeFile(
    `${base}.json`,
    JSON.stringify(
      { from: GMAIL_FROM, to: opts.to, replyTo: opts.replyTo || EMAIL, subject: opts.subject, text: opts.text, attachments: files },
      null,
      2,
    ),
  );
  return { ok: true, via: "dry-run" };
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}): Promise<MailResult> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((s) => s.trim()).filter(Boolean);
  if (!to.length) return { ok: false, error: "No recipient." };

  const dry = await writeDryRun({ ...opts, to });
  if (dry) return dry;

  const gmail = await sendViaGmail({
    to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
  if (gmail.ok) return gmail;

  const resend = await sendViaResend({
    to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo || EMAIL,
    attachments: opts.attachments,
  });
  if (resend.ok) return resend;

  const onlyBrian = to.length === 1 && to[0].toLowerCase() === EMAIL.toLowerCase();
  if (!onlyBrian) {
    const err =
      [gmail.error && `gmail: ${gmail.error}`, resend.error && `resend: ${resend.error}`]
        .filter(Boolean)
        .join(" | ") || "Owner email failed.";
    return { ok: false, error: err.slice(0, 280) };
  }

  const fs = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(EMAIL)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: opts.subject,
      _template: "box",
      _captcha: "false",
      name: "Summers Vacations desk",
      email: opts.replyTo || EMAIL,
      message: opts.attachments?.length
        ? `${opts.text}\n\n(Attachment not included in this backup email. Download the PDF from https://mybransonvacation.com/contracts/log)`
        : opts.text,
    }),
  });
  let body: { success?: string | boolean; message?: string } = {};
  try {
    body = (await fs.json()) as typeof body;
  } catch {
    /* ignore */
  }
  const success = body.success === true || body.success === "true";
  if (fs.ok && success) return { ok: true, via: "formsubmit" };
  const msg = (body.message || gmail.error || resend.error || "FormSubmit did not send.").slice(0, 240);
  return { ok: false, error: msg };
}
