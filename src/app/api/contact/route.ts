import { NextResponse } from "next/server";

/** POST /api/contact — receive contact form submissions */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Name, email, and message are required." }, { status: 400 });
    }

    // Log the contact for now (can wire to email/SMS later)
    console.log(`📬 Contact from ${name} (${email}, ${phone || "no phone"}): ${message}`);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to process" }, { status: 500 });
  }
}
