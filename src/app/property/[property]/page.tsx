"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { bookingUrl, isComingSoon, EMAIL, PHONE, PHONE_HREF } from "@/lib/site";
import { trackBookClick } from "@/lib/analytics";
import BookYourWay from "@/components/BookYourWay";

interface Photo {
  url: string;
  caption?: string;
}

const PHOTO_DIRS: Record<string, string> = {
  "the-penthouse": "penthouse",
  "rustic-ozark-retreat": "rustic-ozark-retreat",
  "woodland-retreat": "woodland-retreat",
  "double-condo": "double-condo",
  "branson-family-haven": "",
  "scotts-unit": "scotts-unit",
  "silver-dollar-city-adventure-escape": "silver-dollar-city-adventure-escape",
};

const KLEIN_DIR = "/property-photos/silver-dollar-city-adventure-escape";
const kp = (file: string, caption: string): Photo => ({ url: `${KLEIN_DIR}/${file}`, caption });

const PROPERTIES: Record<
  string,
  {
    name: string;
    tag: string;
    sleeps: string;
    beds: string;
    address: string;
    /** Short location for the header; defaults to "Branson West, MO". */
    location?: string;
    guestyId: string;
    emoji: string;
    desc: string;
    highlights: string[];
    amenities: string[];
    /** Hero background photo (optional). */
    heroPhoto?: string;
    /** Set false when the home has no guidebook yet (hides "Preview Guidebook"). */
    hasGuidebook?: boolean;
    /** "The Fun Stuff" photo highlight section near the top (optional). */
    fun?: { title: string; intro: string; photos: Photo[] };
    /** Longer "About this home" copy (optional). */
    about?: {
      intro: string[];
      groups: { title: string; items: string[] }[];
    };
    /** Bedroom-by-bedroom sleeping arrangements (optional). */
    sleeping?: { room: string; beds: string }[];
    /** Quick facts: size, check-in/out, hosts… (optional). */
    details?: { label: string; value: string }[];
    /** "Good to know" notes (optional). */
    goodToKnow?: { label: string; text: string }[];
    /** Curated local gallery, in display order (optional; otherwise fetched). */
    gallery?: Photo[];
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
    beds: "5BR · 4BA",
    address: "44 Timber Trace Ln, Branson, MO 65616",
    location: "Branson, MO",
    guestyId: "6993c5d31547001e711bc7ed",
    emoji: "🏡",
    desc: "A standalone 5-bedroom house with private yard, full kitchen, in-unit washer/dryer, gas BBQ grill, fire pit, and access to community pools and hot tub. The ultimate family gathering place.",
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
  "scotts-unit": {
    name: "No-Stairs Condo",
    tag: "✨ First Floor · Remodeled",
    sleeps: "6",
    beds: "2BR",
    address: "289 Notch Lane, Unit 6, Branson West, MO 65737",
    guestyId: "6abe3566a78519004a84f031",
    emoji: "🏠",
    desc: "Freshly remodeled first-floor condo — no stairs into the unit. Open living room, full kitchen, two bedrooms, community pool, and on-site fishing lake. About a mile from Silver Dollar City and 15–20 minutes from the shows.",
    highlights: [
      "First-floor — no stairs",
      "Fresh remodel",
      "Full kitchen",
      "Community pool",
      "On-site fishing lake",
      "~1 mile from Silver Dollar City",
      "15–20 minutes from shows",
    ],
    amenities: [
      "High-speed WiFi",
      "Full kitchen",
      "Smart TV",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
      "Coin laundry on property",
    ],
  },
  "silver-dollar-city-adventure-escape": {
    name: "Silver Dollar City Adventure Escape",
    tag: "New · Game Room · Bunk Room",
    sleeps: "14",
    beds: "4BR · 4BA",
    address: "189 Notch Ln #1, Notch Estates, Branson West, MO 65737",
    guestyId: "",
    emoji: "🕹️",
    desc: "Stay a mile from the magic! This Branson West townhouse is about 1 mile from Silver Dollar City and brings the fun indoors — a game room with a classic Galaga arcade game and foosball, a kids' bunk room, and room for up to 14. Branson's shows are about 15–20 minutes away.",
    heroPhoto: `${KLEIN_DIR}/aaa-gaming-zone.jpg`,
    hasGuidebook: false,
    highlights: [
      "Game room with classic Galaga arcade",
      "Foosball table",
      "Kids' bunk room with beanbags",
      "Sleeps 14 · 4 full baths",
      "~1 mile from Silver Dollar City",
      "15–20 minutes from Branson shows",
      "Deck tucked into the trees",
      "Large covered front patio",
    ],
    amenities: [
      "Galaga arcade game",
      "Foosball table",
      "Living room sectional",
      "Fully equipped kitchen",
      "Stainless appliances",
      "Coffee station",
      "Breakfast bar + dining table",
      "In-unit washer & dryer",
      "Deck with umbrella dining",
      "Covered front patio",
      "Catch-and-release pond",
      "Nature trail",
      "Playground",
      "Basketball court",
      "Picnic pavilions",
      "Seasonal community pool",
    ],
    fun: {
      title: "The Fun Stuff",
      intro: "A game room the kids will claim the minute you arrive — plus a pond, dock, and playground right in the neighborhood.",
      photos: [
        kp("03-arcade-tv-console.jpg", "Classic Galaga arcade game right next to the bunks"),
        kp("01-bunk-game-room-cover.jpg", "Bunk room meets game room, with comfy beanbags"),
        kp("04-gaming-zone-foosball.jpg", "Gaming Zone with foosball"),
        kp("23-bunk-room-wide-foosball.jpg", "Three bunk beds, foosball, and the arcade"),
        kp("25-bunk-beanbags.jpg", "Bunk room with comfy beanbag chairs"),
        kp("24-foosball-closeup.jpg", "Foosball face-off, anyone?"),
        kp("26-bunks-nightstand.jpg", "Cozy bunks for kids and teens"),
        kp("27-lower-bunk-closeup.jpg", "Bunks made up and ready for the cousins"),
        kp("56-playground.jpg", "Notch Estates community playground"),
        kp("50-pond-dock-pavilion.jpg", "Catch-and-release pond with a covered dock"),
        kp("51-pond-pavilion-picnic.jpg", "Picnic table on the pond pavilion"),
      ],
    },
    about: {
      intro: [
        "Welcome to your Branson West family basecamp, just a mile from the magic! You're about 1 mile from Silver Dollar City, so park days start fast, and Branson's shows are about 15–20 minutes away for an easy evening out.",
        "Inside, this 4-bedroom, 4-bath townhouse is made for families and groups who want to stay together: a game room the kids will claim the minute you arrive, a bunk room for cousins and friends, and comfy living spaces where everyone can regroup after a day exploring the Ozarks.",
      ],
      groups: [
        {
          title: "Game Room & Bunk Room",
          items: [
            "Classic Galaga arcade game and a foosball table",
            "Three bunk beds plus beanbag chairs",
          ],
        },
        {
          title: "Living Room",
          items: [
            "Big sectional for movie nights",
            "Open to the kitchen and dining area, with doors to the deck",
          ],
        },
        {
          title: "Kitchen & Dining",
          items: [
            "Fully equipped kitchen with stainless steel appliances",
            "Plenty of counter space for cooking for a crowd",
            "Coffee station",
            "Breakfast bar seating and a dining table for family meals",
          ],
        },
        {
          title: "Outdoor Space",
          items: [
            "Deck with umbrella dining, tucked into the trees",
            "Large covered front patio",
          ],
        },
        {
          title: "Notch Estates Community",
          items: [
            "Catch-and-release pond with a covered dock (a bit of a hike, but worth it!)",
            "Nature trail, playground, basketball court, and picnic pavilions",
            "Seasonal community pool (closed for the season)",
          ],
        },
      ],
    },
    sleeping: [
      { room: "Bedroom 1", beds: "King bed" },
      { room: "Bedroom 2", beds: "Queen bed" },
      { room: "Bedroom 3", beds: "Two queen beds" },
      { room: "Bedroom 4 (bunk room)", beds: "Three bunk beds" },
      { room: "Bathrooms", beds: "4 full baths" },
      { room: "Laundry", beds: "In-unit washer & dryer" },
    ],
    details: [
      { label: "Home", value: "Townhouse in Notch Estates, Branson West, MO" },
      { label: "Size", value: "2,000 sq ft — 1,200 sq ft main level + 800 sq ft finished lower level" },
      { label: "Sleeps", value: "14 · 4 bedrooms · 4 full baths" },
      { label: "Check-in", value: "4:00 PM" },
      { label: "Checkout", value: "10:00 AM" },
      { label: "Your hosts", value: "Brian & Chantel Summers" },
    ],
    goodToKnow: [
      { label: "Parking", text: "Parking is available in front of the unit." },
      { label: "Trash", text: "Take all trash out to the dumpster." },
    ],
    gallery: [
      // Indoor: game room & bunk room
      kp("04-gaming-zone-foosball.jpg", "Gaming Zone with foosball"),
      kp("03-arcade-tv-console.jpg", "Classic Galaga arcade game right next to the bunks"),
      kp("01-bunk-game-room-cover.jpg", "Bunk room meets game room, the kids' favorite hangout"),
      kp("23-bunk-room-wide-foosball.jpg", "Bunk room: three bunk beds, foosball and arcade"),
      kp("25-bunk-beanbags.jpg", "Bunk room with comfy beanbag chairs"),
      kp("26-bunks-nightstand.jpg", "Cozy bunks for kids and teens"),
      kp("27-lower-bunk-closeup.jpg", "Bunks made up and ready for the cousins"),
      kp("24-foosball-closeup.jpg", "Foosball face-off, anyone?"),
      // Living
      kp("02-living-room-sectional.jpg", "Living room with a big sectional and doors to the deck"),
      kp("07-open-living-to-dining.jpg", "Open living room flowing into dining and kitchen"),
      kp("42-living-wide-to-kitchen.jpg", "Living room open to dining and kitchen"),
      kp("45-leather-sofa.jpg", "Comfy sofa by the deck doors"),
      // Kitchen & dining
      kp("08-kitchen-stainless.jpg", "Kitchen with stainless steel appliances"),
      kp("09-kitchen-range-angle.jpg", "Plenty of counter space for cooking for a crowd"),
      kp("43-kitchen-entry-hall.jpg", "Kitchen just off the entry hall"),
      kp("44-coffee-station.jpg", "Coffee station"),
      kp("11-breakfast-bar.jpg", "Breakfast bar seating"),
      kp("10-dining-table.jpg", "Dining table for family meals"),
      // Bedrooms
      kp("12-king-deck-doors.jpg", "Bedroom 1: king bed with doors to the deck"),
      kp("19-king-dresser-tv.jpg", "Bedroom 1: king bed and dresser"),
      kp("21-king-toward-doors.jpg", "Bedroom 1 with access to the deck"),
      kp("20-king-headboard-detail.jpg", "Bedroom 1: relax and recharge"),
      kp("16-queen-bed.jpg", "Bedroom 2: queen bed"),
      kp("22-queen-alt-tv.jpg", "Bedroom 2: queen bed"),
      kp("17-queen-detail.jpg", "Soft linens and fresh towels, ready when you arrive"),
      kp("14-two-queens-wide.jpg", "Bedroom 3: two queen beds and room to spread out"),
      kp("15-two-queens-angle.jpg", "Bedroom 3: two queen beds"),
      kp("18-sitting-nook-wetbar.jpg", "Bedroom 3 sitting area with a round table"),
      // Bathrooms & laundry
      kp("28-bath-1-walkin-shower.jpg", "Bathroom 1 with walk-in shower"),
      kp("29-bath-2-vanity.jpg", "Bathroom 2 vanity"),
      kp("30-bath-2-tub-shower.jpg", "Bathroom 2 tub/shower combo"),
      kp("31-bath-3-vanity.jpg", "Bathroom 3 vanity"),
      kp("32-bath-3-tub-shower.jpg", "Bathroom 3 tub/shower combo"),
      kp("33-bath-4-vanity.jpg", "Bathroom 4 vanity"),
      kp("34-bath-4-tub-shower.jpg", "Bathroom 4 tub/shower combo"),
      kp("35-laundry.jpg", "In-unit washer and dryer"),
      kp("46-desk-hello-vignette.jpg", "A warm hello waiting for you"),
      // Outdoor
      kp("05-deck-dining-umbrella.jpg", "Deck dining under the umbrella, tucked into the trees"),
      kp("36-deck-seating-view.jpg", "Deck seating with a treetop view"),
      kp("37-deck-dining-wide.jpg", "Spacious deck with outdoor dining for the crew"),
      kp("38-deck-adirondacks.jpg", "Adirondack chairs on the deck"),
      kp("39-covered-front-patio.jpg", "Large covered front patio"),
      kp("41-covered-walkway-parking.jpg", "Covered walkway with Adirondack chairs"),
      kp("13-front-exterior.jpg", "Your Branson West townhouse with its big covered patio"),
      // Notch Estates community
      kp("48-notch-estates-sign.jpg", "Welcome to Notch Estates, about 1 mile from Silver Dollar City"),
      kp("47-aerial-notch-estates.jpg", "Wooded Notch Estates from above, in Branson West"),
      kp("50-pond-dock-pavilion.jpg", "Catch-and-release pond with covered dock (a hike, but worth it!)"),
      kp("51-pond-pavilion-picnic.jpg", "Picnic table on the pond pavilion"),
      kp("52-pond-water-view.jpg", "Peaceful pond views in Notch Estates"),
      kp("57-nature-trail-sign.jpg", "Nature trail right on the property"),
      kp("56-playground.jpg", "Community playground"),
      kp("53-community-grill-pavilion.jpg", "Community picnic pavilion"),
      kp("58-covered-picnic-pavilion.jpg", "Covered community picnic pavilion"),
      kp("59-basketball-court.jpg", "Community basketball court"),
      // Seasonal pool (last)
      kp("54-pool-loungers.jpg", "Seasonal community pool (closed for the season)"),
      kp("55-pool-alt.jpg", "Seasonal community pool with loungers"),
    ],
  },
};

export default function PropertyPage() {
  const params = useParams();
  const slug = (params?.property as string) || "";
  const data = PROPERTIES[slug];
  const [photos, setPhotos] = useState<Photo[]>(() => data?.gallery ?? []);
  const bookHref = bookingUrl(slug);
  // Driven by the single `comingSoon` flag on the home in src/lib/site.ts PROPERTIES.
  const comingSoon = isComingSoon(slug);
  const contactHref = "/#contact";

  useEffect(() => {
    if (!data || data.gallery?.length) return;
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
            </div>

            {/* Book your way (Airbnb / VRBO) — top-right on desktop, under direct on mobile */}
            <div className="flex lg:justify-end">
              {data.heroPhoto ? (
                <figure className="relative w-full max-w-xl m-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/30 border-4 border-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.heroPhoto}
                    alt={`${data.name}: Gaming Zone game room with foosball`}
                    className="w-full aspect-[3/2] object-cover"
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

      {data.fun && (
        <section className="py-12 sm:py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <span className="inline-block text-xs font-extrabold tracking-widest uppercase text-[#0ea5e9] mb-2">
              Game on
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0c4a6e]">
              {data.fun.title}
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl leading-relaxed">{data.fun.intro}</p>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.fun.photos.map((p, i) => (
                <figure
                  key={p.url}
                  className={`relative rounded-2xl overflow-hidden bg-sky-100 m-0 ${
                    i < 3 ? "md:col-span-2" : ""
                  } ${i === 0 ? "md:row-span-2" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.caption || `${data.name} photo`}
                    className="w-full h-full object-cover"
                    style={{ minHeight: i === 0 ? 380 : 180 }}
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                  {p.caption && (
                    <figcaption className="absolute bottom-0 inset-x-0 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-t from-black/70 to-transparent">
                      {p.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
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
              {data.about.intro.map((para) => (
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

      {!data.fun && photos.length > 0 && (
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

      {data.fun && photos.length > 0 && (
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
                    title={p.caption}
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
