"use client";

import { useEffect, useState } from "react";
import { Phone, Mail, MapPin, Star, X } from "lucide-react";
import Link from "next/link";

interface CatalogPhoto { url: string; thumb: string; title: string; category: string; source: string; }

const P = [
  { n: "The Penthouse", t: "Top Floor • Views", g: "6", b: "2BR", d: "Branson West", s: "the-penthouse", gid: "68eeb58d873b002c39d38657" },
  { n: "Rustic Ozark Retreat", t: "Cozy • Fireplace", g: "6", b: "2BR", d: "Branson West", s: "rustic-ozark-retreat", gid: "68eeb5866f48002c3d470a6c" },
  { n: "Woodland Retreat", t: "Family • Bunk Room", g: "6", b: "2BR", d: "Branson West", s: "woodland-retreat", gid: "68eecd33a359002c338a2a55" },
  { n: "Modern Charmer", t: "Sleek • Updated", g: "4", b: "1BR", d: "Branson West", s: "modern-charmer", gid: "696679519399002c92ac4ec4" },
  { n: "Pretty Peacock", t: "No Steps • Easy", g: "6", b: "1BR", d: "Branson West", s: "pretty-peacock", gid: "699911d27b1a001efccbf235" },
  { n: "Double Condo", t: "🔥 Best Value", g: "12+", b: "4BR", d: "Branson West", s: "double-condo", gid: "68eeb561cce1002c364dfb89" },
  { n: "Branson Family Haven", t: "🏡 House", g: "16", b: "3BR", d: "Branson", s: "branson-family-haven", gid: "6993c5d31547001e711bc7ed" },
];

export default function Home() {
  const [galleryPhotos, setGalleryPhotos] = useState<CatalogPhoto[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    // Load gallery photos from catalog
    (async () => {
      try {
        const r = await fetch("/photos-catalog.json");
        const d = await r.json();
        // Pick the most exciting/adventurous ones for the mosaic
        const exciting = d.filter((p: CatalogPhoto) =>
          p.category.includes("Thrill") || p.category.includes("Fishing") ||
          p.category.includes("Kayak") || p.category.includes("Coaster") ||
          p.category.includes("Show") || p.category.includes("Concert") ||
          p.category.includes("Lake") || p.category.includes("SDC")
        );
        setGalleryPhotos(exciting.slice(0, 12));
      } catch {}
    })();
    // Cover photos from local property-photos directories
    (async () => {
      const covers: Record<string, string> = {};
      for (const p of P) {
        try {
          const r = await fetch(`/api/property-photos?slug=${p.s}`);
          const d = await r.json();
          if (d.ok && d.photos?.length) covers[p.s] = d.photos[0];
        } catch {}
      }
      setCoverPhotos(covers);
    })();
  }, []);

  return (
    <main className="bg-white">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-end pb-0"
        style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <img src="https://images.pexels.com/photos/31798407/pexels-photo-31798407.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Branson adventure" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-extrabold"
                style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
              <span className="text-lg font-bold text-white hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>Summers Vacations</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {["Properties","Gallery","Reviews","Contact"].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-white/80 no-underline hover:text-white transition-colors tracking-wide">{l}</a>
              ))}
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
                className="px-6 py-2.5 rounded text-sm font-semibold no-underline text-white border-2 border-white/30 hover:bg-white/10 transition-colors">Book Now</a>
            </div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-white">
              {mobileMenu ? <X size={24} /> : <span className="text-2xl">☰</span>}
            </button>
          </div>
          {mobileMenu && (
            <div className="md:hidden bg-black/90 px-4 py-4 space-y-3">
              {["Properties","Gallery","Reviews","Contact"].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="block text-white/80 no-underline text-sm"> {l}</a>
              ))}
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener" className="block text-white no-underline text-sm font-semibold">Book Now</a>
            </div>
          )}
        </nav>

        {/* Hero content */}
        <div className="relative z-10 w-full px-4 pb-20 pt-32">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-400 border border-white/10 mb-6">
                <MapPin size={12} /> Branson, Missouri — Indian Point on Table Rock Lake
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your Branson<br /><span className="text-amber-400">Adventure Awaits</span>
              </h1>
              <p className="text-lg text-white/70 mt-6 max-w-xl leading-relaxed">
                Stay steps from Table Rock Lake and minutes from SDC, mountain coasters, the Strip & every thrill Branson has to offer.
              </p>
            </div>

            {/* Booking Widget */}
            <div className="mt-12 bg-white rounded-2xl shadow-2xl p-6 max-w-lg">
              <div className="text-sm font-semibold text-stone-800 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Check Availability</div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Check-in</div>
                  <div className="text-sm font-semibold text-stone-800 border-b border-stone-200 pb-1">Select date</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Check-out</div>
                  <div className="text-sm font-semibold text-stone-800 border-b border-stone-200 pb-1">Select date</div></div>
                <div><div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Guests</div>
                  <div className="text-sm font-semibold text-stone-800 border-b border-stone-200 pb-1">1 Guest</div></div>
              </div>
              <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
                className="block w-full text-center py-3 rounded-lg text-sm font-bold no-underline bg-stone-900 text-white hover:bg-stone-800 transition-colors">Search</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROPERTIES ═══════════ */}
      <section id="properties" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Seven Ways to Stay</h2>
            <p className="text-stone-500 mt-4 text-lg">6 condos on Indian Point + a standalone family house. All minutes from the fun.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {P.map((p, i) => (
              <Link key={i} href={`/property/${p.s}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 no-underline text-inherit border border-stone-100">
                <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
                  {coverPhotos[p.s] ? (
                    <img src={coverPhotos[p.s]} alt={p.n} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 text-5xl">🏠</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-stone-900">{p.n}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{p.t}</span>
                  </div>
                  <p className="text-sm text-stone-500">Sleeps {p.g} · {p.b} · {p.d}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-block px-10 py-4 bg-stone-900 text-white rounded-lg text-sm font-bold no-underline hover:bg-stone-800 transition-colors">Check Availability</a>
          </div>
        </div>
      </section>

      {/* ═══════════ PHOTO GALLERY ═══════════ */}
      <section id="gallery" className="bg-stone-50">
        <div className="text-center pt-20 pb-10 px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>Experience Branson</h2>
          <p className="text-stone-500 mt-4 text-lg">Thrills, lakes, shows, and adventures waiting for you.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {galleryPhotos.map((photo, i) => (
            <div key={i} className="aspect-square bg-stone-200 overflow-hidden">
              <img src={photo.thumb} alt={photo.title} loading="lazy"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%23e5e7eb" width="400" height="400"/><text x="200" y="200" text-anchor="middle" fill="%239ca3af" font-size="40">🏞️</text></svg>'; }} />
            </div>
          ))}
        </div>
        <div className="text-center pb-20 pt-10">
          <Link href="/photos" className="inline-block px-10 py-4 bg-stone-900 text-white rounded-lg text-sm font-bold no-underline hover:bg-stone-800 transition-colors">View Full Gallery →</Link>
        </div>
      </section>

      {/* ═══════════ QUICK LINKS ═══════════ */}
      <section className="py-20 px-4" style={{ background: '#f5f0eb' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-stone-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Quick Links to Popular Tickets</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            {[
              { t: "Silver Dollar City", u: "https://www.silverdollarcity.com/" },
              { t: "Dogwood Canyon", u: "https://dogwoodcanyon.org/" },
              { t: "Sight & Sound Theatre", u: "https://www.sight-sound.com/" },
              { t: "Branson Shows & Events", u: "https://www.explorebranson.com/" },
            ].map((l, i) => (
              <a key={i} href={l.u} target="_blank" rel="noopener"
                className="flex items-center gap-3 bg-stone-900 text-white rounded-lg px-6 py-5 no-underline hover:bg-stone-800 transition-colors text-left">
                <span className="text-amber-400 text-xl">★</span>
                <span className="text-sm font-bold">{l.t} tickets</span>
              </a>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/reports" className="inline-block text-amber-600 text-sm font-semibold no-underline hover:text-amber-700">
              📰 Daily Branson Report — fishing, shows & events →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section id="reviews" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 text-center mb-14" style={{ fontFamily: "'Playfair Display', serif" }}>Testimonials</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was a favorite of ours and my daughter loved watching the deer frolic in the woods each morning.", a: "Krystal", l: "Saint Charles, MO" },
              { t: "Check in and out went seamlessly, and the place was very cozy and clean. Close to all the fun of SDC but still felt like a secluded mountain getaway!", a: "Jennifer", l: "Arkadelphia, AR" },
              { t: "We could see the fireworks from Silver Dollar City from the deck! Great communication from Brian. We would definitely stay here again.", a: "Gary", l: "Lincoln, NE" },
              { t: "Brian's place is awesome for a larger family! Condos were clean and comfortable. Fantastic hiking and close to SDC. Highly recommend!", a: "Aaron", l: "Kansas" },
            ].map((r, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-6 text-left">
                <div className="flex gap-1 mb-3">{Array(5).fill(0).map((_, j) => <Star key={j} size={14} className="fill-amber-400 text-amber-400" />)}</div>
                <p className="text-sm text-stone-600 leading-relaxed italic">&ldquo;{r.t}&rdquo;</p>
                <div className="mt-4"><div className="text-sm font-bold text-stone-800">{r.a}</div><div className="text-xs text-stone-400">{r.l}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section id="contact" className="py-24 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Let's talk!</h2>
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            <div>
              <h3 className="text-lg font-bold text-stone-800 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Business Hours</h3>
              <div className="text-stone-600 space-y-1 mb-6">
                <div>Mon - Sun: Always Open</div>
                <div className="text-sm text-stone-400">(I might be on a 911 call — I'm a firefighter!)</div>
              </div>
              <div className="space-y-3">
                <a href="tel:3145650589" className="flex items-center gap-2 text-stone-800 no-underline hover:text-amber-600"><Phone size={16} /> 314-565-0589</a>
                <a href="mailto:summersvacationsllc@gmail.com" className="flex items-center gap-2 text-stone-800 no-underline hover:text-amber-600"><Mail size={16} /> summersvacationsllc@gmail.com</a>
              </div>
            </div>
            {submitted ? (
              <div className="bg-green-50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-green-800">Message Sent!</h3>
                <p className="text-sm text-green-600 mt-1">Brian will reply shortly. Thanks!</p>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); try { await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); } catch {} setSubmitted(true); }}>
                <input type="text" placeholder="Name" required value={f.name} onChange={e => setF({ ...f, name: e.target.value })}
                  className="w-full px-0 py-3 border-b border-stone-300 text-sm focus:outline-none focus:border-stone-900 bg-transparent mb-4 placeholder:text-stone-400" />
                <input type="email" placeholder="Email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                  className="w-full px-0 py-3 border-b border-stone-300 text-sm focus:outline-none focus:border-stone-900 bg-transparent mb-4 placeholder:text-stone-400" />
                <input type="tel" placeholder="Phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })}
                  className="w-full px-0 py-3 border-b border-stone-300 text-sm focus:outline-none focus:border-stone-900 bg-transparent mb-4 placeholder:text-stone-400" />
                <textarea placeholder="Message" required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })}
                  className="w-full px-0 py-3 border-b border-stone-300 text-sm focus:outline-none focus:border-stone-900 bg-transparent mb-6 placeholder:text-stone-400 resize-none" />
                <button type="submit" className="px-10 py-4 bg-stone-900 text-white rounded-lg text-sm font-bold border-none cursor-pointer hover:bg-stone-800 transition-colors">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-12 px-4 bg-stone-900 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-extrabold"
            style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
          <div className="text-lg font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', serif" }}>Summers Vacations</div>
        </div>
        <div className="flex justify-center gap-6 text-sm text-stone-400">
          <a href="tel:3145650589" className="no-underline hover:text-amber-400">Call</a>
          <a href="mailto:summersvacationsllc@gmail.com" className="no-underline hover:text-amber-400">Email</a>
          <Link href="/reports" className="no-underline hover:text-amber-400">Daily Reports</Link>
          <Link href="/photos" className="no-underline hover:text-amber-400">Photos</Link>
        </div>
        <div className="mt-8 text-xs text-stone-600">&copy; {new Date().getFullYear()} Summers Vacations LLC</div>
      </footer>
    </main>
  );
}