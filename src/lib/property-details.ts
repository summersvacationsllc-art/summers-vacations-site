/**
 * Per-property detail-page data for /property/[property].
 *
 * Every unit renders through the same template (src/app/property/[property]/page.tsx),
 * modeled on the Silver Dollar City Adventure Escape page: hero, big feature photo,
 * photo highlights, "About this home" + sleeping + details, highlights & amenities,
 * good-to-know notes, and the full photo gallery (grouped, uncropped, with a lightbox).
 *
 * Names, sleeps, beds, booking links and the comingSoon flag still come from
 * src/lib/site.ts — this file only describes what the detail page shows.
 * Photo paths must match files in public/property-photos/.
 */

export interface Photo {
  url: string;
  caption?: string;
  /** Gallery section heading this photo belongs to. */
  group?: string;
  /** CSS object-position for places that must crop (hero / feature). Default "center". */
  pos?: string;
}

export interface PropertyDetail {
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
  /** Hero photo shown beside the hero text (used when there's no Airbnb/VRBO card to show there). */
  heroPhoto?: Photo;
  /** Large feature photo right under the hero. */
  featurePhoto?: Photo;
  /** Set false when the home has no guidebook yet (hides "Preview Guidebook"). */
  hasGuidebook?: boolean;
  /** Photo highlight section near the top. */
  fun?: { eyebrow?: string; title: string; intro: string; photos: Photo[] };
  /** "About this home" copy. */
  about?: { intro?: string[]; groups: { title: string; items: string[] }[] };
  /** Bedroom-by-bedroom sleeping arrangements. */
  sleeping?: { room: string; beds: string }[];
  /** Quick facts: size, check-in/out, hosts… */
  details?: { label: string; value: string }[];
  /** "Good to know" notes. */
  goodToKnow?: { label: string; text: string }[];
  /** Full gallery, in display order (grouped by Photo.group). */
  gallery: Photo[];
}

/* ───────────────────────── helpers ───────────────────────── */

const group = (name: string, photos: Photo[]): Photo[] => photos.map((p) => ({ ...p, group: name }));
const dir = (base: string) => (file: string, caption: string, pos?: string): Photo => ({
  url: `${base}/${file}`,
  caption,
  ...(pos ? { pos } : {}),
});

const KLEIN_DIR = "/property-photos/silver-dollar-city-adventure-escape";
const kp = dir(KLEIN_DIR);
const ph = dir("/property-photos/penthouse");
const phf = dir("/property-photos/penthouse/fall");
const ru = dir("/property-photos/rustic-ozark-retreat");
const ruf = dir("/property-photos/rustic-ozark-retreat/fall");
const wd = dir("/property-photos/woodland-retreat");
const wdf = dir("/property-photos/woodland-retreat/fall");
const dc = dir("/property-photos/double-condo");
const sc = dir("/property-photos/scotts-unit");
const sa = dir("/property-photos/scotts-unit/airbnb");
const hv = dir("/property-photos/branson-family-haven");
const ha = dir("/property-photos/branson-family-haven/airbnb");
const ne = dir("/property-photos/notch-estates");

const HOSTS = { label: "Your hosts", value: "Brian & Chantel Summers" };
const CHECK_IN = { label: "Check-in", value: "4:00 PM" };
const CHECK_OUT = { label: "Checkout", value: "10:00 AM" };

/* ─────────────── Notch Estates shared community amenities ─────────────── */
// Real Notch Estates common-area photos (shared by every Notch unit). Copied into
// public/property-photos/notch-estates/ from the Adventure Escape shoot and the
// No-Stairs Condo shoot — no unit interiors in this set.

export const NOTCH_GROUP = "Notch Estates Community";

export const NOTCH_COMMUNITY_PHOTOS: Photo[] = group(NOTCH_GROUP, [
  ne("01-notch-estates-sign.jpg", "Welcome to Notch Estates, about 1 mile from Silver Dollar City"),
  ne("02-aerial-notch-estates.jpg", "Wooded Notch Estates from above, in Branson West"),
  ne("03-lake-covered-dock.jpg", "5-acre catch-and-release fishing lake with a covered dock"),
  ne("04-lake-view.jpg", "Peaceful lake views in Notch Estates"),
  ne("05-lake-dock-picnic.jpg", "Picnic table on the covered lake dock"),
  ne("06-lake-dock-fishing.jpg", "Fishing off the dock at the community lake"),
  ne("07-nature-trail.jpg", "Nature trail right on the property"),
  ne("08-playground.jpg", "Children's playground"),
  ne("09-grill-pavilion.jpg", "Community pavilion with a charcoal grill"),
  ne("10-picnic-pavilion.jpg", "Covered picnic pavilion"),
  ne("11-basketball-court.jpg", "Community basketball court"),
  ne("12-pool.jpg", "Community pool (seasonal, May–September)"),
  ne("13-pool-loungers.jpg", "Pool deck with loungers"),
  ne("14-pool-fenced.jpg", "Fenced community pool"),
]);

const NOTCH_ABOUT_GROUP = {
  title: NOTCH_GROUP,
  items: [
    "5-acre catch-and-release fishing lake with a covered dock",
    "Nature trail, children's playground and basketball court",
    "Picnic pavilions with charcoal grills, plus a horseshoe pit",
    "Seasonal community pool (May–September)",
  ],
};

/** Shared Notch amenities added to each Notch unit's list (only if not already listed). */
const NOTCH_EXTRA_AMENITIES = ["Nature trail", "Basketball court", "Horseshoe pit", "Picnic pavilions"];
const withNotch = (list: string[]) => [...list, ...NOTCH_EXTRA_AMENITIES.filter((a) => !list.includes(a))];

const NOTCH_GOOD_TO_KNOW = [
  {
    label: "Fishing lake",
    text: "The trail down to the lake is a bit rocky and steep. Wear good shoes and take your time (it's worth it!).",
  },
  { label: "Pool", text: "The community pool is open seasonally, May–September." },
  { label: "Parking", text: "Free parking right outside." },
  { label: "Smoking", text: "No smoking or vaping inside or on the decks. Parking lot and street only (HOA rules)." },
];

/* ───────────────────────── The Penthouse ───────────────────────── */
// Fall photos only, ordered like the Penthouse Airbnb listing (porch & entry, kitchen &
// coffee bar, living room, bedrooms, baths, deck), then the shared Notch photos.

const PENTHOUSE_GALLERY: Photo[] = [
  ...group("Front Porch & Entry", [
    phf("02-porch.jpg", "Front porch"),
    phf("10-porch-door.jpg", "Front porch and entry"),
    phf("01-entry-table.jpg", "Entry table"),
  ]),
  ...group("Kitchen & Coffee Bar", [
    phf("05-kitchen.jpg", "Full kitchen with stainless steel appliances"),
    phf("33-coffee-nook-b.jpg", "Keurig coffee bar"),
    phf("09-island-coffee-living.jpg", "Island, coffee bar and living room"),
    phf("08-kitchen-from-island.jpg", "Granite island with bar seating"),
    phf("06-island.jpg", "Plenty of counter space"),
    phf("29-island-to-stove.jpg", "Island toward the stove"),
  ]),
  ...group("Living Room", [
    phf("13-open-kitchen-living.jpg", "Open kitchen and living area"),
    phf("12-living.jpg", "Living room with a big sectional and deck views"),
    phf("14-fireplace-tv.jpg", "Electric fireplace and Roku Smart TV"),
    phf("07-hallway-to-living.jpg", "Hallway into the living room"),
    phf("16-living-to-kitchen.jpg", "Living room toward the kitchen"),
    phf("15-welcome-table.jpg", "Welcome table for friends and family"),
    phf("17-thermostat-aroma.jpg", "Smart thermostat and Aroma 360 diffuser"),
    phf("20-games-closet.jpg", "Board games for family nights"),
  ]),
  ...group("Bedrooms", [
    phf("21-master-bed.jpg", "Master bedroom: king bed"),
    phf("39-master-to-deck.jpg", "Master bedroom toward the deck"),
    phf("26-master-angle.jpg", "Master bedroom"),
    phf("19-master-dresser.jpg", "Master bedroom TV"),
    phf("22-master-bed-deck.jpg", "Master bedroom: king bed with doors to the deck"),
    phf("28-guest-bed.jpg", "Second bedroom: queen bed"),
    phf("35-guest-bed-wide.jpg", "Second bedroom"),
    phf("37-guest-angle.jpg", "Second bedroom with its own TV"),
    phf("40-guest-dresser-tv.jpg", "Second bedroom TV"),
  ]),
  ...group("Bathrooms & Laundry", [
    phf("27-bath-full.jpg", "Hall bath"),
    phf("24-bath-vanity.jpg", "Bathroom vanity"),
    phf("41-bath-tub.jpg", "Tub/shower combo"),
    phf("31-bath-birds.jpg", "Hall bath with bird prints"),
    phf("03-laundry.jpg", "Washer and dryer"),
  ]),
  ...group("Deck", [
    phf("42-deck-table.jpg", "Deck table"),
    phf("44-deck-sofa.jpg", "Deck seating area"),
    phf("45-deck-view.jpg", "Deck with mountain views"),
    phf("47-deck-pumpkins.jpg", "Deck dressed for fall"),
    phf("46-deck-owl.jpg", "Cozy deck lounge"),
    phf("48-deck-dining.jpg", "Deck dining"),
  ]),
  ...NOTCH_COMMUNITY_PHOTOS,
];

/* ───────────────────────── Rustic Ozark Retreat ───────────────────────── */
// Fall photos only, in the room order of the Rustic Airbnb listing.

const RUSTIC_GALLERY: Photo[] = [
  ...group("Front Porch & Entry", [
    ruf("01-porch.jpg", "Front porch with a wicker sofa"),
    ruf("02-porch-sign.jpg", "Front porch"),
    ruf("03-entry-scarecrows.jpg", "Entry dressed for fall"),
    ruf("08-hallway.jpg", "Hallway with the Neck of the Woods sign"),
  ]),
  ...group("Kitchen & Coffee Bar", [
    ruf("06-kitchen.jpg", "Kitchen with island seating"),
    ruf("48-island-to-coffee.jpg", "Island toward the coffee bar"),
    ruf("43-kitchen-cabinet.jpg", "Dishes ready for family meals"),
    ruf("47-kitchen-stove.jpg", "Stainless steel appliances"),
    ruf("09-coffee-bar.jpg", "Keurig coffee bar"),
  ]),
  ...group("Living Room", [
    ruf("07-drop-leaf.jpg", "Drop-leaf table"),
    ruf("14-thermostat.jpg", "Ecobee smart thermostat"),
    ruf("10-fireplace-tv.jpg", "Electric fireplace and Roku Smart TV"),
    ruf("12-living.jpg", "Living room with rustic lodge decor"),
    ruf("20-living-to-kitchen.jpg", "Living room toward the kitchen"),
  ]),
  ...group("Bedrooms", [
    ruf("18-master-deck.jpg", "Master bedroom: king log bed with doors to the deck"),
    ruf("44-master-bed-front.jpg", "Master bedroom"),
    ruf("17-master-bed.jpg", "Master bedroom: king log bed"),
    ruf("42-master-from-dresser.jpg", "Master bedroom toward the closet"),
    ruf("16-nightstand-usb.jpg", "Nightstand with USB charging"),
    ruf("21-master-dresser.jpg", "Master bedroom TV"),
    ruf("27-guest-bed-window.jpg", "Second bedroom by the window"),
    ruf("23-guest-bed.jpg", "Second bedroom: king log bed"),
    ruf("24-guest-bed-angle.jpg", "Second bedroom"),
    ruf("29-guest-dresser.jpg", "Second bedroom TV"),
  ]),
  ...group("Bathrooms & Laundry", [
    ruf("22-master-bath.jpg", "Master bath"),
    ruf("28-toiletries.jpg", "Toiletries provided"),
    ruf("25-master-bath-hutch.jpg", "Master bath vanity"),
    ruf("31-tub.jpg", "Tub/shower combo"),
    ruf("13-bath-vanity.jpg", "Bathroom vanity"),
    ruf("11-hall-bath.jpg", "Hall bath"),
    ruf("05-laundry.jpg", "Washer and dryer"),
  ]),
  ...group("Deck", [
    ruf("36-deck-sectional.jpg", "Deck sectional with a view"),
    ruf("32-deck-table.jpg", "Deck dining with a view"),
    ruf("37-deck-console.jpg", "Deck console"),
    ruf("34-deck-seating.jpg", "Covered deck with fall garland"),
    ruf("35-deck-dining.jpg", "Deck dining table"),
    ruf("33-deck-tv.jpg", "Deck TV"),
  ]),
  ...NOTCH_COMMUNITY_PHOTOS,
];

/* ───────────────────────── Woodland Retreat ───────────────────────── */
// Fall photos only, ordered like the Woodland Airbnb listing.

const WOODLAND_GALLERY: Photo[] = [
  ...group("Living & Dining", [
    wdf("07.jpg", "Dining table and living room"),
    wdf("31.jpg", "Living room with a sectional and deck doors"),
    wdf("24.jpg", "Living room with Roku Smart TV"),
    wdf("28.jpg", "TV, books and games"),
    wdf("13.jpg", "Dining table for family meals"),
    wdf("03.jpg", "Entry"),
    wdf("09.jpg", "Hallway to the living room"),
  ]),
  ...group("Kitchen & Coffee", [
    wdf("11.jpg", "Full kitchen"),
    wdf("19.jpg", "Mr. Coffee maker and coffee mugs"),
  ]),
  ...group("Bedrooms", [
    wdf("05.jpg", "Bedroom 1: queen bed plus a bunk bed"),
    wdf("06.jpg", "Bedroom 1"),
    wdf("04.jpg", "Bunk bed the kids will love"),
    wdf("15.jpg", "Bedroom 2: king bed"),
    wdf("16.jpg", "Bedroom 2 with a view"),
    wdf("29.jpg", "Bedroom 2: king bed"),
    wdf("25.jpg", "Extra pillows, blankets and a travel crib"),
    wdf("17.jpg", "Bedside charging station"),
    wdf("20.jpg", "Dresser and mirror"),
    wdf("10.jpg", "Bedroom TV"),
  ]),
  ...group("Bathrooms & Laundry", [
    wdf("14.jpg", "Bathroom"),
    wdf("12.jpg", "Bathroom vanity"),
    wdf("26.jpg", "Toiletries provided"),
    wdf("21.jpg", "Hall bath"),
    wdf("02.jpg", "Washer and dryer"),
  ]),
  ...group("Deck", [
    wdf("18.jpg", "Deck dining with a view"),
    wdf("22.jpg", "Deck in the trees"),
    wdf("30.jpg", "Relax on the deck"),
    wdf("23.jpg", "Deck seating"),
    wdf("01.jpg", "Building 14 at Notch Estates"),
  ]),
  ...NOTCH_COMMUNITY_PHOTOS,
];

/* ───────────────────────── Double Condo ───────────────────────── */
// Both-condos photo first (the Double Airbnb cover), then each condo's fall photos in its
// own Airbnb order, then the shared Notch photos.

const DOUBLE_GALLERY: Photo[] = [
  ...group("Both Condos at a Glance", [dc("web/aaa-doublecondo.jpg", "The Penthouse + Rustic Ozark Retreat, booked together")]),
  ...group("The Penthouse (Unit 11)", [
    phf("02-porch.jpg", "Penthouse front porch"),
    phf("33-coffee-nook-b.jpg", "Penthouse Keurig coffee bar"),
    phf("08-kitchen-from-island.jpg", "Penthouse kitchen with granite island"),
    phf("12-living.jpg", "Penthouse living room"),
    phf("14-fireplace-tv.jpg", "Penthouse electric fireplace and Roku Smart TV"),
    phf("22-master-bed-deck.jpg", "Penthouse master: king bed with deck doors"),
    phf("28-guest-bed.jpg", "Penthouse second bedroom: queen bed"),
    phf("27-bath-full.jpg", "Penthouse hall bath"),
    phf("45-deck-view.jpg", "Penthouse deck with mountain views"),
    phf("47-deck-pumpkins.jpg", "Penthouse deck"),
  ]),
  ...group("Rustic Ozark Retreat (Unit 7)", [
    ruf("01-porch.jpg", "Rustic front porch"),
    ruf("06-kitchen.jpg", "Rustic kitchen with island seating"),
    ruf("09-coffee-bar.jpg", "Rustic Keurig coffee bar"),
    ruf("10-fireplace-tv.jpg", "Rustic electric fireplace and Roku Smart TV"),
    ruf("12-living.jpg", "Rustic living room with lodge decor"),
    ruf("18-master-deck.jpg", "Rustic master: king log bed with deck doors"),
    ruf("23-guest-bed.jpg", "Rustic second bedroom: king log bed"),
    ruf("22-master-bath.jpg", "Rustic master bath"),
    ruf("36-deck-sectional.jpg", "Rustic deck sectional"),
    ruf("34-deck-seating.jpg", "Rustic covered deck"),
  ]),
  ...NOTCH_COMMUNITY_PHOTOS,
];

/* ───────────────────────── No-Stairs Condo ───────────────────────── */
// No fall photos yet; ordered like the No-Stairs Airbnb listing.

const NOSTAIRS_GALLERY: Photo[] = [
  ...group("Living Room", [
    sa("00-living-wide.jpg", "Open living room with doors to the deck"),
    sc("aaa-living.jpg", "Freshly remodeled open living room"),
    sc("aaa-living-deck.jpg", "Living room with doors to the deck"),
    sc("07.jpg", "Open living room, kitchen and dining"),
    sc("08.jpg", "Living room toward the kitchen"),
    sa("38-entry-hall.jpg", "Entry hall with coat hooks"),
  ]),
  ...group("Kitchen & Dining", [
    sa("06-kitchen.jpg", "Kitchen with stainless steel appliances"),
    sa("07-island-to-living.jpg", "Granite island open to the living room"),
    sa("08-coffee-station.jpg", "Coffee station with a kettle and mugs"),
    sc("10.jpg", "Remodeled kitchen with bar seating"),
    sc("11.jpg", "Stainless steel appliances"),
    sc("12.jpg", "Kitchen and dining nook"),
  ]),
  ...group("Bedrooms", [
    sa("14-bedroom1-tv.jpg", "Bedroom 1 with a wall-mounted TV"),
    sc("03.jpg", "Bedroom 1: king bed"),
    sa("16-bedroom2-bunk.jpg", "Bedroom 2: double bed and bunk bed"),
    sa("17-bedroom2-bunk-angle.jpg", "Bedroom 2 bunk bed"),
  ]),
  ...group("Bathrooms & Laundry", [
    sa("19-bath1-tub.jpg", "Bathroom 1 with a tub/shower combo"),
    sa("20-bath2.jpg", "Bathroom 2"),
    sc("09.jpg", "Remodeled bathroom"),
    sa("22-laundry.jpg", "Stacked washer and dryer"),
  ]),
  ...group("Porch & Deck", [
    sa("23-front-porch.jpg", "Front porch seating"),
    sa("29-covered-porch.jpg", "Covered porch with string lights"),
    sa("24-deck.jpg", "Deck lounge in the trees"),
    sc("aaa-kitchen.jpg", "Relax on the deck"),
    sa("26-deck-loungers.jpg", "Zero-gravity loungers on the deck"),
  ]),
  ...NOTCH_COMMUNITY_PHOTOS,
];

/* ───────────────────────── Branson Family Haven ───────────────────────── */
// Standalone house in Indian Point (not Notch) — its own photos only.

const HAVEN_GALLERY: Photo[] = [
  ...group("The House", [
    hv("aaa-house.jpg", "Branson Family Haven, with its deck and yard"),
    hv("web/DJI_0197.jpg", "Branson Family Haven from above"),
    ha("07-side-stairs.jpg", "The house from the side"),
  ]),
  ...group("Living, Kitchen & Dining", [
    hv("114C6EBF-D9C1-4E79-8777-DDB797DD6931_1_105_c.jpeg", "Bright, open living, dining and kitchen"),
    ha("26-dining-kitchen.jpg", "Dining table for the whole crew"),
    ha("23-dining-table.jpg", "Dining table set for family meals"),
    ha("25-kitchen-range.jpg", "Full kitchen with Whirlpool range and dishwasher"),
    ha("24-kitchen-sink.jpg", "Kitchen with room to cook for a crowd"),
    ha("21-spiral-staircase.jpg", "Spiral staircase with a warm welcome"),
  ]),
  ...group("Bedrooms", [
    ha("10-bedroom-two-beds.jpg", "Bedroom with two beds"),
    ha("12-bunk-room.jpg", "Bunk room: two bunk beds"),
    ha("13-bedroom-orange.jpg", "Bedroom with an orange quilt"),
    ha("15-bedroom-wood-headboard.jpg", "Bedroom with a wood headboard"),
    ha("16-bedroom-tv.jpg", "Bedroom with its own TV"),
  ]),
  ...group("Bathrooms", [
    ha("17-bath-round-mirror.jpg", "Bathroom with a round mirror"),
    ha("18-bath-floral.jpg", "Bathroom with a floral shower curtain"),
    ha("19-bath-tub.jpg", "Bathroom with a tub/shower combo"),
    ha("20-bath-patterned.jpg", "Bathroom with a patterned shower curtain"),
  ]),
  ...group("Deck & Amenities", [
    ha("08-deck-seating.jpg", "Wicker seating on the deck"),
    ha("05-hot-tub.jpg", "Hot tub"),
    ha("44-pool.jpg", "Community pool"),
    hv("boat-trailer-parking.jpg", "Boat and trailer parking"),
  ]),
  ...group("Around the Neighborhood", [
    ha("04-aerial-neighborhood-lake.jpg", "The neighborhood on the lake"),
    ha("27-aerial-lake.jpg", "Lake and marina views nearby"),
  ]),
];

/* ───────────────────────── Silver Dollar City Adventure Escape (reference) ───────────────────────── */

const KLEIN_GALLERY: Photo[] = [
  ...group("Game Room & Bunk Room", [
    kp("04-gaming-zone-foosball.jpg", "Gaming Zone with foosball"),
    kp("03-arcade-tv-console.jpg", "Classic Galaga arcade game right next to the bunks"),
    kp("01-bunk-game-room-cover.jpg", "Bunk room meets game room, the kids' favorite hangout"),
    kp("23-bunk-room-wide-foosball.jpg", "Bunk room: three bunk beds, foosball and arcade"),
    kp("25-bunk-beanbags.jpg", "Bunk room with comfy beanbag chairs"),
    kp("26-bunks-nightstand.jpg", "Cozy bunks for kids and teens"),
    kp("27-lower-bunk-closeup.jpg", "Bunks made up and ready for the cousins"),
    kp("24-foosball-closeup.jpg", "Foosball face-off, anyone?"),
  ]),
  ...group("Living Room", [
    kp("02-living-room-sectional.jpg", "Living room with a big sectional and doors to the deck"),
    kp("07-open-living-to-dining.jpg", "Open living room flowing into the dining area and kitchen"),
    kp("42-living-wide-to-kitchen.jpg", "Living room open to dining and kitchen"),
    kp("45-leather-sofa.jpg", "Comfy sofa by the deck doors"),
  ]),
  ...group("Kitchen & Dining", [
    kp("08-kitchen-stainless.jpg", "Kitchen with stainless steel appliances"),
    kp("09-kitchen-range-angle.jpg", "Plenty of counter space for cooking for a crowd"),
    kp("43-kitchen-entry-hall.jpg", "Kitchen just off the entry hall"),
    kp("44-coffee-station.jpg", "Coffee station"),
    kp("11-breakfast-bar.jpg", "Breakfast bar seating"),
    kp("10-dining-table.jpg", "Dining table for family meals"),
  ]),
  ...group("Bedrooms", [
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
  ]),
  ...group("Bathrooms & Laundry", [
    kp("28-bath-1-walkin-shower.jpg", "Bathroom 1 with walk-in shower"),
    kp("29-bath-2-vanity.jpg", "Bathroom 2 vanity"),
    kp("30-bath-2-tub-shower.jpg", "Bathroom 2 tub/shower combo"),
    kp("31-bath-3-vanity.jpg", "Bathroom 3 vanity"),
    kp("32-bath-3-tub-shower.jpg", "Bathroom 3 tub/shower combo"),
    kp("33-bath-4-vanity.jpg", "Bathroom 4 vanity"),
    kp("34-bath-4-tub-shower.jpg", "Bathroom 4 tub/shower combo"),
    kp("35-laundry.jpg", "In-unit washer and dryer"),
    kp("46-desk-hello-vignette.jpg", "A warm hello waiting for you"),
  ]),
  ...group("Outdoor Space", [
    kp("05-deck-dining-umbrella.jpg", "Deck dining under the umbrella, tucked into the trees"),
    kp("36-deck-seating-view.jpg", "Deck seating with a treetop view"),
    kp("37-deck-dining-wide.jpg", "Spacious deck with outdoor dining for the crew"),
    kp("38-deck-adirondacks.jpg", "Adirondack chairs on the deck"),
    kp("39-covered-front-patio.jpg", "Large covered front patio"),
    kp("41-covered-walkway-parking.jpg", "Covered walkway with Adirondack chairs"),
    kp("13-front-exterior.jpg", "Your Branson West townhouse with its big covered patio"),
  ]),
  ...group(NOTCH_GROUP, [
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
  ]),
];

/* ───────────────────────── all properties ───────────────────────── */

export const PROPERTY_DETAILS: Record<string, PropertyDetail> = {
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
    amenities: withNotch([
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
      "In-unit washer & dryer",
    ]),
    featurePhoto: phf("45-deck-view.jpg", "Top-floor deck with views over the Ozarks"),
    fun: {
      eyebrow: "Favorite spots",
      title: "Views, Coffee & Cozy Corners",
      intro: "The deck guests rave about, a Keurig coffee bar for slow mornings, and a fireplace for movie nights — plus a fishing lake and playground right in the neighborhood.",
      photos: [
        phf("33-coffee-nook-b.jpg", "Keurig coffee bar, ready for slow mornings"),
        phf("14-fireplace-tv.jpg", "Electric fireplace and Roku Smart TV"),
        phf("12-living.jpg", "Living room with a big sectional"),
        phf("22-master-bed-deck.jpg", "Master bedroom with doors to the deck"),
        phf("47-deck-pumpkins.jpg", "Two seating areas on the deck"),
        ne("03-lake-covered-dock.jpg", "Notch Estates fishing lake with a covered dock"),
        ne("08-playground.jpg", "Children's playground in Notch Estates"),
      ],
    },
    about: {
      groups: [
        {
          title: "Living Room",
          items: [
            "Big sectional with a pull-out sofa bed for extra guests",
            "Electric fireplace and Roku Smart TV",
            "Large windows with Ozark views",
            "Board games for family nights",
          ],
        },
        {
          title: "Kitchen & Coffee Bar",
          items: [
            "Fully stocked kitchen with stainless steel appliances",
            "Granite island with bar seating",
            "Keurig K-Duo Plus coffee bar",
            "Water filter system",
          ],
        },
        {
          title: "Bedrooms & Baths",
          items: [
            "Master: king bed, private bath, TV and doors to the deck",
            "USB and USB-C charging on both sides of the king bed",
            "Second bedroom: queen bed and its own TV",
            "2 full baths",
          ],
        },
        {
          title: "Deck & Porch",
          items: [
            "Oversized top-floor deck with two seating areas and a dining table",
            "Views toward Inspiration Tower at Shepherd of the Hills",
            "Front porch seating",
          ],
        },
        {
          title: "Comforts",
          items: ["In-unit washer & dryer", "Aroma 360 diffuser", "Smart lock self check-in", "High-speed WiFi"],
        },
        NOTCH_ABOUT_GROUP,
      ],
    },
    sleeping: [
      { room: "Bedroom 1 (master)", beds: "King bed" },
      { room: "Bedroom 2", beds: "Queen bed" },
      { room: "Living room", beds: "Sofa bed" },
      { room: "Bathrooms", beds: "2 full baths" },
      { room: "Laundry", beds: "In-unit washer & dryer" },
    ],
    details: [
      { label: "Home", value: "Top-floor condo in Notch Estates, Branson West, MO" },
      { label: "Sleeps", value: "6 · 2 bedrooms · 2 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: NOTCH_GOOD_TO_KNOW,
    gallery: PENTHOUSE_GALLERY,
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
    amenities: withNotch([
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
      "In-unit washer & dryer",
    ]),
    featurePhoto: ruf("36-deck-sectional.jpg", "Covered deck overlooking the Ozarks"),
    fun: {
      eyebrow: "Favorite spots",
      title: "Lodge-Style Favorites",
      intro: "Log beds, a Keurig coffee bar, a fireplace for chilly nights and a big covered deck in the trees — plus a fishing lake and playground right in the neighborhood.",
      photos: [
        ruf("09-coffee-bar.jpg", "Keurig coffee bar"),
        ruf("12-living.jpg", "Living room with rustic lodge decor"),
        ruf("18-master-deck.jpg", "King log bed with doors to the deck"),
        ruf("10-fireplace-tv.jpg", "Electric fireplace and Roku Smart TV"),
        ruf("01-porch.jpg", "Front porch with a wicker sofa"),
        ne("03-lake-covered-dock.jpg", "Notch Estates fishing lake with a covered dock"),
        ne("08-playground.jpg", "Children's playground in Notch Estates"),
      ],
    },
    about: {
      groups: [
        {
          title: "Living Room",
          items: [
            "Rustic timber lodge decor",
            "Electric fireplace and Roku Smart TV",
            "Queen-size pull-out couch",
            "Large windows with Ozark views",
          ],
        },
        {
          title: "Kitchen & Coffee Bar",
          items: [
            "Fully stocked kitchen with stainless steel appliances",
            "Island with bar seating",
            "Keurig K-Duo Plus coffee bar",
          ],
        },
        {
          title: "Bedrooms & Baths",
          items: [
            "Master: king log bed, en-suite bath, TV and deck access",
            "Second bedroom: king log bed and its own TV",
            "Master bath tub/shower; hall bath walk-in shower",
          ],
        },
        {
          title: "Deck & Porch",
          items: [
            "Oversized covered deck with two seating areas",
            "Views including Inspiration Tower at Shepherd of the Hills",
            "Front porch with a wicker sofa",
          ],
        },
        {
          title: "Comforts",
          items: ["Ecobee smart thermostat", "In-unit washer & dryer", "Smart lock self check-in", "High-speed WiFi"],
        },
        NOTCH_ABOUT_GROUP,
      ],
    },
    sleeping: [
      { room: "Bedroom 1 (master)", beds: "King log bed" },
      { room: "Bedroom 2", beds: "King log bed" },
      { room: "Living room", beds: "Queen pull-out couch" },
      { room: "Bathrooms", beds: "2 full baths" },
      { room: "Laundry", beds: "In-unit washer & dryer" },
    ],
    details: [
      { label: "Home", value: "Condo in Notch Estates, Branson West, MO" },
      { label: "Sleeps", value: "6 · 2 bedrooms · 2 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: NOTCH_GOOD_TO_KNOW,
    gallery: RUSTIC_GALLERY,
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
    amenities: withNotch([
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
      "In-unit washer & dryer",
      "Pack 'n play / travel crib",
    ]),
    featurePhoto: wdf("22.jpg", "Covered deck surrounded by trees"),
    fun: {
      eyebrow: "Kids' favorite",
      title: "Bunks, Games & Treetop Views",
      intro: "A bunk room the kids will claim the minute you arrive, games for family nights and a deck in the trees — plus a fishing lake and playground right in the neighborhood.",
      photos: [
        wdf("05.jpg", "Bunk room: queen bed plus a bunk bed"),
        wdf("31.jpg", "Living room with a sectional"),
        wdf("28.jpg", "TV, books and games"),
        wdf("19.jpg", "Mr. Coffee maker and mugs"),
        wdf("15.jpg", "King bedroom"),
        ne("03-lake-covered-dock.jpg", "Notch Estates fishing lake with a covered dock"),
        ne("08-playground.jpg", "Children's playground in Notch Estates"),
      ],
    },
    about: {
      groups: [
        {
          title: "Living & Dining",
          items: [
            "Sectional sofa and Roku Smart TV",
            "Electric fireplace",
            "Dining table for family meals",
            "Board games and books",
          ],
        },
        {
          title: "Kitchen",
          items: [
            "Full kitchen: stove, oven, refrigerator and microwave",
            "Toaster, blender and hot water kettle",
            "Mr. Coffee maker",
          ],
        },
        {
          title: "Bedrooms & Baths",
          items: [
            "Bedroom 1: queen bed plus a bunk bed",
            "Bedroom 2: king bed with room-darkening shades",
            "Pack 'n play / travel crib",
            "2 full baths with shampoo, conditioner and body soap",
          ],
        },
        {
          title: "Deck",
          items: ["Covered deck with a dining table and lounge seating", "Wooded views"],
        },
        {
          title: "Comforts",
          items: ["In-unit washer & dryer", "Smart lock self check-in", "High-speed WiFi"],
        },
        NOTCH_ABOUT_GROUP,
      ],
    },
    sleeping: [
      { room: "Bedroom 1", beds: "Queen bed + bunk bed" },
      { room: "Bedroom 2", beds: "King bed" },
      { room: "Bathrooms", beds: "2 full baths" },
      { room: "Laundry", beds: "In-unit washer & dryer" },
    ],
    details: [
      { label: "Home", value: "Condo in Notch Estates (Building 14), Branson West, MO" },
      { label: "Sleeps", value: "6 · 2 bedrooms · 2 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: NOTCH_GOOD_TO_KNOW,
    gallery: WOODLAND_GALLERY,
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
    amenities: withNotch([
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
      "Two in-unit washers & dryers",
    ]),
    featurePhoto: phf("45-deck-view.jpg", "The Penthouse deck — one of two decks in your Double Condo"),
    fun: {
      eyebrow: "Two condos, one booking",
      title: "Room for the Whole Crew",
      intro: "The Penthouse and Rustic Ozark Retreat sit in the same building, so the group stays close — two kitchens, two coffee bars, two fireplaces and two big decks.",
      photos: [
        dc("web/aaa-doublecondo.jpg", "Both condos, booked together"),
        phf("33-coffee-nook-b.jpg", "Penthouse Keurig coffee bar"),
        ruf("09-coffee-bar.jpg", "Rustic Keurig coffee bar"),
        phf("12-living.jpg", "Penthouse living room"),
        ruf("12-living.jpg", "Rustic living room"),
        ruf("36-deck-sectional.jpg", "Rustic covered deck"),
        ne("03-lake-covered-dock.jpg", "Notch Estates fishing lake with a covered dock"),
        ne("08-playground.jpg", "Children's playground in Notch Estates"),
      ],
    },
    about: {
      groups: [
        {
          title: "Two Condos, One Booking",
          items: [
            "The Penthouse (Unit 11) + Rustic Ozark Retreat (Unit 7), same building",
            "4 bedrooms and 4 baths across both condos",
            "Two full kitchens with stainless steel appliances",
            "Two Keurig coffee bars and two electric fireplaces",
          ],
        },
        {
          title: "The Penthouse",
          items: [
            "Master: king bed, private bath and deck doors",
            "Second bedroom: queen bed",
            "Pull-out sofa bed in the living room",
            "Top-floor deck with mountain views",
          ],
        },
        {
          title: "Rustic Ozark Retreat",
          items: [
            "Master: king log bed, en-suite bath and deck access",
            "Second bedroom: king log bed",
            "Queen pull-out couch in the living room",
            "Covered deck with two seating areas",
          ],
        },
        {
          title: "Comforts",
          items: ["Two in-unit washers & dryers", "Roku Smart TVs", "Smart lock self check-in", "High-speed WiFi"],
        },
        NOTCH_ABOUT_GROUP,
      ],
    },
    sleeping: [
      { room: "Penthouse bedroom 1", beds: "King bed" },
      { room: "Penthouse bedroom 2", beds: "Queen bed" },
      { room: "Penthouse living room", beds: "Sofa bed" },
      { room: "Rustic bedroom 1", beds: "King log bed" },
      { room: "Rustic bedroom 2", beds: "King log bed" },
      { room: "Rustic living room", beds: "Queen pull-out couch" },
      { room: "Bathrooms", beds: "4 full baths" },
    ],
    details: [
      { label: "Home", value: "Two condos in Notch Estates (Building 9), Branson West, MO" },
      { label: "Sleeps", value: "12+ · 4 bedrooms · 4 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: NOTCH_GOOD_TO_KNOW,
    gallery: DOUBLE_GALLERY,
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
    featurePhoto: hv("aaa-house.jpg", "Branson Family Haven, with its big deck and yard"),
    about: {
      groups: [
        {
          title: "The House",
          items: [
            "Standalone 5-bedroom, 4-bath house",
            "Private yard and deck",
            "Bright, open living, dining and kitchen",
            "Board games for family nights",
          ],
        },
        {
          title: "Kitchen",
          items: [
            "Full kitchen with Whirlpool range",
            "Dishwasher and microwave",
            "Coffee maker, toaster and blender",
            "Dining table for the whole crew",
          ],
        },
        {
          title: "Outdoors",
          items: ["Gas BBQ grill", "Fire pit", "Outdoor furniture"],
        },
        {
          title: "Community",
          items: ["2 community pools + hot tub", "Playground", "Boat & trailer parking"],
        },
      ],
    },
    sleeping: [
      { room: "Bedroom 1", beds: "King bed" },
      { room: "Bedroom 2", beds: "Two bunk beds" },
      { room: "Bedroom 3", beds: "King bed" },
      { room: "Bedroom 4", beds: "Two queen beds" },
      { room: "Bedroom 5", beds: "Queen bed" },
      { room: "Bathrooms", beds: "4 baths" },
      { room: "Laundry", beds: "In-unit washer & dryer" },
    ],
    details: [
      { label: "Home", value: "Standalone house in Branson, MO" },
      { label: "Sleeps", value: "16 · 5 bedrooms · 4 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: [
      { label: "Parking", text: "Boat and trailer parking is available." },
      { label: "Neighborhood", text: "Residential neighborhood — quiet hours are 10 PM – 8 AM." },
      { label: "Smoking", text: "No smoking or vaping inside the house or on the decks." },
    ],
    gallery: HAVEN_GALLERY,
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
    amenities: withNotch([
      "High-speed WiFi",
      "Full kitchen",
      "Smart TV",
      "Pool access",
      "Private lake",
      "Playground",
      "Deck/patio",
      "Charcoal BBQ grills",
      "Coin laundry on property",
    ]),
    // No Airbnb/VRBO card to show in the hero yet, so the hero shows a photo instead.
    heroPhoto: sc("aaa-living.jpg", "Freshly remodeled open living room"),
    featurePhoto: sc("aaa-living-deck.jpg", "Open living room with doors to the deck"),
    fun: {
      eyebrow: "Easy living",
      title: "Fresh Remodel, No Stairs",
      intro: "Walk right in — no stairs to haul luggage, strollers or coolers. Then enjoy the Notch Estates pool, fishing lake, trail and playground.",
      photos: [
        sa("00-living-wide.jpg", "Open living room with doors to the deck"),
        sc("10.jpg", "Remodeled kitchen with bar seating"),
        sa("08-coffee-station.jpg", "Coffee station with a kettle and mugs"),
        sc("03.jpg", "Bedroom 1: king bed"),
        sa("16-bedroom2-bunk.jpg", "Bedroom 2: double bed and bunk bed"),
        sa("17-bedroom2-bunk-angle.jpg", "Bedroom 2 bunk bed"),
        sa("19-bath1-tub.jpg", "Bathroom 1 with a tub/shower combo"),
        sa("24-deck.jpg", "Deck lounge in the trees"),
        sc("aaa-kitchen.jpg", "Relax on the deck"),
      ],
    },
    about: {
      groups: [
        {
          title: "Easy Access",
          items: [
            "First-floor condo — no stairs into the unit",
            "Private entrance with smart lock self check-in",
            "Free parking right outside",
          ],
        },
        {
          title: "Living & Kitchen",
          items: [
            "Freshly remodeled open living room with a Smart TV",
            "Full kitchen: stainless oven, microwave, toaster and kettle",
            "Drip coffee maker",
            "Dining table",
          ],
        },
        {
          title: "Bedrooms & Baths",
          items: [
            "Bedroom 1: king bed",
            "Bedroom 2: double bed plus a bunk bed (no children under 6 on the top bunk)",
            "2 full baths with hair dryers",
          ],
        },
        { title: "Outdoor Space", items: ["Back deck"] },
        NOTCH_ABOUT_GROUP,
      ],
    },
    sleeping: [
      { room: "Bedroom 1", beds: "King bed" },
      { room: "Bedroom 2", beds: "Double bed + bunk bed" },
      { room: "Bathrooms", beds: "2 full baths" },
    ],
    details: [
      { label: "Home", value: "First-floor condo in Notch Estates, Branson West, MO" },
      { label: "Sleeps", value: "6 · 2 bedrooms · 2 baths" },
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: NOTCH_GOOD_TO_KNOW,
    gallery: NOSTAIRS_GALLERY,
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
    heroPhoto: {
      url: `${KLEIN_DIR}/aaa-bunk-game-room.jpg`,
      caption: "Bunk room meets game room, with comfy beanbags and a classic Galaga arcade",
    },
    featurePhoto: kp("aaa-open-living.jpg", "Open living room flowing into the dining area and kitchen"),
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
      eyebrow: "Game on",
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
          items: ["Classic Galaga arcade game and a foosball table", "Three bunk beds plus beanbag chairs"],
        },
        {
          title: "Living Room",
          items: ["Big sectional for movie nights", "Open to the kitchen and dining area, with doors to the deck"],
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
          items: ["Deck with umbrella dining, tucked into the trees", "Large covered front patio"],
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
      CHECK_IN,
      CHECK_OUT,
      HOSTS,
    ],
    goodToKnow: [
      { label: "Parking", text: "Parking is available in front of the unit." },
      { label: "Trash", text: "Take all trash out to the dumpster." },
    ],
    gallery: KLEIN_GALLERY,
  },
};
