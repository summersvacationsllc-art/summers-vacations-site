import { NextResponse } from "next/server";
import { EdgeTTS } from "edge-tts-universal";
import {
  JEB_EDGE_RATE,
  JEB_ELEVEN_MODEL,
  JEB_ELEVEN_VOICE,
  JEB_VOICE,
  XAI_TTS_URL,
  clientKey,
  elevenKey,
  rateLimit,
  wrapJebSpeech,
  xaiKey,
} from "@/lib/jeb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function speakEleven(text: string): Promise<Buffer> {
  const key = elevenKey();
  if (!key) throw new Error("no eleven");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${JEB_ELEVEN_VOICE}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: JEB_ELEVEN_MODEL,
      voice_settings: {
        stability: 0.42,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`eleven ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error("empty eleven audio");
  return buf;
}

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

  const attempts: Array<[string, () => Promise<Buffer>]> = [
    ["elevenlabs", () => speakEleven(text)],
    ["edge", () => speakEdge(text)],
    ["xai", () => speakXai(text)],
  ];
  for (const [name, fn] of attempts) {
    try {
      const buf = await fn();
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Jeb-Voice": name },
      });
    } catch {
      /* next provider */
    }
  }
  return NextResponse.json({ ok: false, error: "Jeb lost his voice." }, { status: 502 });
}
