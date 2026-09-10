import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["edge-tts-universal"],
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
        source: "/kiosk-version.json",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
