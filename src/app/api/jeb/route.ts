import { NextResponse } from "next/server";
import {
  JEB_MODEL,
  JEB_MODEL_FALLBACK,
  JEB_PHONE,
  XAI_CHAT_URL,
  buildJebSystemPrompt,
  cleanGuestName,
  cleanUnit,
  clientKey,
  rateLimit,
  xaiKey,
  type JebChatMessage,
} from "@/lib/jeb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function fallbackReply(message: string, guest: string): string {
  const q = (message || "").toLowerCase();
  const hey = guest ? `Howdy ${guest}` : "Howdy";
  if (/911|emergenc|ambulance|hurt|bleeding/.test(q)) {
    return `${hey}. If somebody's hurt, call 911 right now. Then text Brian at ${JEB_PHONE} when you can.`;
  }
  if (/late check|stay late|leave later|noon checkout|11 ?am/.test(q)) {
    return `${hey}. Checkout's 10 in the morning, and I ain't one to promise a late one. Text Brian at ${JEB_PHONE} and he'll tell you straight.`;
  }
  if (/wifi|wi-fi|password|network|internet/.test(q)) {
    return `${hey}. Wi-Fi's in the digital guidebook — on this kiosk swipe to Go and tap Open the house guide, or use the link on your phone. I don't holler passwords across the room.`;
  }
  if (/check.?out|what time.*leave|when.*leave/.test(q)) {
    return `${hey}. Checkout's 10:00 AM at every home. The steps are in the guidebook. Anything extra, text Brian at ${JEB_PHONE}.`;
  }
  if (/rule|quiet|smok|pet|party|pool|towel/.test(q)) {
    return `${hey}. House rules live in the digital guidebook on the kiosk or your phone. Bless your heart, that's the sure way to get it right.`;
  }
  if (/door|code|lock|key/.test(q)) {
    return `${hey}. Door stuff is in the guidebook on check-in day. I don't give codes out. If it's actin' up, text Brian at ${JEB_PHONE}.`;
  }
  if (/show|dinner|eat|restaurant|sdc|silver dollar|fish|golf|map/.test(q)) {
    return `${hey}. Swipe this tablet to Go for tonight's shows, a bite to eat, and the park. Map's the next swipe. I reckon that's easier than me guessin'.`;
  }
  if (/brian|manager|host|owner|text|call you/.test(q)) {
    return `${hey}. Brian's the fella you want. Text him at ${JEB_PHONE}.`;
  }
  return `${hey}. Guidebook on the kiosk or your phone for house stuff. Anything special, text Brian at ${JEB_PHONE}. And tap that microphone each time you wanna talk.`;
}

function asHistory(raw: unknown): JebChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: JebChatMessage[] = [];
  for (const row of raw.slice(-12)) {
    if (!row || typeof row !== "object") continue;
    const role = (row as { role?: unknown }).role;
    const content = (row as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.trim().slice(0, 500);
    if (!text) continue;
    out.push({ role, content: text });
  }
  return out;
}

export async function GET() {
  return NextResponse.json({ ok: true, name: "Jebediah", callMe: "Jeb" });
}

export async function POST(req: Request) {
  if (!rateLimit(`chat:${clientKey(req)}`, 40)) {
    return NextResponse.json({ ok: false, error: "Easy now — give Jeb a minute." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const guest = cleanGuestName(body.name || body.guest);
  const unit = cleanUnit(body.unit);
  let incoming = asHistory(body.messages ?? body.history);
  if (typeof body.message === "string" && body.message.trim()) {
    incoming = [...incoming, { role: "user", content: body.message.trim().slice(0, 500) }];
  }

  const question = [...incoming].reverse().find((m) => m.role === "user")?.content || "";
  if (!question) {
    return NextResponse.json({ ok: false, error: "Need a question." }, { status: 400 });
  }

  const key = xaiKey();
  if (!key) {
    return NextResponse.json({ ok: true, reply: fallbackReply(question, guest), source: "fallback" });
  }

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: buildJebSystemPrompt(guest, unit) },
    ...incoming,
  ];

  for (const model of [JEB_MODEL, JEB_MODEL_FALLBACK]) {
    try {
      const r = await fetch(XAI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, temperature: 0.7, max_tokens: 220, messages }),
      });
      if (!r.ok) continue;
      const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (reply) return NextResponse.json({ ok: true, reply, source: "jeb" });
    } catch {
      /* try next model */
    }
  }

  return NextResponse.json({ ok: true, reply: fallbackReply(question, guest), source: "fallback" });
}
