import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["edge-tts-universal"],
  async headers() {
    return [
      {
        source: "/jeb",
        headers: [{ key: "Permissions-Policy", value: "microphone=(self)" }],
      },
    ];
  },
};

export default nextConfig;
