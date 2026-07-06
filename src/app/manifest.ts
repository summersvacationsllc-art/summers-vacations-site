import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Summers Stay — Guest App",
    short_name: "Summers Stay",
    description:
      "Your personal guidebook for your Summers Vacations stay in Branson, MO.",
    start_url: "/guidebook/the-penthouse",
    display: "standalone",
    background_color: "#f8f7f4",
    theme_color: "#1a1a2e",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-192.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
