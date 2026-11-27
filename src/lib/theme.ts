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
