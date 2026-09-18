/** Browser-only notify. FormSubmit works from the live site origin, not from Vercel. */
const BRIAN = "summersvacationsllc@gmail.com";

export async function notifyBrianFromBrowser(opts: {
  subject: string;
  message: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${BRIAN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: opts.subject,
        _template: "box",
        _captcha: "false",
        name: "Summers Vacations",
        email: opts.replyTo || BRIAN,
        message: opts.message,
      }),
    });
    const j = (await r.json()) as { success?: string | boolean };
    return j.success === true || j.success === "true";
  } catch {
    return false;
  }
}
