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
    primaryColor: '#b45309',
    gradient: 'linear-gradient(135deg,#b45309,#d97706)',
    accentColor: '#f5c842',
    tagline: '☀️ Lake days, shows & family fun',
    pushMessage: 'Fall colors are coming — book your Harvest Fest getaway before rates go up!',
    featuredEvent: '🎆 SDC Night Sky Drone & Fireworks',
    featuredLink: 'https://www.silverdollarcity.com/',
    startDate: '06-01',
    endDate: '08-31',
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
    startDate: '09-01',
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
    "Hi there! I'm Brian Summers, and I'm thrilled to welcome you to one of our properties in the beautiful Branson West area. I'm a full-time paramedic, fireman, and rescue specialist with 26 years of experience. I bring that same dedication to making sure your vacation is stress-free and memorable.",
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
    address: "550 Notch Ln, Building 9, Unit 11, Reeds Spring, MO 65737",
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
    address: "550 Notch Ln, Building 9, Unit 7, Reeds Spring, MO 65737",
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
    address: "550 Notch Ln, Building 9, Units 7 & 11, Reeds Spring, MO 65737",
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
    address: "499 Notch Ln, Building 14, Unit 6, Reeds Spring, MO 65737",
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

  // ─── MODERN CHARMER (550 Notch Lane, Unit 8) ──────────
  "modern-charmer": {
    id: "modern-charmer",
    slug: "modern-charmer",
    name: "Modern Charmer",
    shortName: "Modern",
    address: "550 Notch Lane, Unit 8, Reeds Spring, MO 65737",
    guestyListingId: "696679519399002c92ac4ec4",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "Drive down Notch Ln. Follow to your assigned building.",
      parking:
        "On-street parking is readily available. Park at your convenience any of the spots available.",
      accessNote: COMMON.accessNote,
    },

    wifi: { network: "Hunterslodge Guest 2.4", password: "72BAncWA834E" },

    appliances: {
      coffeeMaker: { type: "Coffee Bar", instructions: "Coffee bar setup in the kitchen." },
      hvac: { type: "Central Heating & AC", instructions: "Thermostat in the unit." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
    },

    amenities: [...COMMON.commonAmenities, "Roku Smart TV", "Pack 'n Play", "Charging station"],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [...COMMON.commonVideos],
  },

  // ─── PRETTY PEACOCK (289 Notch Lane, Building 19, Unit 1) ──
  "pretty-peacock": {
    id: "pretty-peacock",
    slug: "pretty-peacock",
    name: "Pretty Peacock",
    shortName: "Peacock",
    address: "289 Notch Lane, Building 19, Unit 1, Reeds Spring, MO 65737",
    guestyListingId: "699911d27b1a001efccbf235",
    ...COMMON,

    checkIn: {
      time: "4:00 PM",
      type: "keyless",
      doorCode: "Last 4 digits of booking phone",
      directions:
        "From Highway 76: Look for Church of Jesus Christ of Latter-day Saints. Turn onto Notch Lane between the church and Notch Inn & Suites. Continue half a mile. 289 will be on your left. Building is tan with brown trim.",
      parking:
        "Option 1: Park in main lot and walk down stairs. Option 2: Drive to left side of building for step-free access to lower level.",
      accessNote: COMMON.accessNote,
    },

    wifi: { network: "Comfort guest 1", password: "297BCQcet970Rb4!#" },

    appliances: {
      coffeeMaker: { type: "Coffee Bar", instructions: "Coffee bar setup in the kitchen." },
      hvac: { type: "Central Heating & AC", instructions: "Thermostat in the unit." },
      tv: { type: "Smart TV with Roku Streaming", streaming: ["Netflix", "Hulu", "Disney+", "Prime Video"] },
      washer: { instructions: "Coin laundry available on property by the main pool.", youtube: "https://www.youtube.com/watch?v=IlJQi1S0NRI" },
    },

    amenities: [
      ...COMMON.commonAmenities,
      "Roku Smart TV",
      "Pack 'n Play",
      "Charging station",
      "Coffee bar",
      "Pool towels",
      "Games",
    ],
    houseRules: COMMON.houseRules,
    trash: COMMON.trash,
    emergency: { hospital: COMMON.hospital, localContact: COMMON.localContact, call911: COMMON.call911 },
    urgentCare: NOTCH_URGENT_CARE,

    videos: [...COMMON.commonVideos],
  },
};

export function getGuidebook(slug: string): PropertyGuidebook | undefined {
  return guidebooks[slug];
}

export function getAllGuidebookSlugs(): string[] {
  return Object.keys(guidebooks);
}
