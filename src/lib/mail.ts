import { EMAIL } from "@/lib/site";

export type MailResult = { ok: boolean; via?: string; error?: string };

const FROM_DEFAULT = "Summers Vacations <operations@summers-vacations.com>";

/** Transactional mail. Resend first. FormSubmit can only reach Brian's inbox. */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const to = (Array.isArray(opts.to) ? opts.to : [opts.to]).map((s) => s.trim()).filter(Boolean);
  if (!to.length) return { ok: false, error: "No recipient." };

  const resendKey = (process.env.RESEND_API_KEY || "").trim();
  if (resendKey && resendKey !== "[SENSITIVE]") {
    const from = (process.env.EMAIL_FROM || FROM_DEFAULT).trim();
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
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

  const onlyBrian = to.length === 1 && to[0].toLowerCase() === EMAIL.toLowerCase();
  if (!onlyBrian) {
    return { ok: false, error: "Owner email needs Resend (not configured on this site)." };
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
  const msg = (body.message || "FormSubmit did not send.").slice(0, 240);
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
      "Questions: call or text 314-565-0589, or reply to this email.",
      "",
      "Brian Summers",
      "Summers Vacations",
    ].join("\n"),
  };
}

/** Open the owner's mail client with the same letter when server Resend is not configured. */
export function ownerContractMailto(opts: { name: string; email: string; address: string; url: string }): string {
  const letter = ownerContractEmail(opts);
  const to = encodeURIComponent(opts.email.trim());
  const subject = encodeURIComponent(letter.subject);
  const body = encodeURIComponent(letter.text);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
