export type MapCategory = "stay" | "eat" | "webcam" | "marina" | "attraction" | "show" | "golf" | "fish";

export type MapSpot = {
  id: string;
  name: string;
  venue: string;
  category: MapCategory;
  lat: number;
  lng: number;
  description: string;
  /** Official tickets / live cam / venue page */
  href: string;
  cta: string;
  /** Permalink on our site */
  ourPath: string;
  preview?: string;
};

export const MAP_CATEGORIES: {
  id: MapCategory | "all";
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: "all", label: "All", emoji: "🗺️", color: "#0ea5e9" },
  { id: "stay", label: "Our stays", emoji: "🏡", color: "#f59e0b" },
  { id: "eat", label: "Eat & drink", emoji: "🍽️", color: "#f97316" },
  { id: "webcam", label: "Live cams", emoji: "📹", color: "#22d3ee" },
  { id: "marina", label: "Marinas", emoji: "⚓", color: "#14b8a6" },
  { id: "attraction", label: "Attractions", emoji: "🎢", color: "#0ea5e9" },
  { id: "golf", label: "Golf", emoji: "⛳", color: "#16a34a" },
  { id: "fish", label: "Fishing", emoji: "🎣", color: "#0f766e" },
  { id: "show", label: "Shows", emoji: "🎭", color: "#38bdf8" },
];

export const MAP_CATEGORY_META: Record<
  MapCategory,
  { label: string; emoji: string; color: string }
> = {
  stay: { label: "Our stay", emoji: "🏡", color: "#f59e0b" },
  eat: { label: "Eat & drink", emoji: "🍽️", color: "#f97316" },
  webcam: { label: "Live cam", emoji: "📹", color: "#22d3ee" },
  marina: { label: "Marina", emoji: "⚓", color: "#14b8a6" },
  attraction: { label: "Attraction", emoji: "🎢", color: "#0ea5e9" },
  golf: { label: "Golf", emoji: "⛳", color: "#16a34a" },
  fish: { label: "Fishing", emoji: "🎣", color: "#0f766e" },
  show: { label: "Show", emoji: "🎭", color: "#38bdf8" },
};

export const BRANSON_MAP_SPOTS: MapSpot[] = [
  // ── Our stays (neighborhood only — never exact unit addresses) ──
  {
    id: "stays-branson-west",
    name: "Our Branson West condos",
    venue: "Notch Lane · Branson West",
    category: "stay",
    lat: 36.68554,
    lng: -93.3319,
    description:
      "Four condos on Notch Lane — Penthouse, Rustic Ozark, Woodland Retreat, and Double Condo. Pin is the street, not a door number.",
    href: "https://branson-condo.com/?utm_source=branson_map&utm_campaign=stays_west",
    cta: "Book these stays",
    ourPath: "/map?spot=stays-branson-west",
  },
  {
    id: "stays-indian-point",
    name: "Branson Family Haven",
    venue: "Timber Trace Lane · Indian Point",
    category: "stay",
    lat: 36.62888,
    lng: -93.34261,
    description:
      "Our 5-bedroom house on Timber Trace Lane — yard, fire pit, short hop to the lake and SDC. Pin is the street, not the driveway.",
    href: "https://branson-condo.com/?utm_source=branson_map&utm_campaign=stays_haven",
    cta: "Book this house",
    ourPath: "/map?spot=stays-indian-point",
  },

  // ── Webcams ──────────────────────────────────────────
  {
    id: "landing-cam",
    name: "Branson Landing Live Cam",
    venue: "Branson Landing · downtown waterfront",
    category: "webcam",
    lat: 36.64686,
    lng: -93.21525,
    description:
      "Check the Landing energy — shops, boardwalk, and the fountain show on Lake Taneycomo.",
    href: "https://bransonlanding.com/",
    cta: "Open Branson Landing",
    ourPath: "/map?spot=landing-cam",
  },
  {
    id: "chateau-cam",
    name: "Table Rock Lake from Chateau on the Lake",
    venue: "Chateau on the Lake · Hwy 265 bluff",
    category: "webcam",
    lat: 36.6142,
    lng: -93.2875,
    description:
      "Live look across Table Rock from the Chateau bluff — great for boat-day skies.",
    href: "https://www.ky3.com/page/table-rock-lake/",
    cta: "Watch live cam",
    ourPath: "/map?spot=chateau-cam",
    preview:
      "https://api.wetmet.net/widgets/image/frame.php?uid=a9899406a2d399521e491678a0e72c51&type=image&format=image.jpg",
  },
  {
    id: "strip-cam",
    name: "Branson 76 Country Boulevard Cam",
    venue: "The Strip · W 76 Country Blvd",
    category: "webcam",
    lat: 36.64035,
    lng: -93.24015,
    description:
      "KY3’s live look at the Strip — theaters, neon, and traffic before you head out.",
    href: "https://www.ky3.com/page/branson-highway-76-strip/",
    cta: "Watch live cam",
    ourPath: "/map?spot=strip-cam",
    preview:
      "https://api.wetmet.net/widgets/image/frame.php?uid=b693c644002650f965f6fff470025367&type=image&format=image.jpg",
  },
  {
    id: "kimberling-cam",
    name: "Kimberling City / Port of Kimberling Marina Cam",
    venue: "Port of Kimberling Marina · Kimberling City",
    category: "webcam",
    lat: 36.63501,
    lng: -93.41369,
    description:
      "Live marina view on the west side of Table Rock — slips, boats, and lake color.",
    href: "https://portofkimberlingmarina.com/live-cam/",
    cta: "Watch live cam",
    ourPath: "/map?spot=kimberling-cam",
    preview:
      "https://api.wetmet.net/widgets/image/frame.php?uid=b71e4ec47e8da62cc37c25a708a9a23d&type=image&format=image.jpg",
  },
  {
    id: "lake-lodge-cam",
    name: "Branson Lake Lodge Table Rock Lake Cam",
    venue: "Branson Lake Lodge · Chateau Mountain",
    category: "webcam",
    lat: 36.6185,
    lng: -93.282,
    description:
      "Wide live view southwest across Table Rock from Chateau Mountain.",
    href: "https://www.iplivecams.com/live-cams/branson-lake-lodge-chateau-mountain-branson-missouri-united-states/",
    cta: "Watch live cam",
    ourPath: "/map?spot=lake-lodge-cam",
  },

  // ── Marinas ──────────────────────────────────────────
  {
    id: "indian-point-marina",
    name: "Indian Point Marina",
    venue: "3443 Indian Point Rd · Table Rock Lake",
    category: "marina",
    lat: 36.6275,
    lng: -93.3085,
    description:
      "Closest full-service marina to our Indian Point house — rentals, slips, and a floating café.",
    href: "https://indianpointmarina.com/",
    cta: "Marina + rentals",
    ourPath: "/map?spot=indian-point-marina",
  },
  {
    id: "fall-creek-marina",
    name: "Fall Creek Marina",
    venue: "Fall Creek · Lake Taneycomo · trout water",
    category: "marina",
    lat: 36.6508,
    lng: -93.2185,
    description:
      "Taneycomo trout headquarters — guides, boats, and cold tailwater just below the dam.",
    href: "https://www.fallcreekrvcampground.com/",
    cta: "Trout + marina",
    ourPath: "/map?spot=fall-creek-marina",
  },
  {
    id: "lilleys-landing",
    name: "Lilley's Landing",
    venue: "Lilley's Landing Resort & Marina · Hwy 165",
    category: "marina",
    lat: 36.6522,
    lng: -93.2198,
    description:
      "Classic Taneycomo trout lodge and marina — wade, drift, or book a guide.",
    href: "https://lilleyslanding.com/",
    cta: "Marina + fishing",
    ourPath: "/map?spot=lilleys-landing",
  },
  {
    id: "moonshine-beach",
    name: "Moonshine Beach",
    venue: "Table Rock State Park · Hwy 165",
    category: "marina",
    lat: 36.5918,
    lng: -93.3088,
    description:
      "The swim beach families actually use — sand, picnic tables, and Table Rock water.",
    href: "https://mostateparks.com/park/table-rock-state-park",
    cta: "Park + beach info",
    ourPath: "/map?spot=moonshine-beach",
  },

  // ── Attractions ──────────────────────────────────────
  {
    id: "silver-dollar-city",
    name: "Silver Dollar City",
    venue: "399 Silver Dollar City Pkwy · Indian Point",
    category: "attraction",
    lat: 36.6675,
    lng: -93.3385,
    description:
      "Branson’s #1 park — coasters, crafts, and festivals, minutes from Indian Point.",
    href: "https://www.silverdollarcity.com/",
    cta: "Tickets & hours",
    ourPath: "/map?spot=silver-dollar-city",
  },
  {
    id: "titanic",
    name: "Titanic Museum Attraction",
    venue: "3235 W 76 Country Blvd",
    category: "attraction",
    lat: 36.63843,
    lng: -93.28003,
    description:
      "Walk the ship, touch an iceberg, and follow a real passenger story.",
    href: "https://www.titanicbranson.com/",
    cta: "Tickets",
    ourPath: "/map?spot=titanic",
  },
  {
    id: "wonderworks",
    name: "WonderWorks",
    venue: "3210 W 76 Country Blvd · the upside-down building",
    category: "attraction",
    lat: 36.6418,
    lng: -93.2785,
    description:
      "100+ hands-on science exhibits, ropes, and a storm-simulator — rainy-day gold.",
    href: "https://www.wonderworksbranson.com/",
    cta: "Tickets",
    ourPath: "/map?spot=wonderworks",
  },
  {
    id: "aquarium",
    name: "Aquarium at the Boardwalk",
    venue: "The Boardwalk · near The Track",
    category: "attraction",
    lat: 36.6414,
    lng: -93.2472,
    description:
      "Walk-through tunnel, stingrays, and jellyfish — easy add-on to a Strip afternoon.",
    href: "https://www.aquariumattheboardwalk.com/",
    cta: "Tickets",
    ourPath: "/map?spot=aquarium",
  },
  {
    id: "stampede",
    name: "Dolly Parton's Stampede",
    venue: "1525 W 76 Country Blvd",
    category: "attraction",
    lat: 36.64281,
    lng: -93.24656,
    description:
      "Dinner, horses, and a four-season arena show — book seats before the weekend.",
    href: "https://www.dpstampede.com/branson",
    cta: "Tickets",
    ourPath: "/map?spot=stampede",
  },
  {
    id: "showboat",
    name: "Showboat Branson Belle",
    venue: "White River Landing · Hwy 165",
    category: "attraction",
    lat: 36.5869,
    lng: -93.31714,
    description:
      "Paddlewheel cruise on Table Rock with dinner and a show — sunset sails go first.",
    href: "https://www.showboatbransonbelle.com/",
    cta: "Cruise tickets",
    ourPath: "/map?spot=showboat",
  },
  {
    id: "white-water",
    name: "White Water",
    venue: "3505 W 76 Country Blvd · SDC water park",
    category: "attraction",
    lat: 36.64376,
    lng: -93.28241,
    description:
      "Silver Dollar City’s water park on the Strip — slides, wave pool, kids’ area.",
    href: "https://www.silverdollarcity.com/white-water/",
    cta: "Tickets",
    ourPath: "/map?spot=white-water",
  },
  {
    id: "fritzs",
    name: "Fritz's Adventure",
    venue: "Fall Creek Rd · indoor adventure park",
    category: "attraction",
    lat: 36.64185,
    lng: -93.24572,
    description:
      "Giant indoor ropes, slides, and climbing — the rainy-day reset button.",
    href: "https://www.fritzsadventure.com/",
    cta: "Tickets",
    ourPath: "/map?spot=fritzs",
  },
  {
    id: "butterfly-palace",
    name: "The Butterfly Palace & Rainforest Adventure",
    venue: "4106 W 76 Country Blvd",
    category: "attraction",
    lat: 36.65397,
    lng: -93.29295,
    description:
      "Live butterflies, a mirror maze, and a calm indoor garden the kids can wander.",
    href: "https://www.thebutterflypalace.com/",
    cta: "Tickets",
    ourPath: "/map?spot=butterfly-palace",
  },
  {
    id: "promised-land-zoo",
    name: "Promised Land Zoo",
    venue: "Drive-thru safari · Promised Land Zoo Rd",
    category: "attraction",
    lat: 36.6485,
    lng: -93.2764,
    description:
      "Stay in the car for a drive-thru safari — camels, zebra, and a feed cup on the dash.",
    href: "https://promisedlandzoo.com/",
    cta: "Tickets",
    ourPath: "/map?spot=promised-land-zoo",
  },
  {
    id: "toy-museum",
    name: "World's Largest Toy Museum Complex",
    venue: "3609 W 76 Country Blvd",
    category: "attraction",
    lat: 36.64643,
    lng: -93.28747,
    description:
      "Rooms of vintage toys plus the toy store next door — easy 60–90 minutes.",
    href: "https://www.worldslargesttoymuseum.com/",
    cta: "Tickets",
    ourPath: "/map?spot=toy-museum",
  },
  {
    id: "scenic-railway",
    name: "Branson Scenic Railway",
    venue: "Historic depot · 206 E Main St",
    category: "attraction",
    lat: 36.64364,
    lng: -93.21488,
    description:
      "Vintage train out of downtown through the Ozark hills — morning and afternoon runs.",
    href: "https://www.bransontrain.com/",
    cta: "Tickets",
    ourPath: "/map?spot=scenic-railway",
  },
  {
    id: "dogwood-canyon",
    name: "Dogwood Canyon Nature Park",
    venue: "2038 W State Hwy 86 · Lampe",
    category: "attraction",
    lat: 36.5465,
    lng: -93.326,
    description:
      "Waterfalls, bison, trout streams, and tram tours — a half-day that feels like a week.",
    href: "https://dogwoodcanyon.org/",
    cta: "Tickets & tours",
    ourPath: "/map?spot=dogwood-canyon",
  },

  // ── Shows ────────────────────────────────────────────
  {
    id: "dean-z",
    name: "Dean Z",
    venue: "Clay Cooper Theatre · 3216 W 76 Country Blvd",
    category: "show",
    lat: 36.63768,
    lng: -93.27964,
    description:
      "The Ultimate Elvis — voice, jumpsuits, and a full band at Clay Cooper Theatre.",
    href: "https://www.claycoopertheatre.com/dean-z",
    cta: "Tickets",
    ourPath: "/map?spot=dean-z",
  },
  {
    id: "revibe",
    name: "Re-Vibe (Rea's)",
    venue: "Hughes Brothers Theatre · 3425 W 76 Country Blvd",
    category: "show",
    lat: 36.64046,
    lng: -93.28431,
    description:
      "The new Hughes Brothers dinner show — pop, jazz, and country where Rea's fans landed.",
    href: "https://hughesentertainmentinc.com/revibe/",
    cta: "Tickets",
    ourPath: "/map?spot=revibe",
  },
  {
    id: "anthems",
    name: "Anthems of Rock",
    venue: "King's Castle Theatre · 2701 W 76 Country Blvd",
    category: "show",
    lat: 36.64044,
    lng: -93.26808,
    description:
      "Wall-of-sound rock tribute on the Strip — Queen, Journey, and the big choruses.",
    href: "https://www.kingscastletheatre.com/",
    cta: "Tickets",
    ourPath: "/map?spot=anthems",
  },
  {
    id: "haygoods",
    name: "The Haygoods",
    venue: "Andy Williams Moon River Theatre · 2500 W 76 Country Blvd",
    category: "show",
    lat: 36.6401,
    lng: -93.2658,
    description:
      "Nine siblings, live instruments, and the tightest family show in town.",
    href: "https://www.haygoods.com/",
    cta: "Tickets",
    ourPath: "/map?spot=haygoods",
  },
  {
    id: "duttons",
    name: "The Duttons",
    venue: "Dutton Family Theater · 3454 W 76 Country Blvd",
    category: "show",
    lat: 36.64244,
    lng: -93.28687,
    description:
      "Fiddles, comedy, and a multi-generation family band in their own theater.",
    href: "https://www.duttons.com/",
    cta: "Tickets",
    ourPath: "/map?spot=duttons",
  },
  {
    id: "sight-sound",
    name: "Sight & Sound Theatre",
    venue: "David — The Musical · 1001 Shepherd of the Hills Expwy",
    category: "show",
    lat: 36.6654,
    lng: -93.26219,
    description:
      "Branson’s biggest stage — animals, sets, and David in production through this season.",
    href: "https://www.sight-sound.com/",
    cta: "Tickets",
    ourPath: "/map?spot=sight-sound",
  },
  {
    id: "shepherd",
    name: "Shepherd of the Hills Outdoor Drama",
    venue: "5586 W 76 Country Blvd · outdoor amphitheater",
    category: "show",
    lat: 36.667,
    lng: -93.30589,
    description:
      "The Ozarks origin story under the stars — horseback scenes and a real burned cabin.",
    href: "https://theshepherdofthehills.com/",
    cta: "Tickets",
    ourPath: "/map?spot=shepherd",
  },
  {
    id: "hamners",
    name: "Hamners' Unbelievable Variety Show",
    venue: "Hamners' Variety Theater · 3090 Shepherd of the Hills Expwy",
    category: "show",
    lat: 36.65395,
    lng: -93.27957,
    description:
      "Acrobats, comedy, and magic in a compact theater — easy night with kids.",
    href: "https://www.hamnersunbelievable.com/",
    cta: "Tickets",
    ourPath: "/map?spot=hamners",
  },
  {
    id: "clay-cooper",
    name: "Clay Cooper Theatre",
    venue: "3216 W 76 Country Blvd",
    category: "show",
    lat: 36.63733,
    lng: -93.27964,
    description:
      "Home of Clay Cooper Country Express and Dean Z — classic Strip theater.",
    href: "https://www.claycoopertheatre.com/",
    cta: "Tickets",
    ourPath: "/map?spot=clay-cooper",
  },
  {
    id: "baldknobbers",
    name: "Hughes Brothers Theatre / Baldknobbers",
    venue: "Baldknobbers Jamboree · 2835 W 76 Country Blvd",
    category: "show",
    lat: 36.63854,
    lng: -93.27153,
    description:
      "Branson’s original hillbilly jamboree — comedy, country, and a 1959 pedigree.",
    href: "https://www.baldknobbers.com/",
    cta: "Tickets",
    ourPath: "/map?spot=baldknobbers",
  },
  {
    id: "presleys",
    name: "Presley's Country Jubilee",
    venue: "1209 W 76 Country Blvd",
    category: "show",
    lat: 36.64035,
    lng: -93.24015,
    description:
      "The first family show on the Strip — four generations of pickin’ and punchlines.",
    href: "https://www.presleys.com/",
    cta: "Tickets",
    ourPath: "/map?spot=presleys",
  },
  {
    id: "legends",
    name: "Legends in Concert",
    venue: "Pepsi Legends Theater · 1600 W 76 Country Blvd",
    category: "show",
    lat: 36.64151,
    lng: -93.24753,
    description:
      "Tribute stars on a licensed Elvis stage — rotating lineup, always a full band.",
    href: "https://legendsinconcert.com/location/branson-mo/",
    cta: "Tickets",
    ourPath: "/map?spot=legends",
  },
];

export function getMapSpot(id: string | null | undefined) {
  if (!id) return undefined;
  return BRANSON_MAP_SPOTS.find((s) => s.id === id);
}

export function diningId(name: string) {
  return (
    "eat-" +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function diningToMapSpot(r: {
  name: string;
  url?: string;
  cuisine?: string;
  price?: string;
  tag?: string;
  desc?: string;
  venue?: string;
  lat?: number;
  lng?: number;
}): MapSpot | null {
  if (typeof r.lat !== "number" || typeof r.lng !== "number") return null;
  if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return null;
  const bits = [r.cuisine, r.price, r.tag].filter(Boolean).join(" · ");
  return {
    id: diningId(r.name),
    name: r.name,
    venue: r.venue || bits || "Branson",
    category: "eat",
    lat: r.lat,
    lng: r.lng,
    description: r.desc || bits || "Local dining pick from the guest guide.",
    href: r.url || "https://www.mybransonvacation.com/branson",
    cta: r.url ? "Menu / site" : "See in our guide",
    ourPath: `/map?spot=${diningId(r.name)}`,
  };
}

export function showVenueId(venue: string) {
  return (
    "show-" +
    venue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function normPlace(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function placeOverlap(a: string, b: string) {
  const na = normPlace(a);
  const nb = normPlace(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const words = na.split(" ").filter((w) => w.length > 3);
  return words.filter((w) => nb.includes(w)).length >= 2;
}

export function showsToMapSpots(
  shows: {
    name: string;
    time?: string;
    venue?: string;
    type?: string;
    url?: string;
    lat?: number;
    lng?: number;
    venueAddress?: string;
  }[],
  existing: MapSpot[],
): MapSpot[] {
  const byVenue = new Map<string, typeof shows>();
  for (const s of shows) {
    const venue = (s.venue || "").trim();
    if (!venue) continue;
    if (typeof s.lat !== "number" || typeof s.lng !== "number") continue;
    const key = normPlace(venue);
    const list = byVenue.get(key) || [];
    list.push(s);
    byVenue.set(key, list);
  }
  const out: MapSpot[] = [];
  for (const group of byVenue.values()) {
    const first = group[0];
    const venue = first.venue || "Branson theatre";
    const dup = existing.some(
      (e) =>
        e.category === "show" &&
        (placeOverlap(e.name, venue) ||
          placeOverlap(e.venue, venue) ||
          group.some((g) => placeOverlap(e.name, g.name))),
    );
    if (dup) continue;
    const lines = group
      .map((g) => `${g.name}${g.time ? ` · ${g.time}` : ""}`)
      .join(" · ");
    out.push({
      id: showVenueId(venue),
      name: group.length === 1 ? group[0].name : venue,
      venue,
      category: "show",
      lat: first.lat as number,
      lng: first.lng as number,
      description: lines,
      href:
        first.url || "https://www.mybransonvacation.com/branson",
      cta: first.url ? "Tickets" : "See today's shows",
      ourPath: `/map?spot=${showVenueId(venue)}`,
    });
  }
  return out;
}

function slugId(prefix: string, name: string) {
  return (
    prefix +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function golfToMapSpot(r: {
  name: string;
  url?: string;
  designer?: string;
  rates?: string;
  tag?: string;
  desc?: string;
  venue?: string;
  lat?: number;
  lng?: number;
}): MapSpot | null {
  if (typeof r.lat !== "number" || typeof r.lng !== "number") return null;
  if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return null;
  const bits = [r.designer, r.rates, r.tag].filter(Boolean).join(" · ");
  return {
    id: slugId("golf-", r.name),
    name: r.name,
    venue: r.venue || bits || "Branson golf",
    category: "golf",
    lat: r.lat,
    lng: r.lng,
    description: r.desc || bits || "Local golf pick from the guest guide.",
    href: r.url || "https://www.mybransonvacation.com/branson",
    cta: r.url ? "Tee times" : "See in our guide",
    ourPath: `/map?spot=${slugId("golf-", r.name)}`,
  };
}

export function attractionToMapSpot(
  r: {
    name: string;
    url?: string;
    tag?: string;
    desc?: string;
    category?: string;
    venue?: string;
    lat?: number;
    lng?: number;
  },
  existing: MapSpot[],
): MapSpot | null {
  if (typeof r.lat !== "number" || typeof r.lng !== "number") return null;
  if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return null;
  const dup = existing.some(
    (e) =>
      (e.category === "attraction" || e.category === "marina") &&
      (placeOverlap(e.name, r.name) || placeOverlap(e.venue, r.name)),
  );
  if (dup) return null;
  return {
    id: slugId("do-", r.name),
    name: r.name,
    venue: r.venue || r.tag || "Branson",
    category: "attraction",
    lat: r.lat,
    lng: r.lng,
    description: r.desc || r.tag || "Local attraction from the guest guide.",
    href: r.url || "https://www.mybransonvacation.com/branson",
    cta: r.url ? "Hours / tickets" : "See in our guide",
    ourPath: `/map?spot=${slugId("do-", r.name)}`,
  };
}

export function fishingToMapSpot(
  r: {
    name: string;
    url?: string;
    tag?: string;
    desc?: string;
    venue?: string;
    lat?: number;
    lng?: number;
  },
  existing: MapSpot[],
): MapSpot | null {
  if (typeof r.lat !== "number" || typeof r.lng !== "number") return null;
  if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return null;
  const dup = existing.some(
    (e) =>
      (e.category === "marina" || e.category === "fish") &&
      (placeOverlap(e.name, r.name) || placeOverlap(e.venue, r.name)),
  );
  if (dup) return null;
  return {
    id: slugId("fish-", r.name),
    name: r.name,
    venue: r.venue || r.tag || "Table Rock / Taneycomo",
    category: "fish",
    lat: r.lat,
    lng: r.lng,
    description: r.desc || r.tag || "Fishing access from the guest guide.",
    href: r.url || "https://www.mybransonvacation.com/branson",
    cta: r.url ? "Access info" : "See fishing report",
    ourPath: `/map?spot=${slugId("fish-", r.name)}`,
  };
}
