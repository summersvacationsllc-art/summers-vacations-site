import { EMAIL } from "@/lib/site";

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
      `Questions: call or text 314-565-0589, or reply to this email (${EMAIL}).`,
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
