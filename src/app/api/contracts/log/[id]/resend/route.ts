import { NextResponse } from "next/server";
import { isContractsAuthed } from "@/lib/contracts-auth";
import { getContract } from "@/lib/contracts-store";
import { resendSignedCopy } from "@/lib/contract-execute";
import { EMAIL } from "@/lib/site";

export const runtime = "nodejs";

/** Contract log (PIN): re-send the stored signed / executed PDF. Body: { to: "signer" | "brian" | "both" } */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isContractsAuthed(req)) {
    return NextResponse.json({ ok: false, error: "PIN required." }, { status: 401 });
  }
  const { id } = await ctx.params;
  let target: "signer" | "brian" | "both" = "both";
  try {
    const body = (await req.json()) as { to?: string };
    if (body.to === "signer" || body.to === "brian" || body.to === "both") target = body.to;
  } catch {
    /* default both */
  }
  const rec = await getContract(id);
  if (!rec) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const toBrian = (r: { to: string[] }) => r.to.some((e) => e.toLowerCase() === EMAIL.toLowerCase());
  const same = (rec.execution?.resends || []).filter((r) =>
    target === "both" ? true : target === "brian" ? toBrian(r) : !toBrian(r),
  );
  const last = same.at(-1);
  if (last && Date.now() - new Date(last.at).getTime() < 60_000) {
    return NextResponse.json({ ok: false, error: "Just sent. Wait a minute before sending again." }, { status: 429 });
  }

  try {
    const r = await resendSignedCopy(rec, target);
    return NextResponse.json({ ok: r.ok, to: r.to, error: r.error, execution: r.record.execution }, { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not send." }, { status: 500 });
  }
}
