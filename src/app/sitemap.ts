import type { MetadataRoute } from "next";

/* La URL de producción la fija Vercel (varios dominios suben y bajan con cada
   despliegue), así que sale del entorno y solo se usa como último recurso. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ??
  "https://eluniversodelascompras-alpha.vercel.app").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/#productos`, lastModified, changeFrequency: "daily", priority: 0.8 },
  ];
}
