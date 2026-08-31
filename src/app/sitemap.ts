import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://ag-legal.com.co", changeFrequency: "monthly", priority: 1 }];
}
