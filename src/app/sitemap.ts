import type { MetadataRoute } from "next";

const SITE_URL = "https://eluniversodelascompras-alpha.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/#productos`, lastModified, changeFrequency: "daily", priority: 0.8 },
  ];
}
