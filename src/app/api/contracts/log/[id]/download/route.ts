import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getContract, readExecutedPdf } from "@/lib/contracts-store";
import {
  buildContractDocx,
  buildContractPdf,
  buildContractTxt,
  contentTypeFor,
  contractFileBase,
  extensionFor,
  type ContractDownloadFormat,
} from "@/lib/contract-download";

export const runtime = "nodejs";

function parseFormat(raw: string | null): ContractDownloadFormat | null {
  const f = (raw || "").toLowerCase().trim();
  if (f === "txt" || f === "docx" || f === "pdf") return f;
  return null;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const format = parseFormat(new URL(req.url).searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      { ok: false, error: "Use format=txt, format=docx, or format=pdf." },
      { status: 400 },
    );
  }
  const rec = await getContract(id);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  try {
    let body: Buffer;
    if (format === "docx") body = await buildContractDocx(rec);
    else if (format === "pdf") body = (await readExecutedPdf(rec)) || (await buildContractPdf(rec));
    else body = Buffer.from(buildContractTxt(rec), "utf8");

    const filename = `${contractFileBase(rec)}.${extensionFor(format)}`;
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentTypeFor(format),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not build file." }, { status: 500 });
  }
}
