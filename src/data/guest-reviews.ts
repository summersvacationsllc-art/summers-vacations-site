/**
 * Real 5-star guest reviews shown in the homepage "Guests keep coming back" strip.
 *
 * REAL REVIEWS ONLY — copied verbatim from the public review pages listed in
 * `sourceUrl` (read-only; nothing is changed on Airbnb/VRBO/Guesty). Long reviews
 * are trimmed at a sentence boundary and end with " …" (`trimmed: true`); the
 * guest's words are never reworded. Guest first name as shown on the platform.
 *
 * Refresh: re-read each listing's public reviews, keep only 5-star reviews,
 * newest first, ~12–20 total, and update `date` (YYYY-MM-DD, review posted date
 * in UTC from the platform) + `reviewId` for each.
 *
 * Exclusions (on purpose):
 *  - No-Stairs Condo: every public Airbnb review (latest Sept 2026) predates our
 *    management (listing joined us Oct 2026) — previous host's reviews.
 *  - Silver Dollar City Adventure Escape: Coming Soon; any reviews would be the
 *    previous manager's.
 *  - VRBO: review text isn't readable without logging in / is rate-limited for
 *    automated reads, so none are included yet. Google: no listing reviews wired up.
 *
 * Last refreshed: 2026-10-08 from the public Airbnb listing review pages.
 */

export type GuestReview = {
  id: string;
  name: string;
  /** YYYY-MM-DD, date the review was posted on the platform */
  date: string;
  rating: 5;
  platform: "Airbnb" | "Vrbo" | "Google";
  /** Guest-facing home name */
  home: string;
  /** Verbatim guest words; " …" marks a trim */
  quote: string;
  trimmed: boolean;
  sourceUrl: string;
  reviewId: string;
};

export const GUEST_REVIEWS_REFRESHED = "2026-10-08";

/** Newest first. */
export const GUEST_REVIEWS: GuestReview[] = [
  {
    id: "airbnb-1790600212953125274",
    name: "Tia",
    date: "2026-10-06",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "The place was a great location away from how busy Branson can be. The back deck was incredible with a great view we even seen some wild life!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1790600212953125274",
  },
  {
    id: "airbnb-1790027342163015316",
    name: "Rick",
    date: "2026-10-05",
    rating: 5,
    platform: "Airbnb",
    home: "Branson Family Haven",
    quote: "Nice, clean house with comfortable beds and plenty of bathrooms.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1622735625063665266/reviews",
    reviewId: "1790027342163015316",
  },
  {
    id: "airbnb-1789952208647444062",
    name: "Loretta",
    date: "2026-10-05",
    rating: 5,
    platform: "Airbnb",
    home: "Woodland Retreat",
    quote: "Our stay was wonderful!!! We will be back!!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1287974404964958218/reviews",
    reviewId: "1789952208647444062",
  },
  {
    id: "airbnb-1789371763322825048",
    name: "Samantha",
    date: "2026-10-04",
    rating: 5,
    platform: "Airbnb",
    home: "Double Condo",
    quote: "The place was great for me and my family! We were very comfortable and liked that we had separate places but could come together when we wanted to. Brian was easy to get a hold of and was quick in responding to any issues or questions we had. If we are ever in that area we'd definitely stay again!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1365192095570273110/reviews",
    reviewId: "1789371763322825048",
  },
  {
    id: "airbnb-1784179168410000782",
    name: "Nicole",
    date: "2026-09-27",
    rating: 5,
    platform: "Airbnb",
    home: "Woodland Retreat",
    quote: "Great place! Clean and peaceful but not far from the fun of all Branson has to offer. We will definitely be back!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1287974404964958218/reviews",
    reviewId: "1784179168410000782",
  },
  {
    id: "airbnb-1782708149130478862",
    name: "Cody",
    date: "2026-09-25",
    rating: 5,
    platform: "Airbnb",
    home: "The Penthouse",
    quote: "Very beautiful place and very close to Silver Dollar City which made it an awesome place! Would highly recommend!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/866812230966422815/reviews",
    reviewId: "1782708149130478862",
  },
  {
    id: "airbnb-1781202567041653726",
    name: "Andrew",
    date: "2026-09-23",
    rating: 5,
    platform: "Airbnb",
    home: "The Penthouse",
    quote: "We really enjoyed our stay! The room was beautifully decorated, and the balcony was so quiet and peaceful. Excellent hosts!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/866812230966422815/reviews",
    reviewId: "1781202567041653726",
  },
  {
    id: "airbnb-1779758208391196730",
    name: "Patrice",
    date: "2026-09-21",
    rating: 5,
    platform: "Airbnb",
    home: "Branson Family Haven",
    quote: "My family and I do a family trip to Branson every year, and well, this time we decided to do an Airbnb, and when I say it did not disappoint, we are already planning a couples trip and we’re booking it again. …",
    trimmed: true,
    sourceUrl: "https://www.airbnb.com/rooms/1622735625063665266/reviews",
    reviewId: "1779758208391196730",
  },
  {
    id: "airbnb-1779097909827261481",
    name: "Jennifer",
    date: "2026-09-20",
    rating: 5,
    platform: "Airbnb",
    home: "Woodland Retreat",
    quote: "Condo was cozy and exactly what we were looking for!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1287974404964958218/reviews",
    reviewId: "1779097909827261481",
  },
  {
    id: "airbnb-1779010067986326386",
    name: "Candace",
    date: "2026-09-20",
    rating: 5,
    platform: "Airbnb",
    home: "The Penthouse",
    quote: "Loved staying here with my family! Exactly as described! Will definitely be coming back in the future! I felt safe and at peace each day! Thanks again!",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/866812230966422815/reviews",
    reviewId: "1779010067986326386",
  },
  {
    id: "airbnb-1779000417316426914",
    name: "Tristan",
    date: "2026-09-20",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "We had a great night here. Unfortunately, we didn't get to check in until late so we really only slept here. It was such a cute place to stay and beautiful morning views! Brian was very kind to let us check out an hour late. This place will stay on my favorite list when we return.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1779000417316426914",
  },
  {
    id: "airbnb-1778305713376140461",
    name: "Zachary",
    date: "2026-09-19",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "Very informative host and great decorations",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1778305713376140461",
  },
  {
    id: "airbnb-1777643138451461888",
    name: "Janet",
    date: "2026-09-18",
    rating: 5,
    platform: "Airbnb",
    home: "Woodland Retreat",
    quote: "Very happy with this property. First time using and Air B and B. Very pleased with the experience. House was clean and everything we needed was there.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/1287974404964958218/reviews",
    reviewId: "1777643138451461888",
  },
  {
    id: "airbnb-1776825137205930345",
    name: "Debbie",
    date: "2026-09-17",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "This place was excellent. Very convenient to local activities. Very quiet and serene area. Host was very responsive and detail oriented. Great instructions! Would highly recommend and will definitely stay here when we travel to Branson.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1776825137205930345",
  },
  {
    id: "airbnb-1774651733044309365",
    name: "Becky",
    date: "2026-09-14",
    rating: 5,
    platform: "Airbnb",
    home: "The Penthouse",
    quote: "Beautiful mountain views and a wonderfully peaceful stay. The hosts were incredibly attentive and worked hard to make sure everything was to our liking. Thank you for a wonderful stay! We would definitely rent again if in the area.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/866812230966422815/reviews",
    reviewId: "1774651733044309365",
  },
  {
    id: "airbnb-1773980484709664339",
    name: "Michelle",
    date: "2026-09-13",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "Brian’s place was quiet and beautiful. I nice place to relax and close enough to things in Branson to get where you want to go. He was very responsive and kind and their guide was very informative. We really enjoyed our stay here and would stay here again if the need arises.",
    trimmed: false,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1773980484709664339",
  },
  {
    id: "airbnb-1524133474225418876",
    name: "Krystal",
    date: "2025-10-03",
    rating: 5,
    platform: "Airbnb",
    home: "Woodland Retreat",
    quote: "We loved our time at Branson West! The place was spotless and the surroundings were absolutely beautiful. The deck was a favorite of ours and my daughter loved watching the deer frolic in the woods each morning. Our hosts were quick to respond and very friendly. …",
    trimmed: true,
    sourceUrl: "https://www.airbnb.com/rooms/1287974404964958218/reviews",
    reviewId: "1524133474225418876",
  },
  {
    id: "airbnb-1479849446996426101",
    name: "Gary",
    date: "2025-08-03",
    rating: 5,
    platform: "Airbnb",
    home: "Rustic Ozark Retreat",
    quote: "We had a great stay at Brian's place. The property was as advertised and everything worked as expected. We enjoyed the view and had an added bonus as we could see the fireworks from Silver Dollar City from the deck. …",
    trimmed: true,
    sourceUrl: "https://www.airbnb.com/rooms/864359255098863365/reviews",
    reviewId: "1479849446996426101",
  },
  {
    id: "airbnb-1474795464586581446",
    name: "Aaron",
    date: "2025-07-27",
    rating: 5,
    platform: "Airbnb",
    home: "Double Condo",
    quote: "Brian’s place is awesome for a larger family to get together for a great time. Condos were clean well stocked and very comfortable and accommodating for the whole family. Fantastic hiking in the area and close to SDC! Only 15 min to everything in. …",
    trimmed: true,
    sourceUrl: "https://www.airbnb.com/rooms/1365192095570273110/reviews",
    reviewId: "1474795464586581446",
  },
  {
    id: "airbnb-1456002015972021549",
    name: "Jennifer",
    date: "2025-07-01",
    rating: 5,
    platform: "Airbnb",
    home: "The Penthouse",
    quote: "We enjoyed a wonderful week at Brian’s place! Check-in and out went seamlessly, and the place was very cozy and clean. We loved the location…close to all of the fun of SDC and the Branson Strip, but still felt like a secluded mountain get-away! …",
    trimmed: true,
    sourceUrl: "https://www.airbnb.com/rooms/866812230966422815/reviews",
    reviewId: "1456002015972021549",
  },
];
