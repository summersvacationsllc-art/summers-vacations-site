import { EMAIL } from "@/lib/site";

export type MailResult = { ok: boolean; via?: string; error?: string };

/** Prefer Brian's Gmail as From. Resend can only send from a verified domain. */
const GMAIL_FROM = `Summers Vacations <${EMAIL}>`;
const RESEND_FROM_DEFAULT = "Summers Vacations <operations@summers-vacations.com>";

function env(name: string): string {
  return (process.env[name] || "").trim();
}

/** Gmail SMTP (app password). True From = summersvacationsllc@gmail.com */
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

  // Lightweight SMTP over TLS without extra deps (Vercel Node runtime).
  const net = await import("node:tls");
  const host = "smtp.gmail.com";
  const port = 465;

  const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
  const fromHeader = GMAIL_FROM;
  const reply = opts.replyTo || EMAIL;
  const toHeader = opts.to.join(", ");
  const raw = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Reply-To: ${reply}`,
    `Subject: ${opts.subject.replace(/[\r\n]+/g, " ")}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    b64(opts.text).replace(/.{1,76}/g, (m) => m + "\r\n").trim(),
    "",
  ].join("\r\n");

  const mailFrom = user;
  const rcpts = opts.to;

  try {
    await new Promise<void>((resolve, reject) => {
      const socket = net.connect({ host, port, servername: host }, () => {
        let buf = "";
        let step:
          | "banner"
          | "ehlo"
          | "auth"
          | "user"
          | "pass"
          | "mail"
          | "rcpt"
          | "data"
          | "body"
          | "quit" = "banner";
        let rcptIdx = 0;

        const write = (line: string) => {
          socket.write(line + "\r\n");
        };

        socket.on("data", (chunk: Buffer) => {
          buf += chunk.toString("utf8");
          const parts = buf.split(/\r?\n/);
          buf = parts.pop() || "";
          for (const line of parts) {
            if (!/^\d{3}[ \-]/.test(line)) continue;
            const code = parseInt(line.slice(0, 3), 10);
            const cont = line[3] === "-";
            if (cont) continue;

            try {
              if (step === "banner") {
                if (code !== 220) throw new Error(line);
                write(`EHLO mybransonvacation.com`);
                step = "ehlo";
              } else if (step === "ehlo") {
                if (code !== 250) throw new Error(line);
                write("AUTH LOGIN");
                step = "auth";
              } else if (step === "auth") {
                if (code !== 334) throw new Error(line);
                write(b64(user));
                step = "user";
              } else if (step === "user") {
                if (code !== 334) throw new Error(line);
                write(b64(pass));
                step = "pass";
              } else if (step === "pass") {
                if (code !== 235) throw new Error("Gmail auth failed. Check app password.");
                write(`MAIL FROM:<${mailFrom}>`);
                step = "mail";
              } else if (step === "mail") {
                if (code !== 250) throw new Error(line);
                rcptIdx = 0;
                write(`RCPT TO:<${rcpts[rcptIdx]}>`);
                step = "rcpt";
              } else if (step === "rcpt") {
                if (code !== 250 && code !== 251) throw new Error(line);
                rcptIdx += 1;
                if (rcptIdx < rcpts.length) {
                  write(`RCPT TO:<${rcpts[rcptIdx]}>`);
                } else {
                  write("DATA");
                  step = "data";
                }
              } else if (step === "data") {
                if (code !== 354) throw new Error(line);
                // Dot-stuff lines that start with .
                const stuffed = raw
                  .split(/\r?\n/)
                  .map((l) => (l.startsWith(".") ? "." + l : l))
                  .join("\r\n");
                socket.write(stuffed + "\r\n.\r\n");
                step = "body";
              } else if (step === "body") {
                if (code !== 250) throw new Error(line);
                write("QUIT");
                step = "quit";
              } else if (step === "quit") {
                socket.end();
                resolve();
              }
            } catch (e) {
              socket.destroy();
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          }
        });

        socket.on("error", reject);
        socket.on("end", () => {
          if (step !== "quit") reject(new Error("SMTP connection closed early."));
        });
      });
      socket.setTimeout(25000, () => {
        socket.destroy();
        reject(new Error("SMTP timeout."));
      });
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
  // Never use a gmail.com From on Resend — domain must be verified there.
  let from = env("EMAIL_FROM") || RESEND_FROM_DEFAULT;
  if (/@gmail\.com>/i.test(from) || /@gmail\.com$/i.test(from)) {
    from = RESEND_FROM_DEFAULT;
  }
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

/** Transactional mail. Gmail SMTP first (true From), then Resend, then FormSubmit (Brian only). */
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
    const err = [gmail.error, resend.error].filter(Boolean).join(" | ") || "Owner email failed.";
    return { ok: false, error: err.slice(0, 240) };
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
      "Questions: call or text 314-565-0589, or reply to this email (summersvacationsllc@gmail.com).",
      "",
      "Brian Summers",
      "Summers Vacations",
    ].join("\n"),
  };
}

/** Open the owner's mail client with the same letter when server mail is not configured. */
export function ownerContractMailto(opts: { name: string; email: string; address: string; url: string }): string {
  const letter = ownerContractEmail(opts);
  const to = encodeURIComponent(opts.email.trim());
  const subject = encodeURIComponent(letter.subject);
  const body = encodeURIComponent(letter.text);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}
