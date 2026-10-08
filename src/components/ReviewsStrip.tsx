"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { GUEST_REVIEWS, type GuestReview } from "@/data/guest-reviews";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-10-06" → "October 2026" (no timezone math, so it never shifts a month). */
function monthYear(date: string): string {
  const [y, m] = date.split("-");
  return `${MONTHS[Number(m) - 1] ?? ""} ${y}`.trim();
}

const PLATFORM_STYLE: Record<GuestReview["platform"], string> = {
  Airbnb: "bg-rose-50 text-rose-600 border-rose-100",
  Vrbo: "bg-blue-50 text-blue-700 border-blue-100",
  Google: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

/** Horizontal, swipeable strip of real 5-star guest reviews (data: src/data/guest-reviews.ts). */
export default function ReviewsStrip({ reviews = GUEST_REVIEWS }: { reviews?: GuestReview[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  if (!reviews.length) return null;

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label="Guest reviews">
      <ul
        ref={scroller}
        tabIndex={0}
        aria-label="Five-star guest reviews — scroll sideways for more"
        className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-1 scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-1 [scrollbar-width:thin] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-2xl"
      >
        {reviews.map((r, i) => (
          <li
            key={r.id}
            aria-label={`Review ${i + 1} of ${reviews.length}`}
            className="snap-start shrink-0 w-[85%] sm:w-[340px] lg:w-[360px] flex"
          >
            <figure className="flex flex-col w-full bg-gradient-to-b from-sky-50 to-white rounded-2xl p-6 border border-sky-100 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex gap-0.5" role="img" aria-label="Rated 5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} size={15} aria-hidden="true" className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span
                  className={`text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full border ${PLATFORM_STYLE[r.platform]}`}
                >
                  {r.platform}
                </span>
              </div>
              <blockquote className="flex-1 text-sm text-slate-600 leading-relaxed italic">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4 pt-4 border-t border-sky-100">
                <div className="text-sm font-bold text-[#0c4a6e]">{r.name}</div>
                <div className="text-xs text-slate-500">
                  Stayed at {r.home} · {monthYear(r.date)}
                </div>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <div className="hidden sm:flex justify-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Previous reviews"
          className="w-11 h-11 rounded-full border border-sky-200 bg-white text-[#0c4a6e] shadow-sm flex items-center justify-center hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label="Next reviews"
          className="w-11 h-11 rounded-full border border-sky-200 bg-white text-[#0c4a6e] shadow-sm flex items-center justify-center hover:bg-sky-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <p className="sm:hidden text-center text-xs text-slate-400 mt-1" aria-hidden="true">
        Swipe for more reviews →
      </p>
    </div>
  );
}
