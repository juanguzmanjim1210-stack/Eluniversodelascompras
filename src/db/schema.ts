import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storeSettings = pgTable("store_settings", {
  id: integer("id").primaryKey().default(1),
  storeName: varchar("store_name", { length: 500 }).notNull().default("Mi Tienda"),
  storeDescription: text("store_description"),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  facebook: text("facebook"),
  whatsapp: text("whatsapp"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  // Customization
  primaryColor: varchar("primary_color", { length: 20 }).notNull().default("#16a34a"),
  buttonText: varchar("button_text", { length: 100 }).notNull().default("Comprar"),
  currency: varchar("currency", { length: 10 }).notNull().default("$"),
  footerText: text("footer_text"),
  announcementText: text("announcement_text"),
  announcementActive: boolean("announcement_active").notNull().default(false),
  announcementColor: varchar("announcement_color", { length: 20 }).notNull().default("#16a34a"),
  announcementSpeed: integer("announcement_speed").notNull().default(40),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull().default("0"),
  comparePrice: numeric("compare_price", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productFeatures = pgTable("product_features", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 100 }),
  size: varchar("size", { length: 100 }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  stock: integer("stock").notNull().default(0),
  sku: varchar("sku", { length: 100 }),
});
