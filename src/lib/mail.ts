import nodemailer from "nodemailer";
import { EMAIL } from "@/lib/site";

export type MailResult = { ok: boolean; via?: string; error?: string };

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
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((s) => s.trim()).filter(Boolean);
  if (!to.length) return { ok: false, error: "No recipient." };

  const gmail = await sendViaGmail({
    to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });
  if (gmail.ok) return gmail;

  const resend = await sendViaResend({
    to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo || EMAIL,
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
      message: opts.text,
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

export function ownerContractEmail(opts: { name: string; address: string; url: string }): {
  subject: string;
  text: string;
} {
  return {
    subject: `Your Summers Vacations co-hosting agreement — ${opts.address}`,
    text: [
      `Hi ${opts.name},`,
      "",
      `Brian reviewed ${opts.address} and is sending you the Summers Vacations co-hosting agreement.`,
      "",
      "Open this private link. It is one-time — do not forward it:",
      opts.url,
      "",
      "Fill any blanks, read the terms, then type your name to sign. Print a copy for your records. Brian countersigns after he receives it.",
      "",
      "Questions: call or text 314-565-0589, or reply to this email (summersvacationsllc@gmail.com).",
      "",
      "Brian Summers",
      "Summers Vacations",
    ].join("\n"),
  };
}

/** Open the owner's mail client with the same letter when server mail is not configured. */
export function ownerContractMailto(opts: {
  name: string;
  email: string;
  address: string;
  url: string;
}): string {
  const letter = ownerContractEmail(opts);
  const to = encodeURIComponent(opts.email.trim());
  const subject = encodeURIComponent(letter.subject);
  const body = encodeURIComponent(letter.text);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
