import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getInquiry } from "@/lib/owner-inquiries";
import { inquiryArchiveMarkdown, inquiryArchiveTxt } from "@/lib/inquiry-archive";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const format = (new URL(req.url).searchParams.get("format") || "md").toLowerCase();
  const rec = await getInquiry(id);
  if (!rec) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  const base = `owner-review-${(rec.name || "owner")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)}-${rec.submittedAt.slice(0, 10)}`;

  if (format === "json") {
    const body = JSON.stringify(rec, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${base}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "txt") {
    const body = inquiryArchiveTxt(rec);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${base}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const body = inquiryArchiveMarkdown(rec);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
