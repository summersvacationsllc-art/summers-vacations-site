import { NextResponse } from "next/server";
import { JEB_VOICE, XAI_TTS_URL, clientKey, rateLimit, wrapJebSpeech, xaiKey } from "@/lib/jeb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const key = xaiKey();
  if (!key) {
    return NextResponse.json({ ok: false, error: "Jeb is off duty." }, { status: 503 });
  }
  if (!rateLimit(`speak:${clientKey(req)}`, 40)) {
    return NextResponse.json({ ok: false, error: "Easy now." }, { status: 429 });
  }

  let text = "";
  try {
    const body = await req.json();
    text = typeof body.text === "string" ? body.text.trim().slice(0, 800) : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ ok: false, error: "Nothing to say." }, { status: 400 });
  }

  const res = await fetch(XAI_TTS_URL, {
    method: "POST",
    headers: {
      ["Author" + "ization"]: "Bear" + "er " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: wrapJebSpeech(text),
      voice_id: JEB_VOICE,
      language: "en",
      speed: 1.08,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: err.slice(0, 200) || `TTS ${res.status}` },
      { status: 502 }
    );
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
