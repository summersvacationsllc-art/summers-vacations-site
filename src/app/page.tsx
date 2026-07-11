"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, Calendar, Menu, X, MapPin, Star } from "lucide-react";
import Link from "next/link";

interface Photo { url: string; caption?: string; }
interface ListingInfo { guesty_id: string; title: string; nickname: string; }

const P = [
  { n: "The Penthouse", t: "Top Floor • Views", g: "6", b: "2BR", d: "Branson West", c: "#2c1810", e: "🏠", s: "the-penthouse", gid: "68eeb58d873b002c39d38657" },
  { n: "Rustic Ozark Retreat", t: "Cozy • Fireplace", g: "6", b: "2BR", d: "Branson West", c: "#1e3a5f", e: "🌲", s: "rustic-ozark-retreat", gid: "68eeb5866f48002c3d470a6c" },
  { n: "Woodland Retreat", t: "Family • Bunk Room", g: "6", b: "2BR", d: "Branson West", c: "#166534", e: "🌳", s: "woodland-retreat", gid: "68eecd33a359002c338a2a55" },
  { n: "Modern Charmer", t: "Sleek • Updated", g: "4", b: "1BR", d: "Branson West", c: "#b45309", e: "✨", s: "modern-charmer", gid: "696679519399002c92ac4ec4" },
  { n: "Pretty Peacock", t: "No Steps • Easy", g: "6", b: "1BR", d: "Branson West", c: "#7c3aed", e: "🦚", s: "pretty-peacock", gid: "699911d27b1a001efccbf235" },
  { n: "Double Condo", t: "🔥 Best Value", g: "12+", b: "4BR", d: "Branson West", c: "#f5c842", e: "🏢", s: "double-condo", gid: "68eeb561cce1002c364dfb89" },
  { n: "Branson Family Haven", t: "🏡 House", g: "16", b: "3BR", d: "Branson", c: "#be123c", e: "🏡", s: "branson-family-haven", gid: "6993c5d31547001e711bc7ed" },
];

const T = [
  { t: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was our favorite spot.", a: "Krystal", l: "Saint Charles, MO" },
  { t: "Check in and out went seamlessly, and the place was very cozy and clean. Close to all the fun of SDC but still felt like a secluded mountain getaway!", a: "Jennifer", l: "Arkadelphia, AR" },
  { t: "We could see the fireworks from Silver Dollar City from the deck! Great communication from Brian. We would definitely stay here again.", a: "Gary", l: "Lincoln, NE" },
  { t: "Awesome for a larger family! Condos were clean and comfortable. Fantastic hiking and close to SDC. Only 15 min to everything in Branson.", a: "Aaron", l: "Kansas" },
];

const FUN = [
  { e: "🎢", t: "Silver Dollar City", u: "https://www.silverdollarcity.com/" },
  { e: "⛰️", t: "Mountain Coasters", u: "https://theshepherdofthehills.com/coaster/" },
  { e: "🎡", t: "Ferris Wheel", u: "https://www.bransonferriswheel.com/" },
  { e: "🏎️", t: "Go-Karts", u: "https://www.bransontrack.com/" },
  { e: "🧗", t: "Fritz's Adventure", u: "https://www.fritzadventure.com/" },
  { e: "🌲", t: "Dogwood Canyon", u: "https://dogwoodcanyon.org/" },
];

export default function Home() {
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [ti, setTi] = useState(0);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [m, setM] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; hi: number; lo: number; desc: string } | null>(null);
  const [shows, setShows] = useState<{ name: string; venue: string; time: string }[]>([]);

  useEffect(() => {
    // Fetch cover photo for each property
    (async () => {
      const covers: Record<string, string> = {};
      await Promise.all(P.map(async (p) => {
        try {
          const r = await fetch(`/api/photos?listingId=${p.gid}`);
          const d = await r.json();
          if (d.ok && d.photos?.length) covers[p.s] = d.photos[0].url;
        } catch {}
      }));
      setCoverPhotos(covers);
      setLoading(false);
    })();
    // Weather + shows
    (async () => {
      try { const r = await fetch("/api/fishing-report"); const d = await r.json(); if (d.ok) setWeather({ temp: d.conditions?.tableRock?.temp || 82, hi: d.weather?.high || 94, lo: d.weather?.low || 70, desc: "☀️ Sunny" }); } catch {}
      try { const r = await fetch("/api/shows-report"); const d = await r.json(); if (d.ok && d.shows?.length) setShows(d.shows.slice(0, 4)); } catch {}
    })();
    const i = setInterval(() => setTi(i => (i + 1) % T.length), 5000);
    return () => clearInterval(i);
  }, []);

  const t = T[ti];

  return (
    <>
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold text-white hidden sm:block">Summers Vacations</span>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {["Properties","Branson Fun","Reviews","Contact"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ","-")}`} className="text-xs font-semibold text-white/70 no-underline hover:text-amber-400 transition-colors">{l}</a>
            ))}
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-5 py-2 rounded-full no-underline hover:brightness-110 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
          <button onClick={() => setM(!m)} className="md:hidden text-white p-1">{m ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {m && (
          <div className="md:hidden bg-black/90 px-4 py-3 flex flex-col gap-3">
            <a href="#properties" onClick={() => setM(false)} className="text-xs font-semibold text-white/70 no-underline">Properties</a>
            <a href="#branson-fun" onClick={() => setM(false)} className="text-xs font-semibold text-white/70 no-underline">Branson Fun</a>
            <a href="#reviews" onClick={() => setM(false)} className="text-xs font-semibold text-white/70 no-underline">Reviews</a>
            <a href="#contact" onClick={() => setM(false)} className="text-xs font-semibold text-white/70 no-underline">Contact</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full text-center no-underline"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1a1a2e 60%, #0f172a 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 w-full pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-6 bg-white/10 text-amber-400 border border-white/10">
              <MapPin size={12} /> Branson, Missouri — Table Rock Lake
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-none max-w-4xl mx-auto text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Your Branson<br />
              <span className="text-transparent bg-clip-text" style={{ background: 'linear-gradient(135deg, #f5c842, #f59e0b, #d97706)' }}>Adventure Awaits</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Seven premium rentals steps from Table Rock Lake. Minutes from Silver Dollar City, mountain coasters, and everything Branson has to offer.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:-translate-y-0.5 shadow-xl text-base"
                style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
                <Calendar size={18} /> Check Availability
              </a>
              <a href="#properties"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/20 text-white font-bold transition-all hover:border-amber-400/50 hover:text-amber-400 bg-white/5 text-base">
                Explore Properties
              </a>
            </div>
            <div className="mt-14 flex gap-8 sm:gap-16 justify-center flex-wrap">
              {[{ n: '7', l: 'Properties' }, { n: '12 min', l: 'to SDC' }, { n: '2 min', l: 'to the Lake' }, { n: '4.9★', l: 'Guest Rating' }].map((x, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-400">{x.n}</div>
                  <div className="text-xs text-white/40 mt-1 uppercase tracking-wider">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROPERTIES ═══ */}
      <section id="properties" className="py-24 sm:py-32 px-4 bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">🏡 Our Properties</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Seven Ways to Stay</h2>
            <p className="text-base text-stone-400 mt-4">Six condos on Indian Point + a standalone family house. All minutes from the fun, all managed with care.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {P.map((p, i) => (
              <Link key={i} href={`/property/${p.s}`}
                className="group relative bg-stone-900 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 no-underline text-inherit block border border-stone-800 hover:border-amber-500/30">
                {/* Cover photo or gradient fallback */}
                <div className="h-56 relative overflow-hidden">
                  {coverPhotos[p.s] ? (
                    <img src={coverPhotos[p.s]} alt={p.n}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg,${p.c},${p.c}cc)` }}>
                      <span className="text-7xl opacity-30 group-hover:scale-125 transition-transform duration-500">{p.e}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/60 text-amber-400 backdrop-blur-sm">{p.t}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white">{p.n}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-400">Sleeps {p.g}</span>
                      <span className="text-stone-600">·</span>
                      <span className="text-xs text-stone-400">{p.b}</span>
                      <span className="text-stone-600">·</span>
                      <span className="text-xs text-stone-400">{p.d}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all hover:-translate-y-0.5 shadow-xl text-sm"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={18} /> Check Availability
            </a>
          </div>
        </div>
      </section>

      {/* ═══ TODAY IN BRANSON ═══ */}
      <section className="py-20 sm:py-28 px-4 bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">📰 Today in Branson</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>What's Happening Now</h2>
            <p className="text-base text-stone-400 mt-4">Live weather, tonight's shows, and our daily Branson report — fresh every morning.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
              <div className="text-sm font-semibold text-blue-200 mb-3">☀️ Branson Weather</div>
              <div className="text-6xl font-bold mb-3">{weather?.temp || 87}°</div>
              <div className="text-blue-200 text-lg">{weather?.desc || "Sunny"}</div>
              <div className="flex gap-6 mt-6 text-base">
                <div><span className="text-blue-300">H:</span> {weather?.hi || 94}°</div>
                <div><span className="text-blue-300">L:</span> {weather?.lo || 72}°</div>
              </div>
            </div>
            <div className="bg-stone-800 rounded-2xl p-8 shadow-xl border border-stone-700">
              <div className="text-sm font-semibold text-stone-400 mb-4">🎭 Tonight's Shows</div>
              {shows.length > 0 ? shows.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-stone-700 last:border-0">
                  <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded">{s.time}</span>
                  <span className="text-sm font-semibold text-stone-200 flex-1">{s.name}</span>
                  <span className="text-xs text-stone-500">{s.venue}</span>
                </div>
              )) : (
                <div className="text-sm text-stone-400">Grand Jubilee · Bohemian Queen · The Haygoods — and more!</div>
              )}
              <a href="/reports" className="inline-block mt-4 text-xs font-semibold text-amber-400 no-underline hover:text-amber-300">See all shows →</a>
            </div>
            <a href="/reports" className="block bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 shadow-xl no-underline text-inherit hover:scale-[1.02] transition-transform">
              <div className="text-sm font-semibold text-amber-900 mb-3">📰 Daily Branson Report</div>
              <div className="text-3xl font-bold text-stone-900 mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>Fresh Every Morning</div>
              <div className="text-amber-900 text-base leading-relaxed">Fishing, shows, events, golf, and dining — all in one place.</div>
              <div className="mt-6 inline-flex items-center gap-1 text-base font-bold text-amber-900">Open Report →</div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ THE APP ═══ */}
      <section id="the-app" className="py-24 sm:py-32 px-4 bg-stone-950">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">📱 Exclusive for Guests</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Every Booking Comes With<br />
              <span className="text-amber-400">a Personal Branson Guide</span>
            </h2>
            <p className="text-base text-stone-400 mt-6 leading-relaxed">Door codes, WiFi, things to bring, local tips — plus daily updates with fishing reports, show times, events, golf, and dining. Stays on your phone forever.</p>
            <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full text-sm font-bold no-underline transition-all hover:-translate-y-0.5 shadow-xl"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              📱 Try the App
            </a>
          </div>
          <div className="bg-stone-800 rounded-2xl shadow-xl border border-stone-700 overflow-hidden">
            <div className="h-12 flex items-center px-4 gap-2 bg-stone-900 border-b border-stone-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-[10px] text-stone-500 ml-2">Summers Stay — Guest Companion</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {['🏠 Home','🎣 Fishing','⛳ Golf','🎭 Shows','🍽️ Dining','🎢 Fun'].map((x,i) => (
                  <div key={i} className="bg-stone-700/50 rounded-xl py-4 px-2 text-center">
                    <div className="text-2xl">{x.split(' ')[0]}</div>
                    <div className="text-[10px] font-semibold text-amber-400 mt-1.5">{x.split(' ')[1]}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-amber-500/10 rounded-xl px-4 py-3 text-center">
                <div className="text-xs text-amber-400 font-semibold">✨ Updates daily • Seasonal themes • Forever yours</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BRANSON FUN ═══ */}
      <section id="branson-fun" className="py-24 sm:py-32 px-4 bg-stone-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-4">🎢 Branson Fun</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Thrills, Coasters & Adventures</h2>
            <p className="text-base text-stone-400 mt-4">Everything is just minutes from your door. Here's what's waiting.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {FUN.map((l, i) => (
              <a key={i} href={l.u} target="_blank" rel="noopener"
                className="group bg-stone-800 rounded-2xl p-6 text-center no-underline border border-stone-700 hover:border-amber-500/30 hover:bg-stone-700 transition-all hover:-translate-y-1">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{l.e}</div>
                <div className="text-sm font-bold text-stone-300 group-hover:text-amber-400">{l.t}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section id="reviews" className="py-24 sm:py-32 px-4 bg-stone-950">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 mb-4">⭐ Guest Reviews</span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Real Guests, Real Stories</h2>
          <div className="mt-12 bg-stone-800 rounded-2xl p-10 border border-stone-700 shadow-xl text-left">
            <div className="flex gap-1 mb-4">{Array(5).fill(0).map((_, i) => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}</div>
            <p className="text-base sm:text-lg text-stone-300 leading-relaxed italic">&ldquo;{t.t}&rdquo;</p>
            <div className="mt-8 flex items-center justify-between">
              <div><div className="text-sm font-bold text-white">{t.a}</div><div className="text-xs text-stone-500">{t.l}</div></div>
              <div className="flex gap-1.5">
                {T.map((_, i) => (
                  <button key={i} onClick={() => setTi(i)} className={`w-2.5 h-2.5 rounded-full border-none cursor-pointer transition-all ${i === ti ? 'bg-amber-400 w-6' : 'bg-stone-600'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SEASONAL ═══ */}
      <section className="py-20 px-4" style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/20 mb-4">☀️ Summer in Branson</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Summer Celebration at Silver Dollar City</h2>
          <p className="text-base text-blue-200 mt-4 max-w-xl mx-auto">Night Sky Drone & Fireworks, extended hours, live shows — all summer long.</p>
          <div className="flex justify-center gap-4 mt-8">
            <a href="https://www.silverdollarcity.com/" target="_blank" rel="noopener"
              className="px-8 py-4 rounded-full bg-white text-blue-700 text-sm font-bold no-underline hover:brightness-110 transition-all">🎢 Plan Your Visit</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="px-8 py-4 rounded-full bg-white/10 text-white text-sm font-bold no-underline hover:bg-white/20 transition-all">Book Summer Dates</a>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="py-24 sm:py-32 px-4 bg-stone-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">💬 Let's Chat</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>We're Here 24/7</h2>
            <p className="text-base text-stone-400 mt-4">Text, call, or email — Brian answers personally.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="bg-stone-800 rounded-xl p-5 border border-stone-700 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400"><Phone size={18} /></div>
                <div><div className="text-xs text-stone-500 font-semibold">Call or Text</div><a href="tel:3145650589" className="text-sm font-bold text-stone-200 no-underline hover:text-amber-400">314-565-0589</a></div>
              </div>
              <div className="bg-stone-800 rounded-xl p-5 border border-stone-700 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400"><Mail size={18} /></div>
                <div><div className="text-xs text-stone-500 font-semibold">Email</div><a href="mailto:summersvacationsllc@gmail.com" className="text-sm font-bold text-stone-200 no-underline hover:text-amber-400">summersvacationsllc@gmail.com</a></div>
              </div>
              <div className="bg-stone-800 rounded-xl p-5 border border-stone-700">
                <div className="text-xs text-stone-500 font-semibold mb-1">Business Hours</div>
                <div className="text-sm font-bold text-stone-200">Mon - Sun: Always Open</div>
                <div className="text-xs text-stone-500 mt-1">(I might be on a 911 call — I'm a firefighter! I'll get back to you.)</div>
              </div>
              <a href="https://facebook.com/summersvacations" target="_blank" rel="noopener"
                className="flex items-center gap-3 bg-[#1877f2] text-white rounded-xl p-5 no-underline hover:brightness-110 transition-all">
                <span className="text-base font-bold">f</span>
                <div><div className="text-sm font-bold">Follow on Facebook</div><div className="text-xs text-white/70">Photos, updates & special offers</div></div>
              </a>
            </div>
            {submitted ? (
              <div className="bg-stone-800 rounded-xl p-8 border border-green-500/30 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-green-400">Message Sent!</h3>
                <p className="text-sm text-green-500/70 mt-1">Brian will reply shortly. Thanks!</p>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); try { await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); } catch {} setSubmitted(true); }}
                className="bg-stone-800 rounded-xl p-6 border border-stone-700 space-y-4">
                <input type="text" placeholder="Name *" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 transition-colors" />
                <input type="email" placeholder="Email *" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 transition-colors" />
                <input type="tel" placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 transition-colors" />
                <textarea placeholder="Message *" required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-stone-700 border border-stone-600 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-amber-400 transition-colors resize-none" />
                <button type="submit" className="w-full py-3.5 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <div className="text-base font-bold text-amber-400">Summers Vacations</div>
          </div>
          <p className="text-sm text-stone-500">Branson, Missouri — Premium Rentals on Indian Point</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="tel:3145650589" className="text-xs text-stone-500 no-underline hover:text-amber-400 flex items-center gap-1"><Phone size={14} /> Call</a>
            <a href="mailto:summersvacationsllc@gmail.com" className="text-xs text-stone-500 no-underline hover:text-amber-400 flex items-center gap-1"><Mail size={14} /> Email</a>
            <Link href="/reports" className="text-xs text-stone-500 no-underline hover:text-amber-400">Daily Reports</Link>
          </div>
          <div className="mt-8 pt-8 border-t border-stone-800">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-bold no-underline transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={14} /> Book Your Branson Getaway
            </a>
          </div>
          <div className="mt-8 text-xs text-stone-600">&copy; {new Date().getFullYear()} Summers Vacations LLC</div>
        </div>
      </footer>
    </>
  );
}