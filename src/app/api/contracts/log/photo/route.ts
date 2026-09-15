import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { readPrivateFile } from "@/lib/owner-inquiries";

export async function GET(req: Request) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const path = new URL(req.url).searchParams.get("path") || "";
  const file = await readPrivateFile(path);
  if (!file) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return new NextResponse(Uint8Array.from(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
