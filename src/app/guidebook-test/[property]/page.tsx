import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { headers } from "next/headers";
import { getGuidebook, SEASONS, type SeasonalTheme } from "@/data/guidebooks";
import { stayDateLabel } from "@/lib/stay-window";
import { guidebookTestAllowed, firstQuery, hasCodeParam, parseDemoStage, tokenFromQuery, type DemoStage } from "@/lib/guidebook-test/access";
import { codePhase, doorPanel, type DoorPanel } from "@/lib/guidebook-test/display";
import { lookupStay } from "@/lib/guidebook-test/lookup";
import { testUnit } from "@/lib/guidebook-test/units";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const DEMO_CODE = "0000";

function season(now: Date): SeasonalTheme {
  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return SEASONS.find((s) => s.endDate >= md && s.startDate <= md) || SEASONS[0];
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function chicagoToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function demoDates(stage: DemoStage, now: Date): { checkIn: string; checkOut: string } {
  const today = chicagoToday(now);
  if (stage === "before") return { checkIn: addDays(today, 2), checkOut: addDays(today, 5) };
  if (stage === "after") return { checkIn: addDays(today, -5), checkOut: addDays(today, -1) };
  return { checkIn: addDays(today, -1), checkOut: addDays(today, 2) };
}

function dateLabel(ymd: string): string {
  return stayDateLabel({ value: ymd, source: "lookup" }, Date.now());
}

function DoorBox({ panel }: { panel: DoorPanel }) {
  if (panel.kind === "hidden") return null;
  const ready = panel.kind === "code";
  return (
    <section
      aria-label="Door code"
      className="mx-3.5 -mt-3 relative z-10 rounded-xl px-3.5 py-3 shadow-lg"
      style={{ background: ready ? "linear-gradient(135deg,#0ea5e9,#0284c7)" : "#e0f2fe" }}
    >
      <h2 className="sr-only">Your door code</h2>
      {panel.kind === "code" ? (
        <p className="text-[15px] font-semibold leading-snug text-white">
          Your door code for {panel.place} is{" "}
          <span className="mt-1 block text-3xl font-extrabold tracking-[0.28em] text-white">{panel.code}</span>
        </p>
      ) : (
        <p className="text-[15px] font-semibold leading-snug text-[#0c4a6e]">{panel.text}</p>
      )}
    </section>
  );
}

export default async function GuidebookTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ property: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [{ property }, sp, headerList] = await Promise.all([params, searchParams, headers()]);
  const slug = decodeURIComponent(property);
  const unit = testUnit(slug);
  const guide = getGuidebook(slug);
  if (!unit || !guide || guide.slug !== unit.slug) notFound();

  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  if (!guidebookTestAllowed(process.env.VERCEL_ENV, host)) notFound();

  const keys = Object.keys(sp);
  const tokenQuery = tokenFromQuery(firstQuery(sp.t));
  if (hasCodeParam(keys) || tokenQuery.strip) {
    const next = new URLSearchParams();
    for (const key of keys) {
      if (key.toLowerCase() === "code" || key === "t") continue;
      const value = sp[key];
      if (typeof value === "string") next.set(key, value);
      else if (Array.isArray(value)) for (const item of value) next.append(key, item);
    }
    const qs = next.toString();
    redirect(qs ? `/guidebook-test/${unit.slug}?${qs}` : `/guidebook-test/${unit.slug}`);
  }

  const now = new Date();
  const demo = parseDemoStage(firstQuery(sp.demo));
  const theme = season(now);

  let guestName = "";
  let checkIn: string | null = null;
  let checkOut: string | null = null;
  let panel: DoorPanel = { kind: "hidden" };
  let stayKnown = false;

  if (demo) {
    const dates = demoDates(demo, now);
    const phase = codePhase(dates.checkIn, dates.checkOut, now.getTime());
    guestName = "Demo Guest";
    checkIn = dates.checkIn;
    checkOut = dates.checkOut;
    stayKnown = true;
    panel = doorPanel({
      phase,
      code: demo === "window" ? DEMO_CODE : null,
      place: unit.place,
      lookupFailed: demo === "failed",
    });
  } else if (tokenQuery.token) {
    const found = await lookupStay(unit, tokenQuery.token, now.getTime());
    if (found.kind === "guesty-error") {
      panel = doorPanel({ phase: null, code: null, place: unit.place, lookupFailed: true });
      stayKnown = false;
    } else if (found.kind === "stay") {
      stayKnown = true;
      checkIn = found.stay.checkIn;
      checkOut = found.stay.checkOut;
      panel = doorPanel({
        phase: found.stay.phase,
        code: found.stay.code,
        place: unit.place,
        lookupFailed: found.stay.lookupFailed,
      });
    }
  }

  const ended = stayKnown && checkIn && checkOut ? codePhase(checkIn, checkOut, now.getTime()) === "after" : false;

  return (
    <main className="min-h-screen bg-sky-100 text-sky-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-[#f0f9ff]">
        <header className="flex items-center gap-2 px-3.5 py-2.5" style={{ background: "#0c4a6e" }}>
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white"
            style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}
          >
            SV
          </div>
          <div className="flex-1 text-center">
            <div className="text-base font-bold tracking-wider text-white">Summers Vacations</div>
            <div className="text-[10px] text-white">Branson, Missouri</div>
          </div>
          <div className="text-right text-[10px] text-white">{ended ? "Checked out" : "Test page"}</div>
        </header>

        <p className="bg-amber-100 px-3.5 py-1 text-center text-[10px] font-semibold text-amber-950">
          Test page. Not linked from the live guidebook.
          {demo ? ` Demo: ${demo === "window" ? "during the stay" : demo === "failed" ? "code not available" : demo === "before" ? "before 7 AM" : "after checkout"}.` : ""}
        </p>

        <div className="flex items-center gap-2 px-3.5 py-1.5" style={{ background: theme.gradient }}>
          <span className="text-lg">{theme.emoji}</span>
          <span className="flex-1 text-[12px] font-semibold text-white">{theme.name}</span>
        </div>

        {stayKnown ? (
          <div className="px-4 pb-4 pt-3" style={{ background: theme.gradient }}>
            <h1 className="font-display text-2xl text-white">
              {guestName ? `Welcome, ${guestName}!` : `Welcome to ${guide.name}!`}
            </h1>
            <p className="mt-0.5 text-[13px] text-white">
              {guide.name} · Check-in at {guide.checkIn.time}
              {ended ? " · Stay ended" : ""}
            </p>
          </div>
        ) : (
          <div className="px-4 pb-4 pt-3" style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}>
            <h1 className="font-display text-2xl text-yellow-300">Welcome back to Branson!</h1>
            <p className="mt-0.5 text-[13px] text-white">{theme.tagline}</p>
          </div>
        )}

        <DoorBox panel={panel} />

        {stayKnown && checkIn && checkOut ? (
          <>
            <p className="mx-3.5 mt-3 text-[12px] font-semibold text-sky-900">
              {dateLabel(checkIn)} arrival · {dateLabel(checkOut)} checkout
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(guide.address)}`}
              className="mx-3.5 mt-2 block rounded-lg border border-sky-100 bg-white px-3.5 py-2.5 text-inherit no-underline"
            >
              <div className="text-[11px] font-semibold text-sky-900">{guide.address}</div>
              <div className="mt-0.5 text-[10px] text-sky-800">Tap to open in maps</div>
            </a>
            <section className="mx-3.5 mt-2 rounded-lg border border-sky-100 bg-white px-3.5 py-3">
              <h2 className="text-[13px] font-bold text-sky-900">Getting here</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-sky-900">{guide.checkIn.directions}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-sky-900">{guide.checkIn.parking}</p>
            </section>
            <div className="mt-2.5 flex gap-2 overflow-x-auto px-3.5 pb-1">
              {["aaa-fall-porch.jpg", "aaa-fall-living.jpg", "aaa-fall-kitchen.jpg"].map((file) => (
                <Image
                  key={file}
                  src={`/property-photos/${guide.slug}/${file}`}
                  alt={`${guide.name} photo`}
                  width={140}
                  height={100}
                  className="h-[100px] w-[140px] flex-shrink-0 rounded-lg border border-sky-200 object-cover"
                />
              ))}
            </div>
            <section className="mx-3.5 mt-2 rounded-lg border border-sky-100 bg-white px-3.5 py-3">
              <h2 className="text-[13px] font-bold text-sky-900">House rules</h2>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-sky-900">
                {guide.houseRules.slice(0, 5).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </section>
            <section className="mx-3.5 mt-2 mb-6 rounded-lg border border-sky-100 bg-white px-3.5 py-3">
              <h2 className="text-[13px] font-bold text-sky-900">While you are here</h2>
              <ul className="mt-1 space-y-1 text-[12px] text-sky-900">
                {guide.videos.slice(0, 4).map((video) => (
                  <li key={video.url}>
                    <a href={video.url} className="font-semibold text-sky-800 underline">
                      {video.title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-sky-900">{guide.emergency.localContact}</p>
            </section>
          </>
        ) : (
          <section className="mx-3.5 mt-4 mb-6 rounded-lg border border-sky-100 bg-white px-3.5 py-3">
            <h2 className="text-[13px] font-bold text-sky-900">{theme.featuredEvent}</h2>
            <p className="mt-1 text-[12px] leading-relaxed text-sky-900">{theme.sdcEvent}</p>
            <a href={theme.featuredLink} className="mt-2 inline-block text-[12px] font-semibold text-sky-800 underline">
              See what&apos;s on
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
