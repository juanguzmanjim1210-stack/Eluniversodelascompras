/** Paleta tomada de los píxeles del logo. */
export interface AppearancePalette {
  navy: string;
  blue: string;
  sky: string;
  red: string;
  gold: string;
  yellow: string;
}

/** Elementos nuevos del catálogo que el administrador puede encender o apagar. */
export interface AppearanceSettings {
  palette: AppearancePalette;
  /** Franja amarillo · azul · rojo bajo la portada. */
  tricolor: boolean;
  /** Campo de estrellas del fondo «cosmos» (solo sin imagen de portada). */
  stars: boolean;
  /** Título de la tienda en degradé blanco → crema. */
  titleGradient: boolean;
  /** Vuelo, órbita y sombra del logo. */
  logoFloat: boolean;
}

export interface StoreSettings {
  id: number;
  storeName: string;
  storeDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  facebook: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  primaryColor: string;
  buttonText: string;
  currency: string;
  footerText: string | null;
  footerLogoUrl: string | null;
  footerName: string | null;
  footerColor: string;
  announcementText: string | null;
  announcementActive: boolean;
  announcementColor: string;
  announcementSpeed: number;
  warrantyType: string;
  warrantyText: string | null;
  warrantyImages: string | null;
  updatedAt: string;
  appearance: AppearanceSettings;
}

export interface Category { id: string; name: string; description: string | null; createdAt: string; }
export interface ProductImage { id: string; productId: string; url: string; sortOrder: number; createdAt: string; }
export interface ProductFeature { id: string; productId: string; key: string; value: string; }
export interface ProductVariant { id: string; productId: string; color: string | null; size: string | null; price: string; stock: number; sku: string | null; }
export interface Product { id: string; name: string; description: string | null; categoryId: string | null; basePrice: string; comparePrice: string | null; stock: number; badge: string | null; badgeColor: string; sortOrder: number; active: boolean; createdAt: string; updatedAt: string; images: ProductImage[]; features: ProductFeature[]; variants: ProductVariant[]; }
export interface CartItem { product: Product; variant: ProductVariant | null; quantity: number; }
export interface CustomerData { fullName: string; whatsapp: string; city: string; department: string; address: string; }
