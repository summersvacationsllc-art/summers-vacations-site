"use client";

import { ArrowRight, ExternalLink, Mail, Phone } from "lucide-react";
import { EMAIL, PHONE, PHONE_HREF, channelLinks } from "@/lib/site";
import { trackBookClick } from "@/lib/analytics";

type Props = {
  /** Property slug, e.g. "the-penthouse" */
  slug: string;
  /** Display name, e.g. "The Penthouse" */
  name: string;
};

/**
 * "Book your way" — direct booking first, then Airbnb / VRBO if this home is
 * listed there. OTA buttons only render when a URL is set in src/lib/site.ts.
 */
export default function BookYourWay({ slug, name }: Props) {
  const links = channelLinks(slug);
  const hasOta = Boolean(links.airbnb || links.vrbo);
  const placement = "book_your_way";

  return (
    <section
      id="book"
      className="py-16 px-4 bg-gradient-to-br from-amber-400 to-amber-500"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold text-[#0c4a6e]">
          Book {name} your way
        </h2>
        <p className="text-[#0c4a6e]/80 mt-2 font-medium">
          Book direct with us and skip the Airbnb/VRBO guest service fee. You
          deal with us, the actual hosts, from booking to checkout.
        </p>

        {/* Direct first */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <a
            href={links.direct}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBookClick("direct", slug, placement)}
            className="px-8 py-3.5 rounded-full bg-[#0c4a6e] text-white text-sm font-bold no-underline hover:bg-[#0a3d5c] transition-colors inline-flex items-center gap-2"
          >
            Book Direct
            <ArrowRight size={16} />
          </a>
          <a
            href={PHONE_HREF}
            onClick={() => trackBookClick("phone", slug, placement)}
            className="px-8 py-3.5 rounded-full bg-white/70 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-white transition-all inline-flex items-center gap-2"
          >
            <Phone size={16} /> Call {PHONE}
          </a>
        </div>
        <p className="mt-3 text-sm text-[#0c4a6e]/80">
          Questions first? Email{" "}
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Question about ${name}`)}`}
            onClick={() => trackBookClick("email", slug, placement)}
            className="font-semibold text-[#0c4a6e] underline underline-offset-2 inline-flex items-center gap-1"
          >
            <Mail size={14} /> {EMAIL}
          </a>
        </p>

        {hasOta && (
          <div className="mt-8 pt-6 border-t border-[#0c4a6e]/15">
            <p className="text-sm font-semibold text-[#0c4a6e]">
              Prefer an app you already use? We&apos;re there too.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              {links.airbnb && (
                <a
                  href={links.airbnb}
                  target="_blank"
                  rel="noopener"
                  onClick={() => trackBookClick("airbnb", slug, placement)}
                  className="px-6 py-3 rounded-full border-2 border-[#0c4a6e]/30 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-white/40 transition-colors inline-flex items-center gap-2"
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
                  className="px-6 py-3 rounded-full border-2 border-[#0c4a6e]/30 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-white/40 transition-colors inline-flex items-center gap-2"
                >
                  Also on VRBO
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-[#0c4a6e]/75 max-w-xl mx-auto leading-relaxed">
          Same home, same hosts, same house rules wherever you book. We just
          want you to pick whatever feels most comfortable.
        </p>
      </div>
    </section>
  );
}
