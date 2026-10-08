"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Users,
  DoorOpen,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Images,
} from "lucide-react";
import { bookingUrl, isComingSoon, EMAIL, PHONE, PHONE_HREF } from "@/lib/site";
import { trackBookClick } from "@/lib/analytics";
import BookYourWay from "@/components/BookYourWay";
import PropertyGallery, { photoDims } from "@/components/PropertyGallery";
import { PROPERTY_DETAILS } from "@/lib/property-details";

export default function PropertyPage() {
  const params = useParams();
  const slug = (params?.property as string) || "";
  const data = PROPERTY_DETAILS[slug];
  const bookHref = bookingUrl(slug);
  // Driven by the single `comingSoon` flag on the home in src/lib/site.ts PROPERTIES.
  const comingSoon = isComingSoon(slug);
  const contactHref = "/#contact";

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Property not found
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white bg-gradient-to-br from-[#0c4a6e] to-[#0ea5e9]">
              MB
            </div>
            <span className="text-sm font-bold text-[#0c4a6e]">
              My Branson Vacation
            </span>
          </Link>
          {comingSoon ? (
            <a
              href={contactHref}
              className="btn-book text-xs px-5 py-2.5 rounded-full no-underline inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Coming Soon — contact us</span>
              <span className="sm:hidden">Coming Soon</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </a>
          ) : (
          <a
            href={bookHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBookClick("direct", slug, "nav")}
            className="btn-book text-xs px-5 py-2.5 rounded-full no-underline inline-flex items-center gap-1.5"
          >
            Book Your Stay
            <ArrowRight size={14} strokeWidth={2.5} />
          </a>
          )}
        </div>
      </nav>

      {comingSoon && (
        <div
          role="status"
          className="bg-amber-400 text-[#0c4a6e] px-4 py-2.5 text-center text-sm font-semibold"
        >
          <span className="font-extrabold uppercase tracking-wide">Coming Soon</span>
          {" — "}
          {data.name} isn&apos;t open for booking yet.{" "}
          <a href={contactHref} className="underline font-bold text-[#0c4a6e]">
            Contact us
          </a>{" "}
          to plan a stay.
        </div>
      )}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#0c4a6e] to-[#0ea5e9]">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            {/* Direct booking block — top-left (stacks first on mobile) */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-amber-300 border border-white/20 mb-4">
                {data.emoji} {data.tag}
              </span>
              {comingSoon && (
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-400 text-[#0c4a6e] mb-4">
                  Coming Soon
                </span>
              )}
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                {data.name}
              </h1>
              <p className="mt-4 text-lg text-sky-100 max-w-xl leading-relaxed">
                {data.desc}
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 text-sky-100 text-sm">
                  <Users size={16} /> Sleeps {data.sleeps}
                </div>
                <div className="flex items-center gap-2 text-sky-100 text-sm">
                  <DoorOpen size={16} /> {data.beds}
                </div>
                <div className="flex items-center gap-2 text-sky-100 text-sm">
                  <MapPin size={16} /> {data.location || "Branson West, MO"}
                </div>
              </div>
              {comingSoon ? (
              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={contactHref}
                  className="btn-book inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm no-underline"
                >
                  Coming Soon — contact us
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
              </div>
              ) : (
              <div className="flex flex-wrap gap-3 mt-8">
                <a
                  href={bookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackBookClick("direct", slug, "hero")}
                  className="btn-book inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm no-underline"
                >
                  Book Your Stay
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
                {data.hasGuidebook !== false && (
                <a
                  href={`/guidebook/${slug}?code=demo&name=Guest`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm no-underline hover:bg-white/10 transition-colors"
                >
                  Preview Guidebook
                </a>
                )}
              </div>
              )}
              {comingSoon && (
                <>
                  <p className="mt-3 text-sm text-amber-200/95 font-medium">
                    Coming Soon — online booking isn&apos;t open yet. Call, text, or email us and we&apos;ll help you plan your stay.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                    <a
                      href={PHONE_HREF}
                      onClick={() => trackBookClick("phone", slug, "hero_booking_soon")}
                      className="inline-flex items-center gap-1.5 font-semibold text-white no-underline hover:text-amber-300"
                    >
                      <Phone size={14} /> {PHONE}
                    </a>
                    <a
                      href={`mailto:${EMAIL}?subject=${encodeURIComponent(`Question about ${data.name}`)}`}
                      onClick={() => trackBookClick("email", slug, "hero_booking_soon")}
                      className="inline-flex items-center gap-1.5 font-semibold text-white no-underline hover:text-amber-300"
                    >
                      <Mail size={14} /> Email us
                    </a>
                  </div>
                </>
              )}
              {slug === "scotts-unit" && (
                <p className="mt-3 text-sm text-amber-200/95 font-medium">
                  Coming soon to VRBO, direct booking, and other channels.
                </p>
              )}
              {data.gallery.length > 0 && (
                <a
                  href="#photos"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white no-underline hover:text-amber-300"
                >
                  <Images size={16} /> See all {data.gallery.length} photos
                </a>
              )}
            </div>

            {/* Book your way (Airbnb / VRBO) — top-right on desktop, under direct on mobile */}
            <div className="flex lg:justify-end">
              {data.heroPhoto ? (
                <figure className="relative w-full max-w-xl m-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border-4 border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.heroPhoto.url}
                    alt={data.heroPhoto.caption || data.name}
                    {...photoDims(data.heroPhoto.url)}
                    className="w-full h-auto aspect-[3/2] object-cover"
                    style={{ objectPosition: data.heroPhoto.pos || "center" }}
                    fetchPriority="high"
                  />
                  {comingSoon && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-amber-400 text-[#0c4a6e] shadow">
                      Coming Soon
                    </span>
                  )}
                </figure>
              ) : (
                <BookYourWay slug={slug} name={data.name} />
              )}
            </div>
          </div>
        </div>
        <span className="absolute right-[-20px] bottom-[-40px] text-[200px] opacity-10 select-none pointer-events-none" aria-hidden>
          {data.emoji}
        </span>
      </section>

      {data.featurePhoto && (
        <section className="pt-12 sm:pt-16 px-4 bg-white">
          <figure className="max-w-7xl mx-auto m-0">
            <div className="rounded-3xl overflow-hidden bg-sky-100 shadow-xl shadow-sky-900/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.featurePhoto.url}
                alt={data.featurePhoto.caption || `${data.name} photo`}
                {...photoDims(data.featurePhoto.url)}
                className="w-full h-auto aspect-[16/9] lg:aspect-[2/1] object-cover"
                style={{ objectPosition: data.featurePhoto.pos || "center" }}
              />
            </div>
            {data.featurePhoto.caption && (
              <figcaption className="mt-3 text-sm sm:text-base font-semibold text-[#0c4a6e]">
                {data.featurePhoto.caption}
              </figcaption>
            )}
          </figure>
        </section>
      )}

      {data.fun && (
        <section className="py-12 sm:py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-[#0ea5e9] mb-2">
              {data.fun.eyebrow || "Highlights"}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0c4a6e]">
              {data.fun.title}
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl leading-relaxed">{data.fun.intro}</p>
            <div className="mt-6">
              <PropertyGallery photos={data.fun.photos} name={data.name} variant="highlights" />
            </div>
          </div>
        </section>
      )}

      {data.about && (
        <section className="py-12 sm:py-16 px-4 bg-sky-50">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-4">
                About this home
              </h2>
              {data.about.intro?.map((para) => (
                <p key={para} className="text-slate-700 leading-relaxed mb-4">
                  {para}
                </p>
              ))}
              <div className="grid sm:grid-cols-2 gap-6 mt-6">
                {data.about.groups.map((g) => (
                  <div key={g.title}>
                    <h3 className="text-base font-extrabold text-[#0c4a6e] mb-2">{g.title}</h3>
                    <ul className="space-y-1.5 list-none p-0 m-0">
                      {g.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] mt-2 flex-shrink-0" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              {data.heroPhoto && !comingSoon && <BookYourWay slug={slug} name={data.name} />}
              {data.sleeping && (
                <div className="bg-white rounded-2xl border border-sky-100 p-5">
                  <h3 className="text-base font-extrabold text-[#0c4a6e] mb-3">Where everyone sleeps</h3>
                  <dl className="m-0 space-y-2">
                    {data.sleeping.map((r) => (
                      <div key={r.room} className="flex justify-between gap-3 text-sm">
                        <dt className="font-semibold text-slate-700">{r.room}</dt>
                        <dd className="m-0 text-slate-600 text-right">{r.beds}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {data.details && (
                <div className="bg-white rounded-2xl border border-sky-100 p-5">
                  <h3 className="text-base font-extrabold text-[#0c4a6e] mb-3">The details</h3>
                  <dl className="m-0 space-y-2">
                    {data.details.map((d) => (
                      <div key={d.label} className="text-sm">
                        <dt className="font-semibold text-slate-700">{d.label}</dt>
                        <dd className="m-0 text-slate-600">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-6">
              Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.highlights.map((h) => (
                <div
                  key={h}
                  className="flex items-center gap-2 bg-sky-50 rounded-xl px-4 py-3 border border-sky-100"
                >
                  <CheckCircle2 size={16} className="text-teal-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">{h}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-6">
              Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.amenities.map((a) => (
                <div
                  key={a}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" /> {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {data.goodToKnow && (
        <section className="pb-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-6">
              Good to know
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.goodToKnow.map((g) => (
                <div
                  key={g.label}
                  className="bg-sky-50 rounded-xl px-4 py-3 border border-sky-100"
                >
                  <p className="text-sm font-bold text-[#0c4a6e] m-0">{g.label}</p>
                  <p className="text-sm text-slate-700 mt-1 mb-0">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {data.gallery.length > 0 && (
        <section id="photos" className="py-12 sm:py-16 px-4 bg-sky-50 scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-1">
              Real photos of this home
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {data.gallery.length} photos · tap any photo to see it full-size
            </p>
            <PropertyGallery photos={data.gallery} name={data.name} />
          </div>
        </section>
      )}

      <footer className="py-8 px-4 bg-[#0c4a6e] text-center">
        <Link
          href="/#stays"
          className="text-sm text-sky-200 no-underline hover:text-amber-300"
        >
          ← Back to all stays
        </Link>
      </footer>
    </main>
  );
}
