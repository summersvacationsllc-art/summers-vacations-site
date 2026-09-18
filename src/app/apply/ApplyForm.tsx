"use client";

import { useState } from "react";
import { notifyBrianFromBrowser } from "@/lib/browser-mail";

async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 1600;
    let w = bmp.width;
    let h = bmp.height;
    if (w > max || h > max) {
      const s = Math.min(max / w, max / h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ApplyForm() {
  const [source, setSource] = useState<"website" | "met">("website");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("source", source);
    const files = (form.elements.namedItem("photos") as HTMLInputElement | null)?.files;
    if (files && files.length) {
      data.delete("photos");
      const list = Array.from(files).slice(0, 12);
      for (const f of list) {
        data.append("photos", await shrink(f));
      }
    }
    try {
      const res = await fetch("/api/owner-inquiries", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setStatus("error");
        setError(json.error || "Could not send.");
        return;
      }
      const name = String(data.get("name") || "");
      const address = String(data.get("address") || "");
      const email = String(data.get("email") || "");
      await notifyBrianFromBrowser({
        subject: `Property review request: ${name} — ${address}`,
        replyTo: email,
        message: [
          "An owner asked you to review a property before any contract.",
          "",
          "Open: https://mybransonvacation.com/contracts/log",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${data.get("phone") || "(none)"}`,
          `Address: ${address}`,
          `Area: ${data.get("area") || "(blank)"}`,
          `Listing: ${data.get("listingUrl") || "(none)"}`,
          "",
          String(data.get("notes") || "(no notes)"),
        ].join("\n"),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Network error. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <main className="min-h-dvh bg-[#f0f9ff] px-4 py-12 text-[#0c4a6e]">
        <div className="mx-auto max-w-xl rounded-2xl border border-[#bae6fd] bg-white p-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">Summers Vacations</p>
          <h1 className="mt-2 font-display text-3xl">Brian has your request</h1>
          <p className="mt-3 text-[#0369a1]">
            He will look at the home first. If it is a fit, you get a private agreement link. If it is not, he will say
            so. This is a small, selective book — not every listing.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e]">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0369a1]">Partner with us</p>
        <h1 className="mt-2 font-display text-4xl leading-none">Request a property review</h1>
        <p className="mt-3 text-[#0369a1]">
          Summers Vacations co-hosts a small number of homes. Branson is the current guest site; other markets — Lake of
          the Ozarks included — are reviewed the same way. Brian wants to see the property before any agreement. The bar
          is a 5.0★ guest stay, or a home that can honestly get there. No contract until he says yes.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border border-[#bae6fd] bg-white p-5">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">How do you know Brian?</legend>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input type="radio" name="sourceChoice" checked={source === "website"} onChange={() => setSource("website")} />
              <span>From the website — he has not seen this home yet</span>
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input type="radio" name="sourceChoice" checked={source === "met"} onChange={() => setSource("met")} />
              <span>We have already met / he has already seen the property</span>
            </label>
          </fieldset>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Your name *</span>
            <input name="name" required autoComplete="name" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Email *</span>
            <input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Phone</span>
            <input name="phone" type="tel" autoComplete="tel" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Property address *</span>
            <input name="address" required autoComplete="street-address" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Market / area *</span>
            <input
              name="area"
              required
              placeholder="Branson, Lake of the Ozarks, or another area"
              className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Airbnb / VRBO / listing link</span>
            <input name="listingUrl" type="url" placeholder="https://" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Sleeps</span>
              <input name="sleeps" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">Bedrooms</span>
              <input name="beds" className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">
              Photos {source === "website" ? "(at least 3 unless you include a listing link)" : "(optional)"}
            </span>
            <input name="photos" type="file" accept="image/*" multiple className="mt-1 w-full text-sm" />
            <span className="mt-1 block text-xs text-[#0369a1]">
              Exterior, living, kitchen, each bedroom, each bath. Phone photos are fine.
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#0369a1]">What should Brian know?</span>
            <textarea name="notes" rows={4} className="mt-1 w-full rounded-lg border border-[#bae6fd] px-3 py-2" />
          </label>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-full bg-[#0c4a6e] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send for review"}
          </button>
        </form>
      </div>
    </main>
  );
}
