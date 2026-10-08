import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { autoCountersignFlagOn, emailSignedCopyOn } from "@/lib/contract-templates";
import { loadHostSignaturePng } from "@/lib/host-signature";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check for automatic countersignature. Never returns the image.
 * PIN holders get the JSON; everyone else gets 401 (the result is still written to the
 * server log so it can be checked with `vercel logs`).
 */
export async function GET(req: Request) {
  let signatureLoads = false;
  let width = 0;
  let height = 0;
  try {
    const png = await loadHostSignaturePng();
    if (png) {
      const doc = await PDFDocument.create();
      const img = await doc.embedPng(png);
      signatureLoads = true;
      width = img.width;
      height = img.height;
    }
  } catch {
    signatureLoads = false;
  }
  const status = {
    autoCountersign: autoCountersignFlagOn(),
    emailSignedCopy: emailSignedCopyOn(),
    signatureLoads,
    width,
    height,
  };
  console.log("countersign-status", JSON.stringify(status));
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...status });
}
