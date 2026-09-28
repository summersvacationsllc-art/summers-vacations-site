"use client";

import { ExternalLink, Mail, Phone } from "lucide-react";
import { EMAIL, PHONE, PHONE_HREF, channelLinks } from "@/lib/site";
import { trackBookClick } from "@/lib/analytics";

type Props = {
  /** Property slug, e.g. "the-penthouse" */
  slug: string;
  /** Display name, e.g. "The Penthouse" */
  name: string;
};

/**
 * Compact "Book your way" card for the property hero (top-right on desktop,
 * stacked under the direct-booking block on mobile). Airbnb / VRBO buttons
 * only render when a URL is set in src/lib/site.ts — no empty box if missing.
 */
export default function BookYourWay({ slug, name }: Props) {
  const links = channelLinks(slug);
  const hasOta = Boolean(links.airbnb || links.vrbo);
  const placement = "hero_book_your_way";

  if (!hasOta) return null;

  return (
    <aside
      id="book"
      aria-label={`Book ${name} your way`}
      className="w-full max-w-md rounded-2xl bg-white/95 backdrop-blur-sm border border-white/40 shadow-xl shadow-black/10 p-4 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
        Book your way
      </p>
      <h2 className="font-display text-lg sm:text-2xl font-bold text-[#0c4a6e] mt-1">
        Prefer Airbnb or VRBO?
      </h2>
      <p className="hidden sm:block text-sm text-slate-600 mt-2 leading-relaxed">
        Same home, same hosts. Book direct on the left to skip OTA guest fees —
        or use an app you already know.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 mt-3 sm:mt-4">
        {links.airbnb && (
          <a
            href={links.airbnb}
            target="_blank"
            rel="noopener"
            onClick={() => trackBookClick("airbnb", slug, placement)}
            className="w-full px-3 sm:px-5 py-3 rounded-full border-2 border-[#0c4a6e]/25 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-sky-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            Also on Airbnb
            <ExternalLink size={14} />
          </a>
        )}
        {links.vrbo && (
          <a
            href={links.vrbo}
            target="_blank"
            rel="noopener"
            onClick={() => trackBookClick("vrbo", slug, placement)}
            className="w-full px-3 sm:px-5 py-3 rounded-full border-2 border-[#0c4a6e]/25 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-sky-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            Also on VRBO
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <a
          href={PHONE_HREF}
          onClick={() => trackBookClick("phone", slug, placement)}
          className="inline-flex items-center gap-1 font-semibold text-[#0c4a6e] no-underline hover:underline"
        >
          <Phone size={12} /> {PHONE}
        </a>
        <a
          href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Question about ${name}`)}`}
          onClick={() => trackBookClick("email", slug, placement)}
          className="inline-flex items-center gap-1 font-semibold text-[#0c4a6e] no-underline hover:underline"
        >
          <Mail size={12} /> Email us
        </a>
      </div>
    </aside>
  );
}
