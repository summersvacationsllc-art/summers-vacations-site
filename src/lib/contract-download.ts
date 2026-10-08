import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { StoredContract } from "@/lib/contracts-store";

export type ContractDownloadFormat = "txt" | "docx" | "pdf";

export function contractFileBase(rec: StoredContract): string {
  const name = (rec.fields.subscriberName || "owner")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const day = (rec.fields.signatureDate || rec.submittedAt || "").slice(0, 10) || "signed";
  return `cohosting-agreement-${name || "owner"}-${day}`;
}

function agreementLines(rec: StoredContract): string[] {
  const header = [
    "SUMMERS VACATIONS — CO-HOSTING AGREEMENT (SIGNED COPY)",
    `Subscriber: ${rec.fields.subscriberName || ""}`,
    rec.fields.coSubscriberName ? `Co-subscriber: ${rec.fields.coSubscriberName}` : "",
    `Email: ${rec.fields.email || ""}`,
    `Phone: ${rec.fields.phone || ""}`,
    `Property: ${rec.fields.accommodationsAddress || ""}`,
    `Start date: ${rec.fields.startDate || ""}`,
    `Typed signature: ${rec.fields.signatureName || ""} on ${rec.fields.signatureDate || ""}`,
    rec.fields.coSignatureName
      ? `Co-signature: ${rec.fields.coSignatureName} on ${rec.fields.coSignatureDate || ""}`
      : "",
    rec.execution?.status === "countersigned"
      ? `Host countersignature: ${rec.execution.countersignedBy || "Brian Summers, Summers Vacations LLC"} on ${formatCentral(rec.execution.countersignedAt)}`
      : "",
    `Stored: ${rec.submittedAt || ""} · Log id: ${rec.id}`,
    "",
    "—— AGREEMENT ——",
    "",
  ].filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""));

  return [...header, ...String(rec.agreement || "").replace(/\r\n/g, "\n").split("\n")];
}

/** "October 8, 2026, 10:06 AM CT" */
export function formatCentral(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${s} CT`;
}

export function buildContractTxt(rec: StoredContract): string {
  return agreementLines(rec).join("\n");
}

export async function buildContractDocx(rec: StoredContract): Promise<Buffer> {
  const lines = agreementLines(rec);
  const children: Paragraph[] = [
    new Paragraph({
      text: "Summers Vacations — Co-hosting agreement (signed copy)",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
    }),
  ];
  for (const line of lines) {
    if (line.startsWith("SUMMERS VACATIONS")) continue;
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line || " ",
            font: "Times New Roman",
            size: 22, // 11pt
          }),
        ],
        spacing: { after: line ? 60 : 120 },
      }),
    );
  }
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}

export async function buildContractPdf(
  rec: StoredContract,
  opts: { hostSignaturePng?: Buffer | null } = {},
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Co-hosting agreement — ${rec.fields.subscriberName || "owner"}`);
  pdf.setAuthor("Summers Vacations LLC");
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 11;
  const lineHeight = 14;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawLine = (text: string, bold = false) => {
    const use = bold ? fontBold : font;
    const words = text.split(/\s+/).filter(Boolean);
    if (!words.length) {
      y -= lineHeight;
      if (y < margin) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      return;
    }
    let current = "";
    const flush = (line: string) => {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font: use,
        color: rgb(0.05, 0.1, 0.2),
        maxWidth,
      });
      y -= lineHeight;
    };
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (use.widthOfTextAtSize(next, fontSize) <= maxWidth) {
        current = next;
      } else {
        if (current) flush(current);
        // hard-break very long tokens
        if (use.widthOfTextAtSize(w, fontSize) > maxWidth) {
          let chunk = "";
          for (const ch of w) {
            const trial = chunk + ch;
            if (use.widthOfTextAtSize(trial, fontSize) > maxWidth) {
              if (chunk) flush(chunk);
              chunk = ch;
            } else chunk = trial;
          }
          current = chunk;
        } else {
          current = w;
        }
      }
    }
    if (current) flush(current);
  };

  drawLine("Summers Vacations — Co-hosting agreement (signed copy)", true);
  y -= 6;
  for (const line of agreementLines(rec)) {
    if (line.startsWith("SUMMERS VACATIONS")) continue;
    drawLine(line);
  }

  if (rec.execution) {
    await drawSignaturePage(pdf, rec, { font, fontBold, hostSignaturePng: opts.hostSignaturePng || null });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

/**
 * Final page: signature block for each Subscriber (typed e-signature) and the Host.
 * The Host's image is drawn only when the record is countersigned and an image is supplied.
 */
async function drawSignaturePage(
  pdf: PDFDocument,
  rec: StoredContract,
  o: { font: PDFFont; fontBold: PDFFont; hostSignaturePng: Buffer | null },
) {
  const ex = rec.execution!;
  const script = await pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
  const page = pdf.addPage([612, 792]);
  const ink = rgb(0.05, 0.1, 0.2);
  const muted = rgb(0.3, 0.35, 0.45);
  const left = 54;
  let y = 792 - 60;
  const text = (t: string, size = 11, f: PDFFont = o.font, color = ink, x = left) => {
    const safe = t.replace(/[^\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, "?");
    page.drawText(safe, { x, y, size, font: f, color, maxWidth: 504 });
  };

  text(ex.status === "countersigned" ? "SIGNATURE PAGE — EXECUTED COPY" : "SIGNATURE PAGE — CLIENT-SIGNED COPY", 14, o.fontBold);
  y -= 18;
  text(`Summers Vacations LLC Co-Hosting Agreement · ${rec.fields.accommodationsAddress || ""}`, 10, o.font, muted);
  y -= 14;
  text(`Contract log id: ${rec.id}`, 9, o.font, muted);
  y -= 34;

  const signerBlock = (label: string, typed: string, printed: string, date: string) => {
    text(label, 11, o.fontBold);
    y -= 30;
    text(typed || "—", 22, script);
    y -= 8;
    page.drawLine({ start: { x: left, y }, end: { x: left + 300, y }, thickness: 0.8, color: ink });
    y -= 14;
    text(`Printed name: ${printed || ""}`, 10);
    y -= 13;
    text(`Date: ${date || ""}`, 10);
    y -= 13;
    text(
      `Signed electronically (typed name + "I agree") at mybransonvacation.com/contracts on ${formatCentral(rec.submittedAt)}${rec.ip ? ` from IP ${rec.ip}` : ""}.`,
      8.5,
      o.font,
      muted,
    );
    y -= 34;
  };

  signerBlock("SUBSCRIBER", rec.fields.signatureName, rec.fields.subscriberName, rec.fields.signatureDate);
  if (rec.fields.coSignatureName || rec.fields.coSubscriberName) {
    signerBlock(
      "CO-SUBSCRIBER",
      rec.fields.coSignatureName,
      rec.fields.coSubscriberName,
      rec.fields.coSignatureDate,
    );
  }

  text("HOST: Summers Vacations LLC", 11, o.fontBold);
  y -= 8;
  if (ex.status === "countersigned" && o.hostSignaturePng) {
    const img = await pdf.embedPng(o.hostSignaturePng);
    const maxW = 220;
    const maxH = 70;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    page.drawImage(img, { x: left, y: y - h, width: w, height: h });
    y -= h + 4;
  } else {
    y -= 40;
  }
  page.drawLine({ start: { x: left, y }, end: { x: left + 300, y }, thickness: 0.8, color: ink });
  y -= 14;
  text("Brian Summers, Summers Vacations LLC — Authorized Person", 10);
  y -= 13;
  if (ex.status === "countersigned") {
    text(`Date: ${formatCentral(ex.countersignedAt)}`, 10);
    y -= 13;
    text(
      ex.countersignMethod === "manual"
        ? "Countersigned by Host (Brian Summers) with his approval for this document."
        : "Countersigned automatically by Host on receipt of the Subscriber's signature.",
      8.5,
      o.font,
      muted,
    );
  } else {
    text("Host countersignature: pending. Host countersigns after receipt.", 10, o.font, muted);
  }
}

export function contentTypeFor(format: ContractDownloadFormat): string {
  if (format === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (format === "pdf") return "application/pdf";
  return "text/plain; charset=utf-8";
}

export function extensionFor(format: ContractDownloadFormat): string {
  return format;
}
