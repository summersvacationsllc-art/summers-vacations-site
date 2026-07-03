"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Menu, X, Phone, Mail, Calendar, ChevronDown, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ────────────────────────────────────────────────────────

interface Photo {
  url: string;
  caption?: string;
  id?: string;
}

interface ListingInfo {
  guesty_id: string;
  title: string;
  nickname: string;
}

// ─── Fallback images ─────────────────────────────────────────

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

// ─── Content (exact from current site) ───────────────────────────

const TESTIMONIALS = [
  {
    text: "We loved our time at Woodland Retreat! The place was spotless and the surroundings were absolutely beautiful. The deck was a favorite of ours and my daughter loved watching the deer frolic in the woods each morning. Our hosts were quick to respond and very friendly. All and all, it was a wonderful stay and we highly recommend it to anyone looking for a peacefull getaway with a wide variety of nearby attractions!",
    author: "Krystal",
    location: "Saint Charles Missouri",
  },
  {
    text: "We enjoyed a wonderful week at Brian and Chantels place! Check in and out went seamlessly, and the place was very cozy and clean. We loved the location...close to all of the fun of SDC and the Branson Strip, but still felt like a secluded mountain get away! We enjoyed a late evening swim in the pool most nights, and we also explored around the private lake. We will be staying here next time we head to Branson for sure!",
    author: "Jennifer",
    location: "Arkadelphia Arkansas",
  },
  {
    text: "We had a great stay at Brian's place. The property was as advertised and everything worked as expected. We enjoyed the view and had an added bonus as we could see the fireworks from Silver Dollar City from the deck. We had a clear view of Inspiration Tower at Shepherd of the Hills which had a nice light show after dark as well. The host had great communication, even checking on us when we accidently set off the smoke alarm while cooking. We would definitely stay here again.",
    author: "Gary",
    location: "Lincoln Nebraska",
  },
  {
    text: "Brian's place is awesome for a larger family to get together for a great time. Condos were clean, well stocked, and very comfortable for accommodating the whole family. Fantastic hiking in the area and close to SDC! Only 15 min to everythning in Branson. Lots of places to rent boats all around! Brian was very communicative and helpful! Highly recommend this place to anyone!",
    author: "Aaron",
    location: "Kansas",
  },
];

const QUICK_LINKS = [
  { label: "Silver Dollar City tickets", url: "https://www.silverdollarcity.com/" },
  { label: "Dogwood Canyon tickets", url: "https://dogwoodcanyon.org/" },
  { label: "Ledgestone golf course", url: "https://www.ledstonegolf.com/" },
  { label: "Sight & Sound Theater", url: "https://www.sight-sound.com/" },
];

// ─── Main Page ────────────────────────────────────────────────────

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  // Fetch photos from Guesty
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
            if (photoData.ok && photoData.photos?.length) {
              allPhotos.push(...photoData.photos);
            }
          }
          if (allPhotos.length > 0) {
            setPhotos(allPhotos);
            setLoading(false);
            return;
          }
        }
      } catch {}
      setPhotos(FALLBACK_IMAGES.map((url) => ({ url })) as Photo[]);
      setLoading(false);
    }
    loadPhotos();
  }, []);

  const handleContact = async (e: FormEvent) => {
    e.preventDefault();
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  const t = TESTIMONIALS[testimonialIdx];

  return (
    <>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-tight">
            Summers Vacations LLC
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-stone-300 leading-relaxed max-w-2xl mx-auto">
            Offering you the highest quality guest experience. Guaranteed to be
            a stay you&apos;ll never forget!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://notchcondos.guestywebsites.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-white font-semibold transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 hover:-translate-y-0.5"
            >
              <Calendar size={18} />
              Check Availability
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all hover:-translate-y-0.5"
            >
              View Gallery
            </a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-stone-400">
            <span>Premium Condos</span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span>Branson Location</span>
            <span className="w-1 h-1 rounded-full bg-stone-500" />
            <span>5-Star Service</span>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={20} className="text-white/30" />
        </div>
      </section>

      {/* ─── ABOUT ────────────────────────────────────────── */}
      <section id="about" className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-6">
            About
          </h2>
          <p className="text-stone-600 leading-relaxed text-base sm:text-lg">
            Summers Vacations LLC. offers short-term condo rentals in Branson,
            Missouri, all within the same well-maintained complex for consistency
            and ease. Each safe, quiet, and well-appointed unit provides
            convenient access to shows, outdoor adventures, and family-friendly
            activities. Founded by a long-time Branson enthusiast and a current
            Fire Fighter who understands a busy life style and stress. We aim to
            deliver a home away from home where guests can unwind, rest, and
            recharge with thoughtful amenities.
          </p>
        </div>
      </section>

      {/* ─── GALLERY ──────────────────────────────────────── */}
      <section id="gallery" className="py-16 sm:py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-10 text-center">
            Gallery
          </h2>
          {loading ? (
            <div className="text-center text-stone-400 py-16">Loading photos...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {photos.map((photo, i) => (
                <a
                  key={photo.id || i}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm group"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────── */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-10 text-center">
            Testimonials
          </h2>
          <div className="bg-stone-50 rounded-2xl p-6 sm:p-10 border border-stone-100">
            <div className="flex gap-1 mb-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-stone-600 leading-relaxed text-base sm:text-lg italic">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-stone-300 flex items-center justify-center text-white font-bold text-sm">
                {t.author[0]}
              </div>
              <div>
                <p className="font-semibold text-stone-800">{t.author}</p>
                <p className="text-sm text-stone-400">{t.location}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2 mt-5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === testimonialIdx ? "bg-stone-700 w-6" : "bg-stone-300 hover:bg-stone-400"
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUICK LINKS ──────────────────────────────────── */}
      <section id="buttons" className="py-16 sm:py-24 bg-stone-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-8">
            Quick links to popular tickets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {QUICK_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-medium text-sm transition-all hover:-translate-y-0.5 shadow-md"
              >
                <Star size={15} className="text-amber-400 shrink-0 fill-amber-400" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ──────────────────────────────────────── */}
      <section id="contact" className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-10 text-center">
            Let&apos;s talk!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* Info */}
            <div className="space-y-6">
              <div className="bg-stone-50 rounded-xl p-6 border border-stone-100">
                <h3 className="font-semibold text-stone-700 mb-2">Business Hours</h3>
                <p className="text-sm text-stone-500">Mon - Sun: Open 24 Hours</p>
              </div>
              <div className="space-y-3">
                <a href="tel:+131****0589" className="flex items-center gap-3 text-stone-600 hover:text-stone-900 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Phone size={16} />
                  </div>
                  <span>+1 314-565-0589</span>
                </a>
                <a href="mailto:summersvacationsllc@gmail.com" className="flex items-center gap-3 text-stone-600 hover:text-stone-900 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <span>summersvacationsllc@gmail.com</span>
                </a>
                <a
                  href="https://www.facebook.com/summersvacations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073C0 18.11 4.388 23.242 10.125 24V15.56H7.078v-3.487h3.047V9.458c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.487h-2.796V24C19.612 23.242 24 18.11 24 12.073z" />
                    </svg>
                  </div>
                  <span>Follow us on Facebook</span>
                </a>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div className="bg-stone-50 rounded-xl p-8 text-center border border-stone-100">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="font-semibold text-stone-800">Message Sent!</p>
                  <p className="text-sm text-stone-500 mt-1">We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleContact} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                  />
                  <textarea
                    placeholder="Message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-sm transition-all hover:-translate-y-0.5 shadow-md"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
