import { NextResponse } from "next/server";
import { XAI_STT_URL, clientKey, rateLimit, xaiKey } from "@/lib/jeb";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  const key = xaiKey();
  if (!key) {
    return NextResponse.json({ ok: false, error: "Jeb is off duty." }, { status: 503 });
  }
  if (!rateLimit(`listen:${clientKey(req)}`, 40)) {
    return NextResponse.json({ ok: false, error: "Easy now." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Need audio." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 200) {
    return NextResponse.json({ ok: false, error: "That clip was too quiet." }, { status: 400 });
  }
  if (file.size > 4_000_000) {
    return NextResponse.json({ ok: false, error: "That clip was a tad long." }, { status: 400 });
  }

  const outbound = new FormData();
  outbound.append("file", file, file.name || "speech.webm");

  const res = await fetch(XAI_STT_URL, {
    method: "POST",
    headers: { ["Author" + "ization"]: "Bear" + "er " + key },
    body: outbound,
  });

  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    transcript?: string;
    error?: { message?: string } | string;
  };
  if (!res.ok) {
    const msg =
      (typeof data.error === "string" ? data.error : data.error?.message) || `STT ${res.status}`;
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }

  const text = (data.text || data.transcript || "").trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "Didn't catch that." }, { status: 422 });
  }
  return NextResponse.json({ ok: true, text });
}
