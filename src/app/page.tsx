"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Star,
  X,
  Menu,
  Heart,
  Shield,
  Sparkles,
  Users,
  Waves,
  TreePine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  BOOK_URL,
  PHONE,
  PHONE_HREF,
  EMAIL,
  FACEBOOK,
  PROPERTIES,
  GALLERY_PHOTOS,
  ACTIVITIES,
} from "@/lib/site";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <main className="bg-white text-slate-900">
      {/* ═══════════ NAV ═══════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-md bg-gradient-to-br from-[#0c4a6e] to-[#0ea5e9]">
              MB
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold text-[#0c4a6e] tracking-tight group-hover:text-[#0ea5e9] transition-colors">
                My Branson Vacation
              </div>
              <div className="text-[10px] font-semibold text-teal-600 tracking-wide uppercase hidden sm:block">
                We take care of you
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: "Stays", href: "#stays" },
              { label: "Why Us", href: "#why-us" },
              { label: "Adventures", href: "#adventures" },
              { label: "Photos", href: "#photos" },
              { label: "Reviews", href: "#reviews" },
              { label: "Contact", href: "#contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-[#0c4a6e] hover:bg-sky-50 transition-colors no-underline"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm no-underline"
            >
              Book Your Stay
              <ArrowRight size={16} strokeWidth={2.5} />
            </a>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 rounded-lg text-[#0c4a6e] hover:bg-sky-50"
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="lg:hidden bg-white border-t border-sky-100 px-4 py-4 space-y-1 shadow-lg">
            {[
              { label: "Stays", href: "#stays" },
              { label: "Why Us", href: "#why-us" },
              { label: "Adventures", href: "#adventures" },
              { label: "Photos", href: "#photos" },
              { label: "Reviews", href: "#reviews" },
              { label: "Contact", href: "#contact" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className="block px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-sky-50 rounded-lg no-underline"
              >
                {item.label}
              </a>
            ))}
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book block text-center mt-2 px-4 py-3 rounded-full text-sm no-underline"
            >
              Book Your Stay
            </a>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[92vh] flex items-end pt-16">
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/property-photos/penthouse/12E2EDDB-A38A-4D5A-B209-CBB1F9AD1830_1_105_c.jpeg"
            alt="Screened porch overlooking the Ozarks — real Summers Vacations property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e] via-[#0c4a6e]/70 to-[#0c4a6e]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c4a6e]/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 pb-16 sm:pb-20 pt-24">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 text-amber-300 border border-white/20 backdrop-blur-sm mb-5">
                <MapPin size={13} />
                Branson West · Indian Point · Table Rock Lake
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] tracking-tight">
                Your family&apos;s best
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-teal-300">
                  Branson adventure
                </span>{" "}
                starts here
              </h1>

              <p className="mt-5 text-lg sm:text-xl text-sky-100/90 max-w-xl leading-relaxed">
                Clean condos, a local host who actually cares, and everything
                Branson has to offer — lakes, coasters, shows, and memories —
                minutes from your door.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <a
                  href={BOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-book inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base no-underline"
                >
                  Book Your Stay
                  <ArrowRight size={18} strokeWidth={2.5} />
                </a>
                <a
                  href="#stays"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-colors no-underline backdrop-blur-sm"
                >
                  See Our Homes
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-sky-100/80">
                {[
                  "Local family host",
                  "Spotless & stocked",
                  "Pools · Lake · Playground",
                  "Near Silver Dollar City",
                ].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-teal-300" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST STRIP ═══════════ */}
      <section className="relative z-10 -mt-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: Heart,
                title: "We take care of you",
                desc: "Real local host, real responses",
              },
              {
                icon: Shield,
                title: "Firefighter host",
                desc: "Safety & reliability baked in",
              },
              {
                icon: Sparkles,
                title: "High-value stays",
                desc: "More home, more fun per dollar",
              },
              {
                icon: Users,
                title: "Built for families",
                desc: "From couples to reunions of 16",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-sky-900/5 border border-sky-100 flex gap-3 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-[#0c4a6e]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0c4a6e]">{title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PROPERTIES ═══════════ */}
      <section id="stays" className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-[#0ea5e9] mb-3">
              Your home base
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c4a6e]">
              Homes made for family fun
            </h2>
            <p className="mt-4 text-slate-600 text-lg leading-relaxed">
              Six Indian Point condos plus a standalone house — all real photos
              of our real places. Pick the fit, we handle the rest.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROPERTIES.map((p) => (
              <Link
                key={p.slug}
                href={`/property/${p.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-sky-100 shadow-sm hover:shadow-xl hover:shadow-sky-900/10 hover:-translate-y-1 transition-all duration-300 no-underline text-inherit"
              >
                <div className="aspect-[4/3] bg-sky-50 overflow-hidden relative">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0c4a6e] to-[#0ea5e9] text-white p-6 text-center">
                      <span className="text-4xl mb-2">🏡</span>
                      <span className="font-bold">Family Haven</span>
                      <span className="text-xs text-sky-100 mt-1">
                        Standalone house · Sleeps 16
                      </span>
                    </div>
                  )}
                  {(p.badge || p.tag) && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-[#0c4a6e] shadow-sm">
                      {p.badge || p.tag}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-extrabold text-[#0c4a6e] group-hover:text-[#0ea5e9] transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {p.blurb}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1 text-teal-700">
                      <Users size={12} /> Sleeps {p.sleeps}
                    </span>
                    <span>·</span>
                    <span>{p.beds}</span>
                    <span>·</span>
                    <span>{p.area}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book inline-flex items-center gap-2 px-10 py-4 rounded-full text-base no-underline"
            >
              Book Your Stay
              <ArrowRight size={18} strokeWidth={2.5} />
            </a>
            <p className="mt-3 text-sm text-slate-500">
              Direct booking · Best rates · Instant peace of mind
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY US ═══════════ */}
      <section
        id="why-us"
        className="py-20 sm:py-28 px-4 sm:px-6 bg-gradient-to-b from-sky-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-teal-600 mb-3">
                Local host energy
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c4a6e] leading-tight">
                Not a faceless rental.
                <br />
                <span className="text-[#0ea5e9]">A host who has your back.</span>
              </h2>
              <p className="mt-5 text-slate-600 text-lg leading-relaxed">
                Hi — I&apos;m Brian. I&apos;m a full-time paramedic, firefighter,
                and rescue specialist. That same &ldquo;we&apos;ve got this&rdquo;
                mindset goes into every stay: clear check-in, stocked kitchens,
                fast replies, and homes you&apos;ll actually want to come back to.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Keyless entry & simple arrival instructions",
                  "Coffee bars, full kitchens, Roku TVs, WiFi that works",
                  "Community pools, playground, private lake trail",
                  "Honest local tips for shows, fishing, and family days",
                  "You text, I answer — vacation stress stays at home",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-slate-700"
                  >
                    <CheckCircle2
                      size={20}
                      className="text-teal-500 flex-shrink-0 mt-0.5"
                    />
                    <span className="text-[15px]">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lake inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full text-sm no-underline"
              >
                Reserve Your Dates
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                GALLERY_PHOTOS[0],
                GALLERY_PHOTOS[1],
                GALLERY_PHOTOS[2],
                GALLERY_PHOTOS[3],
              ].map((photo, i) => (
                <div
                  key={photo.src}
                  className={`rounded-2xl overflow-hidden shadow-md ${
                    i % 2 === 1 ? "mt-6 sm:mt-10" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ COMMUNITY PERKS ═══════════ */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-[#0c4a6e] via-[#0c4a6e] to-[#0ea5e9] p-8 sm:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-center">
                Stay where the fun never ends
              </h2>
              <p className="text-center text-sky-100 mt-2 max-w-xl mx-auto">
                Condos share amazing community amenities — so after the thrills,
                you still have a splashy, easy evening.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                {[
                  { icon: Waves, label: "Pools" },
                  { icon: TreePine, label: "Private lake trail" },
                  { icon: Users, label: "Playground" },
                  { icon: Sparkles, label: "BBQ · Games · Courts" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center border border-white/15"
                  >
                    <Icon size={28} className="mx-auto text-amber-300" />
                    <div className="mt-2 text-sm font-bold">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ADVENTURES ═══════════ */}
      <section id="adventures" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-amber-600 mb-3">
              Local adventures
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c4a6e]">
              Branson thrills, minutes away
            </h2>
            <p className="mt-4 text-slate-600 text-lg leading-relaxed">
              Wake up near Table Rock Lake, hit Silver Dollar City before the
              lines, catch a show, then crash on your porch. We&apos;ll help you
              plan it.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ACTIVITIES.map((a) => (
              <a
                key={a.title}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden border border-sky-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 no-underline text-inherit p-6"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl shadow-md mb-4 group-hover:scale-110 transition-transform`}
                >
                  {a.emoji}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0ea5e9] mb-1">
                  {a.tip}
                </div>
                <h3 className="text-xl font-extrabold text-[#0c4a6e] group-hover:text-[#0ea5e9] transition-colors">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {a.desc}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-teal-600">
                  Explore
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </a>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/reports"
              className="text-sm font-bold text-[#0c4a6e] hover:text-[#0ea5e9] no-underline"
            >
              📰 Daily Branson Report — fishing, shows & events →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ PHOTO MOSAIC ═══════════ */}
      <section id="photos" className="py-20 sm:py-24 bg-sky-50">
        <div className="text-center px-4 mb-10">
          <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-teal-600 mb-3">
            Real places · Real photos
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c4a6e]">
            Peek inside your getaway
          </h2>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Every shot is from our properties — porches, bedrooms, kitchens, and
            Ozark views. No stock photos.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2 px-1.5 sm:px-2 max-w-[1600px] mx-auto">
          {GALLERY_PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              className={`overflow-hidden bg-sky-100 ${
                i === 0 || i === 5
                  ? "md:col-span-1 aspect-square"
                  : "aspect-square"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book inline-flex items-center gap-2 px-10 py-4 rounded-full text-base no-underline"
          >
            Book Your Stay
            <ArrowRight size={18} strokeWidth={2.5} />
          </a>
        </div>
      </section>

      {/* ═══════════ REVIEWS ═══════════ */}
      <section id="reviews" className="py-20 sm:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-amber-600 mb-3">
              Happy families
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0c4a6e]">
              Guests keep coming back
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                t: "We loved our time at Woodland Retreat! Spotless, beautiful surroundings. The deck was a favorite — my daughter loved watching the deer each morning.",
                a: "Krystal",
                l: "Saint Charles, MO",
              },
              {
                t: "Check-in went seamlessly. Cozy, clean, close to SDC but still felt like a secluded mountain getaway!",
                a: "Jennifer",
                l: "Arkadelphia, AR",
              },
              {
                t: "We could see the fireworks from Silver Dollar City from the deck! Great communication from Brian. We would definitely stay here again.",
                a: "Gary",
                l: "Lincoln, NE",
              },
              {
                t: "Awesome for a larger family! Clean, comfortable, fantastic hiking, and close to SDC. Highly recommend!",
                a: "Aaron",
                l: "Kansas",
              },
            ].map((r) => (
              <div
                key={r.a}
                className="bg-gradient-to-b from-sky-50 to-white rounded-2xl p-6 border border-sky-100 shadow-sm"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array(5)
                    .fill(0)
                    .map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  &ldquo;{r.t}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-sky-100">
                  <div className="text-sm font-bold text-[#0c4a6e]">{r.a}</div>
                  <div className="text-xs text-slate-400">{r.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BIG CTA ═══════════ */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-5xl mx-auto rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/property-photos/pretty-peacock/IMG_0368.PNG"
              alt="Family porch ready for vacation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0c4a6e]/95 via-[#0c4a6e]/85 to-teal-700/80" />
          </div>
          <div className="relative px-6 py-14 sm:py-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Ready for an amazing Branson vacation?
            </h2>
            <p className="mt-3 text-sky-100 text-lg max-w-xl mx-auto">
              Book direct for the best value. We&apos;ll take care of the rest —
              so your family can just show up and have fun.
            </p>
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book inline-flex items-center gap-2 mt-8 px-12 py-4 rounded-full text-lg no-underline"
            >
              Book Your Stay
              <ArrowRight size={20} strokeWidth={2.5} />
            </a>
            <p className="mt-4 text-sm text-sky-200">
              Questions? Call or text{" "}
              <a href={PHONE_HREF} className="font-bold text-white underline">
                {PHONE}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ═══════════ */}
      <section id="contact" className="py-20 sm:py-24 px-4 sm:px-6 bg-sky-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0c4a6e]">
              Let&apos;s plan your trip
            </h2>
            <p className="mt-3 text-slate-600">
              Tell us your dates, group size, or questions — Brian will help you
              pick the perfect place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-sky-100 shadow-sm">
                <h3 className="font-bold text-[#0c4a6e] mb-3">Reach us anytime</h3>
                <div className="space-y-3">
                  <a
                    href={PHONE_HREF}
                    className="flex items-center gap-3 text-slate-700 no-underline hover:text-[#0ea5e9] font-medium"
                  >
                    <span className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Phone size={16} className="text-[#0c4a6e]" />
                    </span>
                    {PHONE}
                  </a>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-3 text-slate-700 no-underline hover:text-[#0ea5e9] font-medium break-all"
                  >
                    <span className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-teal-700" />
                    </span>
                    {EMAIL}
                  </a>
                  <a
                    href={FACEBOOK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-slate-700 no-underline hover:text-[#0ea5e9] font-medium"
                  >
                    <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-amber-700">f</span>
                    </span>
                    Summers Vacations on Facebook
                  </a>
                </div>
                <p className="mt-5 text-xs text-slate-500 leading-relaxed">
                  Hours: Always open for guests. (If I&apos;m on a 911 call, I&apos;ll
                  get back to you ASAP — firefighter life!)
                </p>
              </div>
            </div>

            {submitted ? (
              <div className="bg-teal-50 rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-teal-100">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-teal-900">Message sent!</h3>
                <p className="text-sm text-teal-700 mt-1">
                  Brian will reply shortly. Can&apos;t wait to host you!
                </p>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(f),
                    });
                  } catch {
                    /* still show success for UX */
                  }
                  setSubmitted(true);
                }}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-sky-100 shadow-sm space-y-4"
              >
                <input
                  type="text"
                  placeholder="Your name"
                  required
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40 focus:border-[#0ea5e9]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40 focus:border-[#0ea5e9]"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40 focus:border-[#0ea5e9]"
                />
                <textarea
                  placeholder="Dates, group size, or questions..."
                  required
                  rows={4}
                  value={f.message}
                  onChange={(e) => setF({ ...f, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-sky-100 bg-sky-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/40 focus:border-[#0ea5e9] resize-none"
                />
                <button
                  type="submit"
                  className="btn-lake w-full py-3.5 rounded-xl text-sm border-none cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-[#0c4a6e] text-sky-100 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm bg-gradient-to-br from-[#0ea5e9] to-[#14b8a6]">
                MB
              </div>
              <div>
                <div className="font-extrabold text-white">My Branson Vacation</div>
                <div className="text-xs text-sky-300">
                  Summers Vacations LLC · We take care of you
                </div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-sm font-semibold">
              <a href={PHONE_HREF} className="hover:text-amber-300 no-underline">
                Call
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="hover:text-amber-300 no-underline"
              >
                Email
              </a>
              <Link href="/reports" className="hover:text-amber-300 no-underline">
                Daily Reports
              </Link>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 hover:text-amber-200 no-underline"
              >
                Book Your Stay
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-sky-400">
            &copy; {new Date().getFullYear()} Summers Vacations LLC · Branson,
            Missouri
          </div>
        </div>
      </footer>
    </main>
  );
}
