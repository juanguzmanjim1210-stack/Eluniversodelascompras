"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product, Category, StoreSettings, CartItem, ProductVariant } from "@/lib/types";
import AdminPanel from "@/components/AdminPanel";
import Cart from "@/components/Cart";

function FacebookIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
}
function WhatsAppIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
}
function InstagramIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
}
function TikTokIcon() {
  return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>;
}
function WhatsAppIconLg() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>;
}
function CartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>;
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-2.5 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [store, setStore] = useState<StoreSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const fetchProducts = useCallback(async () => {
    const p = new URLSearchParams();
    p.set("active", "true");
    p.set("_t", Date.now().toString());
    if (selectedCategory) p.set("categoryId", selectedCategory);
    if (search) p.set("search", search);
    const res = await fetch(`/api/products?${p}`, { cache: "no-store" });
    setProducts(await res.json());
    setLoading(false);
  }, [selectedCategory, search]);

  const fetchStore = useCallback(async () => {
    const r = await fetch(`/api/store-settings?_t=${Date.now()}`, { cache: "no-store" });
    setStore(await r.json());
  }, []);

  const fetchCategories = useCallback(async () => {
    const r = await fetch(`/api/categories?_t=${Date.now()}`, { cache: "no-store" });
    setCategories(await r.json());
  }, []);

  useEffect(() => { fetchStore(); fetchCategories(); }, [fetchStore, fetchCategories]);
  useEffect(() => { setLoading(true); fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    const i = setInterval(() => { fetchProducts(); fetchStore(); fetchCategories(); }, 1000);
    return () => clearInterval(i);
  }, [fetchProducts, fetchStore, fetchCategories]);

  useEffect(() => {
    if (selectedProduct) {
      const u = products.find((p) => p.id === selectedProduct.id);
      if (u && JSON.stringify(u) !== JSON.stringify(selectedProduct)) setSelectedProduct(u);
    }
  }, [products, selectedProduct]);

  const addToCart = (product: Product, variant: ProductVariant | null = null) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant?.id === variant?.id);
      if (idx >= 0) { const n = [...prev]; n[idx].quantity += 1; return n; }
      return [...prev, { product, variant, quantity: 1 }];
    });
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 1500);
  };

  const hasSocial = useMemo(() => store && (store.facebook || store.whatsapp || store.instagram || store.tiktok), [store]);

  const btnColor = store?.primaryColor || "#16a34a";
  const btnText = store?.buttonText || "Comprar";
  const cur = store?.currency || "$";

  const formatPrice = (val: string) => `${cur}${parseFloat(val).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Announcement banner — marquee */}
      {store?.announcementActive && store.announcementText && (
        <div style={{ backgroundColor: store.announcementColor || btnColor }} className="text-white overflow-hidden py-2.5 sm:py-3">
          <div className="marquee-track whitespace-nowrap inline-flex" style={{ animationDuration: `${store.announcementSpeed || 40}s` }}>
            {[0,1].map((half) => (
              <span key={half} className="inline-flex">
                {[0,1,2,3,4,5].map((i) => (
                  <span key={i} className="mx-6 sm:mx-12 text-sm sm:text-lg md:text-xl font-bold tracking-wide uppercase" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                    ★ {store.announcementText} ★
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* ====== HEADER — centered layout ====== */}
      {store && (
        <>
          {store.coverUrl && (
            <div className="relative w-full h-40 sm:h-52 md:h-64 overflow-hidden">
              <img src={store.coverUrl} alt="Portada" className="w-full h-full object-cover" loading="eager" />
              <div className="absolute inset-0 bg-black/30" />
              {/* Top buttons over cover */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition" title="Carrito">
                  <CartIcon className="w-5 h-5" />
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                </button>
                <button onClick={() => setAdminOpen(true)} className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition text-sm" title="Admin">⚙️</button>
              </div>
            </div>
          )}
          <div className={`bg-white border-b ${store.coverUrl ? "-mt-16 sm:-mt-20 relative z-10" : ""}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 flex flex-col items-center text-center">
              {/* Logo — large and centered, transparent-friendly */}
              {store.logoUrl ? (
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 overflow-hidden">
                  <img src={store.logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-md" loading="eager" />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl">
                  <span className="text-white text-4xl sm:text-5xl font-bold">{store.storeName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {/* Store name */}
              <h1 className="mt-3 sm:mt-4 text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{store.storeName}</h1>
              {/* Description */}
              {store.storeDescription && <p className="mt-1 sm:mt-2 text-gray-500 text-xs sm:text-sm md:text-base max-w-lg">{store.storeDescription}</p>}
              {/* Social icons — centered */}
              {hasSocial && (
                <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-100 transition" title="Facebook"><FacebookIcon /></a>}
                  {store.whatsapp && <a href={store.whatsapp} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition" title="WhatsApp"><WhatsAppIcon /></a>}
                  {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-100 transition" title="Instagram"><InstagramIcon /></a>}
                  {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 transition" title="TikTok"><TikTokIcon /></a>}
                </div>
              )}
              {/* Cart and admin buttons when no cover */}
              {!store.coverUrl && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition text-gray-700" title="Carrito">
                    <CartIcon className="w-5 h-5" />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
                  </button>
                  <button onClick={() => setAdminOpen(true)} className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition text-sm" title="Admin">⚙️</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ====== MAIN ====== */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        {/* Filters */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8">
          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm sm:text-base max-w-[140px] sm:max-w-none"
          >
            <option value="">Todas</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-500">{loading ? "Cargando..." : `${products.length} producto(s)`}</p>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-green-600">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
            En vivo
          </div>
        </div>

        {/* ====== PRODUCT GRID ====== */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="text-5xl sm:text-6xl mb-3">📦</div>
            <h3 className="text-base sm:text-xl font-semibold text-gray-600">No hay productos disponibles</h3>
            <p className="text-gray-400 mt-1 text-sm">Pronto agregaremos nuevos productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
            {products.map((product) => {
              const hasDiscount = product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.basePrice);
              const discountPct = hasDiscount ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.basePrice)) / parseFloat(product.comparePrice!)) * 100) : 0;

              return (
              <div key={product.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col">
                <div onClick={() => setSelectedProduct(product)} className="cursor-pointer">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.images.length > 0 ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg className="w-10 h-10 sm:w-14 sm:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    {hasDiscount && <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-md">-{discountPct}%</span>}
                    {product.images.length > 1 && <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">+{product.images.length - 1}</span>}
                    {addedToCart === product.id && (
                      <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
                        <span className="text-white font-bold text-sm sm:text-lg">✓ Agregado</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 sm:p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{product.name}</h3>
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-lg font-bold" style={{ color: btnColor }}>{formatPrice(product.basePrice)}</span>
                    {hasDiscount && <span className="text-[10px] sm:text-xs text-gray-400 line-through">{formatPrice(product.comparePrice!)}</span>}
                  </div>
                  {product.variants.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {[...new Set(product.variants.map((v) => v.color).filter(Boolean))].slice(0, 2).map((c) => (
                        <span key={c} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{c}</span>
                      ))}
                      {product.variants.length > 2 && <span className="text-[10px] text-gray-400">+{product.variants.length - 2}</span>}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); product.variants.length > 0 ? setSelectedProduct(product) : addToCart(product, null); }}
                    style={{ backgroundColor: btnColor }}
                    className="mt-2 sm:mt-3 w-full text-white py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center gap-1 text-xs sm:text-sm"
                  >
                    <CartIcon className="w-4 h-4" /> {btnText}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating cart FAB */}
      {cartCount > 0 && (
        <button onClick={() => setCartOpen(true)} style={{ backgroundColor: btnColor }} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 text-white rounded-full shadow-2xl flex items-center justify-center hover:opacity-90 transition z-30">
          <CartIcon className="w-7 h-7 sm:w-8 sm:h-8" /><span className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>
        </button>
      )}

      {/* Footer */}
      {store && (
        <footer className="bg-gray-900 text-white mt-10 sm:mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {store.logoUrl && <div className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden"><img src={store.logoUrl} alt="Logo" className="w-full h-full object-contain" /></div>}
                <div>
                  <h3 className="font-bold text-sm sm:text-lg">{store.storeName}</h3>
                  {store.storeDescription && <p className="text-gray-400 text-xs sm:text-sm">{store.storeDescription}</p>}
                </div>
              </div>
              {hasSocial && (
                <div className="flex items-center gap-2 sm:gap-3">
                  {store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"><FacebookIcon /></a>}
                  {store.whatsapp && <a href={store.whatsapp} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition"><WhatsAppIcon /></a>}
                  {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"><InstagramIcon /></a>}
                  {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-600 transition"><TikTokIcon /></a>}
                </div>
              )}
            </div>
            {store.footerText && <p className="text-gray-400 text-xs sm:text-sm text-center mt-4">{store.footerText}</p>}
            <div className="border-t border-gray-800 mt-4 sm:mt-8 pt-4 sm:pt-6 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">© {new Date().getFullYear()} {store.storeName}</p>
            </div>
          </div>
        </footer>
      )}

      {/* Modal */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} addedToCart={addedToCart} currency={cur} primaryColor={btnColor} />}
      <Cart items={cartItems} isOpen={cartOpen} onClose={() => setCartOpen(false)} onUpdateQuantity={(i, q) => setCartItems((prev) => { const n = [...prev]; n[i].quantity = q; return n; })} onRemoveItem={(i) => setCartItems((prev) => prev.filter((_, idx) => idx !== i))} onClearCart={() => setCartItems([])} storeWhatsapp={store?.whatsapp || null} storeName={store?.storeName || "Tienda"} currency={cur} primaryColor={btnColor} />
      <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}

/* ============ PRODUCT MODAL ============ */
function ProductModal({ product, onClose, onAddToCart, addedToCart, currency, primaryColor }: { product: Product; onClose: () => void; onAddToCart: (p: Product, v: ProductVariant | null) => void; addedToCart: string | null; currency: string; primaryColor: string }) {
  const fmt = (v: string) => `${currency}${parseFloat(v).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product.variants.length > 0 ? product.variants[0] : null);

  useEffect(() => { setCurrentImage(0); setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null); }, [product.id, product.variants]);

  // Auto-slide images every 3 seconds
  useEffect(() => {
    if (product.images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % product.images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [product.images.length]);

  const price = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(product.basePrice);
  const hasDiscount = !selectedVariant && product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.basePrice);
  const discountPct = hasDiscount ? Math.round(((parseFloat(product.comparePrice!) - parseFloat(product.basePrice)) / parseFloat(product.comparePrice!)) * 100) : 0;

  const prevImage = () => setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % product.images.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl">
        {/* Drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 sticky top-0 bg-white rounded-t-3xl z-10"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <button onClick={onClose} className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition text-xs font-bold">✕</button>

        {/* Image carousel */}
        <div className="relative bg-black">
          <div className="aspect-square overflow-hidden">
            {product.images.length > 0 ? (
              <img src={product.images[currentImage]?.url} alt={product.name} className="w-full h-full object-contain bg-gray-50" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><span className="text-5xl">📷</span></div>
            )}
          </div>
          {/* Arrows */}
          {product.images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition text-lg">‹</button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition text-lg">›</button>
            </>
          )}
          {/* Dots */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {product.images.map((_, i) => (
                <button key={i} onClick={() => setCurrentImage(i)} className={`rounded-full transition-all ${i === currentImage ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
              ))}
            </div>
          )}
          {/* Discount badge */}
          {hasDiscount && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">-{discountPct}%</span>}
          {/* Counter */}
          {product.images.length > 1 && <span className="absolute top-3 right-12 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full">{currentImage + 1}/{product.images.length}</span>}
          {/* Added overlay */}
          {addedToCart === product.id && (
            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
              <div className="text-center text-white">
                <span className="text-5xl block mb-2">✓</span>
                <span className="font-bold text-lg">¡Agregado!</span>
              </div>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-4 space-y-3">
          {/* Name & Price */}
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{product.name}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-2xl font-bold" style={{ color: primaryColor }}>{fmt(price.toString())}</span>
              {hasDiscount && <span className="text-sm text-gray-400 line-through">{fmt(product.comparePrice!)}</span>}
              {hasDiscount && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">-{discountPct}%</span>}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[13px] text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase mb-1.5">Opciones disponibles</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition border-2 ${selectedVariant?.id === v.id ? "text-white" : "border-gray-200 text-gray-700 bg-white"}`} style={selectedVariant?.id === v.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}>
                    {v.color && v.size ? `${v.color} / ${v.size}` : v.color || v.size || fmt(v.price)}
                  </button>
                ))}
              </div>
              {selectedVariant && (
                <p className="text-xs text-gray-500 mt-1.5">
                  {selectedVariant.color && <span className="mr-2">{selectedVariant.color}</span>}
                  {selectedVariant.size && <span className="mr-2">Talla: {selectedVariant.size}</span>}
                  <span>Stock: {selectedVariant.stock}</span>
                </p>
              )}
            </div>
          )}

          {/* Add to cart button */}
          <button onClick={() => onAddToCart(product, selectedVariant)} style={{ backgroundColor: primaryColor }} className="w-full text-white py-3 rounded-2xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 text-[15px]">
            <CartIcon className="w-5 h-5" /> Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}
