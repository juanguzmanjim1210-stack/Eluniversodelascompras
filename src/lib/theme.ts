/**
 * Colores del logo de la tienda (emblema azul y dorado con detalles rojos y amarillos).
 * Medidos sobre los píxeles reales del logo, no estimados a ojo.
 */
export const LOGO = {
  navy: "#0a1a5c", // fondo profundo del cosmos
  blue: "#0b44b7", // azul real del emblema
  sky: "#1784e6", // azul brillante de los destellos
  red: "#f02436", // los dos puntos rojos y la bandera
  gold: "#d4a62a", // aro exterior
  yellow: "#fde047", // el globo
} as const;

import type { AppearancePalette, AppearanceSettings } from "@/lib/types";

/** Apariencia por defecto: la que trae el catálogo si nadie la ha tocado. */
export const DEFAULT_APPEARANCE: AppearanceSettings = {
  palette: { navy: "#0a1a5c", blue: "#0b44b7", sky: "#1784e6", red: "#f02436", gold: "#d4a62a", yellow: "#fde047" },
  tricolor: true,
  stars: true,
  titleGradient: true,
  logoFloat: true,
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Acepta el JSON guardado en la base de datos o el objeto ya interpretado. */
export function normalizeAppearance(raw: unknown): AppearanceSettings {
  const d = DEFAULT_APPEARANCE;
  let src: Record<string, unknown> = {};
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") src = parsed as Record<string, unknown>;
    } catch { /* JSON roto: se usan los valores por defecto */ }
  } else if (raw && typeof raw === "object") {
    src = raw as Record<string, unknown>;
  }
  const p = (src.palette ?? {}) as Partial<AppearancePalette>;
  const hex = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v) ? v : fb);
  const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);
  return {
    palette: {
      navy: hex(p.navy, d.palette.navy),
      blue: hex(p.blue, d.palette.blue),
      sky: hex(p.sky, d.palette.sky),
      red: hex(p.red, d.palette.red),
      gold: hex(p.gold, d.palette.gold),
      yellow: hex(p.yellow, d.palette.yellow),
    },
    tricolor: bool(src.tricolor, d.tricolor),
    stars: bool(src.stars, d.stars),
    titleGradient: bool(src.titleGradient, d.titleGradient),
    logoFloat: bool(src.logoFloat, d.logoFloat),
  };
}

/** Verde que traía la tienda por defecto (el que nunca se cambió). */
export const LEGACY_GREEN = "#16a34a";

/** ¿El color guardado sigue siendo el verde original (nadie lo personalizó)? */
export function isLegacyGreen(color?: string | null): boolean {
  return !color || color.trim().toLowerCase() === LEGACY_GREEN;
}

/**
 * Color principal de la tienda. Si el administrador nunca eligió uno propio
 * (sigue el verde de fábrica) se usa el azul del logo; si eligió otro, se respeta.
 */
export function resolveBrand(color?: string | null): string {
  return isLegacyGreen(color) ? LOGO.blue : (color as string);
}

/** Color de la barra de anuncios: rojo del logo salvo que se haya personalizado. */
export function resolveAnnouncement(color?: string | null): string {
  return isLegacyGreen(color) ? LOGO.red : (color as string);
}

/** Atajos de color para los selectores del panel de administración. */
export const LOGO_SWATCHES = [
  { name: "Azul", hex: LOGO.blue },
  { name: "Azul cielo", hex: LOGO.sky },
  { name: "Azul marino", hex: LOGO.navy },
  { name: "Rojo", hex: LOGO.red },
  { name: "Dorado", hex: LOGO.gold },
  { name: "Amarillo", hex: LOGO.yellow },
] as const;
