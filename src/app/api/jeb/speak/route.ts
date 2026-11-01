import { NextResponse } from "next/server";
import { EdgeTTS } from "edge-tts-universal";
import {
  JEB_EDGE_RATE,
  JEB_OPENAI_MODEL,
  JEB_OPENAI_VOICE,
  JEB_VOICE,
  XAI_TTS_URL,
  clientKey,
  openaiKey,
  rateLimit,
  wrapJebSpeech,
  xaiKey,
} from "@/lib/jeb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function speakXai(text: string): Promise<Buffer> {
  const key = xaiKey();
  if (!key) throw new Error("no xai");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
  try {
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
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`xAI TTS ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") throw new Error("xAI TTS timeout");
    throw e;
  }
}

async function speakOpenAI(text: string): Promise<Buffer> {
  const key = openaiKey();
  if (!key) throw new Error("no openai");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: JEB_OPENAI_MODEL,
        voice: JEB_OPENAI_VOICE,
        input: wrapJebSpeech(text),
        speed: 1.0,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OpenAI TTS ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") throw new Error("OpenAI TTS timeout");
    throw e;
  }
}

async function speakEdge(text: string): Promise<Buffer> {
  const tts = new EdgeTTS(text, JEB_VOICE, { rate: JEB_EDGE_RATE });
  const result = await tts.synthesize();
  const buf = Buffer.from(await result.audio.arrayBuffer());
  if (buf.length < 200) throw new Error("empty edge audio");
  return buf;
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
    ["xai", () => speakXai(text)],
    ["openai", () => speakOpenAI(text)],
    ["edge", () => speakEdge(text)],
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
