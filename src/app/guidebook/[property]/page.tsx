"use client";

import { useState, useEffect, useRef } from "react";
import { getGuidebook, type PropertyGuidebook } from "@/data/guidebooks";
import { notFound } from "next/navigation";

// ─── Icons (inline SVG to avoid external deps) ─────────────
const icons = {
  home: {
    outline: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    filled: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0",
  },
  book: {
    outline:
      "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
    filled: "",
  },
  compass: {
    outline:
      "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
    filled: "",
  },
  chat: {
    outline:
      "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    filled: "",
  },
  extras: {
    outline:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    filled: "",
  },
};

// ─── Tab Type ──────────────────────────────────────────────
type Tab = "home" | "guidebook" | "explore" | "messages" | "extras";

// ─── Props ─────────────────────────────────────────────────
interface Props {
  params: Promise<{ property: string }>;
  searchParams: Promise<{ ref?: string; name?: string }>;
}

// ─── Page ──────────────────────────────────────────────────
export default function GuidebookPage({ params, searchParams }: Props) {
  const [property, setProperty] = useState<PropertyGuidebook | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [pwaPrompt, setPwaPrompt] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { property: slug } = await params;
      const sp = await searchParams;
      const gb = getGuidebook(slug);
      if (!gb) {
        notFound();
        return;
      }
      setProperty(gb);
      if (sp.name) setGuestName(sp.name);

      // Try to fetch Guesty photos
      // (silently fall back to a generic hero)
    };
    load();
  }, [params, searchParams]);

  // Scroll to top on tab change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);

  if (!property) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400">Loading guidebook...</div>
      </div>
    );
  }

  const p = property;

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-[#f8f7f4] flex flex-col relative overflow-hidden shadow-xl">
      {/* ─── Status Bar ─── */}
      <div className="h-12 bg-[#f8f7f4] flex items-center justify-between px-6 flex-shrink-0">
        <span className="text-xs font-semibold text-stone-400">
          Summers Stay
        </span>
        <span className="text-xs text-stone-400">{new Date().toLocaleDateString()}</span>
      </div>

      {/* ─── PWA Install Toast ─── */}
      {pwaPrompt && (
        <div className="mx-3 mt-1 bg-stone-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg animate-slideDown flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold text-amber-400">
            SV
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Add to Home Screen</div>
            <div className="text-xs text-stone-400 truncate">
              Install for quick access
            </div>
          </div>
          <button
            onClick={() => setPwaPrompt(false)}
            className="px-3 py-1.5 bg-white text-stone-900 text-xs font-bold rounded-lg"
          >
            Install
          </button>
          <button
            onClick={() => setPwaPrompt(false)}
            className="text-stone-500 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Content Area ─── */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto scroll-smooth"
      >
        {/* ═══ HOME TAB ═══ */}
        {tab === "home" && (
          <div className="animate-fadeIn">
            {/* Hero */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 px-5 pt-4 pb-6 rounded-b-[28px]">
              {guestName ? (
                <h1 className="text-xl font-bold text-white">
                  Welcome back, {guestName}
                </h1>
              ) : (
                <h1 className="text-xl font-bold text-white">{p.name}</h1>
              )}
              <p className="text-xs text-stone-400 mt-1">
                {p.address}
              </p>

              {/* Property Card */}
              <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl flex-shrink-0">
                  🏠
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {p.name}
                  </div>
                  <div className="text-xs text-stone-400">
                    Check-in: {p.checkIn.time}
                  </div>
                </div>
                <div className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white whitespace-nowrap">
                  ✦ Ready
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2.5 px-4 mt-4">
              <button
                onClick={() => setTab("guidebook")}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-100 text-left hover:shadow-md transition-shadow"
              >
                <span className="text-xl">📖</span>
                <div className="text-xs font-semibold text-stone-800 mt-1">
                  Guidebook
                </div>
                <div className="text-[10px] text-stone-400">
                  Door code, WiFi, rules
                </div>
              </button>
              <button
                onClick={() => setTab("explore")}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-100 text-left hover:shadow-md transition-shadow"
              >
                <span className="text-xl">🗺️</span>
                <div className="text-xs font-semibold text-stone-800 mt-1">
                  Explore
                </div>
                <div className="text-[10px] text-stone-400">
                  Restaurants, shows, fun
                </div>
              </button>
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-100">
                <span className="text-xl">🔑</span>
                <div className="text-xs font-semibold text-stone-800 mt-1">
                  Door Code
                </div>
                <div className="text-sm font-bold text-stone-800 mt-0.5 tracking-widest">
                  {p.checkIn.doorCode}
                </div>
              </div>
              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-stone-100">
                <span className="text-xl">📶</span>
                <div className="text-xs font-semibold text-stone-800 mt-1">
                  WiFi
                </div>
                <div className="text-[10px] text-stone-600 leading-tight mt-0.5">
                  {p.wifi.network}
                  <br />
                  <span className="text-stone-400">{p.wifi.password}</span>
                </div>
              </div>
            </div>

            {/* Stay Timeline */}
            <div className="px-4 mt-5 pb-5">
              <h2 className="text-sm font-bold text-stone-800 mb-3">
                Your Stay
              </h2>
              <div className="space-y-0">
                {[
                  { label: "Booking Confirmed", sub: "via Airbnb", done: true },
                  {
                    label: "Check-in Info Sent",
                    sub: "Door code & directions shared",
                    done: true,
                  },
                  {
                    label: "Check-in Today",
                    sub: `${p.checkIn.time} • Door code ready`,
                    today: true,
                  },
                  {
                    label: "Check-out",
                    sub: "10:00 AM",
                    upcoming: true,
                  },
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 pb-3 relative last:pb-0">
                    {step.done && (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 mt-0.5 flex-shrink-0" />
                        {i < 3 && (
                          <div className="absolute left-[5px] top-[18px] w-[2px] bg-emerald-200 h-[calc(100%-16px)]" />
                        )}
                      </>
                    )}
                    {step.today && (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-100 mt-0.5 flex-shrink-0" />
                        {i < 3 && (
                          <div className="absolute left-[5px] top-[18px] w-[2px] bg-stone-200 h-[calc(100%-16px)]" />
                        )}
                      </>
                    )}
                    {step.upcoming && (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full bg-stone-200 mt-0.5 flex-shrink-0" />
                      </>
                    )}
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-semibold ${
                          step.done
                            ? "text-stone-800"
                            : step.today
                              ? "text-amber-600"
                              : "text-stone-400"
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {step.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ GUIDEBOOK TAB ═══ */}
        {tab === "guidebook" && (
          <div className="animate-fadeIn">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 px-5 pt-4 pb-5 rounded-b-[24px]">
              <h1 className="text-xl font-bold text-white">📖 Guidebook</h1>
              <p className="text-xs text-emerald-200 mt-1">
                {p.name} — Everything you need to know
              </p>
            </div>

            <div className="px-4 pt-4 pb-5 space-y-2.5">
              {/* Check-in */}
              <SectionCard
                icon="🔑"
                bg="bg-sky-50"
                title="Check-in Instructions"
                desc={p.checkIn.accessNote}
                details={[
                  `Check-in after ${p.checkIn.time}`,
                  `Door code: ${p.checkIn.doorCode}`,
                ]}
              />

              {/* WiFi */}
              <SectionCard
                icon="📶"
                bg="bg-amber-50"
                title="WiFi & Entertainment"
                desc={
                  <>
                    Network: <strong>{p.wifi.network}</strong>
                    <br />
                    Password: {p.wifi.password}
                  </>
                }
              />

              {/* Coffee */}
              <SectionCard
                icon="☕"
                bg="bg-amber-50"
                title="Coffee Bar"
                desc={
                  <>
                    {p.appliances.coffeeMaker.type}
                    {p.appliances.coffeeMaker.youtube && (
                      <div className="mt-1">
                        <a
                          href={p.appliances.coffeeMaker.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 underline inline-flex items-center gap-1"
                        >
                          ▶ Watch demo video
                        </a>
                      </div>
                    )}
                  </>
                }
              />

              {/* Aroma 360 */}
              {p.appliances.aroma360 && (
                <SectionCard
                  icon="🌸"
                  bg="bg-purple-50"
                  title="Aroma 360 Diffuser"
                  desc={
                    <a
                      href={p.appliances.aroma360.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 underline"
                    >
                      ▶ Watch how to use
                    </a>
                  }
                />
              )}

              {/* Water Filter */}
              {p.appliances.waterFilter && (
                <SectionCard
                  icon="💧"
                  bg="bg-blue-50"
                  title="Drinking Water Filter"
                  desc={
                    <a
                      href={p.appliances.waterFilter.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 underline"
                    >
                      ▶ Watch how to use
                    </a>
                  }
                />
              )}

              {/* Fireplace */}
              {p.appliances.fireplace && (
                <SectionCard
                  icon="🔥"
                  bg="bg-orange-50"
                  title="Electric Fireplace"
                  desc={
                    <a
                      href={p.appliances.fireplace.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 underline"
                    >
                      ▶ Watch how to use
                    </a>
                  }
                />
              )}

              {/* House Rules */}
              <SectionCard
                icon="📋"
                bg="bg-stone-50"
                title="House Rules"
                desc={
                  <ul className="list-disc list-inside space-y-0.5">
                    {p.houseRules.map((r, i) => (
                      <li key={i} className="text-xs text-stone-600">
                        {r}
                      </li>
                    ))}
                  </ul>
                }
              />

              {/* Trash */}
              <SectionCard
                icon="🗑️"
                bg="bg-stone-50"
                title="Trash & Recycling"
                desc={p.trash}
              />

              {/* Amenities */}
              <SectionCard
                icon="🏊"
                bg="bg-teal-50"
                title="Amenities"
                desc={
                  <div className="flex flex-wrap gap-1.5">
                    {p.amenities.map((a, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-white px-2 py-1 rounded-full text-stone-600 border border-stone-200"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                }
              />

              {/* Emergency */}
              <SectionCard
                icon="🆘"
                bg="bg-red-50"
                title="Emergency Info"
                desc={
                  <>
                    <div className="text-xs text-stone-600">
                      <strong>Hospital:</strong> {p.emergency.hospital}
                    </div>
                    <div className="text-xs text-stone-600 mt-1">
                      <strong>Contact:</strong> {p.emergency.localContact}
                    </div>
                  </>
                }
              />

              {/* Cleanliness Status */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">
                  🧹
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-emerald-700">
                    Cleanliness Status
                  </div>
                  <div className="text-[11px] text-emerald-600">
                    ✓ Unit inspected and ready for your arrival
                  </div>
                </div>
                <div className="text-emerald-500">✓</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ EXPLORE TAB ═══ */}
        {tab === "explore" && (
          <div className="animate-fadeIn">
            <div className="px-5 pt-5 pb-3">
              <h1 className="text-xl font-bold text-stone-800">
                🗺️ Explore Branson
              </h1>
              <p className="text-xs text-stone-400 mt-1">
                Hand-picked by your host
              </p>
            </div>

            <div className="px-4 pb-5 space-y-3">
              {[
                {
                  emoji: "🍽️",
                  title: "The Keeter Center",
                  desc: "American • $$$ • Host Pick",
                  rating: "⭐ 4.8",
                  note: "Farm-to-table dining at College of the Ozarks",
                },
                {
                  emoji: "🎢",
                  title: "Silver Dollar City",
                  desc: "Theme Park • Family",
                  rating: "⭐ 4.9",
                  note: "📍 12 min drive",
                },
                {
                  emoji: "🌲",
                  title: "Table Rock Lake",
                  desc: "Boating • Swimming • Hiking",
                  rating: "",
                  note: "📍 8 min • Host Pick",
                },
                {
                  emoji: "🎭",
                  title: "Sight & Sound Theatre",
                  desc: "Live Productions • Biblical",
                  rating: "⭐ 4.8",
                  note: "📍 15 min",
                },
                {
                  emoji: "⛳",
                  title: "Ledgestone Golf Course",
                  desc: "18 Holes • Scenic Views",
                  rating: "⭐ 4.6",
                  note: "📍 5 min",
                },
                {
                  emoji: "🛍️",
                  title: "Branson Landing",
                  desc: "Shopping • Dining • Fountain Show",
                  rating: "",
                  note: "📍 18 min",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-stone-100"
                >
                  <div className="p-3.5 flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">{item.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-stone-800">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-stone-500">{item.desc}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {item.note}
                      </div>
                    </div>
                    {item.rating && (
                      <div className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full whitespace-nowrap">
                        {item.rating}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MESSAGES TAB ═══ */}
        {tab === "messages" && (
          <div className="animate-fadeIn">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <h1 className="text-xl font-bold text-stone-800">💬 Messages</h1>
              <div className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                2 new
              </div>
            </div>
            <div className="px-4 pb-5 divide-y divide-stone-100">
              {[
                {
                  avatar: "SV",
                  bg: "bg-stone-800",
                  from: "Summers Vacations",
                  msg: "Your unit is ready! We've completed cleaning and inspection.",
                  time: "2 min ago",
                  unread: true,
                },
                {
                  avatar: "☀️",
                  bg: "bg-amber-50",
                  from: "Branson Report",
                  msg: "This week's guide: best BBQ spots, live music schedule",
                  time: "1h ago",
                  unread: true,
                },
                {
                  avatar: "🔔",
                  bg: "bg-sky-50",
                  from: "Check-in Reminder",
                  msg: `Today at ${p.checkIn.time} · Door code ready`,
                  time: "Yesterday",
                  unread: false,
                },
                {
                  avatar: "🧹",
                  bg: "bg-emerald-50",
                  from: "Cleanliness Update",
                  msg: "🟢 The Penthouse — Cleaned & inspected. Status: Ready",
                  time: "Yesterday",
                  unread: false,
                },
              ].map((msg, i) => (
                <div
                  key={i}
                  className="flex gap-3 py-3.5 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${msg.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-stone-800">
                        {msg.from}
                      </span>
                      {msg.unread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate mt-0.5">
                      {msg.msg}
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-400 flex-shrink-0">
                    {msg.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ EXTRAS TAB ═══ */}
        {tab === "extras" && (
          <div className="animate-fadeIn">
            <div className="bg-gradient-to-br from-violet-700 to-violet-800 px-5 pt-4 pb-5 rounded-b-[24px]">
              <h1 className="text-xl font-bold text-white">🛍️ Enhance Your Stay</h1>
              <p className="text-xs text-violet-200 mt-1">
                Premium upgrades & local experiences
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 px-4 pt-4 pb-5">
              {[
                { icon: "⏰", title: "Early Check-in", price: "$25" },
                { icon: "🌙", title: "Late Check-out", price: "$35" },
                { icon: "🧹", title: "Mid-Stay Clean", price: "$65" },
                { icon: "🚗", title: "Airport Pickup", price: "$40" },
                { icon: "🎫", title: "SDC Tickets", price: "from $89" },
                { icon: "🎭", title: "Show Tickets", price: "Browse" },
              ].map((item, i) => (
                <button
                  key={i}
                  className="bg-white rounded-xl p-4 text-center shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div className="text-xs font-semibold text-stone-800 mt-1">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-violet-600 font-semibold mt-0.5">
                    {item.price}
                  </div>
                </button>
              ))}
            </div>

            {/* AI Trip Planner */}
            <div className="px-4 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-stone-800">
                    AI Trip Planner
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Tell me what you like, I&apos;ll build your itinerary
                  </div>
                </div>
                <div className="text-amber-500 text-lg">›</div>
              </div>
            </div>

            {/* Videos Section */}
            <div className="px-4 pb-6">
              <h2 className="text-sm font-bold text-stone-800 mb-3">
                🎬 Video Guides
              </h2>
              <div className="space-y-2">
                {p.videos.map((v, i) => (
                  <a
                    key={i}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
                      ▶
                    </div>
                    <span className="text-xs font-medium text-stone-700">
                      {v.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spacer for tab bar */}
        <div className="h-4" />
      </div>

      {/* ─── BOTTOM TAB BAR ─── */}
      <div className="bg-white border-t border-stone-100 flex-shrink-0 flex items-stretch pt-1 pb-3 px-1">
        {(
          [
            { key: "home", icon: icons.home, label: "Home" },
            { key: "guidebook", icon: icons.book, label: "Guidebook" },
            { key: "explore", icon: icons.compass, label: "Explore" },
            { key: "messages", icon: icons.chat, label: "Messages" },
            { key: "extras", icon: icons.extras, label: "Extras" },
          ] as { key: Tab; icon: typeof icons.home; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 relative ${
              tab === t.key ? "" : "opacity-50"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={tab === t.key ? 2.5 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-5 h-5 transition-all ${
                tab === t.key ? "text-stone-900" : "text-stone-400"
              }`}
            >
              <path d={t.key === "home" ? icons.home.outline : t.icon.outline} />
            </svg>
            <span
              className={`text-[9px] font-medium transition-all ${
                tab === t.key ? "text-stone-900 font-semibold" : "text-stone-400"
              }`}
            >
              {t.label}
            </span>
            {t.key === "messages" && (
              <span className="absolute top-0 right-1/2 translate-x-3.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[7px] font-bold flex items-center justify-center">
                2
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Card Component ────────────────────────────────
function SectionCard({
  icon,
  bg,
  title,
  desc,
  details,
}: {
  icon: string;
  bg: string;
  title: string;
  desc: React.ReactNode;
  details?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`${bg} rounded-xl p-3.5 cursor-pointer hover:shadow-sm transition-shadow`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className="text-lg flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-stone-800">{title}</div>
          {expanded && desc && (
            <div className="mt-1.5 text-[11px] text-stone-600 leading-relaxed">
              {desc}
            </div>
          )}
          {details && expanded && (
            <ul className="mt-1 space-y-0.5">
              {details.map((d, i) => (
                <li key={i} className="text-[11px] text-stone-500 flex items-center gap-1">
                  <span className="text-emerald-500">•</span> {d}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`text-stone-300 text-sm transition-transform ${expanded ? 'rotate-90' : ''}`}>
          ›
        </div>
      </div>
    </div>
  );
}
