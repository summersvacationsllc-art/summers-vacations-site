import { NextResponse } from "next/server";
import { getInvite } from "@/lib/owner-inquiries";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  const inv = await getInvite(token);
  if (!inv) {
    return NextResponse.json({ ok: false, error: "This link is not valid." }, { status: 404 });
  }
  if (inv.usedAt) {
    return NextResponse.json({ ok: false, error: "This agreement link was already used." }, { status: 410 });
  }
  return NextResponse.json({
    ok: true,
    name: inv.name,
    email: inv.email,
    phone: inv.phone,
    address: inv.address,
  });
}
