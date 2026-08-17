import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import {
  JEB_MODEL,
  JEB_MODEL_FALLBACK,
  JEB_PHONE,
  JEB_SEARCH_MODEL,
  XAI_CHAT_URL,
  XAI_RESPONSES_URL,
  buildJebSystemPrompt,
  cleanGuestName,
  cleanUnit,
  clientKey,
  rateLimit,
  xaiKey,
  type JebChatMessage,
} from "@/lib/jeb";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

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
  if (/show|dinner|eat|restaurant|sdc|silver dollar|fish|golf|map|sight.?and.?sound|theater|theatre/.test(q)) {
    return `${hey}. I couldn't get a live look just now. Swipe this tablet to Go for tonight's board, or text Brian at ${JEB_PHONE}.`;
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

async function readJson(name: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(join(process.cwd(), "public", "reports", name), "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function townBoard(): Promise<string> {
  const [shows, dining] = await Promise.all([readJson("shows-data.json"), readJson("dining-data.json")]);
  const showRows = Array.isArray(shows?.shows) ? (shows?.shows as { name?: string; time?: string; venue?: string }[]) : [];
  const eatRows = Array.isArray(dining?.restaurants)
    ? (dining?.restaurants as { name?: string; tag?: string; venue?: string }[])
    : [];
  const showLines = showRows
    .slice(0, 14)
    .map((s) => `- ${s.name || "Show"}${s.time ? ` · ${s.time}` : ""}${s.venue ? ` · ${s.venue}` : ""}`)
    .join("\n");
  const eatLines = eatRows
    .slice(0, 8)
    .map((d) => `- ${d.name || "Restaurant"}${d.tag ? ` · ${d.tag}` : ""}${d.venue ? ` · ${d.venue}` : ""}`)
    .join("\n");
  if (!showLines && !eatLines) return "";
  return `\n\nTODAY'S BRANSON BOARD (use this first for town questions; web-search if the guest asks about something not listed, like Sight & Sound):\nShows:\n${showLines || "- none loaded"}\nEat:\n${eatLines || "- none loaded"}`;
}

function extractResponseText(data: {
  output_text?: string;
  output?: {
    type?: string;
    content?: { type?: string; text?: string }[];
    text?: string;
  }[];
  choices?: { message?: { content?: string } }[];
}): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) return cleanJebReply(data.output_text);
  if (Array.isArray(data.output)) {
    const bits: string[] = [];
    for (const item of data.output) {
      if (item.type && item.type !== "message" && item.type !== "output_text") continue;
      if (typeof item.text === "string") bits.push(item.text);
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if ((c.type === "output_text" || c.type === "text") && c.text) bits.push(c.text);
        }
      }
    }
    const joined = bits.join("\n").trim();
    if (joined) return cleanJebReply(joined);
  }
  return cleanJebReply(data.choices?.[0]?.message?.content?.trim() || "");
}

function cleanJebReply(text: string): string {
  return text
    .replace(/\[\[[^\]]*\]\]\([^)]+\)/g, "")
    .replace(/\[(\d+)\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isHouseOrHost(q: string): boolean {
  const s = q.toLowerCase();
  if (/wifi|wi-?fi|password|network|internet|checkout|check-out|house rule|door code|quiet hours|towel|trash|dishwasher|late check|broken|door lock|keypad|parking/.test(s)) {
    return true;
  }
  if (/911|emergenc|hurt|bleeding|ambulance/.test(s)) return true;
  if (/^thanks|^thank you|^ok\b|^okay\b|^howdy\b$/.test(s.trim())) return true;
  return false;
}

async function askWithSearch(system: string, history: JebChatMessage[], key: string): Promise<string> {
  const r = await fetch(XAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: JEB_SEARCH_MODEL,
      input: [{ role: "system", content: system }, ...history],
      tools: [{ type: "web_search" }],
      max_output_tokens: 280,
    }),
  });
  if (!r.ok) throw new Error(`search ${r.status}`);
  const data = (await r.json()) as Parameters<typeof extractResponseText>[0];
  const reply = extractResponseText(data);
  if (!reply) throw new Error("empty search reply");
  return reply;
}

async function askPlain(system: string, history: JebChatMessage[], key: string): Promise<string> {
  for (const model of [JEB_MODEL, JEB_MODEL_FALLBACK]) {
    try {
      const r = await fetch(XAI_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 220,
          messages: [{ role: "system", content: system }, ...history],
        }),
      });
      if (!r.ok) continue;
      const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (reply) return reply;
    } catch {
      /* next model */
    }
  }
  throw new Error("plain failed");
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

  const board = await townBoard();
  const system = buildJebSystemPrompt(guest, unit) + board;
  const town = !isHouseOrHost(question);

  try {
    if (town) {
      try {
        const reply = await askWithSearch(system, incoming, key);
        return NextResponse.json({ ok: true, reply, source: "jeb-search" });
      } catch {
        const reply = await askPlain(system, incoming, key);
        return NextResponse.json({ ok: true, reply, source: "jeb" });
      }
    }
    const reply = await askPlain(system, incoming, key);
    return NextResponse.json({ ok: true, reply, source: "jeb" });
  } catch {
    return NextResponse.json({ ok: true, reply: fallbackReply(question, guest), source: "fallback" });
  }
}
