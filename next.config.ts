import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
