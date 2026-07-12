/** Shared site constants */

export const BOOK_URL = "https://branson-condo.com";
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
};

/** Curated real property photos — fetched from /api/property-photos at runtime. */
export const PROPERTIES: PropertyCard[] = [
  {
    name: "The Penthouse",
    tag: "Top Floor · Views",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "the-penthouse",
    photo: null,
    blurb: "Screened porch with mountain views and a cozy top-floor retreat.",
  },
  {
    name: "Rustic Ozark Retreat",
    tag: "Cozy · Fireplace",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "rustic-ozark-retreat",
    photo: null,
    blurb: "Ozark charm, electric fireplace, and that mountain-getaway feel.",
  },
  {
    name: "Woodland Retreat",
    tag: "Family · Bunks",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "woodland-retreat",
    photo: null,
    blurb: "Kids love the bunk room. Parents love the open living space.",
  },
  {
    name: "Modern Charmer",
    tag: "Sleek · Updated",
    sleeps: "4",
    beds: "1BR",
    area: "Branson West",
    slug: "modern-charmer",
    photo: null,
    blurb: "Fresh finishes, coffee bar, and perfect for couples or small crews.",
  },
  {
    name: "Pretty Peacock",
    tag: "No Steps · Easy",
    sleeps: "6",
    beds: "1BR",
    area: "Branson West",
    slug: "pretty-peacock",
    photo: null,
    blurb: "Ground-floor ease, porch hangouts, and zero stairs to worry about.",
  },
  {
    name: "Double Condo",
    tag: "Best Value",
    sleeps: "12+",
    beds: "4BR",
    area: "Branson West",
    slug: "double-condo",
    photo: null,
    blurb: "Two units, two kitchens — reunions and big families done right.",
    badge: "🔥 Best Value",
  },
  {
    name: "Branson Family Haven",
    tag: "House · Groups",
    sleeps: "16",
    beds: "5BR · 4BA",
    area: "Indian Point",
    slug: "branson-family-haven",
    photo: null,
    blurb: "Standalone 5BR house with yard, fire pit, and room for the whole crew.",
    badge: "🏡 House",
  },
];

/** Gallery photos — populated at runtime from /api/property-photos, with SSR-safe fallback. */
export const GALLERY_PHOTOS: { src: string; alt: string }[] = [
  { src: "/property-photos/penthouse/011F73D2-6245-49FF-80B8-9BCC5537672B_1_105_c.jpeg", alt: "Summers Vacations property" },
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
