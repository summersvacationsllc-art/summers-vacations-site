"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Users,
  DoorOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { BOOK_URL, PHONE, PHONE_HREF } from "@/lib/site";

interface Photo {
  url: string;
  caption?: string;
}

const PHOTO_DIRS: Record<string, string> = {
  "the-penthouse": "penthouse",
  "rustic-ozark-retreat": "rustic-ozark-retreat",
  "woodland-retreat": "woodland-retreat",
  "modern-charmer": "modern-charmer",
  "pretty-peacock": "pretty-peacock",
  "double-condo": "double-condo",
  "branson-family-haven": "",
};

const PROPERTIES: Record<
  string,
  {
    name: string;
    tag: string;
    sleeps: string;
    beds: string;
    address: string;
    guestyId: string;
    emoji: string;
    desc: string;
    highlights: string[];
    amenities: string[];
  }
> = {
  "the-penthouse": {
    name: "The Penthouse",
    tag: "Top Floor · Views",
    sleeps: "6",
    beds: "2BR",
    address: "550 Notch Ln, Building 9, Unit 11, Branson West, MO 65737",
    guestyId: "68eeb58d873b002c39d38657",
    emoji: "🏠",
    desc: "Our top-floor penthouse features a stunning screened porch with mountain views, a cozy electric fireplace, Keurig coffee bar, and luxury finishes throughout. Perfect for couples or small families.",
    highlights: [
      "Top-floor views",
      "Electric fireplace",
      "Keurig K-Duo Plus",
      "Aroma 360 diffuser",
      "Water filter system",
      "Roku Smart TV",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Keurig coffee bar",
      "Electric fireplace",
      "Roku Smart TV",
      "Aroma 360",
      "Water filter",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "rustic-ozark-retreat": {
    name: "Rustic Ozark Retreat",
    tag: "Cozy · Fireplace",
    sleeps: "6",
    beds: "2BR",
    address: "550 Notch Ln, Building 9, Unit 7, Branson West, MO 65737",
    guestyId: "68eeb5866f48002c3d470a6c",
    emoji: "🌲",
    desc: "Cozy mountain vibes with an electric fireplace, Keurig coffee bar, smart thermostat, and rustic decor. The perfect Ozark retreat after a day of adventure.",
    highlights: [
      "Cozy mountain vibe",
      "Electric fireplace",
      "Keurig K-Duo Plus",
      "Ecobee Smart Thermostat",
      "Roku Smart TV",
      "Coffee bar",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Keurig coffee bar",
      "Electric fireplace",
      "Roku Smart TV",
      "Smart thermostat",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "woodland-retreat": {
    name: "Woodland Retreat",
    tag: "Family · Bunk Room",
    sleeps: "6",
    beds: "2BR",
    address: "499 Notch Ln, Building 14, Unit 6, Branson West, MO 65737",
    guestyId: "68eecd33a359002c338a2a55",
    emoji: "🌳",
    desc: "Great for families! Features a bunk room kids will love, Mr. Coffee maker, games, and an electric fireplace. Surrounded by trees with a peaceful woodland feel.",
    highlights: [
      "Bunk beds for kids",
      "Mr. Coffee maker",
      "Electric fireplace",
      "Board games",
      "Roku Smart TV",
      "Family-friendly",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Mr. Coffee maker",
      "Electric fireplace",
      "Roku Smart TV",
      "Bunk beds",
      "Games",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "modern-charmer": {
    name: "Modern Charmer",
    tag: "Sleek · Updated",
    sleeps: "4",
    beds: "1BR",
    address: "550 Notch Lane, Unit 8, Branson West, MO 65737",
    guestyId: "696679519399002c92ac4ec4",
    emoji: "✨",
    desc: "Sleek and updated with modern finishes, coffee bar, Pack 'n Play for little ones, and a 6-device charging station. Queen sleeper sofa in the family room.",
    highlights: [
      "Sleek modern finishes",
      "Coffee bar",
      "Pack 'n Play",
      "6-device charging station",
      "Queen sleeper sofa",
      "Roku Smart TV",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Coffee bar",
      "Electric fireplace",
      "Roku Smart TV",
      "Pack 'n Play",
      "Charging station",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "pretty-peacock": {
    name: "Pretty Peacock",
    tag: "No Steps · Easy Access",
    sleeps: "6",
    beds: "1BR",
    address: "289 Notch Lane, Building 19, Unit 1, Branson West, MO 65737",
    guestyId: "699911d27b1a001efccbf235",
    emoji: "🦚",
    desc: "Bottom floor unit with zero steps — easy access for everyone. Coffee bar, Pack 'n Play, charging station, games, and electric fireplace. Perfect for guests who prefer no stairs.",
    highlights: [
      "No steps — ground floor",
      "Coffee bar",
      "Pack 'n Play",
      "Charging station",
      "Electric fireplace",
      "Games & Roku TV",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Coffee bar",
      "Electric fireplace",
      "Roku Smart TV",
      "Pack 'n Play",
      "Charging station",
      "Games",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "double-condo": {
    name: "Double Condo",
    tag: "🔥 Best Value",
    sleeps: "12+",
    beds: "4BR",
    address: "550 Notch Ln, Building 9, Units 7 & 11, Branson West, MO 65737",
    guestyId: "68eeb561cce1002c364dfb89",
    emoji: "🏢",
    desc: "Two units combined — The Penthouse + Rustic Ozark Retreat. Sleeps 12+ across 4 bedrooms. Perfect for large families, reunions, or groups traveling together. Two full kitchens, two coffee bars, two fireplaces.",
    highlights: [
      "Two full units combined",
      "Sleeps 12+ guests",
      "Two full kitchens",
      "Two coffee bars",
      "Two electric fireplaces",
      "Best value for groups",
    ],
    amenities: [
      "High-speed WiFi",
      "Two full kitchens",
      "Two Keurig coffee bars",
      "Two electric fireplaces",
      "Roku Smart TVs",
      "Aroma 360",
      "Water filter",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
    ],
  },
  "branson-family-haven": {
    name: "Branson Family Haven",
    tag: "🏡 Standalone House",
    sleeps: "16",
    beds: "3BR",
    address: "44 Timber Trace Lane, Branson, MO 65616",
    guestyId: "6993c5d31547001e711bc7ed",
    emoji: "🏡",
    desc: "A standalone 3-bedroom house with private yard, full kitchen, in-unit washer/dryer, gas BBQ grill, fire pit, and access to community pools and hot tub. The ultimate family gathering place.",
    highlights: [
      "Standalone house",
      "Private yard",
      "In-unit washer & dryer",
      "Gas BBQ grill",
      "Fire pit",
      "2 pools + hot tub",
      "Boat parking",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen with Whirlpool range",
      "Dishwasher",
      "Microwave",
      "In-unit washer & dryer",
      "Roku Smart TV",
      "Gas BBQ grill",
      "Fire pit",
      "2 community pools",
      "Hot tub",
      "Playground",
      "Boat & trailer parking",
      "Games",
    ],
  },
};

export default function PropertyPage() {
  const params = useParams();
  const slug = (params?.property as string) || "";
  const [photos, setPhotos] = useState<Photo[]>([]);
  const data = PROPERTIES[slug];

  useEffect(() => {
    if (!data) return;
    const dir = PHOTO_DIRS[slug];
    (async () => {
      // Prefer local real property photos
      if (dir) {
        try {
          const r = await fetch(`/api/property-photos?slug=${dir}`);
          const d = await r.json();
          if (d.ok && d.photos?.length) {
            setPhotos(d.photos.map((url: string) => ({ url })));
            return;
          }
        } catch {
          /* fall through */
        }
      }
      // Fallback to Guesty if available
      if (data.guestyId) {
        try {
          const r = await fetch(`/api/photos?listingId=${data.guestyId}`);
          const d = await r.json();
          if (d.ok && d.photos?.length) setPhotos(d.photos.slice(0, 8));
        } catch {
          /* ignore */
        }
      }
    })();
  }, [data, slug]);

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
          <a
            href={BOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book text-xs px-5 py-2.5 rounded-full no-underline inline-flex items-center gap-1.5"
          >
            Book Your Stay
            <ArrowRight size={14} strokeWidth={2.5} />
          </a>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#0c4a6e] to-[#0ea5e9]">
        <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-amber-300 border border-white/20 mb-4">
              {data.emoji} {data.tag}
            </span>
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
                <MapPin size={16} /> Branson West, MO
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-book inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm no-underline"
              >
                Book Your Stay
                <ArrowRight size={16} strokeWidth={2.5} />
              </a>
              <a
                href={`/guidebook/${slug}?code=demo&name=Guest`}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/30 text-white font-semibold text-sm no-underline hover:bg-white/10 transition-colors"
              >
                Preview Guidebook
              </a>
            </div>
          </div>
          <span className="absolute right-[-20px] bottom-[-40px] text-[200px] opacity-10 select-none">
            {data.emoji}
          </span>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="py-12 px-4 bg-sky-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display text-2xl font-bold text-[#0c4a6e] mb-6">
              Real photos of this home
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden bg-sky-100 ${
                    i === 0 ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption || `${data.name} photo`}
                    className="w-full h-full object-cover"
                    style={{ minHeight: i === 0 ? 360 : 180 }}
                    loading="lazy"
                  />
                </div>
              ))}
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

      <section className="py-16 px-4 bg-gradient-to-br from-amber-400 to-amber-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-[#0c4a6e]">
            Ready to book {data.name}?
          </h2>
          <p className="text-[#0c4a6e]/80 mt-2 font-medium">
            Book direct for the best rates — we take care of the rest.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full bg-[#0c4a6e] text-white text-sm font-bold no-underline hover:bg-[#0a3d5c] transition-colors inline-flex items-center gap-2"
            >
              Book Your Stay
              <ArrowRight size={16} />
            </a>
            <a
              href={PHONE_HREF}
              className="px-8 py-3.5 rounded-full bg-white/70 text-[#0c4a6e] text-sm font-bold no-underline hover:bg-white transition-all flex items-center gap-2"
            >
              <Phone size={16} /> Call {PHONE}
            </a>
          </div>
        </div>
      </section>

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
