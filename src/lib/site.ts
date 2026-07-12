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

/** Curated real property photos — paths must match files on disk in public/property-photos/. */
export const PROPERTIES: PropertyCard[] = [
  {
    name: "The Penthouse",
    tag: "Top Floor · Views",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "the-penthouse",
    photo: "/property-photos/penthouse/aaa-deck.jpeg",
    blurb: "Deck with mountain views and a cozy top-floor retreat.",
  },
  {
    name: "Rustic Ozark Retreat",
    tag: "Cozy · Fireplace",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "rustic-ozark-retreat",
    photo: "/property-photos/rustic-ozark-retreat/aaa-rusticporch.jpeg",
    blurb: "Porch overlooking the Ozarks — that mountain-getaway feel.",
  },
  {
    name: "Woodland Retreat",
    tag: "Family · Bunks",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "woodland-retreat",
    photo:
      "/property-photos/woodland-retreat/1827C3E6-ED59-49E6-92A6-1D0EC7A6DC7F_1_105_c.jpeg",
    blurb: "Kids love the bunk room. Parents love the open living space.",
  },
  {
    name: "Modern Charmer",
    tag: "Sleek · Updated",
    sleeps: "6+2",
    beds: "1BR",
    area: "Branson West",
    slug: "modern-charmer",
    photo:
      "/property-photos/modern-charmer/1773378876798_JmrcRDaVzRXfXABYeOaFHq4aroXFHm67XTjlxz17.jpg",
    blurb: "Fresh finishes, coffee bar, and perfect for couples or small crews.",
  },
  {
    name: "Pretty Peacock",
    tag: "No Steps · Easy",
    sleeps: "6+2",
    beds: "1BR",
    area: "Branson West",
    slug: "pretty-peacock",
    photo: "/property-photos/pretty-peacock/aaa-peacockporch.jpg",
    blurb: "Family porch with turquoise chairs — ground-floor ease.",
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
  },
  {
    name: "Branson Family Haven",
    tag: "House · Groups",
    sleeps: "16",
    beds: "5BR · 4BA",
    area: "Indian Point",
    slug: "branson-family-haven",
    photo:
      "/property-photos/branson-family-haven/114C6EBF-D9C1-4E79-8777-DDB797DD6931_1_105_c.jpeg",
    blurb: "Standalone 5BR house with yard, fire pit, and room for the whole crew.",
    badge: "🏡 House",
  },
];

/** Real property photos for the mosaic / gallery strip (2–3 per property folder). */
export const GALLERY_PHOTOS: { src: string; alt: string }[] = [
  // Penthouse
  { src: "/property-photos/penthouse/aaa-deck.jpeg", alt: "Deck with Ozark views" },
  { src: "/property-photos/penthouse/aaa-coffeebar.jpeg", alt: "Coffee bar ready for mornings" },
  { src: "/property-photos/penthouse/IMG_7909.jpeg", alt: "Bright penthouse living room" },
  // Rustic Ozark
  { src: "/property-photos/rustic-ozark-retreat/aaa-rusticporch.jpeg", alt: "Porch overlooking the Ozarks" },
  { src: "/property-photos/rustic-ozark-retreat/IMG_8094.jpeg", alt: "Cozy rustic living space" },
  { src: "/property-photos/rustic-ozark-retreat/IMG_8062.jpeg", alt: "Rustic Ozark bedroom" },
  // Woodland
  { src: "/property-photos/woodland-retreat/aaa-woodland-deck.jpeg", alt: "Woodland deck retreat" },
  { src: "/property-photos/woodland-retreat/aaa-woodland-living-room.jpeg", alt: "Open living and dining" },
  { src: "/property-photos/woodland-retreat/2988F6CE-F08F-47A8-B37B-3369F82A636F_1_105_c.jpeg", alt: "Family bunk room" },
  // Modern Charmer
  { src: "/property-photos/modern-charmer/Image 37.jpg", alt: "Sleek modern living room" },
  { src: "/property-photos/modern-charmer/Image 38.jpg", alt: "Modern Charmer kitchen" },
  { src: "/property-photos/modern-charmer/Image 62.jpg", alt: "Modern Charmer bedroom" },
  // Pretty Peacock
  { src: "/property-photos/pretty-peacock/aaa-peacockporch.jpg", alt: "Family porch with turquoise chairs" },
  { src: "/property-photos/pretty-peacock/Image 63.jpg", alt: "Bright and welcoming entry" },
  { src: "/property-photos/pretty-peacock/Image 66.jpg", alt: "Cozy Peacock living space" },
  // Double Condo
  { src: "/property-photos/double-condo/aaa-doublecondo.jpg", alt: "Double condo living area" },
  { src: "/property-photos/double-condo/0849C14C-3CDE-471E-9D7F-85A81FA21DD2_1_105_c.jpeg", alt: "Kitchen ready for groups" },
  { src: "/property-photos/double-condo/01FAF5EF-0304-4FC3-A02D-B31260D55472_1_105_c.jpeg", alt: "Spacious double condo suite" },
  // Branson Family Haven
  { src: "/property-photos/branson-family-haven/114C6EBF-D9C1-4E79-8777-DDB797DD6931_1_105_c.jpeg", alt: "Bright family living space" },
  { src: "/property-photos/branson-family-haven/DJI_0197.jpeg", alt: "Family Haven from above" },
  { src: "/property-photos/branson-family-haven/IMG_9172.jpeg", alt: "Haven living room" },
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
