import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { headers } from "next/headers";
import { getGuidebook } from "@/data/guidebooks";
import { guidebookTestAllowed, firstQuery, hasCodeParam, parseDemoStage, tokenFromQuery, type DemoStage } from "@/lib/guidebook-test/access";
import { codePhase, doorPanel } from "@/lib/guidebook-test/display";
import { lookupStay } from "@/lib/guidebook-test/lookup";
import { testUnit } from "@/lib/guidebook-test/units";
import GuidebookScreen, { type GuidebookDoor } from "./GuidebookScreen";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

const DEMO_CODE = "0000";

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

function toDoor(panel: ReturnType<typeof doorPanel>): GuidebookDoor {
  if (panel.kind === "code") return { kind: "code", code: panel.code };
  if (panel.kind === "before") return { kind: "before" };
  if (panel.kind === "fallback") return { kind: "fallback" };
  return { kind: "hidden" };
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
  let checkin: string | null = null;
  let checkout: string | null = null;
  let door: GuidebookDoor = { kind: "hidden" };

  if (demo) {
    const dates = demoDates(demo, now);
    const phase = codePhase(dates.checkIn, dates.checkOut, now.getTime());
    checkin = dates.checkIn;
    checkout = dates.checkOut;
    door = toDoor(doorPanel({
      phase,
      code: demo === "window" ? DEMO_CODE : null,
      place: unit.place,
      lookupFailed: demo === "failed",
    }));
  } else if (tokenQuery.token) {
    const found = await lookupStay(unit, tokenQuery.token, now.getTime());
    if (found.kind === "guesty-error") {
      door = { kind: "fallback" };
    } else if (found.kind === "stay") {
      checkin = found.stay.checkIn;
      checkout = found.stay.checkOut;
      door = toDoor(doorPanel({
        phase: found.stay.phase,
        code: found.stay.code,
        place: unit.place,
        lookupFailed: found.stay.lookupFailed,
      }));
    }
  }

  return (
    <GuidebookScreen
      slug={unit.slug}
      listingId={unit.listingId}
      place={unit.place}
      checkin={checkin}
      checkout={checkout}
      door={door}
    />
  );
}
