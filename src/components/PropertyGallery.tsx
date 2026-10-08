"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import type { Photo } from "@/lib/property-details";
import PHOTO_DIMS from "@/lib/property-photo-dims.json";

const DIMS: Record<string, number[]> = PHOTO_DIMS;

/** Intrinsic size for a local photo (keeps the real aspect ratio while it loads). */
export function photoDims(url: string): { width?: number; height?: number } {
  const d = DIMS[url];
  return d ? { width: d[0], height: d[1] } : {};
}

type Props = {
  photos: Photo[];
  /** Home name, for alt text fallbacks. */
  name: string;
  /** "gallery" = grouped full gallery with captions under each photo;
   *  "highlights" = compact photo highlights with captions over the photo. */
  variant?: "gallery" | "highlights";
};

/**
 * Masonry photo grid that never crops or squishes: every photo keeps its natural
 * aspect ratio (portrait shots like coffee bars stay whole). Click any photo to
 * open it full-size in a lightbox (arrow keys / swipe-friendly buttons, Esc closes).
 */
export default function PropertyGallery({ photos, name, variant = "gallery" }: Props) {
  const [open, setOpen] = useState<number | null>(null);

  const sections = useMemo(() => {
    if (variant !== "gallery" || !photos.some((p) => p.group)) {
      return [{ title: "", items: photos.map((p, i) => ({ p, i })) }];
    }
    const out: { title: string; items: { p: Photo; i: number }[] }[] = [];
    photos.forEach((p, i) => {
      const title = p.group || "More photos";
      let s = out.find((x) => x.title === title);
      if (!s) out.push((s = { title, items: [] }));
      s.items.push({ p, i });
    });
    return out;
  }, [photos, variant]);

  // Lightbox steps through photos in the order they're displayed (section by section),
  // so prev/next always matches what's on screen even if groups aren't contiguous.
  const order = useMemo(() => sections.flatMap((s) => s.items.map((x) => x.i)), [sections]);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) =>
      setOpen((o) => {
        if (o === null || order.length === 0) return o;
        const pos = order.indexOf(o);
        return order[(pos + d + order.length) % order.length];
      }),
    [order],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, step]);

  const current = open === null ? null : photos[open];

  return (
    <>
      {sections.map((s) => (
        <div key={s.title || "all"} className={s.title ? "mt-8 first:mt-0" : ""}>
          {s.title && (
            <h3 className="text-base sm:text-lg font-extrabold text-[#0c4a6e] mb-3 flex items-baseline gap-2">
              {s.title}
              <span className="text-xs font-semibold text-slate-400">
                {s.items.length} photo{s.items.length === 1 ? "" : "s"}
              </span>
            </h3>
          )}
          <div
            className={
              variant === "highlights"
                ? "columns-2 md:columns-3 gap-2 sm:gap-3"
                : "columns-2 md:columns-3 xl:columns-4 gap-2 sm:gap-3"
            }
          >
            {s.items.map(({ p, i }) => (
              <figure key={`${p.url}-${i}`} className="m-0 mb-2 sm:mb-3 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group relative block w-full p-0 border-0 rounded-2xl overflow-hidden bg-sky-100 cursor-zoom-in"
                  aria-label={`View larger: ${p.caption || `${name} photo`}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption || `${name} photo`}
                    {...photoDims(p.url)}
                    className="block w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
                    loading={variant === "highlights" && i < 3 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/45 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand size={14} />
                  </span>
                  {variant === "highlights" && p.caption && (
                    <figcaption className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 sm:px-3 sm:py-2 text-left text-[11px] sm:text-sm leading-snug font-semibold text-white bg-gradient-to-t from-black/75 to-transparent">
                      {p.caption}
                    </figcaption>
                  )}
                </button>
                {variant === "gallery" && p.caption && (
                  <figcaption className="mt-1.5 px-1 text-xs sm:text-[13px] leading-snug text-slate-600">
                    {p.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      ))}

      {current && open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo ${order.indexOf(open) + 1} of ${photos.length}`}
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white/90 text-sm">
            <span className="font-semibold">
              {order.indexOf(open) + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={close}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.caption || `${name} photo`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center border-0"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center border-0"
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
          <p className="px-4 py-4 text-center text-sm text-white/90 m-0">
            {current.group && <span className="text-amber-300 font-semibold">{current.group} · </span>}
            {current.caption}
          </p>
        </div>
      )}
    </>
  );
}
