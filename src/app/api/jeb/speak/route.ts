import { NextResponse } from "next/server";
import { EdgeTTS } from "edge-tts-universal";
import {
  JEB_EDGE_RATE,
  JEB_VOICE,
  XAI_TTS_URL,
  clientKey,
  rateLimit,
  wrapJebSpeech,
  xaiKey,
} from "@/lib/jeb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function speakEdge(text: string): Promise<Buffer> {
  const tts = new EdgeTTS(text, JEB_VOICE, { rate: JEB_EDGE_RATE });
  const result = await tts.synthesize();
  const buf = Buffer.from(await result.audio.arrayBuffer());
  if (buf.length < 200) throw new Error("empty edge audio");
  return buf;
}

async function speakXai(text: string): Promise<Buffer> {
  const key = xaiKey();
  if (!key) throw new Error("no xai");
  const res = await fetch(XAI_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: wrapJebSpeech(text),
      voice_id: "orion",
      language: "en",
      speed: 1.08,
    }),
  });
  if (!res.ok) throw new Error(`xAI TTS ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function POST(req: Request) {
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

  try {
    const buf = await speakEdge(text);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Jeb-Voice": "edge" },
    });
  } catch {
    try {
      const buf = await speakXai(text);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Jeb-Voice": "xai" },
      });
    } catch {
      return NextResponse.json({ ok: false, error: "Jeb lost his voice." }, { status: 502 });
    }
  }
}
