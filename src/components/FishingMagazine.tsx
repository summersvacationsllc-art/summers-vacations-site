"use client";

type WeekDay = { date: string; label: string; level: string; fresh?: boolean };
type LakeBlock = {
  hed: string;
  dek?: string;
  now?: Record<string, string | undefined>;
  body?: string[];
  working?: string[];
};

export type FishingMagazineData = {
  date?: string;
  kicker?: string;
  hed?: string;
  deck?: string;
  weekGraf?: string;
  week?: WeekDay[];
  tableRock?: LakeBlock;
  taneycomo?: LakeBlock;
  editor?: { stamp?: string; checked?: string; note?: string };
};

function Grafs({ body }: { body?: string[] }) {
  if (!body?.length) return null;
  return (
    <div className="space-y-2.5">
      {body.map((p, i) => (
        <p
          key={i}
          className="text-[13px] leading-[1.55] text-sky-950"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function Lake({ block, kicker }: { block?: LakeBlock; kicker: string }) {
  if (!block?.hed) return null;
  const now = block.now || {};
  const facts = Object.entries(now).filter(([, v]) => v);
  return (
    <article className="mx-3.5 mb-2.5 bg-white rounded-xl border border-sky-100 overflow-hidden">
      <div className="px-3.5 pt-3 pb-2 border-b border-sky-50">
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600">
          {kicker}
        </div>
        <h3
          className="text-[18px] leading-tight text-sky-950 mt-0.5"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {block.hed}
        </h3>
        {block.dek && (
          <div className="text-[11px] text-sky-700 mt-0.5">{block.dek}</div>
        )}
      </div>
      {facts.length > 0 && (
        <dl className="px-3.5 py-2 grid gap-1.5 bg-sky-50/60">
          {facts.map(([k, v]) => (
            <div key={k} className="text-[11px] leading-snug text-sky-900">
              <span className="font-semibold capitalize text-sky-700">
                {k === "generation" ? "Generation" : k}:{" "}
              </span>
              {v}
            </div>
          ))}
        </dl>
      )}
      <div className="px-3.5 py-3">
        <Grafs body={block.body} />
        {block.working && block.working.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-sky-100">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-600 mb-1.5">
              What’s working
            </div>
            <div className="flex flex-wrap gap-1">
              {block.working.map((w) => (
                <span
                  key={w}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-100"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function FishingMagazine({
  magazine,
  weatherLine,
}: {
  magazine: FishingMagazineData;
  weatherLine?: string;
}) {
  const week = magazine.week || [];
  return (
    <div className="pb-1">
      <div className="mx-3.5 mb-2.5 rounded-xl px-3.5 py-3" style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
          {magazine.kicker || "The Outdoor Desk"}
          {magazine.date ? ` · ${magazine.date}` : ""}
        </div>
        <h2
          className="text-[22px] leading-tight text-white mt-1"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {magazine.hed}
        </h2>
        {magazine.deck && (
          <p className="text-[12px] leading-relaxed text-sky-100 mt-1.5">{magazine.deck}</p>
        )}
        {weatherLine && (
          <div className="text-[11px] text-sky-200 mt-2">{weatherLine}</div>
        )}
      </div>

      {week.length > 0 && (
        <div className="mx-3.5 mb-2.5 bg-white rounded-xl border border-sky-100 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-600 mb-1.5">
            The week on the water · Table Rock level
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {week.map((d) => (
              <div
                key={d.date}
                className={`min-w-[3.15rem] text-center rounded-lg px-1 py-1.5 ${
                  d.fresh ? "bg-sky-50 border border-sky-200" : "bg-slate-50 border border-slate-100"
                }`}
              >
                <div className="text-[9px] uppercase text-sky-600">{d.label}</div>
                <div className="text-[11px] font-bold text-sky-950 tabular-nums">{d.level}</div>
                <div className="text-[8px] text-sky-500">{d.fresh ? "desk" : "carry"}</div>
              </div>
            ))}
          </div>
          {magazine.weekGraf && (
            <p
              className="text-[12px] leading-relaxed text-sky-900 mt-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {magazine.weekGraf}
            </p>
          )}
        </div>
      )}

      <Lake block={magazine.tableRock} kicker="The lake" />
      <Lake block={magazine.taneycomo} kicker="The trout water" />

      {magazine.editor?.note && (
        <div className="mx-3.5 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            {magazine.editor.stamp || "Outdoor desk"}
            {magazine.editor.checked ? ` · checked ${magazine.editor.checked}` : ""}
          </div>
          <p className="text-[11px] leading-snug text-amber-950 mt-0.5">{magazine.editor.note}</p>
        </div>
      )}
    </div>
  );
}
