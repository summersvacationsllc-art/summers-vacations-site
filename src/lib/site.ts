/** Shared site constants */

export const BOOK_URL = "https://notchcondos.guestybookings.com/";
export const PHONE = "314-565-0589";
export const PHONE_HREF = "tel:3145650589";
export const EMAIL = "summersvacationsllc@gmail.com";
export const FACEBOOK = "https://www.facebook.com/summersvacations/";

export type PropertyCard = {
  name: string;
  tag: string;
  sleeps: string;
  beds: string;
  area: string;
  slug: string;
  photo: string | null;
  blurb: string;
  badge?: string;
  /** Guesty booking site for this unit. Homepage pic + Book buttons go here. */
  bookUrl?: string;
  /** Public Airbnb listing URL. Leave "" until known — the button only renders when set. */
  airbnbUrl?: string;
  /** Public VRBO listing URL. Leave "" until known — the button only renders when set. */
  vrboUrl?: string;
  /**
   * COMING SOON flag — the single switch for a home that isn't bookable yet.
   * true  → "Coming Soon" banner/badges, no Book/Airbnb/VRBO links anywhere, only "Coming Soon — contact us".
   * Remove the line (or set false) to go live; also set bookUrl/airbnbUrl/vrboUrl at that point.
   */
  comingSoon?: boolean;
  /** Other names this home may carry in Guesty (title/nickname), so /api/listings maps it to this slug. */
  guestyAliases?: string[];
};

/** True while a home is flagged comingSoon in PROPERTIES (no booking links). */
export function isComingSoon(slug?: string | null): boolean {
  if (!slug) return false;
  return Boolean(PROPERTIES.find((p) => p.slug === slug)?.comingSoon);
}

export function bookingUrl(slug?: string | null): string {
  if (!slug) return BOOK_URL;
  return PROPERTIES.find((p) => p.slug === slug)?.bookUrl || BOOK_URL;
}

export type ChannelLinks = {
  /** Direct booking (Guesty booking site, or the main site fallback). Always set. */
  direct: string;
  airbnb?: string;
  vrbo?: string;
};

/** Where a guest can book this home. Empty/missing OTA URLs are omitted. */
export function channelLinks(slug?: string | null): ChannelLinks {
  const p = slug ? PROPERTIES.find((x) => x.slug === slug) : undefined;
  const clean = (u?: string) => (u && u.trim() ? u.trim() : undefined);
  return {
    direct: bookingUrl(slug),
    airbnb: clean(p?.airbnbUrl),
    vrbo: clean(p?.vrboUrl),
  };
}

/** Curated real property photos — paths must match files on disk in public/property-photos/. */
export const PROPERTIES: PropertyCard[] = [
  {
    name: "The Penthouse",
    tag: "Top Floor · Views",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "the-penthouse",
    photo: "/property-photos/penthouse/aaa-fall-porch.jpg",
    blurb: "Deck with mountain views and a cozy top-floor retreat.",
    bookUrl:
      "https://bransonpenthouse.guestybookings.com/en/properties?minOccupancy=1&adults=1",
    airbnbUrl: "https://www.airbnb.com/rooms/866812230966422815",
    vrboUrl: "https://www.vrbo.com/4922479",
  },
  {
    name: "Rustic Ozark Retreat",
    tag: "Cozy · Fireplace",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "rustic-ozark-retreat",
    photo: "/property-photos/rustic-ozark-retreat/aaa-fall-porch.jpg",
    blurb: "Porch overlooking the Ozarks — that mountain-getaway feel.",
    bookUrl:
      "https://rusticozarkretreat.guestybookings.com/en/properties?minOccupancy=1&adults=1",
    airbnbUrl: "https://www.airbnb.com/rooms/864359255098863365",
    vrboUrl: "https://www.vrbo.com/4922480",
  },
  {
    name: "Woodland Retreat",
    tag: "Family · Bunks",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "woodland-retreat",
    photo: "/property-photos/woodland-retreat/aaa-fall-living.jpg",
    blurb: "Kids love the bunk room. Parents love the open living space.",
    bookUrl:
      "https://woodlandretreat.guestybookings.com/en/properties?minOccupancy=1&adults=1",
    airbnbUrl: "https://www.airbnb.com/rooms/1287974404964958218",
    vrboUrl: "https://www.vrbo.com/4927502",
  },
  {
    name: "Double Condo",
    tag: "Best Value",
    sleeps: "12+",
    beds: "4BR",
    area: "Branson West",
    slug: "double-condo",
    photo: "/property-photos/double-condo/aaa-doublecondo.jpg",
    blurb: "Two units, two kitchens — reunions and big families done right.",
    badge: "🔥 Best Value",
    bookUrl: "https://notchcondos.guestybookings.com/properties/68eeb561cce11f00119cac37",
    airbnbUrl: "https://www.airbnb.com/rooms/1365192095570273110",
    vrboUrl: "https://www.vrbo.com/4922482",
  },
  {
    name: "Branson Family Haven",
    tag: "House · Groups",
    sleeps: "16",
    beds: "5BR · 4BA",
    area: "Indian Point",
    slug: "branson-family-haven",
    photo: "/property-photos/branson-family-haven/aaa-house.jpg",
    blurb: "Standalone 5BR house with yard, fire pit, and room for the whole crew.",
    badge: "🏡 House",
    bookUrl: "https://bransonfamilyhaven.guestybookings.com/",
    airbnbUrl: "https://www.airbnb.com/rooms/1622735625063665266",
    vrboUrl: "https://www.vrbo.com/5183812",
  },
  {
    name: "No-Stairs Condo",
    tag: "First Floor · Remodeled",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "scotts-unit",
    photo: "/property-photos/scotts-unit/aaa-living.jpg",
    blurb: "Fresh remodel, first-floor access — no stairs into the unit. About a mile from Silver Dollar City; 15–20 minutes from the shows.",
    badge: "✨ New",
    // Airbnb-only for now — primary Book buttons go to Airbnb until VRBO/direct are live
    bookUrl: "https://www.airbnb.com/rooms/1128338659082307697",
    airbnbUrl: "https://www.airbnb.com/rooms/1128338659082307697",
    vrboUrl: "",
  },
  {
    name: "Silver Dollar City Adventure Escape",
    tag: "Game Room · Bunk Room",
    sleeps: "14",
    beds: "4BR · 4BA",
    area: "Branson West",
    slug: "silver-dollar-city-adventure-escape",
    comingSoon: true, // ← flip to go live (then add bookUrl/airbnbUrl/vrboUrl below)
    photo: "/property-photos/silver-dollar-city-adventure-escape/aaa-bunk-game-room.jpg",
    blurb: "Game room with a classic Galaga arcade and foosball, plus a kids' bunk room. About a mile from Silver Dollar City; 15–20 minutes from the shows.",
    badge: "✨ New",
    // Not bookable yet: Airbnb listing is unlisted; no direct/VRBO link. Leave these empty while comingSoon.
    airbnbUrl: "",
    vrboUrl: "",
    guestyAliases: ["Klein's condo", "!NOT189", "Mile from the Magic", "Family Fun Retreat Near SDC Sleeps 14"],
  },
];

/** Real property photos for the mosaic / gallery strip (2–3 per property folder).
 *  `pos` = CSS object-position for the square/4:5 crops (keeps the subject in frame). */
export const GALLERY_PHOTOS: { src: string; alt: string; pos?: string }[] = [
  // Penthouse
  { src: "/property-photos/penthouse/aaa-fall-porch.jpg", alt: "Penthouse porch dressed for fall" },
  { src: "/property-photos/penthouse/aaa-fall-coffee.jpg", alt: "Coffee nook with fall garland", pos: "50% 20%" },
  { src: "/property-photos/penthouse/aaa-fall-living.jpg", alt: "Living room with fall pillows" },
  // Rustic Ozark
  { src: "/property-photos/rustic-ozark-retreat/aaa-fall-porch.jpg", alt: "Rustic porch dressed for fall" },
  { src: "/property-photos/rustic-ozark-retreat/aaa-fall-deck.jpg", alt: "Covered deck with fall garland" },
  { src: "/property-photos/rustic-ozark-retreat/aaa-fall-living.jpg", alt: "Living room with fall pillows" },
  // Woodland
  { src: "/property-photos/woodland-retreat/aaa-fall-deck.jpg", alt: "Woodland deck in the trees" },
  { src: "/property-photos/woodland-retreat/aaa-fall-living.jpg", alt: "Living room dressed for fall" },
  { src: "/property-photos/woodland-retreat/aaa-fall-kitchen.jpg", alt: "Kitchen with pumpkin-patch sign" },
  // Extra deck views (Penthouse + Rustic)
  { src: "/property-photos/penthouse/aaa-deck.jpeg", alt: "Penthouse deck with mountain views" },
  { src: "/property-photos/penthouse/aaa-fall-deck.jpg", alt: "Penthouse deck dressed for fall" },
  { src: "/property-photos/rustic-ozark-retreat/aaa-fall-deck.jpg", alt: "Rustic covered deck with fall garland" },
  // Double Condo
  { src: "/property-photos/double-condo/aaa-doublecondo.jpg", alt: "Double condo living area" },
  { src: "/property-photos/double-condo/0849C14C-3CDE-471E-9D7F-85A81FA21DD2_1_105_c.jpeg", alt: "Kitchen ready for groups" },
  { src: "/property-photos/double-condo/01FAF5EF-0304-4FC3-A02D-B31260D55472_1_105_c.jpeg", alt: "Spacious double condo suite" },
  // Branson Family Haven
  { src: "/property-photos/branson-family-haven/114C6EBF-D9C1-4E79-8777-DDB797DD6931_1_105_c.jpeg", alt: "Bright family living space" },
  { src: "/property-photos/branson-family-haven/DJI_0197.jpeg", alt: "Family Haven from above" },
  { src: "/property-photos/branson-family-haven/IMG_9172.jpeg", alt: "Haven living room" },
  // Scott's unit / No-Stairs Condo
  { src: "/property-photos/scotts-unit/aaa-living.jpg", alt: "No-Stairs Condo open living room" },
  { src: "/property-photos/scotts-unit/aaa-kitchen.jpg", alt: "Remodeled kitchen with island" },
  { src: "/property-photos/scotts-unit/aaa-living-deck.jpg", alt: "Living room looking out to the deck" },
  // Klein's condo / Silver Dollar City Adventure Escape
  { src: "/property-photos/silver-dollar-city-adventure-escape/04-gaming-zone-foosball.jpg", alt: "Gaming Zone with foosball" },
  { src: "/property-photos/silver-dollar-city-adventure-escape/01-bunk-game-room-cover.jpg", alt: "Bunk room meets game room, the kids' favorite hangout" },
  { src: "/property-photos/silver-dollar-city-adventure-escape/02-living-room-sectional.jpg", alt: "Living room with a big sectional" },
];

/** Adventure carousel — loaded from public/adventure-photos/manifest.json.
 *  Drop photos in public/adventure-photos/, update manifest.json with filenames and captions. */
export const ADVENTURE_PHOTOS: { src: string; label: string }[] = [];

export const ACTIVITIES = [
  {
    emoji: "🎢",
    title: "Silver Dollar City",
    desc: "World-class coasters, crafts, and festivals — minutes from our condos.",
    tip: "Minutes from Indian Point",
    href: "https://www.silverdollarcity.com/",
    color: "from-sky-500 to-teal-500",
  },
  {
    emoji: "🚤",
    title: "Table Rock Lake",
    desc: "Boating, swimming, pontoons, and sunsets that stop the whole family mid-sentence.",
    tip: "Indian Point access",
    href: "https://www.mostateparks.com/park/table-rock-state-park",
    color: "from-lake to-navy",
  },
  {
    emoji: "🎭",
    title: "Shows & Theaters",
    desc: "From Sight & Sound epics to country, comedy, and magic on the Strip.",
    tip: "Book seats early",
    href: "https://www.explorebranson.com/events-branson/shows/",
    color: "from-amber-500 to-orange-500",
  },
  {
    emoji: "🌲",
    title: "Dogwood Canyon",
    desc: "Trails, wildlife, tram rides, and pure Ozarks beauty for all ages.",
    tip: "Great half-day trip",
    href: "https://dogwoodcanyon.org/",
    color: "from-teal-500 to-emerald-600",
  },
  {
    emoji: "🎣",
    title: "Fishing Fun",
    desc: "Bass on Table Rock, trout on Taneycomo — or cast at our private lake.",
    tip: "Catch & release on-site",
    href: "https://mdc.mo.gov/fishing/fishing-prospects/areas/lake-taneycomo",
    color: "from-cyan-500 to-sky-600",
  },
  {
    emoji: "🛍️",
    title: "Branson Landing",
    desc: "Shopping, dining, fountains, and live entertainment along the waterfront.",
    tip: "Evening favorite",
    href: "https://www.explorebranson.com/",
    color: "from-violet-500 to-fuchsia-500",
  },
];
