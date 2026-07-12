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
    photo:
      "/property-photos/branson-family-haven/3CAE200A-210A-4B6C-A553-EF5F1F1111E0_1_105_c.jpeg",
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

/** Adventure carousel — Branson-themed adventure photos that match captions */
export const ADVENTURE_PHOTOS = [
  { src: "https://images.unsplash.com/photo-1567095761054-7a6e89f70b3b?w=400&h=500&fit=crop&q=80", label: "Silver Dollar City Coasters" },
  { src: "https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=400&h=500&fit=crop&q=80", label: "Wildfire at SDC" },
  { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=500&fit=crop&q=80", label: "Zipline Through the Ozarks" },
  { src: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=500&fit=crop&q=80", label: "Go-Kart Family Racing" },
  { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop&q=80", label: "Table Rock Lake Beaches" },
  { src: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=500&fit=crop&q=80", label: "Taneycomo Trout Fishing" },
  { src: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=500&fit=crop&q=80", label: "Lake Taneycomo Diving" },
  { src: "https://images.unsplash.com/photo-1605040566590-6e9e97294e3c?w=400&h=500&fit=crop&q=80", label: "Mountain Coaster Thrills" },
  { src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=500&fit=crop&q=80", label: "Branson Dinner Shows" },
  { src: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=500&fit=crop&q=80", label: "Ozark Hiking Trails" },
  { src: "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=500&fit=crop&q=80", label: "Showboat Branson Belle" },
  { src: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=500&fit=crop&q=80", label: "SDC Night Fireworks" },
  { src: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=500&fit=crop&q=80", label: "Branson Landing Fun" },
  { src: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=400&h=500&fit=crop&q=80", label: "Mini Golf with the Family" },
  { src: "https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=400&h=500&fit=crop&q=80", label: "Water Skiing Table Rock" },
  { src: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=500&fit=crop&q=80", label: "Ozark Sunset Views" },
  { src: "https://images.unsplash.com/photo-1494783367193-149034c05e8f?w=400&h=500&fit=crop&q=80", label: "Scenic Ozark Byways" },
  { src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=500&fit=crop&q=80", label: "Branson Road Trip" },
  { src: "https://images.unsplash.com/photo-1513618827672-0a1e6e9423e8?w=400&h=500&fit=crop&q=80", label: "Sight & Sound Theatre" },
  { src: "https://images.unsplash.com/photo-1537565266759-34bbc16be345?w=400&h=500&fit=crop&q=80", label: "Community Pool Days" },
  { src: "https://images.unsplash.com/photo-1526491109672-74740652b963?w=400&h=500&fit=crop&q=80", label: "Live Music on the Strip" },
  { src: "https://images.unsplash.com/photo-1558904541-efa843b3b4df?w=400&h=500&fit=crop&q=80", label: "Dogwood Canyon Beauty" },
  { src: "https://images.unsplash.com/photo-1508182314993-09bdab4a0b55?w=400&h=500&fit=crop&q=80", label: "Kayaking Table Rock" },
  { src: "https://images.unsplash.com/photo-1532330393533-443990d51f10?w=400&h=500&fit=crop&q=80", label: "Summer Vacation Fun" },
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
