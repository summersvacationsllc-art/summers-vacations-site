"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Phone, Mail, Calendar, ChevronDown, Menu, X, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

interface Photo { url: string; caption?: string; id?: string; }
interface ListingInfo { guesty_id: string; title: string; nickname: string; }

const P = [
  { n: "The Penthouse", t: "Top Floor • Views", g: "6", b: "2BR", d: "550 Notch Ln, Unit 11", c: "#2c1810", e: "🏠", s: "the-penthouse" },
  { n: "Rustic Ozark Retreat", t: "Cozy • Fireplace", g: "6", b: "2BR", d: "550 Notch Ln, Unit 7", c: "#1e3a5f", e: "🌲", s: "rustic-ozark-retreat" },
  { n: "Woodland Retreat", t: "Family • Bunk Room", g: "6", b: "2BR", d: "499 Notch Ln, Unit 6", c: "#166534", e: "🌳", s: "woodland-retreat" },
  { n: "Modern Charmer", t: "Sleek • Updated", g: "4", b: "1BR", d: "550 Notch Ln, Unit 8", c: "#b45309", e: "✨", s: "modern-charmer" },
  { n: "Pretty Peacock", t: "No Steps • Easy", g: "6", b: "1BR", d: "289 Notch Ln, Unit 1", c: "#7c3aed", e: "🦚", s: "pretty-peacock" },
  { n: "Double Condo", t: "🔥 Best Value", g: "12+", b: "4BR", d: "Penthouse + Rustic combined", c: "#f5c842", e: "🏢", s: "double-condo" },
  { n: "Branson Family Haven", t: "🏡 House", g: "16", b: "3BR", d: "44 Timber Trace — private yard", c: "#be123c", e: "🏡", s: "branson-family-haven" },
];

const T = [
  { t: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was our favorite spot.", a: "Krystal", l: "Saint Charles, MO" },
  { t: "Check in and out went seamlessly, and the place was very cozy and clean. Close to all the fun of SDC but still felt like a secluded mountain getaway!", a: "Jennifer", l: "Arkadelphia, AR" },
  { t: "We could see the fireworks from Silver Dollar City from the deck! Great communication from Brian. We would definitely stay here again.", a: "Gary", l: "Lincoln, NE" },
  { t: "Awesome for a larger family! Condos were clean and comfortable. Fantastic hiking and close to SDC. Only 15 min to everything in Branson.", a: "Aaron", l: "Kansas" },
];

const APP = [
  { e: "🎣", t: "Fishing Report", d: "Bite of the day, lake conditions" },
  { e: "🎭", t: "Show Times", d: "What's playing, one-tap tickets" },
  { e: "⛳", t: "Golf Guide", d: "10 courses, rates, spotlight" },
  { e: "🍽️", t: "Dining & Bars", d: "Host picks, waterfront bars" },
  { e: "🎢", t: "Adventure Finder", d: "SDC, coasters, Dogwood Canyon" },
  { e: "🔑", t: "Smart Door Codes", d: "No keys, works at check-in" },
];

const FUN = [
  { e: "🎢", t: "Silver Dollar City", u: "https://www.silverdollarcity.com/" },
  { e: "⛰️", t: "Mountain Coasters", u: "https://theshepherdofthehills.com/coaster/" },
  { e: "🎡", t: "Branson Ferris Wheel", u: "https://www.bransonferriswheel.com/" },
  { e: "🏎️", t: "Go-Karts", u: "https://www.bransontrack.com/" },
  { e: "🧗", t: "Fritz's Adventure", u: "https://www.fritzadventure.com/" },
  { e: "🌲", t: "Dogwood Canyon", u: "https://dogwoodcanyon.org/" },
];

// Unsplash download URLs (work in img tags — browser follows redirect)
const HERO = "https://unsplash.com/photos/QlG574l7t-4/download?force=true&w=1920";
const GALLERY = [
  "https://unsplash.com/photos/QlG574l7t-4/download?force=true&w=800",
  "https://unsplash.com/photos/crowd-gathered-around-a-colorful-amusement-park-ride-7KRTki0NT-8/download?force=true&w=800",
  "https://unsplash.com/photos/tall-amusement-park-ride-with-crowds-below-J8IoTOD_hUY/download?force=true&w=800",
  "https://unsplash.com/photos/people-queuing-for-a-colorful-amusement-park-ride-Ry9qAEU010M/download?force=true&w=800",
  "https://unsplash.com/photos/amusement-park-ride-with-people-enjoying-the-attraction-GGXkM2zu8Ew/download?force=true&w=800",
  "https://unsplash.com/photos/black-and-brown-tower-under-blue-sky-during-daytime-ljN0zTXf7tQ/download?force=true&w=800",
  "https://unsplash.com/photos/1567672585861-53c96c9c662e/download?force=true&w=800",
  "https://unsplash.com/photos/1506905925346-21bda4d32df4/download?force=true&w=800",
];

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [ti, setTi] = useState(0);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [m, setM] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; hi: number; lo: number; desc: string } | null>(null);
  const [shows, setShows] = useState<{ name: string; venue: string; time: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/listings");
        const d = await r.json();
        if (d.ok && d.listings?.length) {
          const all: Photo[] = [];
          for (const l of d.listings as ListingInfo[]) {
            const pr = await fetch(`/api/photos?listingId=${l.guesty_id}`);
            const pd = await pr.json();
            if (pd.ok && pd.photos?.length) all.push(...pd.photos);
          }
          if (all.length > 0) { setPhotos(all); setLoading(false); return; }
        }
      } catch {}
      setPhotos([]); setLoading(false);
    })();
    // Fetch weather + shows
    (async () => {
      try { const r = await fetch("/api/fishing-report"); const d = await r.json(); if (d.ok) setWeather({ temp: d.conditions?.tableRock?.temp || 82, hi: d.weather?.high || 94, lo: d.weather?.low || 70, desc: "☀️ Sunny" }); } catch {}
      try { const r = await fetch("/api/shows-report"); const d = await r.json(); if (d.ok && d.shows?.length) setShows(d.shows.slice(0, 4)); } catch {}
    })();
  }, []);

  useEffect(() => { const i = setInterval(() => setTi(i => (i + 1) % T.length), 5000); return () => clearInterval(i); }, []);
  const t = T[ti];
  const gp = photos.length > 0 ? photos : [];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold hidden sm:block text-stone-800">Summers Vacations</span>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            <a href="#properties" className="text-xs font-semibold text-stone-500 no-underline hover:text-amber-600 transition-colors">Properties</a>
            <a href="#app" className="text-xs font-semibold text-stone-500 no-underline hover:text-amber-600 transition-colors">The App</a>
            <a href="#fun" className="text-xs font-semibold text-stone-500 no-underline hover:text-amber-600 transition-colors">Branson Fun</a>
            <a href="#reviews" className="text-xs font-semibold text-stone-500 no-underline hover:text-amber-600 transition-colors">Reviews</a>
            <a href="#contact" className="text-xs font-semibold text-stone-500 no-underline hover:text-amber-600 transition-colors">Contact</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-5 py-2 rounded-full no-underline transition-all hover:brightness-110 shadow-lg shadow-amber-200"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
          <button onClick={() => setM(!m)} className="md:hidden text-stone-500 p-1">{m ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {m && (
          <div className="md:hidden bg-white border-t border-stone-100 px-4 py-3 flex flex-col gap-3">
            <a href="#properties" onClick={() => setM(false)} className="text-xs font-semibold text-stone-500 no-underline">Properties</a>
            <a href="#app" onClick={() => setM(false)} className="text-xs font-semibold text-stone-500 no-underline">The App</a>
            <a href="#fun" onClick={() => setM(false)} className="text-xs font-semibold text-stone-500 no-underline">Branson Fun</a>
            <a href="#reviews" onClick={() => setM(false)} className="text-xs font-semibold text-stone-500 no-underline">Reviews</a>
            <a href="#contact" onClick={() => setM(false)} className="text-xs font-semibold text-stone-500 no-underline">Contact</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full text-center no-underline"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO — Bright, Exciting ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, #f5c84220 0%, #e8b83220 50%, #f9731620 100%)' }} />
        <div className="relative z-10 w-full pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5 bg-amber-100 text-amber-700 border border-amber-200">
              <MapPin size={12} /> Branson, Missouri — Indian Point on Table Rock Lake
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight max-w-3xl text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Your Branson<br />
              <span className="text-amber-600">Adventure Awaits</span>
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-stone-600 max-w-xl leading-relaxed">
              Stay steps from Table Rock Lake and minutes from SDC, mountain coasters, the Strip & every thrill Branson has to offer.
              <span className="text-amber-600 font-semibold"> Book direct and get our exclusive guest app.</span>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-200 text-sm"
                style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
                <Calendar size={18} /> Check Availability
              </a>
              <a href="#fun"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border-2 border-stone-200 text-stone-700 font-medium transition-all hover:-translate-y-0.5 hover:border-amber-300 bg-white text-sm">
                See Branson Fun <ChevronDown size={16} />
              </a>
            </div>
            <div className="mt-10 flex gap-8 sm:gap-14 flex-wrap">
              {[{ n: '7', l: 'Properties' }, { n: '12 min', l: 'to SDC' }, { n: '2 min', l: 'to Lake' }, { n: '4.9★', l: 'Rating' }].map((x, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{x.n}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-l from-transparent via-white/20 to-transparent" />
          <img src={HERO} alt="Amusement park thrill ride" className="hidden sm:block absolute inset-0 w-full h-full object-cover opacity-40" loading="eager" />
        </div>
      </section>

      {/* ═══ PROPERTIES ═══ */}
      <section id="properties" className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 mb-4">🏡 Our Properties</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Seven Ways to Stay</h2>
            <p className="text-sm text-stone-500 mt-3">6 condos on Indian Point + a standalone family house. All minutes from the fun.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {P.map((p, i) => (
              <Link key={i} href={`/guidebook/${p.s}?code=demo&name=Guest`}
                className="group bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 shadow-sm no-underline text-inherit block">
                <div className="h-44 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg,${p.c},${p.c}dd)` }}>
                  <span className="text-7xl opacity-40 group-hover:scale-125 transition-transform duration-500">{p.e}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold text-stone-800">{p.n}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 whitespace-nowrap">{p.t}</span>
                  </div>
                  <p className="text-xs text-stone-500">Sleeps {p.g} · {p.b}</p>
                  <p className="text-[10px] text-stone-400 mt-1.5">{p.d}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5 shadow-lg text-sm"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={18} /> Check Availability
            </a>
          </div>
        </div>
      </section>

      {/* ═══ APP ═══ */}
      <section id="app" className="py-20 sm:py-28 px-4" style={{ background: 'linear-gradient(180deg,#fefce8,#faf8f5)' }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 mb-4">📱 Exclusive for Guests</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Every Booking Comes With<br />
              <span className="text-amber-600">a Personal Branson Guide</span>
            </h2>
            <p className="text-sm text-stone-500 mt-4 leading-relaxed">Our guest app is a living Branson companion — fishing reports, show times, golf courses, dining, and more. Updated daily. Stays on your phone forever.</p>
            <div className="mt-6 space-y-3">
              {APP.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{a.e}</span>
                  <div><div className="text-sm font-bold text-stone-800">{a.t}</div><div className="text-xs text-stone-500">{a.d}</div></div>
                </div>
              ))}
            </div>
            <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full text-sm font-semibold no-underline transition-all hover:-translate-y-0.5 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              📱 Try the App
            </a>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
            <div className="h-44 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)' }}>
              <div className="text-center">
                <div className="text-5xl mb-2">📱</div>
                <div className="text-lg font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Summers Stay</div>
                <div className="text-xs text-stone-600">Guest Companion App</div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {['🏠 Home', '🎣 Fishing', '⛳ Golf', '🎭 Shows', '🍽️ Dining', '🎢 Fun'].map((x, i) => (
                  <div key={i} className="text-center bg-amber-50 rounded-lg py-2.5 px-1"><div className="text-lg">{x.split(' ')[0]}</div><div className="text-[9px] font-semibold text-amber-700 mt-0.5">{x.split(' ')[1]}</div></div>
                ))}
              </div>
              <div className="bg-amber-50 rounded-lg px-3 py-2 text-center text-[10px] font-semibold text-amber-700">✨ Updates daily • Seasonal themes • Forever yours</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BRANSON FUN ═══ */}
      <section id="fun" className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-700 mb-4">🎢 Branson Fun</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Thrills, Coasters & Adventures</h2>
            <p className="text-sm text-stone-500 mt-3">Branson is packed with fun — and everything is just minutes from your door.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {FUN.map((l, i) => (
              <a key={i} href={l.u} target="_blank" rel="noopener"
                className="group bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center no-underline hover:bg-amber-50 hover:border-amber-200 transition-all hover:-translate-y-1">
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{l.e}</div>
                <div className="text-sm font-bold text-stone-700 group-hover:text-amber-700">{l.t}</div>
              </a>
            ))}
          </div>

          {/* Gallery */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 mb-4">📸 Life at Our Properties</span>
          </div>
          {loading ? (
            <div className="flex justify-center"><div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : gp.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gp.slice(0, 8).map((photo, i) => (
                <div key={i} className={`aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                  <img src={photo.url} alt={(photo as Photo).caption || `Property ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GALLERY.map((url, i) => (
                <div key={i} className={`aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                  <img src={url} alt="Branson fun" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ REVIEWS ═══ */}
      <section id="reviews" className="py-20 sm:py-28 px-4" style={{ background: 'linear-gradient(180deg,#fefce8,#faf8f5)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 mb-4">⭐ Guest Reviews</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Real Guests, Real Stories</h2>
          <div className="mt-10 bg-white rounded-2xl p-8 sm:p-10 border border-stone-100 shadow-sm text-left">
            <div className="flex gap-1 mb-4">{Array(5).fill(0).map((_, i) => <span key={i} className="text-amber-400 text-lg">★</span>)}</div>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed italic">&ldquo;{t.t}&rdquo;</p>
            <div className="mt-6 flex items-center justify-between">
              <div><div className="text-sm font-bold text-stone-800">{t.a}</div><div className="text-xs text-stone-400">{t.l}</div></div>
              <div className="flex gap-1.5">
                {T.map((_, i) => (
                  <button key={i} onClick={() => setTi(i)} className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === ti ? 'bg-amber-500 w-4' : 'bg-stone-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TODAY IN BRANSON ═══ */}
      <section className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 mb-4">📰 Today in Branson</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>What's Happening Now</h2>
            <p className="text-sm text-stone-500 mt-3">Live weather, tonight's shows, and our daily Branson report — updated every morning.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Weather Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="text-sm font-semibold text-blue-200 mb-2">☀️ Branson Weather</div>
              <div className="text-5xl font-bold mb-2">{weather?.temp || 87}°</div>
              <div className="text-blue-200 text-sm">{weather?.desc || "Sunny"}</div>
              <div className="flex gap-4 mt-4 text-sm">
                <div><span className="text-blue-300">H:</span> {weather?.hi || 94}°</div>
                <div><span className="text-blue-300">L:</span> {weather?.lo || 72}°</div>
              </div>
            </div>
            {/* Shows Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="text-sm font-semibold text-stone-500 mb-3">🎭 Tonight's Shows</div>
              {shows.length > 0 ? shows.map((s, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
                  <span className="text-[11px] font-bold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{s.time}</span>
                  <span className="text-[13px] font-semibold text-stone-800 flex-1">{s.name}</span>
                  <span className="text-[10px] text-stone-400">{s.venue}</span>
                </div>
              )) : (
                <div className="text-[13px] text-stone-400">Grand Jubilee · Bohemian Queen · The Haygoods — and more!</div>
              )}
              <a href="/reports" className="inline-block mt-3 text-[11px] font-semibold text-amber-600 no-underline hover:text-amber-700">See all shows →</a>
            </div>
            {/* Daily Report Card */}
            <a href="/reports" className="block bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 shadow-lg no-underline text-inherit hover:scale-[1.02] transition-transform">
              <div className="text-sm font-semibold text-amber-800 mb-2">📰 Daily Branson Report</div>
              <div className="text-2xl font-bold text-stone-900 mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>Fresh Every Morning</div>
              <div className="text-amber-800 text-sm leading-relaxed">Fishing conditions, show times, events, golf, and dining — all in one place.</div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-900">Open Report →</div>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ SEASONAL ═══ */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white border border-white/30 mb-4">☀️ Summer in Branson</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Summer Celebration at Silver Dollar City</h2>
          <p className="text-sm text-blue-200 mt-3 max-w-xl mx-auto">Night Sky Drone & Fireworks, extended hours, live shows — all summer long. The Ozarks are at their best.</p>
          <div className="flex justify-center gap-4 mt-8">
            <a href="https://www.silverdollarcity.com/" target="_blank" rel="noopener"
              className="px-6 py-3 rounded-full bg-white text-blue-700 text-sm font-semibold no-underline hover:brightness-110 transition-all">🎢 Plan Your Visit</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="px-6 py-3 rounded-full bg-white/20 text-white text-sm font-semibold no-underline hover:bg-white/30 transition-all">Book Summer Dates</a>
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 mb-4">💬 Let&apos;s Chat</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>We&apos;re Here 24/7</h2>
            <p className="text-sm text-stone-500 mt-3">Text, call, or email — Brian answers personally.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Phone size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Call or Text</div><a href="tel:+131****0589" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">314-565-0589</a></div>
              </div>
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Mail size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Email</div><a href="mailto:summersvacationsllc@gmail.com" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">summersvacationsllc@gmail.com</a></div>
              </div>
              <div className="bg-stone-50 rounded-xl p-5 border border-stone-100">
                <div className="text-xs text-stone-400 font-semibold mb-1">Business Hours</div>
                <div className="text-sm font-bold text-stone-800">Mon - Sun: Always Open</div>
                <div className="text-xs text-stone-400 mt-1">(I might be on a 911 call — I&apos;m a firefighter! I&apos;ll get back to you.)</div>
              </div>
              <a href="https://facebook.com/summersvacations" target="_blank" rel="noopener"
                className="flex items-center gap-3 bg-[#1877f2] text-white rounded-xl p-5 no-underline hover:brightness-110 transition-all">
                <span className="text-base font-bold">f</span>
                <div><div className="text-sm font-bold">Follow on Facebook</div><div className="text-xs text-white/70">Photos, updates & special offers</div></div>
              </a>
            </div>
            {submitted ? (
              <div className="bg-white rounded-xl p-8 border border-green-100 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-green-800">Message Sent!</h3>
                <p className="text-sm text-green-600 mt-1">Brian will reply shortly. Thanks!</p>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); await new Promise(r => setTimeout(r, 800)); setSubmitted(true); }}
                className="bg-stone-50 rounded-xl p-6 border border-stone-100 space-y-4">
                <input type="text" placeholder="Name *" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-white" />
                <input type="email" placeholder="Email *" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-white" />
                <input type="tel" placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-white" />
                <textarea placeholder="Message *" required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-white resize-none" />
                <button type="submit" className="w-full py-3 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 px-4" style={{ background: '#2c1810' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <div className="text-sm font-bold" style={{ color: '#f5c842' }}>Summers Vacations</div>
          </div>
          <p className="text-xs text-stone-500">Branson, Missouri — Premium Rentals on Indian Point</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="tel:+131****0589" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Phone size={14} /> Call</a>
            <a href="mailto:summersvacationsllc@gmail.com" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Mail size={14} /> Email</a>
            <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest" target="_blank" rel="noopener" className="text-xs text-stone-400 no-underline hover:text-amber-400">Guest App</a>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-700">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold no-underline transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={14} /> Book Your Branson Getaway
            </a>
          </div>
          <div className="mt-6 text-[10px] text-stone-600">&copy; {new Date().getFullYear()} Summers Vacations LLC</div>
        </div>
      </footer>
    </>
  );
}