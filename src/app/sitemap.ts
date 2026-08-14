import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://aglegal.restaurar.co", changeFrequency: "monthly", priority: 1 }];
}
