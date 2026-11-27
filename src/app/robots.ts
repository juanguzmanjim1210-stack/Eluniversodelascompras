import type { MetadataRoute } from "next";

/* La URL de producción la fija Vercel (varios dominios suben y bajan con cada
   despliegue), así que sale del entorno y solo se usa como último recurso. */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ??
  "https://eluniversodelascompras-alpha.vercel.app").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
