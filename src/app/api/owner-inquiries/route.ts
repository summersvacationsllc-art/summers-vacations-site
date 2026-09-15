import { NextResponse } from "next/server";
import { EMAIL } from "@/lib/site";
import {
  clientIp,
  newInquiryId,
  saveInquiry,
  savePhoto,
  type InquirySource,
  type OwnerInquiry,
} from "@/lib/owner-inquiries";

function str(v: FormDataEntryValue | null, max = 800): string {
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    if (str(form.get("website"), 80)) {
      return NextResponse.json({ ok: true });
    }

    const name = str(form.get("name"), 200);
    const email = str(form.get("email"), 200);
    const phone = str(form.get("phone"), 40);
    const address = str(form.get("address"), 400);
    const area = str(form.get("area"), 80);
    const listingUrl = str(form.get("listingUrl"), 400);
    const sleeps = str(form.get("sleeps"), 40);
    const beds = str(form.get("beds"), 40);
    const notes = str(form.get("notes"), 2000);
    const sourceRaw = str(form.get("source"), 20);
    const source: InquirySource = sourceRaw === "met" ? "met" : "website";

    if (!name || !email || !address) {
      return NextResponse.json({ ok: false, error: "Name, email, and property address are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    const files = form
      .getAll("photos")
      .filter((f): f is File => typeof f !== "string" && f.size > 0)
      .slice(0, 12);

    if (source === "website" && files.length < 3 && !listingUrl) {
      return NextResponse.json(
        { ok: false, error: "Website inquiries need a listing link or at least 3 photos so Brian can see the home." },
        { status: 400 },
      );
    }

    const id = newInquiryId(name);
    const photoPathnames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > 8_000_000) {
        return NextResponse.json({ ok: false, error: "Each photo must be under 8 MB." }, { status: 400 });
      }
      photoPathnames.push(await savePhoto(id, f, i));
    }

    const rec: OwnerInquiry = {
      id,
      submittedAt: new Date().toISOString(),
      source,
      name,
      email,
      phone,
      address,
      area,
      listingUrl,
      sleeps,
      beds,
      notes,
      photoPathnames,
      status: "pending",
      inviteToken: null,
      declinedNote: "",
      ip: clientIp(req),
    };
    await saveInquiry(rec);

    const subject = `Property review request: ${name} — ${address}`;
    const text = [
      "A owner asked you to review a property before any contract.",
      "",
      `Open: https://mybransonvacation.com/contracts/log`,
      `Id: ${id}`,
      `Source: ${source === "met" ? "already met Brian" : "website / unknown"}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || "(none)"}`,
      `Address: ${address}`,
      `Area: ${area || "(blank)"}`,
      `Listing: ${listingUrl || "(none)"}`,
      `Sleeps: ${sleeps || "(blank)"}  Beds: ${beds || "(blank)"}`,
      `Photos: ${photoPathnames.length}`,
      "",
      notes || "(no notes)",
    ].join("\n");
    await notify(subject, text, email, name);

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save the request." }, { status: 500 });
  }
}

async function notify(subject: string, text: string, replyTo: string, fromName: string) {
  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(EMAIL)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: subject,
        _template: "box",
        name: fromName,
        email: replyTo,
        message: text,
      }),
    });
  } catch {
    /* log is the record */
  }
}
