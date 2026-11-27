import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import ButtonEffects from "@/components/ButtonEffects";
import "./globals.css";

/* Tipografía autoalojada por Next en el build: sin peticiones a Google en
   tiempo de visita, y con `display: swap` el texto se ve desde el primer momento. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jakarta",
});

const SITE_URL = "https://eluniversodelascompras-alpha.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "El Universo de las Compras — Catálogo en línea",
    template: "%s · El Universo de las Compras",
  },
  description:
    "Catálogo de productos con búsqueda en tiempo real, variantes de talla y color, galería de hasta 10 fotos y panel de administración seguro. Pedidos directos por WhatsApp.",
  keywords: [
    "catálogo en línea",
    "tienda online",
    "catálogo de productos",
    "variantes talla color",
    "panel de administración",
    "WhatsApp pedidos",
  ],
  applicationName: "El Universo de las Compras",
  authors: [{ name: "El Universo de las Compras" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "El Universo de las Compras",
    title: "El Universo de las Compras — Catálogo en línea",
    description:
      "Catálogo de productos con búsqueda en tiempo real, variantes de talla y color y pedidos directos por WhatsApp.",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Universo de las Compras — Catálogo en línea",
    description:
      "Catálogo de productos con búsqueda en tiempo real, variantes de talla y color y pedidos directos por WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <head>
        {/* Las fotos viven en imgbb: abrir la conexión antes acelera la primera imagen */}
        <link rel="preconnect" href="https://i.ibb.co" />
        <link rel="dns-prefetch" href="https://i.ibb.co" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <ButtonEffects />
      </body>
    </html>
  );
}
