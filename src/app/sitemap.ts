import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const publicRoutes = [
  "",
  "/projects",
  "/submit",
  "/leaderboard",
  "/network",
  "/wallet",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((path) => ({
    changeFrequency: path === "" ? "daily" : "weekly",
    lastModified,
    priority: path === "" ? 1 : 0.8,
    url: `${siteConfig.url}${path}`,
  }));
}
