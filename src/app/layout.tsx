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

export const metadata: Metadata = {
  title: "Catálogo en Línea",
  description: "Catálogo de productos con panel de administración",
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
