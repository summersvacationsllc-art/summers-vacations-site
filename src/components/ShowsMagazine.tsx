"use client";

import { useMemo, useState } from "react";

export type ShowRow = {
  name?: string;
  time?: string;
  venue?: string;
  type?: string;
  url?: string;
  chip?: string;
  icon?: string;
  ticketOk?: boolean;
  desc?: string;
  price?: string;
  bucket?: string;
  sortMinutes?: number | null;
  for?: string;
  tag?: string;
};

export type ShowsMagazineData = {
  date?: string;
  kicker?: string;
  brand?: string;
  hed?: string;
  deck?: string;
  pick?: {
    title?: string;
    when?: string;
    where?: string;
    why?: string;
    url?: string;
    source?: string;
  } | null;
  buckets?: {
    id: string;
    label: string;
    blurb?: string;
    count?: number;
    shows: ShowRow[];
  }[];
  chips?: { id: string; label: string; count?: number }[];
  free?: { name?: string; detail?: string; url?: string; when?: string }[];
  indoor?: { name?: string; detail?: string; url?: string }[];
  tomorrow?: string;
  editor?: { stamp?: string; checked?: string; note?: string };
  counts?: { shows?: number; withTickets?: number };
};

function ticketHref(url?: string, ticketOk?: boolean) {
  if (!url || !url.startsWith("http")) return null;
  // still allow open even if generic — label differs
  return url;
}

function ShowCard({ s }: { s: ShowRow }) {
  const href = ticketHref(s.url, s.ticketOk);
  const meta = [s.time, s.venue, s.price].filter(Boolean).join(" · ");
  const body = (
    <>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">{s.icon || "🎭"}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-violet-950 leading-snug">
            {s.name}
          </div>
          {meta && (
            <div className="text-[11px] text-violet-800 mt-0.5 leading-snug">{meta}</div>
          )}
          {(s.type || s.chip) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {s.chip && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-100 capitalize">
                  {s.chip}
                </span>
              )}
              {s.type && s.type.toLowerCase() !== (s.chip || "").toLowerCase() && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-100">
                  {s.type}
                </span>
              )}
            </div>
          )}
          {s.desc && (
            <p className="text-[11px] text-violet-900/80 mt-1.5 leading-relaxed">{s.desc}</p>
          )}
          {href && (
            <div className="text-[11px] font-semibold text-violet-700 mt-1.5">
              {s.ticketOk === false ? "Showtimes calendar →" : "Tickets / info →"}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="block bg-white rounded-xl px-3.5 py-3 border border-violet-100 no-underline text-inherit"
      >
        {body}
      </a>
    );
  }
  return (
    <div className="bg-white rounded-xl px-3.5 py-3 border border-violet-100">{body}</div>
  );
}

export default function ShowsMagazine({
  magazine,
  showsFallback,
}: {
  magazine: ShowsMagazineData;
  /** Flat list if buckets empty */
  showsFallback?: ShowRow[];
}) {
  const [chip, setChip] = useState<string>("all");

  const buckets = useMemo(() => {
    const src =
      magazine.buckets && magazine.buckets.length > 0
        ? magazine.buckets
        : [
            {
              id: "all",
              label: "Today’s board",
              blurb: "",
              shows: showsFallback || [],
            },
          ];
    if (chip === "all") return src;
    return src
      .map((b) => ({
        ...b,
        shows: (b.shows || []).filter(
          (s) => (s.chip || s.for || "").toLowerCase() === chip
        ),
      }))
      .filter((b) => (b.shows || []).length > 0);
  }, [magazine.buckets, showsFallback, chip]);

  const pick = magazine.pick;
  const chips = magazine.chips || [];

  return (
    <div className="pb-1">
      <div
        className="mx-3.5 mb-2.5 rounded-xl px-3.5 py-3.5"
        style={{
          background: "linear-gradient(165deg,#4c1d95 0%,#6d28d9 55%,#7c3aed 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            {magazine.kicker || "Tonight in Branson"}
          </div>
          <div className="text-[10px] text-violet-100">
            {magazine.brand || "The daily board"}
            {magazine.date ? ` · ${magazine.date}` : ""}
          </div>
        </div>
        <h2
          className="text-[22px] leading-tight text-white mt-2"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {magazine.hed || "Today’s live shows"}
        </h2>
        {magazine.deck && (
          <p className="text-[13px] leading-relaxed text-violet-100 mt-1.5">{magazine.deck}</p>
        )}
        {typeof magazine.counts?.shows === "number" && (
          <div className="text-[11px] text-violet-200 mt-2">
            {magazine.counts.shows} on the board
            {magazine.counts.withTickets != null
              ? ` · ${magazine.counts.withTickets} with direct ticket links`
              : ""}
          </div>
        )}
      </div>

      {pick?.title && (
        <div className="mx-3.5 mb-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
            Editor’s pick
            {pick.source ? ` · ${pick.source}` : ""}
          </div>
          <div
            className="text-[17px] leading-tight text-amber-950 mt-0.5"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            {pick.title}
          </div>
          {(pick.when || pick.where) && (
            <div className="text-[11px] text-amber-900 mt-1">
              {[pick.when, pick.where].filter(Boolean).join(" · ")}
            </div>
          )}
          {pick.why && (
            <p
              className="text-[13px] leading-relaxed text-amber-950 mt-1.5"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {pick.why}
            </p>
          )}
          {pick.url && pick.url.startsWith("http") && (
            <a
              href={pick.url}
              target="_blank"
              rel="noopener"
              className="inline-block mt-2 text-[12px] font-bold text-amber-900 underline"
            >
              Open tickets / info →
            </a>
          )}
        </div>
      )}

      {chips.length > 0 && (
        <div className="mx-3.5 mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setChip("all")}
            className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer ${
              chip === "all"
                ? "bg-violet-700 text-white border-violet-700"
                : "bg-white text-violet-800 border-violet-200"
            }`}
          >
            All
          </button>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChip(c.id)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer capitalize ${
                chip === c.id
                  ? "bg-violet-700 text-white border-violet-700"
                  : "bg-white text-violet-800 border-violet-200"
              }`}
            >
              {c.label}
              {c.count != null ? ` ${c.count}` : ""}
            </button>
          ))}
        </div>
      )}

      {buckets.map((b) => (
        <div key={b.id} className="mb-2.5">
          <div className="px-3.5 mb-1.5">
            <div
              className="text-[15px] text-violet-950"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {b.label}
              {b.count != null ? (
                <span className="text-[11px] font-sans font-semibold text-violet-600 ml-1.5">
                  {b.shows?.length ?? b.count}
                </span>
              ) : null}
            </div>
            {b.blurb && <div className="text-[11px] text-violet-700">{b.blurb}</div>}
          </div>
          <div className="mx-3.5 flex flex-col gap-1.5">
            {(b.shows || []).map((s, i) => (
              <ShowCard key={`${s.name}-${s.time}-${i}`} s={s} />
            ))}
          </div>
        </div>
      ))}

      {buckets.length === 0 && (
        <p className="px-3.5 py-6 text-center text-sm text-violet-800">
          No shows match that filter — try All.
        </p>
      )}

      {!!magazine.free?.length && (
        <div className="mx-3.5 mb-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
            Free / easy adds
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {magazine.free.map((f, i) => (
              <li key={i} className="text-[12px] text-emerald-950 leading-snug">
                <span className="font-semibold">{f.name}</span>
                {f.when ? ` · ${f.when}` : ""}
                {f.detail ? ` — ${f.detail}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!magazine.indoor?.length && (
        <div className="mx-3.5 mb-2.5 bg-white rounded-xl border border-violet-100 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
            Indoor cool-downs
          </div>
          <ul className="mt-1.5 space-y-2">
            {magazine.indoor.map((x, i) => (
              <li key={i}>
                {x.url ? (
                  <a
                    href={x.url}
                    target="_blank"
                    rel="noopener"
                    className="text-[13px] font-semibold text-violet-900 no-underline"
                  >
                    {x.name}
                  </a>
                ) : (
                  <div className="text-[13px] font-semibold text-violet-900">{x.name}</div>
                )}
                {x.detail && (
                  <div className="text-[11px] text-violet-700 leading-snug">{x.detail}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {magazine.tomorrow && (
        <div className="mx-3.5 mb-2.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
            Why open this tomorrow
          </div>
          <p
            className="text-[13px] leading-relaxed text-violet-950 mt-1"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {magazine.tomorrow}
          </p>
        </div>
      )}

      {magazine.editor?.note && (
        <div className="mx-3.5 mb-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">
            {magazine.editor.stamp || "Tonight in Branson"}
            {magazine.editor.checked ? ` · ${magazine.editor.checked}` : ""}
          </div>
          <p className="text-[11px] leading-snug text-stone-800 mt-0.5">
            {magazine.editor.note}
          </p>
        </div>
      )}
    </div>
  );
}
