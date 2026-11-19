import { NextResponse } from "next/server";
import { gateAuthCookie, gateClearCookie, gatePinMatches } from "@/lib/gate-admin-auth";

export const dynamic = "force-dynamic";
const fails = new Map<string, { n: number; at: number }>();

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  const f = fails.get(ip);
  if (f && now - f.at < 10 * 60_000 && f.n >= 8) return NextResponse.json({ ok: false, error: "Too many tries." }, { status: 429 });
  try {
    const body = await req.json();
    if (!gatePinMatches(typeof body.pin === "string" ? body.pin : "")) {
      fails.set(ip, { n: f && now - f.at < 10 * 60_000 ? f.n + 1 : 1, at: f && now - f.at < 10 * 60_000 ? f.at : now });
      return NextResponse.json({ ok: false, error: "Wrong PIN." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", gateAuthCookie());
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Failed." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", gateClearCookie());
  return res;
}
