/* 
  Data layer — PostgreSQL via Drizzle ORM (Neon/PostgreSQL)
*/
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, ilike, desc } from "drizzle-orm";

// ===================== STORE SETTINGS =====================

export async function getStoreSettings() {
  const [row] = await db.select().from(schema.storeSettings).where(eq(schema.storeSettings.id, 1));
  if (!row) {
    const [created] = await db.insert(schema.storeSettings).values({ id: 1, storeName: "Mi Tienda" }).returning();
    return created;
  }
  return row;
}

export async function updateStoreSettings(data: Record<string, unknown>) {
  const clean = {
    storeName: (data.storeName as string) || "Mi Tienda",
    storeDescription: (data.storeDescription as string) || null,
    logoUrl: (data.logoUrl as string) || null,
    coverUrl: (data.coverUrl as string) || null,
    facebook: (data.facebook as string) || null,
    whatsapp: (data.whatsapp as string) || null,
    instagram: (data.instagram as string) || null,
    tiktok: (data.tiktok as string) || null,
    primaryColor: (data.primaryColor as string) || "#16a34a",
    buttonText: (data.buttonText as string) || "Comprar",
    currency: (data.currency as string) || "$",
    footerText: (data.footerText as string) || null,
    footerLogoUrl: (data.footerLogoUrl as string) || null,
    footerName: (data.footerName as string) || null,
    footerColor: (data.footerColor as string) || "#111827",
    announcementText: (data.announcementText as string) || null,
    announcementActive: (data.announcementActive as boolean) ?? false,
    announcementColor: (data.announcementColor as string) || "#16a34a",
    announcementSpeed: (data.announcementSpeed as number) || 40,
    updatedAt: new Date(),
  };

  const existing = await db.select().from(schema.storeSettings).where(eq(schema.storeSettings.id, 1));
  if (existing.length > 0) {
    const [row] = await db.update(schema.storeSettings).set(clean).where(eq(schema.storeSettings.id, 1)).returning();
    return row;
  }
  const [row] = await db.insert(schema.storeSettings).values({ id: 1, storeName: clean.storeName }).returning();
  return row;
}

// ===================== CATEGORIES =====================

export async function getCategories() {
  return db.select().from(schema.categories).orderBy(schema.categories.name);
}

export async function createCategory(body: { name: string; description?: string }) {
  const [row] = await db.insert(schema.categories).values({ name: body.name, description: body.description || null }).returning();
  return row;
}

export async function deleteCategory(id: string) {
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
}

// ===================== PRODUCTS =====================

async function enrichProduct(id: string, data: Record<string, unknown>) {
  const images = await db.select().from(schema.productImages).where(eq(schema.productImages.productId, id)).orderBy(schema.productImages.sortOrder);
  const features = await db.select().from(schema.productFeatures).where(eq(schema.productFeatures.productId, id));
  const variants = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, id));
  return { id, ...data, images, features, variants };
}

export async function getProducts(filters: { categoryId?: string; search?: string; active?: boolean }) {
  const conditions = [];
  if (filters.categoryId) conditions.push(eq(schema.products.categoryId, filters.categoryId));
  if (filters.active) conditions.push(eq(schema.products.active, true));
  if (filters.search) conditions.push(ilike(schema.products.name, `%${filters.search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select().from(schema.products).where(where).orderBy(schema.products.sortOrder, desc(schema.products.createdAt));
  return Promise.all(rows.map((r) => enrichProduct(r.id, r as unknown as Record<string, unknown>)));
}

export async function getProduct(id: string) {
  const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id));
  if (!row) return null;
  return enrichProduct(id, row as unknown as Record<string, unknown>);
}

export async function createProduct(body: Record<string, unknown>) {
  const [row] = await db.insert(schema.products).values({
    name: (body.name as string) || "Producto",
    description: (body.description as string) || null,
    categoryId: (body.categoryId as string) || null,
    basePrice: (body.basePrice as string) || "0",
    comparePrice: (body.comparePrice as string) || null,
    stock: (body.stock as number) ?? 0,
    badge: (body.badge as string) || null,
    badgeColor: (body.badgeColor as string) || "#f59e0b",
    sortOrder: (body.sortOrder as number) ?? 0,
    active: (body.active as boolean) ?? true,
  }).returning();
  return row;
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  const [row] = await db.update(schema.products).set({
    name: (body.name as string) || "Producto",
    description: (body.description as string) || null,
    categoryId: (body.categoryId as string) || null,
    basePrice: (body.basePrice as string) || "0",
    comparePrice: (body.comparePrice as string) || null,
    stock: (body.stock as number) ?? 0,
    badge: (body.badge as string) || null,
    badgeColor: (body.badgeColor as string) || "#f59e0b",
    sortOrder: (body.sortOrder as number) ?? 0,
    active: (body.active as boolean) ?? true,
    updatedAt: new Date(),
  }).where(eq(schema.products.id, id)).returning();
  return row;
}

export async function deleteProduct(id: string) {
  await db.delete(schema.products).where(eq(schema.products.id, id));
}

// ===================== IMAGES =====================

export async function setProductImages(productId: string, urls: string[]) {
  await db.delete(schema.productImages).where(eq(schema.productImages.productId, productId));
  const created = [];
  for (let i = 0; i < urls.length; i++) {
    const [img] = await db.insert(schema.productImages).values({ productId, url: urls[i].trim(), sortOrder: i }).returning();
    created.push(img);
  }
  return created;
}

export async function deleteProductImage(productId: string, imageId: string) {
  await db.delete(schema.productImages).where(and(eq(schema.productImages.id, imageId), eq(schema.productImages.productId, productId)));
}

// ===================== FEATURES =====================

export async function addProductFeature(productId: string, key: string, value: string) {
  const [row] = await db.insert(schema.productFeatures).values({ productId, key, value }).returning();
  return row;
}

export async function deleteProductFeature(productId: string, featureId: string) {
  await db.delete(schema.productFeatures).where(and(eq(schema.productFeatures.id, featureId), eq(schema.productFeatures.productId, productId)));
}

// ===================== VARIANTS =====================

export async function addProductVariant(productId: string, body: Record<string, unknown>) {
  const [row] = await db.insert(schema.productVariants).values({
    productId,
    color: (body.color as string) || null,
    size: (body.size as string) || null,
    price: (body.price as string) || "0",
    stock: (body.stock as number) || 0,
    sku: (body.sku as string) || null,
  }).returning();
  return row;
}

export async function deleteProductVariant(productId: string, variantId: string) {
  await db.delete(schema.productVariants).where(and(eq(schema.productVariants.id, variantId), eq(schema.productVariants.productId, productId)));
}

// ===================== ADMIN AUTH =====================

export async function getAdminHash(): Promise<string | null> {
  const [row] = await db.select().from(schema.adminSettings).where(eq(schema.adminSettings.id, 1));
  return row ? row.passwordHash : null;
}

export async function setAdminHash(hash: string) {
  const existing = await db.select().from(schema.adminSettings).where(eq(schema.adminSettings.id, 1));
  if (existing.length > 0) {
    await db.update(schema.adminSettings).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(schema.adminSettings.id, 1));
  } else {
    await db.insert(schema.adminSettings).values({ id: 1, passwordHash: hash });
  }
}
