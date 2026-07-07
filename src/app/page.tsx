"use client";

import { useEffect, useState, type FormEvent, useRef } from "react";
import { Phone, Mail, Calendar, Star, ChevronDown, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

interface Photo { url: string; caption?: string; id?: string; }
interface ListingInfo { guesty_id: string; title: string; nickname: string; }

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753086-00f18f5b7b5a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600595956481-8a9e1f5c1c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
];

const PROPERTIES = [
  { name: "The Penthouse", sleeps: 6, beds: 2, badge: "Top Floor • Views", emoji: "🏠" },
  { name: "Rustic Ozark Retreat", sleeps: 6, beds: 2, badge: "Cozy • Fireplace", emoji: "🌲" },
  { name: "Woodland Retreat", sleeps: 6, beds: 2, badge: "Family • Bunks", emoji: "🌳" },
  { name: "Modern Charmer", sleeps: 4, beds: 1, badge: "Sleek • Updated", emoji: "✨" },
  { name: "Pretty Peacock", sleeps: 6, beds: 1, badge: "No Steps • Easy", emoji: "🦚" },
  { name: "Branson Family Haven", sleeps: 8, beds: 3, badge: "House • Yard", emoji: "🏡" },
  { name: "Double Condo", sleeps: 12, beds: 4, badge: "🔥 Bundle Deal", emoji: "🏢" },
];

const TESTIMONIALS = [
  { text: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was a favorite of ours and my daughter loved watching the deer frolic in the woods each morning. Our hosts were quick to respond and very friendly. All and all, it was a wonderful stay and we highly recommend it!", author: "Krystal", location: "Saint Charles, MO" },
  { text: "We enjoyed a wonderful week at Brian and Chantel's place! Check in and out went seamlessly, and the place was very cozy and clean. We loved the location...close to all of the fun of SDC and the Branson Strip, but still felt like a secluded mountain get away!", author: "Jennifer", location: "Arkadelphia, AR" },
  { text: "We had a great stay! The property was as advertised and everything worked as expected. We enjoyed the view and had an added bonus as we could see the fireworks from Silver Dollar City from the deck. The host had great communication. We would definitely stay here again.", author: "Gary", location: "Lincoln, NE" },
  { text: "Brian's place is awesome for a larger family to get together for a great time. Condos were clean, well stocked, and very comfortable for accommodating the whole family. Fantastic hiking in the area and close to SDC! Only 15 min to everything in Branson.", author: "Aaron", location: "Kansas" },
];

const QUICK_LINKS = [
  { label: "Silver Dollar City", url: "https://www.silverdollarcity.com/", emoji: "🎢" },
  { label: "Dogwood Canyon", url: "https://dogwoodcanyon.org/", emoji: "🌲" },
  { label: "Ledgestone Golf", url: "https://www.ledstonegolf.com/", emoji: "⛳" },
  { label: "Sight & Sound", url: "https://www.sight-sound.com/", emoji: "🎭" },
];

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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
      setPhotos(FALLBACK_IMAGES.map((url) => ({ url })) as Photo[]);
      setLoading(false);
    }
    loadPhotos();
  }, []);

  useEffect(() => { const i = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 6000); return () => clearInterval(i); }, []);

  const handleContact = async (e: FormEvent) => { e.preventDefault(); await new Promise(r => setTimeout(r, 800)); setSubmitted(true); };
  const t = TESTIMONIALS[testimonialIdx];
  const p: Photo[] = photos.length > 0 ? photos : FALLBACK_IMAGES.map(u => ({ url: u }));

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#2c1810]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <span className="text-sm font-bold hidden sm:block" style={{ color: '#f5c842' }}>Summers Vacations</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#properties" className="text-xs font-semibold no-underline text-stone-300 hover:text-amber-400 transition-colors">Properties</a>
            <a href="#gallery" className="text-xs font-semibold no-underline text-stone-300 hover:text-amber-400 transition-colors">Gallery</a>
            <a href="#reviews" className="text-xs font-semibold no-underline text-stone-300 hover:text-amber-400 transition-colors">Reviews</a>
            <a href="#contact" className="text-xs font-semibold no-underline text-stone-300 hover:text-amber-400 transition-colors">Contact</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full no-underline transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-stone-300 p-1">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#2c1810] border-t border-white/5 px-4 py-3 flex flex-col gap-3">
            <a href="#properties" onClick={() => setMenuOpen(false)} className="text-xs font-semibold text-stone-300 no-underline">Properties</a>
            <a href="#gallery" onClick={() => setMenuOpen(false)} className="text-xs font-semibold text-stone-300 no-underline">Gallery</a>
            <a href="#reviews" onClick={() => setMenuOpen(false)} className="text-xs font-semibold text-stone-300 no-underline">Reviews</a>
            <a href="#contact" onClick={() => setMenuOpen(false)} className="text-xs font-semibold text-stone-300 no-underline">Contact</a>
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="text-xs font-bold px-4 py-2 rounded-full text-center no-underline"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Book Now</a>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#2c1810 0%,#4a3228 50%,#2c1810 100%)' }}>
        <div className="absolute inset-0 bg-[url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80)] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-6 bg-white/10 text-amber-300 border border-white/10">
            🎃 Branson, Missouri — Book Your Ozarks Getaway
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold leading-tight" style={{ fontFamily: "'DM Serif Display', serif", color: '#f5c842' }}>
            Summers Vacations
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-stone-300 max-w-2xl mx-auto leading-relaxed">
            Premium condos just minutes from Silver Dollar City, the Branson Strip, and Table Rock Lake. <span className="text-amber-400 font-semibold">Your Ozarks adventure starts here.</span>
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={18} /> Check Availability
            </a>
            <a href="#properties"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white font-medium transition-all hover:-translate-y-0.5 bg-white/10 hover:bg-white/20">
              View Properties <ChevronDown size={16} />
            </a>
          </div>
          <div className="mt-12 flex justify-center gap-8 sm:gap-12 flex-wrap">
            {[{n:'7',l:'Properties'},{n:'4.9★',l:'Avg Rating'},{n:'2 min',l:'to Table Rock'},{n:'12 min',l:'to SDC'}].map((x,i) => (
              <div key={i} className="text-center"><div className="text-2xl font-bold text-amber-400">{x.n}</div><div className="text-xs text-stone-400 mt-0.5">{x.l}</div></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="text-stone-400" size={24} />
        </div>
      </section>

      {/* PROPERTIES */}
      <section id="properties" className="py-20 sm:py-28 px-4" style={{ background: 'linear-gradient(180deg,#faf8f5 0%,#f5f0eb 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 mb-4">🏡 Our Properties</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Choose Your Branson Home Base</h2>
            <p className="text-sm text-stone-500 mt-3 leading-relaxed">From cozy condos to family-sized homes — all within walking distance of the best Branson has to offer.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROPERTIES.map((prop, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                <div className="h-48 flex items-center justify-center text-6xl" style={{ background: ['linear-gradient(135deg,#2c1810,#4a3228)','linear-gradient(135deg,#1e3a5f,#2d5a8e)','linear-gradient(135deg,#166534,#15803d)','linear-gradient(135deg,#b45309,#d97706)','linear-gradient(135deg,#7c3aed,#6d28d9)','linear-gradient(135deg,#be123c,#e11d48)','linear-gradient(135deg,#f5c842,#e8b832)'][i] }}>
                  <span className="opacity-70 group-hover:scale-110 transition-transform duration-300">{prop.emoji}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-stone-800">{prop.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{prop.badge}</span>
                  </div>
                  <p className="text-xs text-stone-500">Sleeps {prop.sleeps} · {prop.beds} bedroom{(prop.beds??0)>1?'s':''}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://notchcondos.guestywebsites.com/" target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>
              <Calendar size={18} /> Check Availability & Book
            </a>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20 sm:py-28 px-4 bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-stone-700 text-stone-200 mb-4">📸 Gallery</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'DM Serif Display', serif" }}>A Look Inside</h2>
            <p className="text-sm text-stone-400 mt-3">Real photos from our properties — what you see is what you get.</p>
          </div>
          {loading ? (
            <div className="flex justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {p.slice(0, 12).map((photo, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-800">
                  <img src={photo.url} alt={(photo as Photo).caption || `Property photo ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-20 sm:py-28 px-4" style={{ background: 'linear-gradient(180deg,#f5f0eb,#faf8f5)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-100 text-green-800 mb-4">⭐ Guest Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>What Our Guests Say</h2>
          </div>
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-stone-100 shadow-sm">
            <div className="flex gap-1 mb-4">{Array(5).fill(0).map((_,i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}</div>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
            <div className="mt-6 flex items-center justify-between">
              <div><div className="text-sm font-bold text-stone-800">{t.author}</div><div className="text-xs text-stone-400">{t.location}</div></div>
              <div className="flex gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)} className={`w-2 h-2 rounded-full border-none cursor-pointer transition-colors ${i === testimonialIdx ? 'bg-amber-500' : 'bg-stone-200'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRANSON QUICK LINKS */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'linear-gradient(135deg,#2c1810,#4a3228)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-400" style={{ fontFamily: "'DM Serif Display', serif" }}>🎯 Branson Favorites</h2>
            <p className="text-sm text-stone-400 mt-2">Quick links to top attractions — book tickets in one tap.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {QUICK_LINKS.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener"
                className="bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:bg-white/10 transition-all hover:-translate-y-0.5 no-underline group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{link.emoji}</div>
                <div className="text-sm font-semibold text-white">{link.label}</div>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://mybransonvacation.com/guidebook/the-penthouse?code=demo&name=Guest"
              target="_blank" rel="noopener"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold text-stone-800 no-underline transition-all"
              style={{ background: '#f5c842' }}>
              📱 Try Our Guest App
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 sm:py-28 px-4 bg-stone-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 mb-4">💬 Let&apos;s Talk</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Get in Touch</h2>
            <p className="text-sm text-stone-500 mt-3">Questions about a property, booking multiple units, or need recommendations? We&apos;re here 24/7.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 max-w-3xl mx-auto">
            <div className="space-y-5">
              <div className="bg-white rounded-xl p-5 border border-stone-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Phone size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Call or Text</div><a href="tel:+13145650589" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">314-565-0589</a></div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-stone-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 text-amber-600"><Mail size={18} /></div>
                <div><div className="text-xs text-stone-400 font-semibold">Email</div><a href="mailto:summersvacationsllc@gmail.com" className="text-sm font-bold text-stone-800 no-underline hover:text-amber-600">summersvacationsllc@gmail.com</a></div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-stone-100">
                <div className="text-xs text-stone-400 font-semibold mb-1">Business Hours</div>
                <div className="text-sm font-bold text-stone-800">Mon - Sun: Open 24 Hours</div>
              </div>
              <a href="https://facebook.com/summersvacations" target="_blank" rel="noopener"
                className="flex items-center gap-3 bg-[#1877f2] text-white rounded-xl p-5 no-underline hover:brightness-110 transition-all">
                <span className="text-lg">f</span>
                <div><div className="text-sm font-bold">Follow us on Facebook</div><div className="text-xs text-white/70">Updates, photos & specials</div></div>
              </a>
            </div>
            {submitted ? (
              <div className="bg-white rounded-xl p-8 border border-green-100 flex flex-col items-center justify-center text-center">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-lg font-bold text-green-800">Message Sent!</h3>
                <p className="text-sm text-green-600 mt-1">We&apos;ll get back to you within a few hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} className="bg-white rounded-xl p-6 border border-stone-100 space-y-4">
                <input type="text" placeholder="Name *" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <input type="email" placeholder="Email *" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50" />
                <textarea placeholder="Message *" required rows={4} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                  className="w-full px-4 py-3 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400 transition-colors bg-stone-50 resize-none" />
                <button type="submit"
                  className="w-full py-3 rounded-lg text-sm font-bold border-none cursor-pointer transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 text-center" style={{ background: '#2c1810' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-extrabold" style={{ background: 'linear-gradient(135deg,#f5c842,#e8b832)', color: '#2c1810' }}>SV</div>
            <div className="text-sm font-bold" style={{ color: '#f5c842' }}>Summers Vacations</div>
          </div>
          <p className="text-xs text-stone-500">Branson, Missouri — Premium Short-Term Rentals</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="tel:+13145650589" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Phone size={14} /> 314-565-0589</a>
            <a href="mailto:summersvacationsllc@gmail.com" className="text-xs text-stone-400 no-underline hover:text-amber-400 flex items-center gap-1"><Mail size={14} /> Email</a>
            <a href="https://facebook.com/summersvacations" target="_blank" rel="noopener" className="text-xs text-stone-400 no-underline hover:text-amber-400">Facebook</a>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-800 text-[10px] text-stone-600">&copy; {new Date().getFullYear()} Summers Vacations LLC. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}