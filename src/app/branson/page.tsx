"use client";

/**
 * Phase A+ — Branson live card (shareable), multi-tenant ready.
 * Isolated from /guidebook/[property] guest deep-links.
 * No door codes, Wi‑Fi, or unit secrets.
 *
 * /branson              → Summers (platform default)
 * /branson?t=<slug>     → tenant catalog (or Summers funnel if lapsed)
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SEASONS, type SeasonalTheme } from "@/data/guidebooks";
import {
  resolveFromSlug,
  type CatalogResolution,
  type TenantProperty,
} from "@/data/tenants";
import { FACEBOOK, PHONE } from "@/lib/site";
import dynamic from "next/dynamic";
import FishingMagazine from "@/components/FishingMagazine";

const GuideMap = dynamic(() => import("@/app/map/GuideMap"), { ssr: false });

const LS_PREFIX = "sv-branson-card-v1";

type Session = {
  name: string;
  phone: string;
  unlockedAt: string;
};

function currentSeason(): SeasonalTheme {
  const now = new Date();
  const md = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  return SEASONS.find((s) => s.endDate >= md && s.startDate <= md) || SEASONS[0];
}

function lsKey(tenantSlug: string) {
  return `${LS_PREFIX}:${tenantSlug}`;
}

function loadSession(tenantSlug: string): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(lsKey(tenantSlug));
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.name || !s?.phone) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(tenantSlug: string, s: Session) {
  localStorage.setItem(lsKey(tenantSlug), JSON.stringify(s));
}

function clearSession(tenantSlug: string) {
  localStorage.removeItem(lsKey(tenantSlug));
}

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = digitsOnly(v).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name.trim();
}

function bookHref(p: TenantProperty, catalog: CatalogResolution) {
  const base = p.bookUrl || catalog.displayTenant.bookUrl;
  const absolute = base.startsWith("http") ? base : `https://${base}`;
  const u = new URL(absolute);
  u.searchParams.set("utm_source", "branson_card");
  u.searchParams.set("utm_campaign", catalog.displayTenant.slug);
  u.searchParams.set("utm_content", p.slug);
  if (catalog.usingPlatformFunnel) {
    u.searchParams.set("utm_medium", "funnel_fallback");
  }
  return u.toString();
}

type Tab = "home" | "adventure" | "map" | "shows" | "food" | "fish" | "golf" | "stay";

type ShowItem = {
  name: string;
  url?: string;
  time?: string;
  venue?: string;
  price?: string;
  desc?: string;
  tag?: string;
};

type DiningItem = {
  name: string;
  url?: string;
  cuisine?: string;
  price?: string;
  tag?: string;
  desc?: string;
};

type FishSpecies = {
  name: string;
  rating?: string;
  depth?: string;
  technique?: string;
};

type FishingData = {
  biteOfDay?: string;
  tip?: string;
  conditions?: {
    tableRock?: { temp?: string; level?: string; clarity?: string };
    taneycomo?: { temp?: string; clarity?: string; generation?: string };
  };
  species?: FishSpecies[];
  magazine?: import("@/components/FishingMagazine").FishingMagazineData;
};

type GolfCourse = {
  name: string;
  url?: string;
  rates?: string;
  drive?: string;
  tag?: string;
  desc?: string;
  featured?: boolean;
};

type GolfData = { courses?: GolfCourse[]; tip?: string };

type AttractionItem = {
  name?: string;
  title?: string;
  url?: string;
  area?: string;
  tag?: string;
  desc?: string;
  category?: string;
  featured?: boolean;
};

type ApiBag = Record<string, unknown> & { ok?: boolean };

export default function BransonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sky-50 flex items-center justify-center">
          <p className="text-sky-700 text-sm">Loading…</p>
        </div>
      }
    >
      <BransonCardPage />
    </Suspense>
  );
}

function BransonCardPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("t");
  const catalog = useMemo(() => resolveFromSlug(tenantParam), [tenantParam]);
  const brand = catalog.displayTenant;
  const list = catalog.properties;
  const sessionTenantKey = catalog.requestedTenant.slug;

  const T = useMemo(() => currentSeason(), []);
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const [shows, setShows] = useState<ShowItem[] | null>(null);
  const [dining, setDining] = useState<DiningItem[] | null>(null);
  const [fishing, setFishing] = useState<FishingData | null>(null);
  const [golf, setGolf] = useState<GolfData | null>(null);
  const [attractions, setAttractions] = useState<AttractionItem[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSession(loadSession(sessionTenantKey));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [sessionTenantKey]);

  const unlocked = !!session;

  const loadLive = useCallback(async () => {
    const pull = async (path: string): Promise<ApiBag> => {
      const r = await fetch(path);
      return (await r.json()) as ApiBag;
    };
    try {
      const [sh, di, fi, go, at] = await Promise.all([
        pull("/api/shows").catch(() => ({ ok: false }) as ApiBag),
        pull("/api/dining").catch(() => ({ ok: false }) as ApiBag),
        pull("/api/fishing-report").catch(() => ({ ok: false }) as ApiBag),
        pull("/api/golf").catch(() => ({ ok: false }) as ApiBag),
        pull("/api/attractions").catch(() => ({ ok: false }) as ApiBag),
      ]);
      setLoadErr(null);
      setShows(sh.ok && Array.isArray(sh.shows) ? (sh.shows as ShowItem[]) : []);
      setDining(
        di.ok && Array.isArray(di.restaurants)
          ? (di.restaurants as DiningItem[])
          : []
      );
      setFishing(fi.ok ? (fi as FishingData) : null);
      setGolf(go.ok ? (go as GolfData) : null);
      if (at.ok && Array.isArray(at.attractions)) {
        setAttractions(at.attractions as AttractionItem[]);
      } else if (at.ok && Array.isArray(at.items)) {
        setAttractions(at.items as AttractionItem[]);
      } else {
        setAttractions([]);
      }
    } catch {
      setLoadErr(
        "Could not load live Branson data right now. Try again in a moment."
      );
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    (async () => {
      await loadLive();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [unlocked, loadLive]);

  function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    const p = digitsOnly(phone);
    if (n.length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (p.length < 10) {
      setError("Enter a 10-digit mobile number.");
      return;
    }
    const s: Session = {
      name: n,
      phone: p,
      unlockedAt: new Date().toISOString(),
    };
    saveSession(sessionTenantKey, s);
    setSession(s);
  }

  async function onShare() {
    const url =
      typeof window !== "undefined"
        ? window.location.href.split("#")[0]
        : `https://branson-condo.com/branson?t=${sessionTenantKey}`;
    const text = `Live Branson guide from ${brand.displayName} — shows, food, fishing & stays.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Branson Live Guide", text, url });
        setShareMsg("Thanks for sharing!");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied — paste anywhere.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied.");
      } catch {
        setShareMsg(url);
      }
    }
    setTimeout(() => setShareMsg(null), 3500);
  }

  function onLock() {
    clearSession(sessionTenantKey);
    setSession(null);
    setTab("home");
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <p className="text-sky-700 text-sm">Loading…</p>
      </div>
    );
  }

  const greet = session ? firstName(session.name) : "";
  const hostPhone = brand.phone || PHONE;
  const hostTel = `tel:${digitsOnly(hostPhone)}`;

  return (
    <div
      className="min-h-screen bg-sky-50 flex flex-col max-w-md mx-auto relative"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <div className="h-[34px]" />

      <div
        className="flex items-center gap-2 px-3.5 pb-2.5 flex-shrink-0"
        style={{ background: "#0c4a6e", paddingTop: 8 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 text-white"
          style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}
        >
          {brand.brandShort.slice(0, 2)}
        </div>
        <div className="flex-1 text-center">
          <div className="text-base font-bold tracking-wider text-white">
            {brand.displayName}
          </div>
          <div className="text-[10px] text-white/90">Branson Live Guide</div>
        </div>
        <div className="text-[10px] text-right text-white/90">🌊 City</div>
      </div>

      <div
        className="flex gap-2 px-3.5 py-1 flex-shrink-0 justify-center"
        style={{ background: "#0c4a6e" }}
      >
        <div
          className="text-[10px] font-semibold px-3 py-1 rounded-full text-white"
          style={{ background: T.accentColor }}
        >
          🌊 Branson Mode
          {catalog.reason === "trial" ? " · Trial" : ""}
        </div>
      </div>

      {catalog.usingPlatformFunnel && (
        <div className="px-3.5 py-1.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-950 leading-relaxed">
          This host&apos;s listing placement is inactive. Featuring{" "}
          <strong>Summers Vacations</strong> stays meanwhile —{" "}
          {catalog.statusLabel}.
        </div>
      )}

      <div
        className="px-3.5 py-1.5 flex items-center gap-2 flex-shrink-0"
        style={{ backgroundImage: T.gradient }}
      >
        <span className="text-lg">{T.emoji}</span>
        <span className="text-[12px] font-semibold text-white flex-1">
          {T.name}
        </span>
        <span className="text-[10px] text-white/90">{todayLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarWidth: "none" }}>
        {!unlocked ? (
          <>
            <div
              className="px-4 pt-4 pb-5"
              style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}
            >
              <h1
                className="text-2xl text-yellow-300"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
              >
                Your live Branson guide
              </h1>
              <p className="text-[13px] text-white mt-1 leading-relaxed">
                Shows, dining, fishing, golf & stays from {brand.displayName}.
                Unlock free with your name & mobile.
              </p>
              <p className="text-[11px] text-sky-100 mt-2">
                {brand.tagline || T.tagline}
              </p>
            </div>

            <div className="mx-3.5 -mt-3 relative z-10 bg-white rounded-xl border border-sky-100 shadow-md px-3.5 py-3">
              <div className="text-[12px] font-bold text-sky-900 mb-1">
                What you&apos;ll unlock
              </div>
              <ul className="text-[12px] text-sky-800 space-y-1 leading-relaxed">
                <li>🗺️ Live map — stays, eats, shows, cams</li>
                <li>🎭 Today&apos;s shows & entertainment picks</li>
                <li>🍽️ Dining · 🎣 fishing · ⛳ golf</li>
                <li>🏡 Stays from {brand.displayName}</li>
                <li>📤 Share this card like a virtual business card</li>
              </ul>
              <p className="text-[10px] text-sky-600 mt-2">
                No door codes or unit Wi‑Fi here — those stay on a private guest
                stay link.
              </p>
            </div>

            <form
              onSubmit={onUnlock}
              className="mx-3.5 mt-3 bg-white rounded-xl border border-sky-100 px-3.5 py-3.5"
            >
              <div className="text-[13px] font-bold text-sky-900 mb-2">
                Unlock live guide
              </div>
              <label className="block text-[11px] font-semibold text-sky-800 mb-1">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="First name is fine"
                className="w-full rounded-lg border border-sky-200 px-3 py-2.5 text-[14px] text-sky-900 mb-2.5 outline-none focus:border-sky-400"
              />
              <label className="block text-[11px] font-semibold text-sky-800 mb-1">
                Mobile number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(555) 555-5555"
                className="w-full rounded-lg border border-sky-200 px-3 py-2.5 text-[14px] text-sky-900 mb-2 outline-none focus:border-sky-400"
              />
              <p className="text-[10px] text-sky-600 mb-2.5 leading-relaxed">
                We use this to personalize your guide. We won&apos;t sell your
                number.
              </p>
              {error && (
                <p className="text-[12px] text-red-600 font-semibold mb-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-lg py-3 text-[14px] font-bold text-white border-0 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#0284c7)" }}
              >
                Unlock Branson live →
              </button>
            </form>

            <div className="mx-3.5 mt-3 mb-2">
              <div className="text-[12px] font-bold text-sky-900 px-0.5 mb-1.5">
                Stays
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {list.slice(0, 4).map((p) => (
                  <a
                    key={p.slug}
                    href={bookHref(p, catalog)}
                    target="_blank"
                    rel="noopener"
                    className="flex-shrink-0 w-[140px] bg-white rounded-lg border border-sky-100 overflow-hidden no-underline text-inherit"
                  >
                    {p.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo}
                        alt=""
                        className="w-full h-[80px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-[80px] bg-sky-100" />
                    )}
                    <div className="px-2 py-1.5">
                      <div className="text-[11px] font-bold text-sky-900 leading-tight">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-sky-600">
                        {p.beds} · sleeps {p.sleeps}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {tab === "home" && (
              <>
                <div
                  className="px-4 pt-3 pb-4"
                  style={{ background: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" }}
                >
                  <h1
                    className="text-2xl text-yellow-300"
                    style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                  >
                    Hey {greet}! 🤠
                  </h1>
                  <p className="text-[13px] text-white mt-0.5">
                    {brand.tagline || T.tagline}
                  </p>
                  <p className="text-[11px] text-sky-100 mt-1">
                    Live Branson · {brand.displayName} · {todayLabel}
                  </p>
                </div>

                {loadErr && (
                  <div className="mx-3.5 mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
                    {loadErr}{" "}
                    <button
                      type="button"
                      className="underline font-semibold"
                      onClick={loadLive}
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="mx-3.5 mt-2 grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ["🎭", "Shows", `${shows?.length ?? "…"} listed`, "shows"],
                      ["🍽️", "Dining", `${dining?.length ?? "…"} spots`, "food"],
                      [
                        "🎣",
                        "Fishing",
                        fishing?.biteOfDay ? "Report live" : "Guide",
                        "fish",
                      ],
                      [
                        "⛳",
                        "Golf",
                        golf?.courses
                          ? `${golf.courses.length} courses`
                          : "Guide",
                        "golf",
                      ],
                    ] as const
                  ).map(([emoji, label, meta, id]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className="bg-white rounded-lg border border-sky-100 px-2.5 py-2.5 text-left cursor-pointer"
                    >
                      <div className="text-xl">{emoji}</div>
                      <div className="text-[12px] font-bold text-sky-900">
                        {label}
                      </div>
                      <div className="text-[10px] text-sky-600">{meta}</div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setTab("map")}
                  className="mx-3.5 mt-1.5 w-[calc(100%-1.75rem)] bg-white rounded-lg border border-sky-100 px-3 py-2.5 text-left cursor-pointer"
                >
                  <div className="text-[12px] font-bold text-sky-900">
                    🗺️ Live Branson map
                  </div>
                  <div className="text-[10px] text-sky-600">
                    Stays · restaurants · shows · cams — tap a pin
                  </div>
                </button>

                {fishing?.biteOfDay && (
                  <div className="mx-3.5 mt-2 rounded-lg px-3 py-2.5 border border-sky-200 bg-white">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-600">
                      Bite of the day
                    </div>
                    <div className="text-[12px] text-sky-900 mt-0.5 leading-relaxed">
                      {fishing.biteOfDay}
                    </div>
                  </div>
                )}

                {!!shows?.length && (
                  <>
                    <h2
                      className="font-serif text-lg text-sky-900 px-3.5 pt-3 pb-1"
                      style={{
                        fontFamily: "var(--font-fraunces), Georgia, serif",
                      }}
                    >
                      🎭 Spotlight shows
                    </h2>
                    {shows.slice(0, 4).map((x, i) => (
                      <a
                        key={i}
                        href={x.url || "#"}
                        target="_blank"
                        rel="noopener"
                        className="block bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-sky-100 no-underline text-inherit"
                      >
                        <div className="text-[13px] font-bold text-sky-900">
                          {x.name}
                        </div>
                        <div className="text-[11px] text-sky-700 mt-0.5">
                          {[x.time, x.venue, x.price].filter(Boolean).join(" · ")}
                        </div>
                        {x.desc && (
                          <div className="text-[11px] text-sky-700 mt-1 leading-relaxed">
                            {x.desc}
                          </div>
                        )}
                      </a>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTab("shows")}
                      className="mx-3.5 text-[12px] font-semibold text-sky-700 underline bg-transparent border-0 cursor-pointer"
                    >
                      See all shows →
                    </button>
                  </>
                )}

                <h2
                  className="font-serif text-lg text-sky-900 px-3.5 pt-3 pb-1"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
                >
                  🏡 Stay with {brand.displayName}
                </h2>
                {list.map((p) => (
                  <PropertyRow key={p.slug} p={p} href={bookHref(p, catalog)} />
                ))}

                <div className="mx-3.5 mt-3 mb-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onShare}
                    className="w-full rounded-lg py-3 text-[13px] font-bold text-white border-0 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg,#0ea5e9,#0284c7)",
                    }}
                  >
                    📤 Share this Branson card
                  </button>
                  {shareMsg && (
                    <p className="text-[11px] text-center text-sky-700 font-semibold">
                      {shareMsg}
                    </p>
                  )}
                  {brand.isPlatformDefault && (
                    <a
                      href={FACEBOOK}
                      target="_blank"
                      rel="noopener"
                      className="text-center text-[12px] font-semibold text-sky-800 no-underline"
                    >
                      Follow Summers Vacations on Facebook
                    </a>
                  )}
                  <a
                    href={hostTel}
                    className="text-center text-[12px] text-sky-700 no-underline"
                  >
                    Host · {hostPhone}
                  </a>
                  <button
                    type="button"
                    onClick={onLock}
                    className="text-[11px] text-sky-500 underline bg-transparent border-0 cursor-pointer mt-1"
                  >
                    Sign out on this device
                  </button>
                </div>
              </>
            )}

            {tab === "map" && (
              <div className="px-0 pt-1" style={{ height: "calc(100dvh - 11.5rem)" }}>
                <GuideMap />
              </div>
            )}

            {tab === "adventure" && (
              <ListTab
                title="Adventure"
                subtitle="Theme parks · coasters · outdoors · thrills"
                gradient="linear-gradient(135deg,#0f766e,#14b8a6)"
                empty={attractions === null}
                emptyLabel="Loading adventures…"
              >
                {(attractions || [])
                  .slice()
                  .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
                  .map((a, i) => (
                    <Item
                      key={i}
                      href={a.url}
                      title={a.name || a.title || "Attraction"}
                      meta={[a.tag, a.area, a.category].filter(Boolean).join(" · ")}
                      desc={a.desc}
                    />
                  ))}
                {attractions && attractions.length === 0 && (
                  <p className="px-3.5 py-8 text-center text-sm text-sky-700">
                    Adventure list not available yet — check back soon.
                  </p>
                )}
              </ListTab>
            )}

            {tab === "shows" && (
              <ListTab
                title="Branson Shows"
                subtitle="Music · comedy · dinner · magic"
                gradient="linear-gradient(135deg,#7c3aed,#6d28d9)"
                empty={!shows}
                emptyLabel="Loading shows…"
              >
                {(shows || []).map((x, i) => (
                  <Item
                    key={i}
                    href={x.url}
                    title={x.name}
                    meta={[x.time, x.venue, x.price].filter(Boolean).join(" · ")}
                    desc={x.desc}
                  />
                ))}
                {shows && shows.length === 0 && (
                  <p className="px-3.5 py-8 text-center text-sm text-sky-700">
                    No shows file loaded yet — check back soon.
                  </p>
                )}
              </ListTab>
            )}

            {tab === "food" && (
              <ListTab
                title="Branson Dining"
                subtitle="Restaurants · waterfront · local picks"
                gradient="linear-gradient(135deg,#be123c,#e11d48)"
                empty={!dining}
                emptyLabel="Loading dining…"
              >
                {(dining || []).map((x, i) => (
                  <Item
                    key={i}
                    href={x.url}
                    title={x.name}
                    meta={[x.cuisine, x.price, x.tag]
                      .filter(Boolean)
                      .join(" · ")}
                    desc={x.desc}
                  />
                ))}
                {dining && dining.length === 0 && (
                  <p className="px-3.5 py-8 text-center text-sm text-sky-700">
                    Dining list not available yet.
                  </p>
                )}
              </ListTab>
            )}

            {tab === "fish" && (
              <ListTab
                title="Hooked on Branson"
                subtitle="The daily read · Table Rock · Taneycomo"
                gradient="linear-gradient(135deg,#0369a1,#0ea5e9)"
                empty={false}
              >
                {fishing?.magazine ? (
                  <FishingMagazine magazine={fishing.magazine} />
                ) : (
                  <>
                    {fishing?.biteOfDay && (
                      <div className="mx-3.5 mt-2 rounded-lg bg-sky-900 text-white px-3 py-2.5">
                        <div className="text-[10px] font-semibold uppercase text-sky-200">
                          Bite of the day
                        </div>
                        <div className="text-[13px] mt-0.5 leading-relaxed">
                          {fishing.biteOfDay}
                        </div>
                      </div>
                    )}
                    {!fishing && (
                      <p className="px-3.5 py-8 text-center text-sm text-sky-700">
                        Loading fishing report…
                      </p>
                    )}
                  </>
                )}
              </ListTab>
            )}

            {tab === "golf" && (
              <ListTab
                title="Branson Golf"
                subtitle="Courses · rates · tee times"
                gradient="linear-gradient(135deg,#2a5e3e,#1e4a30)"
                empty={!golf}
                emptyLabel="Loading golf…"
              >
                {(golf?.courses || []).map((c, i) => (
                  <Item
                    key={i}
                    href={c.url}
                    title={c.name}
                    meta={[c.rates, c.drive, c.tag].filter(Boolean).join(" · ")}
                    desc={c.desc}
                  />
                ))}
                {golf?.tip && (
                  <div className="mx-3.5 my-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-2 text-[11px] text-teal-900">
                    💡 {golf.tip}
                  </div>
                )}
                {golf && !(golf.courses || []).length && (
                  <p className="px-3.5 py-8 text-center text-sm text-sky-700">
                    Golf list not available yet.
                  </p>
                )}
              </ListTab>
            )}

            {tab === "stay" && (
              <ListTab
                title="Stays"
                subtitle={brand.tagline || brand.displayName}
                gradient="linear-gradient(135deg,#0c4a6e,#0ea5e9)"
                empty={false}
              >
                {list.map((p) => (
                  <PropertyRow key={p.slug} p={p} href={bookHref(p, catalog)} />
                ))}
                <button
                  type="button"
                  onClick={() => setTab("adventure")}
                  className="mx-3.5 mt-2 mb-1 w-[calc(100%-1.75rem)] rounded-lg py-2.5 text-[12px] font-bold text-teal-900 bg-teal-50 border border-teal-200 cursor-pointer"
                >
                  🏞️ Browse Adventure tab → parks, coasters & thrills
                </button>
              </ListTab>
            )}
          </>
        )}
      </div>

      {unlocked && (
        <nav
          className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex border-t border-sky-900/20"
          style={{
            background: "#0c4a6e",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {(
            [
              ["home", "🏠", "Home"],
              ["adventure", "🏞️", "Adventure"],
              ["map", "🗺️", "Map"],
              ["shows", "🎭", "Shows"],
              ["food", "🍽️", "Food"],
              ["fish", "🎣", "Fish"],
              ["golf", "⛳", "Golf"],
              ["stay", "🏡", "Stay"],
            ] as const
          ).map(([id, emoji, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center py-2 gap-0.5 bg-transparent border-0 cursor-pointer"
              style={{ color: tab === id ? T.accentColor : "#94a3b8" }}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className="text-[9px] font-semibold">{label}</span>
            </button>
          ))}
        </nav>
      )}

      {!unlocked && (
        <div className="px-3.5 py-3 text-center">
          <Link href="/" className="text-[11px] text-sky-600 no-underline">
            home
          </Link>
        </div>
      )}
    </div>
  );
}

function PropertyRow({ p, href }: { p: TenantProperty; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="flex gap-2.5 bg-white rounded-lg mx-3.5 mb-1.5 border border-sky-100 overflow-hidden no-underline text-inherit"
    >
      {p.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.photo}
          alt=""
          className="w-[88px] h-[72px] object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-[88px] h-[72px] bg-sky-100 flex-shrink-0" />
      )}
      <div className="py-2 pr-2 flex-1 min-w-0">
        <div className="text-[12px] font-bold text-sky-900 truncate">
          {p.badge ? `${p.badge} ` : ""}
          {p.name}
        </div>
        <div className="text-[10px] text-sky-600">
          {p.area} · {p.beds} · sleeps {p.sleeps}
        </div>
        <div className="text-[10px] text-sky-700 mt-0.5 line-clamp-2">
          {p.blurb}
        </div>
        <div className="text-[10px] font-semibold text-sky-600 mt-1">Book →</div>
      </div>
    </a>
  );
}

function ListTab({
  title,
  subtitle,
  gradient,
  children,
  empty,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  gradient: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyLabel?: string;
}) {
  return (
    <>
      <div className="px-4 pt-3 pb-3" style={{ background: gradient }}>
        <h1
          className="text-2xl text-white"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
        >
          {title}
        </h1>
        <p className="text-[12px] mt-0.5 text-white/80">{subtitle}</p>
      </div>
      {empty ? (
        <p className="px-3.5 py-10 text-center text-sm text-sky-700">
          {emptyLabel || "Loading…"}
        </p>
      ) : (
        <div className="pt-2 pb-4">{children}</div>
      )}
    </>
  );
}

function Item({
  href,
  title,
  meta,
  desc,
}: {
  href?: string;
  title: string;
  meta?: string;
  desc?: string;
}) {
  const inner = (
    <>
      <div className="text-[13px] font-bold text-sky-900">{title}</div>
      {meta ? (
        <div className="text-[11px] text-sky-700 mt-0.5">{meta}</div>
      ) : null}
      {desc ? (
        <div className="text-[11px] text-sky-700 mt-1 leading-relaxed">{desc}</div>
      ) : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        className="block bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-sky-100 no-underline text-inherit"
      >
        {inner}
      </a>
    );
  }
  return (
    <div className="bg-white rounded-lg px-3.5 py-3 mx-3.5 mb-1 border border-sky-100">
      {inner}
    </div>
  );
}
