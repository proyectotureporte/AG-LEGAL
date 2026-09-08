import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://aglegal.com.co", changeFrequency: "monthly", priority: 1 }];
}
