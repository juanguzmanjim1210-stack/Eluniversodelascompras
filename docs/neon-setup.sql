-- Esquema para Neon / PostgreSQL

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  store_name VARCHAR(500) NOT NULL DEFAULT 'Mi Tienda',
  store_description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  facebook TEXT,
  whatsapp TEXT,
  instagram TEXT,
  tiktok TEXT,
  primary_color VARCHAR(20) NOT NULL DEFAULT '#16a34a',
  button_text VARCHAR(100) NOT NULL DEFAULT 'Comprar',
  currency VARCHAR(10) NOT NULL DEFAULT '$',
  footer_text TEXT,
  footer_logo_url TEXT,
  footer_name VARCHAR(500),
  footer_color VARCHAR(20) NOT NULL DEFAULT '#111827',
  announcement_text TEXT,
  announcement_active BOOLEAN NOT NULL DEFAULT false,
  announcement_color VARCHAR(20) NOT NULL DEFAULT '#16a34a',
  announcement_speed INTEGER NOT NULL DEFAULT 40,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_price NUMERIC(12,2),
  stock INTEGER NOT NULL DEFAULT 0,
  badge VARCHAR(50),
  badge_color VARCHAR(20) NOT NULL DEFAULT '#f59e0b',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS product_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color VARCHAR(100),
  size VARCHAR(100),
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100)
);
