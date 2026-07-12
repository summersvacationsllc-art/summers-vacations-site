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

/** Curated real property photos (local assets only — no stock). */
export const PROPERTIES: PropertyCard[] = [
  {
    name: "The Penthouse",
    tag: "Top Floor · Views",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "the-penthouse",
    photo:
      "/property-photos/penthouse/12E2EDDB-A38A-4D5A-B209-CBB1F9AD1830_1_105_c.jpeg",
    blurb: "Screened porch with mountain views and a cozy top-floor retreat.",
  },
  {
    name: "Rustic Ozark Retreat",
    tag: "Cozy · Fireplace",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "rustic-ozark-retreat",
    photo:
      "/property-photos/rustic-ozark-retreat/170A99D0-37F1-40D1-87E0-88172D6E6E1D_1_105_c.jpeg",
    blurb: "Ozark charm, electric fireplace, and that mountain-getaway feel.",
  },
  {
    name: "Woodland Retreat",
    tag: "Family · Bunks",
    sleeps: "6",
    beds: "2BR",
    area: "Branson West",
    slug: "woodland-retreat",
    photo:
      "/property-photos/woodland-retreat/2988F6CE-F08F-47A8-B37B-3369F82A636F_1_105_c.jpeg",
    blurb: "Kids love the bunk room. Parents love the open living space.",
  },
  {
    name: "Modern Charmer",
    tag: "Sleek · Updated",
    sleeps: "4",
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
    sleeps: "6",
    beds: "1BR",
    area: "Branson West",
    slug: "pretty-peacock",
    photo: "/property-photos/pretty-peacock/IMG_0368.PNG",
    blurb: "Ground-floor ease, porch hangouts, and zero stairs to worry about.",
  },
  {
    name: "Double Condo",
    tag: "Best Value",
    sleeps: "12+",
    beds: "4BR",
    area: "Branson West",
    slug: "double-condo",
    photo:
      "/property-photos/double-condo/0A6EF612-360C-46FD-AD00-F1FA8B459CDE_1_105_c.jpeg",
    blurb: "Two units, two kitchens — reunions and big families done right.",
    badge: "🔥 Best Value",
  },
  {
    name: "Branson Family Haven",
    tag: "House · Groups",
    sleeps: "16",
    beds: "3BR",
    area: "Branson",
    slug: "branson-family-haven",
    photo: null,
    blurb: "Standalone house with yard, fire pit, and room for the whole crew.",
    badge: "🏡 House",
  },
];

/** Real property photos for the mosaic / gallery strip. */
export const GALLERY_PHOTOS: { src: string; alt: string }[] = [
  {
    src: "/property-photos/penthouse/12E2EDDB-A38A-4D5A-B209-CBB1F9AD1830_1_105_c.jpeg",
    alt: "Screened porch overlooking the Ozarks",
  },
  {
    src: "/property-photos/pretty-peacock/IMG_0368.PNG",
    alt: "Family porch with turquoise chairs",
  },
  {
    src: "/property-photos/woodland-retreat/2988F6CE-F08F-47A8-B37B-3369F82A636F_1_105_c.jpeg",
    alt: "Open living and dining at Woodland Retreat",
  },
  {
    src: "/property-photos/penthouse/0FA8D7A4-80EC-456F-BB9E-23829038A59D_1_105_c.jpeg",
    alt: "Bright master bedroom with balcony access",
  },
  {
    src: "/property-photos/rustic-ozark-retreat/170A99D0-37F1-40D1-87E0-88172D6E6E1D_1_105_c.jpeg",
    alt: "Ozark hillside views from the property",
  },
  {
    src: "/property-photos/modern-charmer/1773378876798_JmrcRDaVzRXfXABYeOaFHq4aroXFHm67XTjlxz17.jpg",
    alt: "Modern Charmer bedroom",
  },
  {
    src: "/property-photos/double-condo/0A6EF612-360C-46FD-AD00-F1FA8B459CDE_1_105_c.jpeg",
    alt: "Sunny guest bedroom ready for family",
  },
  {
    src: "/property-photos/pretty-peacock/IMG_0370.PNG",
    alt: "Welcome entrance at Pretty Peacock",
  },
  {
    src: "/property-photos/woodland-retreat/1827C3E6-ED59-49E6-92A6-1D0EC7A6DC7F_1_105_c.jpeg",
    alt: "Full kitchen ready for family meals",
  },
  {
    src: "/property-photos/double-condo/0849C14C-3CDE-471E-9D7F-85A81FA21DD2_1_105_c.jpeg",
    alt: "Fully stocked kitchen cabinets",
  },
  {
    src: "/property-photos/pretty-peacock/IMG_0369.PNG",
    alt: "Covered porch hangout space",
  },
  {
    src: "/property-photos/penthouse/0A6EF612-360C-46FD-AD00-F1FA8B459CDE_1_105_c.jpeg",
    alt: "Comfortable bedroom with Table Rock Lake map art",
  },
];

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
    href: "https://www.explorebranson.com/outdoor/table-rock-lake",
    color: "from-lake to-navy",
  },
  {
    emoji: "🎭",
    title: "Shows & Theaters",
    desc: "From Sight & Sound epics to country, comedy, and magic on the Strip.",
    tip: "Book seats early",
    href: "https://www.explorebranson.com/",
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
    href: "https://www.explorebranson.com/outdoor/fishing",
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
