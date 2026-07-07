"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
import { Phone, Mail, Calendar, Star, ChevronDown, Menu, X, MapPin, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Photo { url: string; caption?: string; id?: string; }
interface ListingInfo { guesty_id: string; title: string; nickname: string; }

const PROPERTIES = [
  { name: "The Penthouse", tag: "Top Floor • Views", guests: "Sleeps 6", bed: "2BR", desc: "550 Notch Lane, Unit 11", color: "#2c1810", emoji: "🏠" },
  { name: "Rustic Ozark Retreat", tag: "Cozy • Fireplace", guests: "Sleeps 6", bed: "2BR", desc: "550 Notch Lane, Unit 7", color: "#1e3a5f", emoji: "🌲" },
  { name: "Woodland Retreat", tag: "Family • Bunk Room", guests: "Sleeps 6", bed: "2BR", desc: "499 Notch Lane, Unit 6", color: "#166534", emoji: "🌳" },
  { name: "Modern Charmer", tag: "Sleek • Updated", guests: "Sleeps 4", bed: "1BR", desc: "550 Notch Lane, Unit 8", color: "#b45309", emoji: "✨" },
  { name: "Pretty Peacock", tag: "No Steps • Easy", guests: "Sleeps 6", bed: "1BR", desc: "289 Notch Lane, Unit 1", color: "#7c3aed", emoji: "🦚" },
  { name: "Double Condo", tag: "🔥 Best Value", guests: "Sleeps 12+", bed: "4BR", desc: "Penthouse + Rustic combined", color: "#f5c842", emoji: "🏢" },
  { name: "Branson Family Haven", tag: "🏡 Standalone House", guests: "Sleeps 16", bed: "3BR", desc: "44 Timber Trace — private yard", color: "#be123c", emoji: "🏡" },
];

const TESTIMONIALS = [
  { text: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was a favorite of ours and my daughter loved watching the deer frolic in the woods each morning. We highly recommend it!", author: "Krystal", loc: "Saint Charles, MO" },
  { text: "We enjoyed a wonderful week! Check in and out went seamlessly, and the place was very cozy and clean. We loved the location...close to all of the fun of SDC and the Branson Strip, but still felt like a secluded mountain get away!", author: "Jennifer", loc: "Arkadelphia, AR" },
  { text: "We had a great stay! The property was as advertised. We could see the fireworks from Silver Dollar City from the deck. The host had great communication. We would definitely stay here again.", author: "Gary", loc: "Lincoln, NE" },
  { text: "Brian's place is awesome for a larger family! Condos were clean, well stocked, and very comfortable. Fantastic hiking in the area and close to SDC! Only 15 min to everything in Branson.", author: "Aaron", loc: "Kansas" },
];

const APP_FEATURES = [
  { emoji: "🎣", title: "Daily Fishing Report", desc: "Bite of the day, lake conditions, secret spots" },
  { emoji: "🎭", title: "Show Times & Tickets", desc: "What's playing tonight, one-tap booking" },
  { emoji: "⛳", title: "Golf Course Guide", desc: "10 courses, rates, tee times, course spotlight" },
  { emoji: "🍽️", title: "Dining & Bar Guide", desc: "Host picks, Big Cedar, waterfront bars" },
  { emoji: "🎢", title: "Adventure Finder", desc: "SDC, coasters, Dogwood Canyon, Strip" },
  { emoji: "🔑", title: "Digital Door Code", desc: "No keys needed — works at check-in" },
];

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [ti, setTi] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    async function loadPhotos() {
      try {
        const listRes = await fetch("/api/listings");
        const listData = await listRes.json();
        if (listData.ok && listData.listings?.length) {
          const allPhotos: Photo[] = [];
          for (const l of listData.listings as ListingInfo[]) {
            const photoRes = await fetch(`/api/photos?listingId=${l.guesty_id}`);
            const photoData = await photoRes.json();
            if (photoData.ok && photoData.photos?.length) allPhotos.push(...photoData.photos);
          }
          if (allPhotos.length > 0) { setPhotos(allPhotos); setLoading(false); return; }
        }
      } catch {}
      setPhotos([]); setLoading(false);
    }
    loadPhotos();
  }, []);

  useEffect(() => { const i = setInterval(() => setTi(i => (i + 1) % TESTIMONIALS.length), 5000); return () => clearInterval(i); }, []);
  useEffect(() => { const t = setTimeout(() => setHeroLoaded(true), 500); return () => clearTimeout(t); }, []);

  const handleContact = async (e: FormEvent) => { e.preventDefault(); await new Promise(r => setTimeout(r, 800)); setSubmitted(true); };
  const t = TESTIMONIALS[ti];
  const galleryPhotos = photos.length > 0 ? photos : [];

  const navLinks = [
    { label: "Properties", href: "#properties" },
    { label: "The App", href: "#app" },
    { label: "Reviews", href: "#reviews" },
    { label: "Branson Guide", href: "#guide" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${heroLoaded ? 'bg-[#2c1810]/95 backdrop-blur-sm border-b border-white/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold hidden sm:block" style={{ color: '#f5c842' }}>Summers Vacations</span>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="text-xs font-semibold no-underline text-stone-300 hover:text-amber-400 transition-colors">{l.label}</a>
            ))}
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full no-underline transition-all hover:brightness-110 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Check Availability</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-stone-300 p-1">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#2c1810] border-t border-white/5 px-4 py-3 flex flex-col gap-3">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="text-xs font-semibold text-stone-300 no-underline">{l.label}</a>
            ))}
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full text-center no-underline"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Check Availability</a>
          </div>
        )}
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: '#2c1810' }}>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30 z-10" />
          <img src="https://images.unsplash.com/photo-1567672585861-53c96c9c662e?auto=format&fit=crop&w=1920&q=80"
            alt="Table Rock Lake, Branson Missouri — autumn morning fog over the Ozarks" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 w-full pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5 bg-amber-400/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
              <MapPin size={12} /> Branson, Missouri — Indian Point
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight max-w-3xl" style={{ fontFamily: "'DM Serif Display', serif", color: '#f5c842' }}>
              Your Branson<br />Getaway Starts Here
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-stone-200 max-w-xl leading-relaxed">
              Premium condos steps from Table Rock Lake, minutes from Silver Dollar City & the Branson Strip. <span className="text-amber-400 font-semibold">Book direct and unlock our exclusive guest app.</span>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/30 text-sm"
                style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
                <Calendar size={18} /> Check Availability
              </a>
              <a href="#properties"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white font-medium transition-all hover:-translate-y-0.5 bg-white/10 hover:bg-white/20 text-sm">
                Explore Properties <ChevronDown size={16} />
              </a>
            </div>
            <div className="mt-10 flex gap-8 sm:gap-14 flex-wrap">
              {[{ n: '7', l: 'Properties' }, { n: '12 min', l: 'to SDC' }, { n: '2 min', l: 'to Lake' }, { n: '4.9★', l: 'Guest Rating' }].map((x, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{x.n}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <ChevronDown className="text-stone-400" size={24} />
        </div>
      </section>

      {/* ═══════ THE APP — KEY DIFFERENTIATOR ═══════ */}
      <section id="app" className="py-20 sm:py-28 px-4" style={{ background: '#faf8f5' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 mb-4">📱 Only When You Book Direct</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-800 leading-tight" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Your Stay Comes With<br />
                <span className="text-amber-600">a Personal Branson Guide</span>
              </h2>
              <p className="text-sm text-stone-500 mt-4 leading-relaxed">
                Every Summers Vacations guest gets access to our exclusive guidebook app — a living Branson companion that goes far beyond a typical welcome packet.
              </p>
              <div className="mt-6 space-y-3">
                {APP_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{f.emoji}</span>
                    <div><div className="text-sm font-bold text-stone-800">{f.title}</div><div className="text-xs text-stone-500">{f.desc}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">The app stays on your phone even after checkout — use it to plan your next trip!</span>
                </div>
              </div>
              <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest" target="_blank" rel="noopener"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-full text-sm font-semibold no-underline transition-all hover:-translate-y-0.5 shadow-lg"
                style={{ background: 'linear-gradient(135deg,#2c1810,#4a3228)', color: '#f5c842' }}>
                See the App in Action <ExternalLink size={14} />
              </a>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
                <div className="h-52 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2c1810,#4a3228)' }}>
                  <div className="text-center">
                    <div className="text-5xl mb-2">📱</div>
                    <div className="text-lg font-bold text-amber-400" style={{ fontFamily: "'DM Serif Display', serif" }}>Summers Stay</div>
                    <div className="text-xs text-stone-400">Guest Companion App</div>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-3">
                  {['🏠 Home', '🎣 Fishing', '⛳ Golf', '🎭 Shows', '🍽️ Dining', '🎢 Adventure'].map((x, i) => (
                    <div key={i} className="text-center bg-stone-50 rounded-lg py-3 px-1">
                      <div className="text-lg">{x.split(' ')[0]}</div>
                      <div className="text-[9px] font-semibold text-stone-500 mt-1">{x.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-4">
                  <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
                    <div className="text-[10px] font-semibold text-amber-800">✨ Seasonal themes • Daily updates • Forever yours</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 bg-amber-500 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg" style={{ transform: 'rotate(3deg)' }}>
                ⭐ Guest Favorite Feature
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ PROPERTIES ═══════ */}
      <section id="properties" className="py-20 sm:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 mb-4">🏡 Our Properties</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Seven Unique Ways to Stay</h2>
            <p className="text-sm text-stone-500 mt-3">6 condos on Indian Point at Table Rock Lake + a standalone family house on Timber Trace. All minutes from SDC &amp; the Strip.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROPERTIES.map((prop, i) => (
              <div key={i} className="group bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="h-48 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg,${prop.color},${prop.color}dd)` }}>
                  <span className="text-7xl opacity-40 group-hover:scale-125 transition-transform duration-500">{prop.emoji}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold text-stone-800">{prop.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 whitespace-nowrap">{prop.tag}</span>
                  </div>
                  <p className="text-xs text-stone-500">{prop.guests} · {prop.bed}</p>
                  <p className="text-[10px] text-stone-400 mt-1.5">{prop.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5 shadow-lg text-sm"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={18} /> Check Availability & Book Direct
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section id="gallery" className="py-20 sm:py-28 px-4 bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-stone-700 text-stone-200 mb-4">📸 Real Photos</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>Life at Our Properties</h2>
            <p className="text-sm text-stone-400 mt-3">What you see is what you get — real photos from our actual Branson units.</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : galleryPhotos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryPhotos.slice(0, 12).map((photo, i) => (
                  <div key={i} className={`aspect-[4/3] rounded-xl overflow-hidden bg-stone-800 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                    <img src={photo.url} alt={(photo as Photo).caption || `Property ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-stone-500 mt-4">Photos loaded from your Guesty listings</p>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                'https://images.unsplash.com/photo-1567672585861-53c96c9c662e?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1440583070797-3b0b72f30ea4?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=600&q=80',
              ].map((url, i) => (
                <div key={i} className={`aspect-[4/3] rounded-xl overflow-hidden bg-stone-800 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
                  <img src={url} alt="Branson property" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ REVIEWS + BRANSON GUIDE ═══════ */}
      <section id="reviews" className="py-20 sm:py-28 px-4" style={{ background: 'linear-gradient(180deg,#f5f0eb,#faf8f5)' }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 mb-4">⭐ What Guests Say</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Real Reviews from Real Guests</h2>
            <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 border border-stone-100 shadow-sm">
              <div className="flex gap-1 mb-4">{Array(5).fill(0).map((_, i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}</div>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-5 flex items-center justify-between">
                <div><div className="text-sm font-bold text-stone-800">{t.author}</div><div className="text-xs text-stone-400">{t.loc}</div></div>
                <div className="flex gap-1.5">
                  {TESTIMONIALS.map((_, i) => (
                    <button key={i} onClick={() => setTi(i)} className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === ti ? 'bg-amber-500 w-4' : 'bg-stone-200'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div id="guide">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 mb-4">🗺️ Branson at Your Fingertips</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Branson Favorites</h2>
            <p className="text-sm text-stone-500 mt-3 mb-6">Quick links to the best Branson has to offer — book tickets in one tap.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: '🎢', name: 'Silver Dollar City', url: 'https://www.silverdollarcity.com/', color: 'bg-amber-50 border-amber-200 text-amber-800' },
                { emoji: '🌲', name: 'Dogwood Canyon', url: 'https://dogwoodcanyon.org/', color: 'bg-green-50 border-green-200 text-green-800' },
                { emoji: '⛳', name: 'Ledgestone Golf', url: 'https://www.ledstonegolf.com/', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                { emoji: '🎭', name: 'Sight & Sound', url: 'https://www.sight-sound.com/', color: 'bg-purple-50 border-purple-200 text-purple-800' },
                { emoji: '🎣', name: 'Fishing Guides', url: 'https://captainbguide.com/', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                { emoji: '🎸', name: 'Branson Shows', url: 'https://www.claycooper.com/', color: 'bg-pink-50 border-pink-200 text-pink-800' },
              ].map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener"
                  className={`rounded-xl px-4 py-3 border no-underline hover:brightness-95 transition-all hover:-translate-y-0.5 ${l.color}`}>
                  <div className="text-xl">{l.emoji}</div>
                  <div className="text-xs font-bold mt-1">{l.name}</div>
                </a>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-4">Plus fishing reports, show times, golf courses & more in the guest app →</p>
          </div>
        </div>
      </section>

      {/* ═══════ SEASONAL ═══════ */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg,#2c1810,#4a3228)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">🎃 Seasonal</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-amber-400" style={{ fontFamily: "'DM Serif Display', serif" }}>Fall in Branson is Magic</h2>
          <p className="text-sm text-stone-300 mt-3 max-w-xl mx-auto">
            Silver Dollar City&apos;s Harvest Festival runs through October 31. Book your fall getaway and experience Pumpkin Nights, cooler weather, and the Ozarks in full color.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <a href="https://www.silverdollarcity.com/theme-park/festivals/harvest-festival/" target="_blank" rel="noopener"
              className="px-6 py-3 rounded-full bg-amber-500 text-amber-900 text-sm font-semibold no-underline hover:brightness-110 transition-all">🎃 Learn More</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="px-6 py-3 rounded-full border border-white/20 text-white text-sm font-semibold no-underline hover:bg-white/10 transition-all">Book Fall Dates</a>
          </div>
        </div>
      </section>

      {/* ═══════ CONTACT ═══════ */}
      <section id="contact" className="py-20 sm:py-28 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 mb-4">💬 Let&apos;s Chat</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Questions? We&apos;re Here 24/7</h2>
            <p className="text-sm text-stone-500 mt-3">Text, call, or email — Brian answers personally.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-stone-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Phone size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Call or Text</div><a href="tel:+13145650589" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">314-565-0589</a></div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-stone-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Mail size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Email</div><a href="mailto:summersvacationsllc@gmail.com" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">summersvacationsllc@gmail.com</a></div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-stone-100 hover:shadow-sm transition-shadow">
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
                <p className="text-sm text-green-600 mt-1">Brian will reply shortly. Thanks for reaching out!</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="bg-white rounded-xl p-6 border border-stone-100 space-y-4">
                <input type="text" placeholder="Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <textarea placeholder="Message *" required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50 resize-none" />
                <button type="submit"
                  className="w-full py-3 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-12 px-4" style={{ background: '#2c1810' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <div className="text-sm font-bold" style={{ color: '#f5c842' }}>Summers Vacations</div>
          </div>
          <p className="text-xs text-stone-500">Branson, Missouri — Premium Short-Term Rentals on Indian Point</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="tel:+13145650589" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Phone size={14} /> 314-565-0589</a>
            <a href="mailto:summersvacationsllc@gmail.com" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Mail size={14} /> Email</a>
            <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest" target="_blank" rel="noopener" className="text-xs text-stone-400 no-underline hover:text-amber-400">Guest App</a>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-800">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold no-underline transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={14} /> Book Your Branson Getaway
            </a>
          </div>
          <div className="mt-6 text-[10px] text-stone-600">&copy; {new Date().getFullYear()} Summers Vacations LLC · All rights reserved</div>
        </div>
      </footer>
    </>
  );
}