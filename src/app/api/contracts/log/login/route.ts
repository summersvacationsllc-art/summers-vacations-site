import { NextResponse } from "next/server";
import { pinMatches, setAuthCookieHeader, clearAuthCookieHeader } from "@/lib/contracts-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!pinMatches(pin)) {
      return NextResponse.json({ ok: false, error: "Wrong PIN." }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", setAuthCookieHeader());
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Failed." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearAuthCookieHeader());
  return res;
}
