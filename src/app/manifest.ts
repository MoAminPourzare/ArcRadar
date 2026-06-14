import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#02071a",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/brand/arcradar-mark-192.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/brand/arcradar-mark-512.png",
        type: "image/png",
      },
    ],
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#02071a",
  };
}
