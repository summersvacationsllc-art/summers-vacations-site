import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
    `Stored: ${rec.submittedAt || ""} · Log id: ${rec.id}`,
    "",
    "—— AGREEMENT ——",
    "",
  ].filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""));

  return [...header, ...String(rec.agreement || "").replace(/\r\n/g, "\n").split("\n")];
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

export async function buildContractPdf(rec: StoredContract): Promise<Buffer> {
  const pdf = await PDFDocument.create();
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

  const bytes = await pdf.save();
  return Buffer.from(bytes);
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
