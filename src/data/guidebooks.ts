// ─── Guest Guidebook Data ───────────────────────────────────
// Per-property content for the guest app.
// Data sourced from Hostfully guidebooks + Guesty.

export interface SeasonalTheme {
  season: 'summer' | 'harvest' | 'christmas' | 'spring';
  name: string;
  emoji: string;
  sdcEvent: string;
  primaryColor: string;
  gradient: string;
  accentColor: string;
  tagline: string;
  pushMessage: string;
  featuredEvent: string;
  featuredLink: string;
  startDate: string; // MM-DD
  endDate: string;   // MM-DD
}

export const SEASONS: SeasonalTheme[] = [
  {
    season: 'summer',
    name: 'Summer Family Fun',
    emoji: '☀️',
    sdcEvent: 'Summer Celebration (Jun 6 – Aug 2)',
    primaryColor: '#0ea5e9',
    gradient: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
    accentColor: '#0284c7',
    tagline: '☀️ Lake days, shows & family fun',
    pushMessage: 'Fall colors are coming — book your Harvest Fest getaway before rates go up!',
    featuredEvent: '🎆 SDC Night Sky Drone & Fireworks',
    featuredLink: 'https://www.silverdollarcity.com/theme-park/festivals/summer-celebration/',
    startDate: '06-01',
    endDate: '08-02',
  },
  {
    season: 'summer',
    name: 'Late Summer in Branson',
    emoji: '☀️',
    sdcEvent: 'Southern Gospel Picnic (Aug 27 – Sep 7)',
    primaryColor: '#0ea5e9',
    gradient: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
    accentColor: '#0284c7',
    tagline: '☀️ Lake days, shows & family fun',
    pushMessage: '🙌 Southern Gospel Picnic is Aug 27–Sep 7 — next festival at Silver Dollar City.',
    featuredEvent: '🙌 Southern Gospel Picnic at SDC',
    featuredLink: 'https://www.silverdollarcity.com/theme-park/festivals/southern-gospel-picnic/',
    startDate: '08-03',
    endDate: '09-10',
  },
  {
    season: 'harvest',
    name: '🎃 Harvest Fest in Branson',
    emoji: '🎃',
    sdcEvent: 'Harvest Festival (Sep 11 – Oct 31)',
    primaryColor: '#c2410c',
    gradient: 'linear-gradient(135deg,#9a3412,#ea580c)',
    accentColor: '#fb923c',
    tagline: '🎃 Pumpkin nights, fall colors & cooler temps',
    pushMessage: '🎄 Christmas in Branson is magical — book your holiday trip now! Shows sell out fast!',
    featuredEvent: '🎃 Pumpkins in the City at SDC',
    featuredLink: 'https://www.silverdollarcity.com/theme-park/festivals/harvest-festival/',
    startDate: '09-11',
    endDate: '10-31',
  },
  {
    season: 'christmas',
    name: '🎄 Christmas in Branson',
    emoji: '🎄',
    sdcEvent: 'An Old Time Christmas (Nov 7 – Jan 2)',
    primaryColor: '#1e3a8a',
    gradient: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    accentColor: '#fbbf24',
    tagline: '🎄 6.5M lights, shows & holiday magic',
    pushMessage: '🌱 Spring fishing and Dogwood blooms are right around the corner — start planning!',
    featuredEvent: '🎄 An Old Time Christmas at SDC',
    featuredLink: 'https://www.silverdollarcity.com/theme-park/festivals/christmas/',
    startDate: '11-01',
    endDate: '01-15',
  },
  {
    season: 'spring',
    name: '🌱 Spring in the Ozarks',
    emoji: '🌱',
    sdcEvent: 'Spring season',
    primaryColor: '#166534',
    gradient: 'linear-gradient(135deg,#166534,#22c55e)',
    accentColor: '#86efac',
    tagline: '🌱 Trout biting, trails blooming, summer ahead',
    pushMessage: '☀️ Summer family vacation spots are filling up — book your dates before they go!',
    featuredEvent: '🎣 Trout season & Dogwood Canyon',
    featuredLink: 'https://dogwoodcanyon.org/',
    startDate: '01-16',
    endDate: '05-31',
  },
];

export interface PropertyGuidebook {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  address: string;
  guestyListingId: string;
  hostName: string;
  hostBio: string;
  hostPhone: string;
  hostEmail: string;

  checkIn: {
    time: string;
    type: string;
    doorCode: string;
    directions: string;
    parking: string;
    accessNote: string;
  };

  wifi: {
    network: string;
    password: string;
  };

  appliances: {
    coffeeMaker: { type: string; instructions?: string; youtube?: string };
    hvac: { type: string; instructions?: string; youtube?: string };
    tv: { type: string; streaming: string[] };
    washer: { instructions?: string; youtube?: string };
    stove?: string;
    fireplace?: { type: string; youtube?: string };
    waterFilter?: { youtube?: string };
    aroma360?: { youtube?: string };
    candles?: { youtube?: string };
  };

  amenities: string[];
  houseRules: string[];
  /** Optional intro paragraphs shown above houseRules. When set, the guidebook page renders this unit's houseRules verbatim instead of the shared Notch text. */
  houseRulesIntro?: string[];
  trash: string;
  emergency: {
    hospital: string;
    localContact: string;
    call911: string;
  };
  urgentCare: { name: string; address: string; phone: string; mapsUrl: string; distance: string }[];

  videos: { title: string; url: string }[];
}

// ─── Common values shared across all properties ──────────
const COMMON = {
  hostName: "Brian Summers",
  hostBio:
    `Hi there! I'm Brian Summers, and I'm thrilled to welcome you to one of our properties in the beautiful Branson West area. I'm a full-time paramedic, fireman, and rescue specialist with ${new Date().getFullYear() - 2000} years of experience. I bring that same dedication to making sure your vacation is stress-free and memorable.`,
  hostPhone: "314-565-0589",
  hostEmail: "summersvacationsllc@gmail.com",
  checkInTime: "4:00 PM",
  accessNote:
    "We have keyless entry. Your door code will be emailed prior to arrival. Check your email for check-in instructions.",
  hospital: "Cox Medical Center Branson — 525 Branson Landing Blvd, Branson, MO",
  localContact: "Brian: 314-565-0589",
  call911: "Call 911 for life-threatening emergencies. For non-emergency police: Stone County Sheriff (417) 357-6116.",
  trash: "Dumpster located behind the building complex. Recycling bins are marked.",
  houseRules: [
    "No smoking inside the unit",
    "Quiet hours: 10 PM – 8 AM",
    "No parties or events",
    "Pool rules must be followed at all times",
    "Please start dishwasher and bag trash before checkout",
  ],
  commonVideos: [
    { title: "Access Codes & Instructions", url: "https://www.youtube.com/watch?v=2DvVB7xTuNk" },
    { title: "Laundry Room", url: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
    { title: "Playground", url: "https://www.youtube.com/watch?v=unj-zG9wtdU" },
    { title: "Private Lake Trail", url: "https://www.youtube.com/watch?v=VGmH8k_656A" },
    { title: "Boat & Trailer Parking", url: "https://www.youtube.com/watch?v=nCJsHxMO_Ok" },
  ],
  commonAmenities: [
    "High-speed WiFi",
    "Full kitchen",
    "Barbecue grill",
    "Pool access",
    "Private lake access",
    "Playground",
    "Deck/patio",
  ],
  // Shared community info for all Notch Lane properties
  communityInfo: {
    pool: "The pool is open from 8 AM to 10 PM. No glass containers in the pool area. Children must be supervised at all times. Pool towels are provided in the unit — please do not take bath towels to the pool. No diving or running.",
    lake: "The private lake (pond) is a short walk from the property. Catch-and-release fishing is allowed. The walking trail circles the lake. Please supervise children near the water.",
    trail: "A scenic walking trail circles the private lake. The trail is maintained year-round. Perfect for a morning walk or evening stroll.",
    playground: "Children's playground is located near the main pool area. Equipment includes swings and a slide. Adult supervision required.",
    horseshoes: "Horseshoe pits are located by the larger pool. Horseshoes are left at the pit — no need to bring your own.",
    basketball: "A basketball court is available near the pool area. Basketballs are on the rack by the court.",
    bbq: "Charcoal barbecue grills are available on the property. Charcoal is NOT provided — please bring your own. Please clean the grill after use. The grill is shared — be considerate of other guests.",
    laundry: "Coin-operated laundry facility is located near the main pool. Washers and dryers accept quarters. Detergent is available for purchase. A starter supply of detergent pods is provided in the unit.",
    smoking: "No smoking tobacco, marijuana, or vaping inside the buildings/units, on decks (front or rear), walkways, pool areas, or playgrounds. Smoking tobacco (no marijuana) and vaping are permitted in the parking lot and street only. This is per HOA rules.",
  },
};

const NOTCH_URGENT_CARE = [
  {
    name: "CoxHealth Center Branson West (Walk-In)",
    address: "18452 MO-13, Branson West, MO 65737",
    phone: "(417) 272-8911",
    mapsUrl: "https://maps.google.com/?q=CoxHealth+Center+Branson+West+18452+MO-13+Branson+West+MO+65737",
    distance: "~5 min drive",
  },
  {
    name: "CoxHealth Urgent Care Branson",
    address: "525 Branson Landing Blvd, Suite 100, Branson, MO 65616",
    phone: "(417) 348-8646",
    mapsUrl: "https://maps.google.com/?q=CoxHealth+Urgent+Care+525+Branson+Landing+Blvd+Branson+MO",
    distance: "~15 min drive",
  },
];

const HAVEN_URGENT_CARE = [
  {
    name: "Total Point Urgent Care Branson",
    address: "3250 Shepherd of the Hills Expy, Branson, MO 65616",
    phone: "(417) 248-2093",
    mapsUrl: "https://maps.google.com/?q=Total+Point+Urgent+Care+3250+Shepherd+of+the+Hills+Expy+Branson+MO",
    distance: "~10 min drive",
  },
  {
    name: "CoxHealth Urgent Care Branson",
    address: "525 Branson Landing Blvd, Suite 100, Branson, MO 65616",
    phone: "(417) 348-8646",
    mapsUrl: "https://maps.google.com/?q=CoxHealth+Urgent+Care+525+Branson+Landing+Blvd+Branson+MO",
    distance: "~15 min drive",
  },
];

export const guidebooks: Record<string, PropertyGuidebook> = {
  // ─── THE PENTHOUSE ──────────────────────────────────────
  "the-penthouse": {
    id: "the-penthouse",
    slug: "the-penthouse",
    name: "The Penthouse",
    shortName: "Penthouse",
    address: "550 Notch Ln, Building 9, Unit 11, Branson West, MO 65737",
    guestyListingId: "68eeb58d873b002c39d38657",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "Drive down Notch Ln. Building 9 will be the last building on the right side just before the circle turn around.",
      parking:
        "On-street parking is readily available. Park at your convenience any of the spots available.",
      accessNote: COMMON.accessNote,
    },

    wifi: { network: "MyAltice 3a35c7", password: "linen-680-659" },

    appliances: {
      coffeeMaker: {
        type: "Keurig K-Duo Plus",
        instructions: "Use your favorite K-Cup pods. Reservoir fills from the top.",
        youtube: "https://www.youtube.com/watch?v=9VvWwr4lEzg",
      },
      hvac: { type: "Ecobee Smart Thermostat", instructions: "Set between 68-72°F for comfort and efficiency." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
      fireplace: { type: "Electric Fireplace", youtube: "https://www.youtube.com/watch?v=lcq7bG2Mh8E" },
      waterFilter: { youtube: "https://www.youtube.com/watch?v=awyb9DSggcg" },
      aroma360: { youtube: "https://www.youtube.com/watch?v=Th_8nI2pdjM" },
      candles: { youtube: "https://www.youtube.com/watch?v=nmuM_oBuME8" },
    },

    amenities: [
      ...COMMON.commonAmenities,
      "Coffee bar with Keurig K-Duo Plus",
      "Electric fireplace",
      "Roku Smart TV",
      "Aroma 360 diffuser",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [
      { title: "Coffee Bar Tour", url: "https://www.youtube.com/watch?v=s8OHxzMKVd8" },
      { title: "Keurig K-Duo Plus", url: "https://www.youtube.com/watch?v=9VvWwr4lEzg" },
      { title: "Aroma 360 Diffuser", url: "https://www.youtube.com/watch?v=Th_8nI2pdjM" },
      { title: "Water Filter", url: "https://www.youtube.com/watch?v=awyb9DSggcg" },
      { title: "Electric Fireplace", url: "https://www.youtube.com/watch?v=lcq7bG2Mh8E" },
      { title: "Electric Candle & Lantern", url: "https://www.youtube.com/watch?v=nmuM_oBuME8" },
      ...COMMON.commonVideos,
    ],
  },

  // ─── RUSTIC OZARK RETREAT ──────────────────────────────
  "rustic-ozark-retreat": {
    id: "rustic-ozark-retreat",
    slug: "rustic-ozark-retreat",
    name: "Rustic Ozark Retreat",
    shortName: "Rustic Ozark",
    address: "550 Notch Ln, Building 9, Unit 7, Branson West, MO 65737",
    guestyListingId: "68eeb5866f48002c3d470a6c",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "Drive down Notch Ln. Building 9 will be the last building on the right side just before the circle turn around.",
      parking:
        "On-street parking is readily available. Park at your convenience any of the spots available.",
      accessNote: COMMON.accessNote,
    },

    wifi: { network: "MyOptimum d6d285", password: "3616-cyan-52" },

    appliances: {
      coffeeMaker: {
        type: "Keurig K-Duo Plus",
        instructions: "Use your favorite K-Cup pods. Reservoir fills from the top.",
        youtube: "https://www.youtube.com/watch?v=9VvWwr4lEzg",
      },
      hvac: {
        type: "Ecobee Smart Thermostat",
        instructions: "Set between 68-72°F for comfort and efficiency.",
        youtube: "https://www.youtube.com/watch?v=XHbRs2uq0KU",
      },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
      fireplace: { type: "Electric Fireplace", youtube: "https://www.youtube.com/watch?v=ZMgLcwV4Hwc" },
      candles: { youtube: "https://www.youtube.com/watch?v=ljN3qBYoZ7k" },
    },

    amenities: [
      ...COMMON.commonAmenities,
      "Coffee bar with Keurig K-Duo Plus",
      "Electric fireplace",
      "Roku Smart TV",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [
      { title: "Finding the Building", url: "https://youtu.be/qTRxLgEop-Q" },
      { title: "Coffee Bar Tour", url: "https://www.youtube.com/watch?v=s8OHxzMKVd8" },
      { title: "Keurig K-Duo Plus", url: "https://www.youtube.com/watch?v=9VvWwr4lEzg" },
      { title: "Nest Thermostat", url: "https://www.youtube.com/watch?v=XHbRs2uq0KU" },
      { title: "Electric Fireplace", url: "https://www.youtube.com/watch?v=ZMgLcwV4Hwc" },
      { title: "Electronic Candles & Lantern", url: "https://www.youtube.com/watch?v=ljN3qBYoZ7k" },
      ...COMMON.commonVideos,
    ],
  },

  // ─── DOUBLE CONDO (Penthouse + Rustic Ozark combo) ─────
  "double-condo": {
    id: "double-condo",
    slug: "double-condo",
    name: "Double Condo",
    shortName: "Double",
    address: "550 Notch Ln, Building 9, Units 7 & 11, Branson West, MO 65737",
    guestyListingId: "68eeb561cce1002c364dfb89",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Same code for both units (emailed prior to arrival)",
      directions:
        "Drive down Notch Ln. Building 9 will be the last building on the right side just before the circle turn around.",
      parking:
        "On-street parking is readily available. Please park both units' vehicles considerately.",
      accessNote: COMMON.accessNote,
    },

    wifi: {
      network: "Unit 7: MyOptimum d6d285 / Unit 11: MyAltice 3a35c7",
      password: "Unit 7: 3616-cyan-52 / Unit 11: linen-680-659",
    },

    appliances: {
      coffeeMaker: {
        type: "Keurig K-Duo Plus (both units)",
        instructions: "Both units have Keurig K-Duo Plus coffee makers.",
        youtube: "https://www.youtube.com/watch?v=9VvWwr4lEzg",
      },
      hvac: { type: "Ecobee Smart Thermostats (both units)", instructions: "Set between 68-72°F." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
      fireplace: { type: "Electric Fireplaces (both units)", youtube: "https://www.youtube.com/watch?v=lcq7bG2Mh8E" },
      waterFilter: { youtube: "https://www.youtube.com/watch?v=awyb9DSggcg" },
    },

    amenities: [
      ...COMMON.commonAmenities,
      "Two full units (sleeps larger groups)",
      "Coffee bar in each unit",
      "Electric fireplaces",
      "Roku Smart TVs",
      "Charcoal BBQ grills (in front of buildings and by pools)",
      "2 pools",
      "Playground",
      "Horseshoe pit",
      "Basketball court",
      "Walking trails around private lake",
      "Catch-and-release lake",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [
      { title: "Coffee Bar Tour", url: "https://www.youtube.com/watch?v=s8OHxzMKVd8" },
      { title: "Keurig K-Duo Plus", url: "https://www.youtube.com/watch?v=9VvWwr4lEzg" },
      { title: "Aroma 360 Diffuser", url: "https://www.youtube.com/watch?v=Th_8nI2pdjM" },
      { title: "Water Filter", url: "https://www.youtube.com/watch?v=awyb9DSggcg" },
      ...COMMON.commonVideos,
    ],
  },

  // ─── BRANSON FAMILY HAVEN ──────────────────────────────
  "branson-family-haven": {
    id: "branson-family-haven",
    slug: "branson-family-haven",
    name: "Branson Family Haven",
    shortName: "Family Haven",
    address: "44 Timber Trace Lane, Branson, MO 65616",
    guestyListingId: "6993c5d31547001e711bc7ed",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "From Highway 76: Head west toward Table Rock Lake. Turn left onto Indian Point Road. Continue 3-4 miles, turn left onto Myrtle Lane, then left onto Timber Trace Lane. 44 Timber Trace will be on your right.",
      parking:
        "Park in the driveway. Boat and trailer parking is in the upper lot by the blue shed.",
      accessNote:
        "We have keyless entry. Your door code is the last 4 digits of the phone number used when booking. Code is active at 4:00 PM on check-in day.",
    },

    wifi: { network: "44 Timber Trace", password: "welcome44" },

    appliances: {
      coffeeMaker: {
        type: "Drip Coffee Maker",
        instructions: "Standard drip coffee maker in the kitchen.",
      },
      hvac: { type: "Ecobee Smart Thermostat", instructions: "Thermostat on main level wall." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Washer and dryer located in unit.", youtube: "https://www.youtube.com/watch?v=2DvVB7xTuNk" },
      stove: "Whirlpool Range",
    },

    amenities: [
      "Full kitchen with Whirlpool range",
      "Dishwasher",
      "Microwave",
      "Washer & dryer in-unit",
      "Roku Smart TV",
      "High-speed WiFi",
      "Driveway parking",
      "Boat & trailer parking",
      "Games & activities",
      "Dim-able can lights downstairs",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: HAVEN_URGENT_CARE,

    videos: [
      ...COMMON.commonVideos,
    ],
  },

  // ─── WOODLAND RETREAT (499 Notch Ln, Building 14, Unit 6) ──
  "woodland-retreat": {
    id: "woodland-retreat",
    slug: "woodland-retreat",
    name: "Woodland Retreat",
    shortName: "Woodland",
    address: "499 Notch Ln, Building 14, Unit 6, Branson West, MO 65737",
    guestyListingId: "68eecd33a359002c338a2a55",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "Turn into Notch Estates. Building 14 is directly across from the small pool on the left.",
      parking:
        "You can park in the driveway for Building 14, Unit 6.",
      accessNote: COMMON.accessNote,
    },

    wifi: { network: "My Optimum c950bf", password: "brick-148-543" },

    appliances: {
      coffeeMaker: {
        type: "Mr. Coffee Coffee Maker",
        instructions: "Standard drip coffee maker in the kitchen.",
        youtube: "https://www.youtube.com/watch?v=74MuwGbmJFc",
      },
      hvac: { type: "Ecobee Smart Thermostat", instructions: "Thermostat in the unit." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
    },

    amenities: [
      ...COMMON.commonAmenities,
      "Roku Smart TV",
      "Mr. Coffee coffee maker",
      "Bunk beds (children's room)",
      "Electric fireplace",
      "Games",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [
      { title: "Mr. Coffee Coffee Maker", url: "https://www.youtube.com/watch?v=74MuwGbmJFc" },
      ...COMMON.commonVideos,
    ],
  },

  // ─── SCOTT'S UNIT (No-Stairs Condo · 289 Notch #6) ─────
  "scotts-unit": {
    id: "scotts-unit",
    slug: "scotts-unit",
    name: "No-Stairs Condo",
    shortName: "Scotts unit",
    address: "289 Notch Lane, Unit 6, Branson West, MO 65737",
    guestyListingId: "6abe3566a78519004a84f031",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "While you're staying with us: turn into Notch Estates on Notch Lane. Your home is 289 Notch Lane, Unit 6 — a first-floor condo with no stairs into the unit. Look for building/unit signage for #6.",
      parking:
        "Park in the spaces near Unit 6 / 289 Notch Lane. Please don't block neighboring driveways, walkways, or dumpster access.",
      accessNote:
        "Keyless entry (same lock system style as The Penthouse at Notch). Your door code is the last 4 digits of the phone number on your booking. The code works from 4:00 PM on arrival day until 10:00 AM on checkout day. We'll also email check-in details before you arrive. If the lock doesn't respond, wait a few seconds and try again, then text Brian at 314-565-0589.",
    },

    wifi: { network: "MyAltice 34f945", password: "3259-lavender-11" },

    appliances: {
      coffeeMaker: {
        // TODO(Brian): confirm brand/model (drip vs Keurig) after walk-through
        type: "Coffee maker",
        instructions:
          "While you're staying with us, the coffee maker is on the kitchen counter. Supplies are in the cabinet above or beside it.",
      },
      hvac: {
        type: "Ecobee Smart Thermostat",
        instructions:
          "Ecobee smart thermostat in the living area. Set between 68–72°F for comfort and efficiency. Please don't switch the system to extreme temps or hold modes overnight.",
      },
      tv: {
        type: "Smart TV",
        streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"],
      },
      washer: {
        instructions:
          "Coin-operated laundry is available near the main pool (same Notch Estates facility as our other condos). A starter supply of detergent pods is in the unit when stocked.",
        youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI",
      },
      stove:
        "Full kitchen with stove/oven, microwave, refrigerator, freezer, toaster, kettle, cookware, dishes, and silverware.",
    },

    amenities: [
      ...COMMON.commonAmenities,
      "First-floor — no stairs into the unit",
      "Fresh remodel",
      "Full kitchen",
      "Ecobee smart thermostat",
      "Smart TV",
      "Outdoor community pool",
      "On-site fishing lake",
      "Private entrance",
    ],
    // Final house rules (exact wording from FINAL-scotts-house-rules-for-guesty.txt, 2026-10-03).
    houseRulesIntro: [
      "BY BOOKING THIS PROPERTY YOU AGREE TO ABIDE BY THE HOUSE RULES. This nightly rate is for an occupancy of 6. Any additional guests over 6 is subject to a $20 per person nightly charge. ",
      "No Smoking or vaping in any unit, or common area, or limited common area, including decks, porches, and walkways. Smoking of tobacco and vaping are permitted in the parking lot and street, with proper disposal of butts and wrappers.  Smoking of marijuana is not permitted.  Violators are subject to a $500.00 fine.",
    ],
    houseRules: [
      "1. CHECK-OUT is 10AM. CHECK-IN is 4PM.",
      "2. VISITORS - People other than those in the Guest party set forth in the reservation may not stay overnight in the property. Any other person in the property is the sole responsibility of Guest.",
      "3. QUIET HOURS – NOTCH ESTATES HOA Quiet Hours are 10PM-8AM",
      "4. STRICTLY NO SMOKING OR VAPING of any kind, including marijuana, inside the condo or on the deck, porch, or walkways. Tobacco and vaping are allowed in the parking lot and street only, per HOA rules. Marijuana is not allowed. A fine up to $500 may be applied.",
      "5. PROPERTY - Keep the property and all furnishings in good order",
      "6. APPLIANCES - Only use appliances for their intended uses",
      "7. PETS - Pets or animals of any kind are NOT allowed for nightly rental units per HOA rules.",
      "8. PARKING - On-street parking is readily available. Park at your convenience any of the spots available. Trailer/boat parking is available in the designated area.",
      "9. SEPTIC- DO NOT FLUSH anything other than toilet paper. No feminine products, personal or baby wipes should be flushed at any time. If it is found that feminine products have been flushed and clog the septic system, you will be charged for damages.",
      "10. HOUSEKEEPING - There is no daily housekeeping service. While linens and bath towels are included in the unit and laundered upon Guest departure, daily maid service is not included in the rental rate. We suggest you bring beach towels for the pool.",
      "11. THERMOSTAT (ECOBEE) - Set between 68-72°F for comfort and efficiency.",
      "12. BUNK BEDS - Children under the age of 6 should not use the top bunk. Guests assume any and all risks related to accessing, sleeping in, and otherwise using bunk beds.",
      "13. CABLE TELEVISION AND INTERNET: Cable Television and internet is provided, and service level has been chosen by the owner. No refund of rents shall be given for outages, content, lack of content, speed, access problems, lack of knowledge of use, or personal preferences with regard to Internet service.",
      "14. ROKU AND CABLE - Roku and cable available in the master bedroom and living room.",
      "15. ILLEGAL ACTIVITY - Any illegal activity will be grounds for immediate removal from the property and forfeit any refund and security deposit.",
      "16. FIREARMS: Only legally owned and permitted firearms shall be allowed on the premises according to State and local laws.",
      "17. USE OF PROPERTY: Guests expressly acknowledge and agree that the Agreement is for transient occupancy of the Property, and that Guests do not intend to make the property a residence or household.",
      "18. OWNERSHIP - All of the units are privately owned; the owners are not responsible for any accidents, injuries or illness that occurs while on the premises or its facilities. The Homeowners are not responsible for the loss of personal belongings or valuables of the guest. By accepting this reservation, it is agreed that all guests are expressly assuming the risk of any harm arising from their use of the premises or others whom they invite to use the premise.",
      "19. HOST LIABILITY: The Guest shall hereby indemnify and hold harmless the Host against any and all claims of personal injury or property damage or loss arising from use of the premises regardless of the nature of the accident, injury or loss. Guest expressly recognize that any insurance for property damage or loss which the Host may maintain on the property does not cover the personal property of Guest, and that Guest should purchase their own insurance if such coverage is desired.",
      "20. TERMINATION: Should the Guest violate any of the terms of this agreement, the rental period shall be terminated immediately. The Guests waive all rights to process if they fail to vacate the premises upon termination of the rental period. The Guests shall vacate the premises at the expiration time and date of the agreement.",
    ],
    trash:
      "Dumpster is at the complex (typically out front/to the left of the building area — follow on-site dumpster signs). Bag household trash and take it out before checkout. Recycling bins are marked where provided.",
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [
      { title: "Access Codes & Instructions", url: "https://www.youtube.com/watch?v=2DvVB7xTuNk" },
      { title: "Laundry Room", url: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
      { title: "Playground", url: "https://www.youtube.com/watch?v=unj-zG9wtdU" },
      { title: "Private Lake Trail", url: "https://www.youtube.com/watch?v=VGmH8k_656A" },
      { title: "Boat & Trailer Parking", url: "https://www.youtube.com/watch?v=nCJsHxMO_Ok" },
    ],
  },
};

export function getGuidebook(slug: string): PropertyGuidebook | undefined {
  // Try slug match first, then name match for Guesty listing names
  return guidebooks[slug] || Object.values(guidebooks).find(gb => gb.name.toLowerCase() === slug.toLowerCase() || gb.shortName.toLowerCase() === slug.toLowerCase());
}

export function getGuidebookByName(name: string): PropertyGuidebook | undefined {
  const lower = name.toLowerCase().trim();
  return Object.values(guidebooks).find(gb => gb.name.toLowerCase() === lower || gb.shortName.toLowerCase() === lower);
}

export function getAllGuidebookSlugs(): string[] {
  return Object.keys(guidebooks);
}
