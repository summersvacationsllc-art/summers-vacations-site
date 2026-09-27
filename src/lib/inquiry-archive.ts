import { put } from "@vercel/blob";
import type { OwnerInquiry } from "@/lib/owner-inquiries";

/** Human-readable + JSON archive copies. Never delete on sign — only update status. */
export function inquiryArchiveMarkdown(rec: OwnerInquiry): string {
  const lines = [
    `# Owner review card — ${rec.name}`,
    "",
    `- **Id:** ${rec.id}`,
    `- **Submitted:** ${rec.submittedAt}`,
    `- **Status:** ${rec.status}`,
    `- **Source:** ${rec.source === "met" ? "already met" : "website"}`,
    `- **Name:** ${rec.name}`,
    `- **Email:** ${rec.email}`,
    `- **Phone:** ${rec.phone || "(none)"}`,
    `- **Address:** ${rec.address}`,
    `- **Area / market:** ${rec.area || "(blank)"}`,
    `- **Listing URL:** ${rec.listingUrl || "(none)"}`,
    `- **Sleeps:** ${rec.sleeps || "(blank)"}`,
    `- **Beds:** ${rec.beds || "(blank)"}`,
    `- **Photos stored:** ${(rec.photoPathnames || []).length}`,
    `- **Invite token:** ${rec.inviteToken || "(none)"}`,
    `- **Contract id:** ${rec.contractId || "(none)"}`,
    `- **Signed at:** ${rec.signedAt || "(not signed)"}`,
    `- **Invite emailed at:** ${rec.inviteEmailedAt || "(no)"}`,
    `- **Brian notify:** ${rec.notifyVia || rec.notifyError || "(none)"}`,
    "",
    "## Notes",
    "",
    rec.notes?.trim() || "(no notes)",
    "",
    "## Photo pathnames",
    "",
    ...(rec.photoPathnames?.length
      ? rec.photoPathnames.map((p) => `- ${p}`)
      : ["(none)"]),
    "",
    "---",
    "Summers Vacations owner desk archive. Kept after approve / sign / decline.",
    "",
  ];
  return lines.join("\n");
}

export function inquiryArchiveTxt(rec: OwnerInquiry): string {
  return inquiryArchiveMarkdown(rec)
    .replace(/^#+\s*/gm, "")
    .replace(/^\*\*(.+?)\*\*:/gm, "$1:")
    .replace(/^- /gm, "• ");
}

export async function writeInquiryArchive(rec: OwnerInquiry): Promise<void> {
  const base = `archives/owner-reviews/${rec.id}`;
  const md = inquiryArchiveMarkdown(rec);
  const json = JSON.stringify(rec, null, 2);
  await Promise.all([
    put(`${base}.md`, md, {
      access: "private",
      contentType: "text/markdown; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(`${base}.json`, json, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(`${base}.txt`, inquiryArchiveTxt(rec), {
      access: "private",
      contentType: "text/plain; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
  ]);
}
