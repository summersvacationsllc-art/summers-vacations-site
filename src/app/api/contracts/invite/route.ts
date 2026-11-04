import { NextResponse } from "next/server";
import { getInvite } from "@/lib/owner-inquiries";
import { autoCountersignFlagOn, templateFor } from "@/lib/contract-templates";
import { loadHostSignaturePng } from "@/lib/host-signature";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const inv = await getInvite(token);
  if (!inv) {
    return NextResponse.json({ ok: false, error: "This link is not valid." }, { status: 404 });
  }
  if (inv.usedAt) {
    return NextResponse.json({ ok: false, error: "This agreement link was already used." }, { status: 410 });
  }
  const tmpl = templateFor(inv.templateId);
  // Booleans only: whether Brian's automatic countersignature will apply. No secret values.
  const countersignReady = tmpl.autoCountersign && autoCountersignFlagOn() && Boolean(await loadHostSignaturePng());
  return NextResponse.json({
    ok: true,
    templateId: tmpl.id,
    title: tmpl.title,
    autoCountersign: tmpl.autoCountersign,
    countersignReady,
    name: inv.name,
    email: inv.email,
    phone: inv.phone,
    address: inv.address,
  });
}
