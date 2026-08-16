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
import { ArrowRight, ExternalLink, MapPin, X } from "lucide-react";
import {
  BRANSON_MAP_SPOTS,
  MAP_CATEGORIES,
  MAP_CATEGORY_META,
  type MapCategory,
  type MapSpot,
} from "@/data/branson-map";
import { BOOK_URL } from "@/lib/site";
import "leaflet/dist/leaflet.css";
import "./map.css";

function pinIcon(spot: MapSpot, active: boolean) {
  const meta = MAP_CATEGORY_META[spot.category];
  return L.divIcon({
    className: "",
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    tooltipAnchor: [0, -40],
    html: `<div class="sv-pin${active ? " is-active" : ""}" style="background:${meta.color}">${meta.emoji}</div>`,
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

export default function BransonMap() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("spot");
  const [filter, setFilter] = useState<MapCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(initial);

  const spots = useMemo(
    () =>
      filter === "all"
        ? BRANSON_MAP_SPOTS
        : BRANSON_MAP_SPOTS.filter((s) => s.category === filter),
    [filter],
  );

  const selected = spots.find((s) => s.id === selectedId) ||
    BRANSON_MAP_SPOTS.find((s) => s.id === selectedId);

  useEffect(() => {
    if (initial && BRANSON_MAP_SPOTS.some((s) => s.id === initial)) {
      setSelectedId(initial);
    }
  }, [initial]);

  function select(id: string | null) {
    setSelectedId(id);
    const url = id ? `/map?spot=${id}` : "/map";
    router.replace(url, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#f0f9ff] flex flex-col">
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
                Cams · lake · shows
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

      <div className="px-4 sm:px-6 pt-4 pb-2 max-w-7xl mx-auto w-full">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0c4a6e]">
          Your Branson playground
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
          Hover a pin, tap for tickets or a live cam. Same bright-blue guide —
          just on a map.
        </p>
        <div className="flex gap-2 overflow-x-auto py-3 -mx-1 px-1">
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
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold border transition-colors ${
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
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pb-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="sv-map-wrap relative rounded-2xl overflow-hidden border-2 border-sky-200 shadow-lg h-[62vh] min-h-[420px] lg:h-[calc(100vh-230px)]">
          <MapContainer
            center={[36.64, -93.27]}
            zoom={12}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FlyTo spot={selected} />
            {spots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                icon={pinIcon(spot, selectedId === spot.id)}
                eventHandlers={{
                  click: () => select(spot.id),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  className="sv-tooltip"
                >
                  <div>
                    <div>{spot.name}</div>
                    <div style={{ fontWeight: 500, opacity: 0.85, fontSize: 11 }}>
                      {spot.venue}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          {selected && (
            <article className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:w-[360px] z-[900] bg-white rounded-2xl border-2 border-sky-200 shadow-2xl overflow-hidden">
              {selected.preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.preview}
                  alt={`${selected.name} live preview`}
                  className="w-full h-28 object-cover bg-sky-100"
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
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-sky-50 hover:text-[#0c4a6e]"
                    aria-label="Close"
                  >
                    <X size={16} />
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
                    className="btn-lake inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm no-underline"
                  >
                    {selected.cta}
                    <ExternalLink size={14} />
                  </a>
                  <Link
                    href={selected.ourPath}
                    className="text-center text-xs font-bold text-[#0369a1] no-underline hover:underline"
                  >
                    Open on our map · mybransonvacation.com{selected.ourPath}
                  </Link>
                </div>
              </div>
            </article>
          )}
        </div>

        <aside className="hidden lg:flex flex-col rounded-2xl border-2 border-sky-200 bg-white shadow-sm overflow-hidden max-h-[calc(100vh-230px)]">
          <div className="px-4 py-3 border-b border-sky-100 text-xs font-bold uppercase tracking-wide text-[#0369a1]">
            {spots.length} spots
          </div>
          <ul className="overflow-y-auto divide-y divide-sky-50">
            {spots.map((spot) => {
              const on = selectedId === spot.id;
              const meta = MAP_CATEGORY_META[spot.category];
              return (
                <li key={spot.id}>
                  <button
                    type="button"
                    onClick={() => select(spot.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors ${
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
      </div>
    </div>
  );
}
