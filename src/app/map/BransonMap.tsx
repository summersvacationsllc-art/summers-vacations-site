"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { ArrowRight, ExternalLink, MapPin, X, Home } from "lucide-react";
import {
  BRANSON_MAP_SPOTS,
  MAP_CATEGORIES,
  MAP_CATEGORY_META,
  diningToMapSpot,
  showsToMapSpots,
  golfToMapSpot,
  attractionToMapSpot,
  fishingToMapSpot,
  type MapCategory,
  type MapSpot,
} from "@/data/branson-map";
import { BOOK_URL } from "@/lib/site";
import { getMapTileConfig } from "@/lib/map-tiles";
import "leaflet/dist/leaflet.css";
import "./map.css";

const MAP_TILES = getMapTileConfig();

function pinIcon(spot: MapSpot, active: boolean) {
  const meta = MAP_CATEGORY_META[spot.category];
  const stay = spot.category === "stay";
  const size = stay ? 44 : 38;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    tooltipAnchor: [0, -size],
    html: `<div class="sv-pin${active ? " is-active" : ""}${stay ? " sv-pin-stay" : ""}" style="background:${meta.color}">${meta.emoji}</div>`,
  });
}

function FlyTo({ spot }: { spot: MapSpot | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!spot) return;
    map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 14), {
      duration: 0.7,
    });
  }, [map, spot]);
  return null;
}

function kioskHomeUrl(unit: string | null) {
  const base = "/kiosk.html";
  if (unit) return `${base}?unit=${encodeURIComponent(unit)}`;
  return base;
}

function goKioskHome(unit: string | null) {
  const home = kioskHomeUrl(unit);
  try {
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      const parentWin = window.parent as Window & {
        goHome?: () => void;
        closePlayer?: () => void;
      };
      try {
        parentWin.closePlayer?.();
      } catch {
        /* ignore */
      }
      try {
        if (typeof parentWin.goHome === "function") {
          parentWin.goHome();
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        parentWin.location.href = home;
        return;
      } catch {
        /* cross-origin fallback below */
      }
    }
  } catch {
    /* ignore */
  }
  window.location.href = home;
}

export default function BransonMap({ embed = false }: { embed?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("spot");
  const kioskMode = params.get("kiosk") === "1";
  const unitSlug = params.get("unit");
  const isEmbed = embed || kioskMode;
  const [filter, setFilter] = useState<MapCategory | "all">(
    params.get("filter") === "webcam" ? "webcam" : "all",
  );
  const [selectedId, setSelectedId] = useState<string | null>(initial);
  const [camSpot, setCamSpot] = useState<MapSpot | null>(null);
  const [diningSpots, setDiningSpots] = useState<MapSpot[]>([]);
  const [liveShowSpots, setLiveShowSpots] = useState<MapSpot[]>([]);
  const [golfSpots, setGolfSpots] = useState<MapSpot[]>([]);
  const [attractionSpots, setAttractionSpots] = useState<MapSpot[]>([]);
  const [fishSpots, setFishSpots] = useState<MapSpot[]>([]);

  useEffect(() => {
    fetch("/api/dining")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.restaurants)) return;
        setDiningSpots(
          d.restaurants
            .map((row: Parameters<typeof diningToMapSpot>[0]) =>
              diningToMapSpot(row),
            )
            .filter((s: MapSpot | null): s is MapSpot => Boolean(s)),
        );
      })
      .catch(() => {});
    fetch("/api/shows")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.shows)) return;
        setLiveShowSpots(showsToMapSpots(d.shows, BRANSON_MAP_SPOTS));
      })
      .catch(() => {});
    fetch("/api/golf")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.courses)) return;
        setGolfSpots(
          d.courses
            .map((row: Parameters<typeof golfToMapSpot>[0]) => golfToMapSpot(row))
            .filter((s: MapSpot | null): s is MapSpot => Boolean(s)),
        );
      })
      .catch(() => {});
    fetch("/api/attractions")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.attractions)) return;
        setAttractionSpots(
          d.attractions
            .map((row: Parameters<typeof attractionToMapSpot>[0]) =>
              attractionToMapSpot(row, BRANSON_MAP_SPOTS),
            )
            .filter((s: MapSpot | null): s is MapSpot => Boolean(s)),
        );
      })
      .catch(() => {});
    fetch("/api/fishing-report")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok || !Array.isArray(d.spots)) return;
        setFishSpots(
          d.spots
            .map((row: Parameters<typeof fishingToMapSpot>[0]) =>
              fishingToMapSpot(row, BRANSON_MAP_SPOTS),
            )
            .filter((s: MapSpot | null): s is MapSpot => Boolean(s)),
        );
      })
      .catch(() => {});
  }, []);

  const allSpots = useMemo(
    () => [
      ...BRANSON_MAP_SPOTS,
      ...diningSpots,
      ...liveShowSpots,
      ...golfSpots,
      ...attractionSpots,
      ...fishSpots,
    ],
    [diningSpots, liveShowSpots, golfSpots, attractionSpots, fishSpots],
  );

  const webcamSpots = useMemo(
    () => allSpots.filter((s) => s.category === "webcam"),
    [allSpots],
  );

  const spots = useMemo(
    () =>
      filter === "all"
        ? allSpots
        : allSpots.filter((s) => s.category === filter),
    [filter, allSpots],
  );

  const selected =
    spots.find((s) => s.id === selectedId) ||
    allSpots.find((s) => s.id === selectedId);

  useEffect(() => {
    if (initial && allSpots.some((s) => s.id === initial)) {
      setSelectedId(initial);
    }
  }, [initial, allSpots]);

  function select(id: string | null) {
    setSelectedId(id);
    if (!isEmbed) {
      router.replace(id ? `/map?spot=${id}` : "/map", { scroll: false });
    }
  }

  function openCam(spot: MapSpot) {
    setCamSpot(spot);
    select(spot.id);
  }

  function closeCam() {
    setCamSpot(null);
  }

  // Public /map: cam cards on "all" + "webcam". Embed/kiosk: cams are their own
  // filter only — gallery on "all" was filling the iframe and hiding map + list.
  const showCamGallery =
    filter === "webcam" || (!isEmbed && filter === "all");
  const embedCamOnly = isEmbed && filter === "webcam";
  const showSpotsList = !embedCamOnly;

  return (
    <div
      className={
        isEmbed
          ? "h-full bg-[#f0f9ff] flex flex-col"
          : "min-h-screen bg-[#f0f9ff] flex flex-col"
      }
    >
      {!isEmbed && (
        <header className="sticky top-0 z-[1000] bg-white/90 backdrop-blur-md border-b border-sky-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md bg-gradient-to-br from-[#0c4a6e] to-[#0ea5e9]">
                MB
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-extrabold text-[#0c4a6e]">
                  Branson Map
                </div>
                <div className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide hidden sm:block">
                  Cams · eats · shows
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/branson"
                className="hidden sm:inline-flex text-sm font-semibold text-[#0369a1] no-underline px-3 py-2 rounded-lg hover:bg-sky-50"
              >
                Live guide
              </Link>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-book inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm no-underline"
              >
                Book
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </header>
      )}

      <div
        className={
          isEmbed
            ? "px-2 pt-1 pb-1 w-full shrink-0"
            : "px-4 sm:px-6 pt-4 pb-2 max-w-7xl mx-auto w-full"
        }
      >
        {!isEmbed && (
          <>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0c4a6e]">
              Your Branson playground
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
              Hover a pin, tap for tickets or a live cam. Same bright-blue guide
              — just on a map.
            </p>
          </>
        )}
        <div className="flex gap-2 overflow-x-auto py-2 -mx-1 px-1">
          {MAP_CATEGORIES.map((c) => {
            const on = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setFilter(c.id);
                  if (selected && c.id !== "all" && selected.category !== c.id) {
                    select(null);
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-full text-sm font-bold border transition-colors ${
                  on
                    ? "text-white border-transparent"
                    : "bg-white text-[#0c4a6e] border-sky-200 hover:bg-sky-50"
                }`}
                style={on ? { background: c.color } : undefined}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {showCamGallery && !embedCamOnly && webcamSpots.length > 0 && (
          <div className="pb-2">
            {filter === "webcam" && (
              <p className="text-xs font-bold uppercase tracking-wide text-[#0369a1] mb-2 px-0.5">
                Live cams — tap a card
              </p>
            )}
            <div
              className={`grid gap-3 ${
                filter === "webcam"
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
              }`}
            >
              {webcamSpots.map((spot) => (
                <button
                  key={`cam-card-${spot.id}`}
                  type="button"
                  onClick={() => openCam(spot)}
                  className={`text-left rounded-2xl border-2 overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md min-h-[44px] ${
                    selectedId === spot.id
                      ? "border-cyan-400 ring-2 ring-cyan-200"
                      : "border-sky-200"
                  }`}
                >
                  {spot.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={spot.preview}
                      alt=""
                      className={`w-full object-cover bg-sky-100 ${
                        filter === "webcam" ? "h-40 sm:h-44" : "h-28 sm:h-32"
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-full flex items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 text-4xl ${
                        filter === "webcam" ? "h-40 sm:h-44" : "h-28 sm:h-32"
                      }`}
                    >
                      📹
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-sm sm:text-base font-bold text-[#0c4a6e] leading-snug">
                      {spot.name}
                    </div>
                    <div className="text-xs text-[#0369a1] mt-0.5 font-semibold">
                      {spot.venue}
                    </div>
                    <div className="mt-2 inline-flex items-center justify-center min-h-[44px] px-3 rounded-full text-sm font-bold text-white bg-[#0284c7]">
                      Watch live cam
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {embedCamOnly && webcamSpots.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 w-full">
          <p className="text-xs font-bold uppercase tracking-wide text-[#0369a1] mb-2 px-0.5">
            Live cams — tap a card
          </p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {webcamSpots.map((spot) => (
              <button
                key={`cam-card-embed-${spot.id}`}
                type="button"
                onClick={() => openCam(spot)}
                className={`text-left rounded-2xl border-2 overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md min-h-[44px] ${
                  selectedId === spot.id
                    ? "border-cyan-400 ring-2 ring-cyan-200"
                    : "border-sky-200"
                }`}
              >
                {spot.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={spot.preview}
                    alt=""
                    className="w-full object-cover bg-sky-100 h-40 sm:h-44"
                  />
                ) : (
                  <div className="w-full h-40 sm:h-44 flex items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 text-4xl">
                    📹
                  </div>
                )}
                <div className="p-3">
                  <div className="text-sm sm:text-base font-bold text-[#0c4a6e] leading-snug">
                    {spot.name}
                  </div>
                  <div className="text-xs text-[#0369a1] mt-0.5 font-semibold">
                    {spot.venue}
                  </div>
                  <div className="mt-2 inline-flex items-center justify-center min-h-[44px] px-3 rounded-full text-sm font-bold text-white bg-[#0284c7]">
                    Watch live cam
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!embedCamOnly && (
      <div
        className={
          isEmbed
            ? "flex-1 min-h-0 w-full px-2 pb-2 flex flex-col portrait:flex-col landscape:flex-row gap-2"
            : "flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4"
        }
      >
        <div
          className={
            isEmbed
              ? "sv-map-wrap relative rounded-xl overflow-hidden border-2 border-sky-200 flex-1 min-h-[42vh] landscape:min-h-0 landscape:h-full"
              : "sv-map-wrap relative rounded-2xl overflow-hidden border-2 border-sky-200 shadow-lg h-[62vh] min-h-[420px] lg:h-[calc(100vh-230px)]"
          }
        >
          <MapContainer
            center={[36.64, -93.27]}
            zoom={12}
            scrollWheelZoom
            className="h-full w-full"
          >
            {/* Keyless OpenStreetMap tiles. CARTO basemaps now require an API key
                (every tile came back "API KEY REQUIRED"). OSM tile policy: keep the
                attribution visible and let the browser send its Referer. */}
            <TileLayer
              attribution={MAP_TILES.attribution}
              url={MAP_TILES.url}
              maxZoom={MAP_TILES.maxZoom}
            />
            <FlyTo spot={selected} />
            {spots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                icon={pinIcon(spot, selectedId === spot.id)}
                eventHandlers={{
                  click: () => {
                    if (spot.category === "webcam") openCam(spot);
                    else select(spot.id);
                  },
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  className="sv-tooltip"
                >
                  <div>
                    <div>{spot.name}</div>
                    <div
                      style={{ fontWeight: 500, opacity: 0.85, fontSize: 11 }}
                    >
                      {spot.venue}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          {selected && selected.category !== "webcam" && (
            <article className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:w-[360px] z-[900] bg-white rounded-2xl border-2 border-sky-200 shadow-2xl overflow-hidden">
              {selected.preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.preview}
                  alt={`${selected.name} live preview`}
                  className="w-full h-40 sm:h-44 object-cover bg-sky-100"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#0c4a6e]"
                      style={{
                        background: `${MAP_CATEGORY_META[selected.category].color}33`,
                      }}
                    >
                      {MAP_CATEGORY_META[selected.category].emoji}{" "}
                      {MAP_CATEGORY_META[selected.category].label}
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#0c4a6e] mt-1 leading-tight">
                      {selected.name}
                    </h2>
                    <p className="text-xs font-semibold text-[#0369a1] mt-0.5 flex items-start gap-1">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      {selected.venue}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => select(null)}
                    className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-sky-50 hover:text-[#0c4a6e] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={22} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {selected.description}
                </p>
                <div className="flex flex-col gap-2 mt-3">
                  <a
                    href={selected.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-lake inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-full text-sm no-underline"
                  >
                    {selected.cta}
                    <ExternalLink size={14} />
                  </a>
                  <Link
                    href={selected.ourPath}
                    className="text-center text-xs font-bold text-[#0369a1] no-underline hover:underline py-2 min-h-[44px] flex items-center justify-center"
                  >
                    {isEmbed
                      ? "Open full map"
                      : `Open on our map · mybransonvacation.com${selected.ourPath}`}
                  </Link>
                </div>
              </div>
            </article>
          )}

          {selected && selected.category === "webcam" && !camSpot && (
            <article className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:w-[min(420px,calc(100%-1.5rem))] z-[900] bg-white rounded-2xl border-2 border-cyan-300 shadow-2xl overflow-hidden">
              {selected.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.preview}
                  alt={`${selected.name} live preview`}
                  className="w-full h-44 sm:h-52 object-cover bg-sky-100"
                />
              ) : (
                <div className="w-full h-44 sm:h-52 flex items-center justify-center bg-gradient-to-br from-sky-100 to-cyan-100 text-5xl">
                  📹
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-[#0c4a6e] bg-cyan-100">
                      📹 Live cam
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#0c4a6e] mt-1 leading-tight">
                      {selected.name}
                    </h2>
                    <p className="text-xs font-semibold text-[#0369a1] mt-0.5">
                      {selected.venue}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => select(null)}
                    className="p-2.5 min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:bg-sky-50 hover:text-[#0c4a6e] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={22} />
                  </button>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {selected.description}
                </p>
                <button
                  type="button"
                  onClick={() => openCam(selected)}
                  className="mt-3 w-full btn-lake inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[48px] rounded-full text-base font-bold"
                >
                  Watch live cam
                </button>
              </div>
            </article>
          )}
        </div>

        {showSpotsList && (
          <aside
            className={
              isEmbed
                ? "flex flex-col rounded-xl border-2 border-sky-200 bg-white shadow-sm overflow-hidden shrink-0 h-[36vh] min-h-[200px] landscape:h-full landscape:w-[300px] landscape:max-h-none"
                : "hidden lg:flex flex-col rounded-2xl border-2 border-sky-200 bg-white shadow-sm overflow-hidden max-h-[calc(100vh-230px)]"
            }
          >
            <div className="px-4 py-3 border-b border-sky-100 text-xs font-bold uppercase tracking-wide text-[#0369a1]">
              {spots.length} spots
            </div>
            <ul className="overflow-y-auto divide-y divide-sky-50 flex-1 min-h-0">
              {spots.map((spot) => {
                const on = selectedId === spot.id;
                const meta = MAP_CATEGORY_META[spot.category];
                return (
                  <li key={spot.id}>
                    <button
                      type="button"
                      onClick={() =>
                        spot.category === "webcam"
                          ? openCam(spot)
                          : select(spot.id)
                      }
                      className={`w-full text-left px-4 py-3 min-h-[44px] hover:bg-sky-50 transition-colors ${
                        on ? "bg-sky-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 text-white"
                          style={{ background: meta.color }}
                        >
                          {meta.emoji}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-[#0c4a6e]">
                            {spot.name}
                          </span>
                          <span className="block text-[11px] text-slate-500">
                            {spot.venue}
                          </span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
      )}

      {camSpot && (
        <div
          className="fixed inset-0 z-[2000] flex flex-col bg-[#042033]"
          role="dialog"
          aria-modal="true"
          aria-label={camSpot.name}
        >
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-3 sm:px-4 bg-[#0c4a6e] text-white shadow-lg">
            {kioskMode ? (
              <button
                type="button"
                onClick={() => goKioskHome(unitSlug)}
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 sm:px-5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-base font-extrabold shadow-md"
              >
                <Home size={20} />
                Back to Home
              </button>
            ) : null}
            <button
              type="button"
              onClick={closeCam}
              className={`inline-flex items-center justify-center gap-2 min-h-[48px] px-4 sm:px-5 rounded-full text-base font-extrabold shadow-md ${
                kioskMode
                  ? "bg-white/15 hover:bg-white/25 border border-white/30"
                  : "bg-[#0284c7] hover:bg-[#0369a1]"
              }`}
            >
              {kioskMode ? "← Back to map" : (
                <>
                  <Home size={20} />
                  Back to map
                </>
              )}
            </button>
            <b className="text-sm sm:text-base font-bold flex-1 min-w-[8rem] truncate">
              {camSpot.name}
            </b>
          </div>
          <iframe
            title={camSpot.name}
            src={camSpot.href}
            className="flex-1 w-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="px-3 py-2 bg-[#0c4a6e] text-center">
            <a
              href={camSpot.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-sky-200 underline"
            >
              Open on cam site if video is blank
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
