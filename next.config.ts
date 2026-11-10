import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["edge-tts-universal"],
  async redirects() {
    // Short, shareable booking links for print/marketing (business cards etc.).
    // Temporary (307) so the target can change later without browser caching.
    const doubleCondoBooking =
      "https://notchcondos.guestybookings.com/properties/68eeb561cce11f00119cac37" +
      "?utm_source=short_link&utm_medium=print&utm_campaign=double_condo";
    return [
      ...["/doublecondo", "/DoubleCondo", "/double-condo", "/book/double-condo"].map(
        (source) => ({ source, destination: doubleCondoBooking, permanent: false }),
      ),
      // Klein listing renamed: old property URL moves permanently (308).
      {
        source: "/property/silver-dollar-city-adventure-escape",
        destination: "/property/silver-dollar-adventure-escape",
        permanent: true,
      },
      {
        source: "/property/scotts-unit",
        destination: "/property/remodeled-condo",
        permanent: true,
      },
      {
        source: "/guidebook/scotts-unit",
        destination: "/guidebook/remodeled-condo",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [{ source: "/owners", destination: "/owners.html" }];
  },
  async headers() {
    return [
      {
        source: "/jeb",
        headers: [{ key: "Permissions-Policy", value: "microphone=(self)" }],
      },
      {
        source: "/kiosk.html",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      {
        source: "/reports/kiosks",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/kiosk-version.json",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
