/* 
  Data layer abstraction.
  Uses PostgreSQL (Drizzle) locally, Firebase Firestore in production.
*/
import { isFirebaseConfigured, getFirestoreDb } from "./firebase";

// ---- Detect mode ----
function useFirebase(): boolean {
  return isFirebaseConfigured();
}

// ---- Firestore helpers ----
function fs() {
  return getFirestoreDb();
}

// ---- PostgreSQL helpers ----
async function pg() {
  const { db } = await import("@/db");
  const schema = await import("@/db/schema");
  const drizzle = await import("drizzle-orm");
  return { db, schema, drizzle };
}

// ===================== STORE SETTINGS =====================

export async function getStoreSettings() {
  const DEFAULTS = {
    id: 1, storeName: "Mi Tienda", storeDescription: null, logoUrl: null,
    coverUrl: null, facebook: null, whatsapp: null, instagram: null, tiktok: null,
    primaryColor: "#16a34a", buttonText: "Comprar", currency: "$",
    footerText: null, announcementText: null, announcementActive: false,
    announcementColor: "#16a34a", updatedAt: new Date().toISOString(),
  };

  if (useFirebase()) {
    const snap = await fs().collection("settings").doc("store").get();
    if (!snap.exists) {
      await fs().collection("settings").doc("store").set(DEFAULTS);
      return DEFAULTS;
    }
    return { id: 1, ...snap.data() };
  }

  const { db, schema, drizzle } = await pg();
  const [row] = await db.select().from(schema.storeSettings).where(drizzle.eq(schema.storeSettings.id, 1));
  if (!row) {
    const [created] = await db.insert(schema.storeSettings).values({ id: 1, storeName: "Mi Tienda" }).returning();
    return created;
  }
  return row;
}

export async function updateStoreSettings(data: Record<string, unknown>) {
  const storeName = (data.storeName as string) || "Mi Tienda";
  const storeDescription = (data.storeDescription as string) || null;
  const logoUrl = (data.logoUrl as string) || null;
  const coverUrl = (data.coverUrl as string) || null;
  const facebook = (data.facebook as string) || null;
  const whatsapp = (data.whatsapp as string) || null;
  const instagram = (data.instagram as string) || null;
  const tiktok = (data.tiktok as string) || null;
  const primaryColor = (data.primaryColor as string) || "#16a34a";
  const buttonText = (data.buttonText as string) || "Comprar";
  const currency = (data.currency as string) || "$";
  const footerText = (data.footerText as string) || null;
  const announcementText = (data.announcementText as string) || null;
  const announcementActive = (data.announcementActive as boolean) ?? false;
  const announcementColor = (data.announcementColor as string) || "#16a34a";

  const clean = { storeName, storeDescription, logoUrl, coverUrl, facebook, whatsapp, instagram, tiktok, primaryColor, buttonText, currency, footerText, announcementText, announcementActive, announcementColor, updatedAt: new Date().toISOString() };

  if (useFirebase()) {
    await fs().collection("settings").doc("store").set(clean, { merge: true });
    return { id: 1, ...clean };
  }

  const { db, schema, drizzle } = await pg();
  const existing = await db.select().from(schema.storeSettings).where(drizzle.eq(schema.storeSettings.id, 1));
  if (existing.length > 0) {
    const [row] = await db.update(schema.storeSettings).set({ ...clean, updatedAt: new Date() }).where(drizzle.eq(schema.storeSettings.id, 1)).returning();
    return row;
  }
  const [row] = await db.insert(schema.storeSettings).values({ id: 1, storeName }).returning();
  return row;
}

// ===================== CATEGORIES =====================

export async function getCategories() {
  if (useFirebase()) {
    const snap = await fs().collection("categories").orderBy("name").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
  const { db, schema } = await pg();
  return db.select().from(schema.categories).orderBy(schema.categories.name);
}

export async function createCategory(body: { name: string; description?: string }) {
  if (useFirebase()) {
    const data = { name: body.name, description: body.description || null, createdAt: new Date().toISOString() };
    const ref = await fs().collection("categories").add(data);
    return { id: ref.id, ...data };
  }
  const { db, schema } = await pg();
  const [row] = await db.insert(schema.categories).values({ name: body.name, description: body.description || null }).returning();
  return row;
}

export async function deleteCategory(id: string) {
  if (useFirebase()) {
    await fs().collection("categories").doc(id).delete();
  } else {
    const { db, schema, drizzle } = await pg();
    await db.delete(schema.categories).where(drizzle.eq(schema.categories.id, id));
  }
}

// ===================== PRODUCTS =====================

async function enrichProduct(id: string, data: Record<string, unknown>) {
  if (useFirebase()) {
    const ref = fs().collection("products").doc(id);
    const [img, feat, vars] = await Promise.all([
      ref.collection("images").orderBy("sortOrder").get(),
      ref.collection("features").get(),
      ref.collection("variants").get(),
    ]);
    return {
      id, ...data,
      images: img.docs.map((d) => ({ id: d.id, ...d.data() })),
      features: feat.docs.map((d) => ({ id: d.id, ...d.data() })),
      variants: vars.docs.map((d) => ({ id: d.id, ...d.data() })),
    };
  }
  const { db, schema, drizzle } = await pg();
  const images = await db.select().from(schema.productImages).where(drizzle.eq(schema.productImages.productId, id)).orderBy(schema.productImages.sortOrder);
  const features = await db.select().from(schema.productFeatures).where(drizzle.eq(schema.productFeatures.productId, id));
  const variants = await db.select().from(schema.productVariants).where(drizzle.eq(schema.productVariants.productId, id));
  return { id, ...data, images, features, variants };
}

export async function getProducts(filters: { categoryId?: string; search?: string; active?: boolean }) {
  if (useFirebase()) {
    let query: FirebaseFirestore.Query = fs().collection("products").orderBy("createdAt", "desc");
    if (filters.categoryId) query = query.where("categoryId", "==", filters.categoryId);
    if (filters.active) query = query.where("active", "==", true);
    const snap = await query.get();
    const results = [];
    for (const doc of snap.docs) {
      const d = doc.data();
      if (filters.search) {
        const name = ((d.name as string) || "").toLowerCase();
        if (!name.includes(filters.search.toLowerCase())) continue;
      }
      results.push(await enrichProduct(doc.id, d));
    }
    return results;
  }

  const { db, schema, drizzle } = await pg();
  const conditions: ReturnType<typeof drizzle.eq>[] = [];
  if (filters.categoryId) conditions.push(drizzle.eq(schema.products.categoryId, filters.categoryId));
  if (filters.active) conditions.push(drizzle.eq(schema.products.active, true));
  if (filters.search) conditions.push(drizzle.ilike(schema.products.name, `%${filters.search}%`));
  const where = conditions.length > 0 ? drizzle.and(...conditions) : undefined;
  const rows = await db.select().from(schema.products).where(where).orderBy(drizzle.desc(schema.products.createdAt));
  return Promise.all(rows.map((r) => enrichProduct(r.id, r as unknown as Record<string, unknown>)));
}

export async function getProduct(id: string) {
  if (useFirebase()) {
    const snap = await fs().collection("products").doc(id).get();
    if (!snap.exists) return null;
    return enrichProduct(id, snap.data()!);
  }
  const { db, schema, drizzle } = await pg();
  const [row] = await db.select().from(schema.products).where(drizzle.eq(schema.products.id, id));
  if (!row) return null;
  return enrichProduct(id, row as unknown as Record<string, unknown>);
}

export async function createProduct(body: Record<string, unknown>) {
  const data = {
    name: body.name as string,
    description: (body.description as string) || null,
    categoryId: (body.categoryId as string) || null,
    basePrice: (body.basePrice as string) || "0",
    comparePrice: (body.comparePrice as string) || null,
    active: (body.active as boolean) ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (useFirebase()) {
    const ref = await fs().collection("products").add(data);
    return { id: ref.id, ...data };
  }
  const { db, schema } = await pg();
  const [row] = await db.insert(schema.products).values({
    name: data.name,
    description: data.description,
    categoryId: data.categoryId,
    basePrice: data.basePrice,
    comparePrice: data.comparePrice,
    active: data.active,
  }).returning();
  return row;
}

export async function updateProduct(id: string, body: Record<string, unknown>) {
  const data = {
    name: body.name as string,
    description: body.description as string || null,
    categoryId: (body.categoryId as string) || null,
    basePrice: body.basePrice as string,
    comparePrice: (body.comparePrice as string) || null,
    active: body.active as boolean,
    updatedAt: new Date().toISOString(),
  };
  if (useFirebase()) {
    await fs().collection("products").doc(id).update(data);
    return { id, ...data };
  }
  const { db, schema, drizzle } = await pg();
  const [row] = await db.update(schema.products).set({ ...data, updatedAt: new Date() }).where(drizzle.eq(schema.products.id, id)).returning();
  return row;
}

export async function deleteProduct(id: string) {
  if (useFirebase()) {
    const ref = fs().collection("products").doc(id);
    for (const sub of ["images", "features", "variants"]) {
      const snap = await ref.collection(sub).get();
      const batch = fs().batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await ref.delete();
  } else {
    const { db, schema, drizzle } = await pg();
    await db.delete(schema.products).where(drizzle.eq(schema.products.id, id));
  }
}

// ===================== IMAGES =====================

export async function setProductImages(productId: string, urls: string[]) {
  if (useFirebase()) {
    const col = fs().collection("products").doc(productId).collection("images");
    const existing = await col.get();
    const batch = fs().batch();
    existing.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    const created = [];
    for (let i = 0; i < urls.length; i++) {
      const data = { productId, url: urls[i].trim(), sortOrder: i, createdAt: new Date().toISOString() };
      const ref = await col.add(data);
      created.push({ id: ref.id, ...data });
    }
    return created;
  }
  const { db, schema, drizzle } = await pg();
  await db.delete(schema.productImages).where(drizzle.eq(schema.productImages.productId, productId));
  const created = [];
  for (let i = 0; i < urls.length; i++) {
    const [img] = await db.insert(schema.productImages).values({ productId, url: urls[i].trim(), sortOrder: i }).returning();
    created.push(img);
  }
  return created;
}

export async function deleteProductImage(productId: string, imageId: string) {
  if (useFirebase()) {
    await fs().collection("products").doc(productId).collection("images").doc(imageId).delete();
  } else {
    const { db, schema, drizzle } = await pg();
    await db.delete(schema.productImages).where(drizzle.and(drizzle.eq(schema.productImages.id, imageId), drizzle.eq(schema.productImages.productId, productId)));
  }
}

// ===================== FEATURES =====================

export async function addProductFeature(productId: string, key: string, value: string) {
  if (useFirebase()) {
    const data = { productId, key, value };
    const ref = await fs().collection("products").doc(productId).collection("features").add(data);
    return { id: ref.id, ...data };
  }
  const { db, schema } = await pg();
  const [row] = await db.insert(schema.productFeatures).values({ productId, key, value }).returning();
  return row;
}

export async function deleteProductFeature(productId: string, featureId: string) {
  if (useFirebase()) {
    await fs().collection("products").doc(productId).collection("features").doc(featureId).delete();
  } else {
    const { db, schema, drizzle } = await pg();
    await db.delete(schema.productFeatures).where(drizzle.and(drizzle.eq(schema.productFeatures.id, featureId), drizzle.eq(schema.productFeatures.productId, productId)));
  }
}

// ===================== VARIANTS =====================

export async function addProductVariant(productId: string, body: Record<string, unknown>) {
  const data = { productId, color: (body.color as string) || null, size: (body.size as string) || null, price: (body.price as string) || "0", stock: (body.stock as number) || 0, sku: (body.sku as string) || null };
  if (useFirebase()) {
    const ref = await fs().collection("products").doc(productId).collection("variants").add(data);
    return { id: ref.id, ...data };
  }
  const { db, schema } = await pg();
  const [row] = await db.insert(schema.productVariants).values(data).returning();
  return row;
}

export async function deleteProductVariant(productId: string, variantId: string) {
  if (useFirebase()) {
    await fs().collection("products").doc(productId).collection("variants").doc(variantId).delete();
  } else {
    const { db, schema, drizzle } = await pg();
    await db.delete(schema.productVariants).where(drizzle.and(drizzle.eq(schema.productVariants.id, variantId), drizzle.eq(schema.productVariants.productId, productId)));
  }
}

// ===================== ADMIN AUTH =====================

export async function getAdminHash(): Promise<string | null> {
  if (useFirebase()) {
    const snap = await fs().collection("settings").doc("admin").get();
    return snap.exists ? snap.data()!.passwordHash : null;
  }
  const { db, schema, drizzle } = await pg();
  const [row] = await db.select().from(schema.adminSettings).where(drizzle.eq(schema.adminSettings.id, 1));
  return row ? row.passwordHash : null;
}

export async function setAdminHash(hash: string) {
  if (useFirebase()) {
    await fs().collection("settings").doc("admin").set({ passwordHash: hash, updatedAt: new Date().toISOString() }, { merge: true });
  } else {
    const { db, schema, drizzle } = await pg();
    const existing = await db.select().from(schema.adminSettings).where(drizzle.eq(schema.adminSettings.id, 1));
    if (existing.length > 0) {
      await db.update(schema.adminSettings).set({ passwordHash: hash, updatedAt: new Date() }).where(drizzle.eq(schema.adminSettings.id, 1));
    } else {
      await db.insert(schema.adminSettings).values({ id: 1, passwordHash: hash });
    }
  }
}
