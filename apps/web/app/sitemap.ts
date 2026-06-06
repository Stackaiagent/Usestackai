import type { MetadataRoute } from "next";

const SITE_URL = "https://usestackai.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/install`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
