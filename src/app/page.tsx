"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Product, Category, StoreSettings, CartItem, ProductVariant } from "@/lib/types";
import Cart from "@/components/Cart";
import FitText from "@/components/FitText";
import Lightbox from "@/components/Lightbox";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import RichText from "@/components/RichText";
import {
  ArrowUp,
  CartIcon,
  CloseIcon,
  FacebookIcon,
  InstagramIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  SortIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/Icons";
import { flyToCart } from "@/lib/fly";

/* El panel de administración pesa bastante y solo lo usa el dueño: se descarga
   únicamente cuando se abre, así la tienda carga más rápido para los clientes. */
const AdminPanel = dynamic(() => import("@/components/AdminPanel"), { ssr: false });

type SortKey = "default" | "price-asc" | "price-desc" | "name";

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton aspect-square" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-4/5 rounded-md" />
        <div className="skeleton h-4 w-3/5 rounded-md" />
        <div className="skeleton h-7 w-2/5 rounded-md" />
        <div className="skeleton h-11 rounded-xl" />
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
  const [sort, setSort] = useState<SortKey>("default");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminMounted, setAdminMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [bumping, setBumping] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [warrantyIdx, setWarrantyIdx] = useState<number | null>(null);
  // La búsqueda se teclea rápido y se consulta despacio: 300 ms de espera
  // evitan una petición (y tres consultas por producto) en cada tecla.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // Atenúa la rejilla mientras llega el resultado, sin vaciarla.
  const [searching, setSearching] = useState(false);
  const reqId = useRef(0);
  const lastSig = useRef("");
  const timers = useRef<number[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    const id = ++reqId.current;
    try {
      const p = new URLSearchParams();
      p.set("_t", Date.now().toString());
      if (selectedCategory) p.set("categoryId", selectedCategory);
      if (debouncedSearch) p.set("search", debouncedSearch);
      const res = await fetch(`/api/products?${p}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        // Si ya salió una petición más nueva, este resultado llega tarde.
        if (id === reqId.current && Array.isArray(data)) {
          // Solo se repinta si algo cambió de verdad: el refresco cada 15 s ya no mueve la pantalla.
          const sig = JSON.stringify(data);
          if (sig !== lastSig.current) {
            lastSig.current = sig;
            setProducts(data);
          }
        }
      }
    } catch { /* no sobreescribir datos buenos */ }
    if (id === reqId.current) {
      setLoading(false);
      setSearching(false);
    }
  }, [selectedCategory, debouncedSearch]);

  const fetchStore = useCallback(async () => {
    try {
      const r = await fetch(`/api/store-settings?_t=${Date.now()}`, { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        if (data && data.updatedAt) setStore((prev) => (prev && JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
      }
    } catch { /* no sobreescribir datos buenos */ }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const r = await fetch(`/api/categories?_t=${Date.now()}`, { cache: "no-store" });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data)) setCategories((prev) => (JSON.stringify(prev) === JSON.stringify(data) ? prev : data));
      }
    } catch { /* no sobreescribir datos buenos */ }
  }, []);

  useEffect(() => { fetchStore(); fetchCategories(); }, [fetchStore, fetchCategories]);
  // Primera carga: esqueletos (`loading` arranca en true). En los cambios
  // posteriores la rejilla se queda visible y solo se atenúa, porque
  // `searching` lo marcan los propios controles al cambiar.
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Refresco cada 15 s, pero solo con la pestaña a la vista; al volver, se actualiza al instante.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      fetchProducts(); fetchStore(); fetchCategories();
    };
    const i = setInterval(tick, 15000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(i); document.removeEventListener("visibilitychange", tick); };
  }, [fetchProducts, fetchStore, fetchCategories]);

  useEffect(() => {
    if (selectedProduct) {
      const u = products.find((p) => p.id === selectedProduct.id);
      if (u && JSON.stringify(u) !== JSON.stringify(selectedProduct)) setSelectedProduct(u);
    }
  }, [products, selectedProduct]);

  useEffect(() => {
    if (store?.storeName) document.title = store.storeName;
  }, [store?.storeName]);

  // El encabezado gana sombra y cristal en cuanto la página empieza a bajar.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Con una ventana abierta, la página de fondo no se desplaza.
  const locked = !!selectedProduct || cartOpen || warrantyIdx !== null;
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement: root } = document;
    const gap = window.innerWidth - root.clientWidth; // ancho de la barra: evita el salto lateral
    const prev = { overflow: body.style.overflow, padding: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => { body.style.overflow = prev.overflow; body.style.paddingRight = prev.padding; };
  }, [locked]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const closeModal = useCallback(() => setSelectedProduct(null), []);

  const addToCart = useCallback((product: Product, variant: ProductVariant | null = null, source?: HTMLElement | null) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id && i.variant?.id === variant?.id);
      if (idx >= 0) return prev.map((it, n) => (n === idx ? { ...it, quantity: it.quantity + 1 } : it));
      return [...prev, { product, variant, quantity: 1 }];
    });
    // La miniatura vuela al carrito y este «salta» al llegar.
    flyToCart(source, () => {
      setBumping(true);
      timers.current.push(window.setTimeout(() => setBumping(false), 650));
    });
    // Mismo flujo de siempre (cerrar el detalle y abrir el carrito), tras un instante para ver la confirmación.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.push(window.setTimeout(() => { setSelectedProduct(null); setCartOpen(true); }, reduce ? 0 : 700));
  }, []);

  const getCategoryName = (catId: string | null) => {
    if (!catId) return null;
    const c = categories.find((cat) => cat.id === catId);
    return c ? c.name : null;
  };

  const hasSocial = useMemo(() => store && (store.facebook || store.whatsapp || store.instagram || store.tiktok), [store]);
  const hasQuery = search.trim() !== "" || selectedCategory !== "";

  const btnColor = store?.primaryColor || "#16a34a";
  const btnText = store?.buttonText || "Comprar";
  const cur = store?.currency || "$";

  const visible = useMemo(() => {
    if (sort === "default") return products;
    const price = (p: Product) => parseFloat(p.basePrice) || 0;
    const sorted = [...products];
    if (sort === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") sorted.sort((a, b) => price(b) - price(a));
    else sorted.sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "es"));
    return sorted;
  }, [products, sort]);

  const descBlocks = useMemo(
    () => (store?.storeDescription ?? "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean),
    [store?.storeDescription]
  );
  const warrantyUrls = useMemo(
    () => (store?.warrantyImages ?? "").split("\n").map((u) => u.trim()).filter(Boolean),
    [store?.warrantyImages]
  );
  const showWarranty =
    !!store &&
    ((store.warrantyType === "text" && !!store.warrantyText?.trim()) ||
      (store.warrantyType === "images" && warrantyUrls.length > 0));

  const changeCategory = (id: string) => {
    if (id === selectedCategory) return;
    setSelectedCategory(id);
    setLoading(false);
    setSearching(true);
  };

  return (
    <div id="top" className="min-h-screen" style={{ "--brand": btnColor } as CSSProperties}>
      {/* ====== ANUNCIO ====== */}
      {store?.announcementActive && store.announcementText && (
        <div style={{ backgroundColor: store.announcementColor || btnColor }} className="overflow-hidden py-2 text-white sm:py-2.5">
          <div className="marquee-track inline-flex whitespace-nowrap" style={{ animationDuration: `${store.announcementSpeed || 40}s` }}>
            {[0, 1].map((half) => (
              <span key={half} className="inline-flex">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="mx-6 text-sm font-extrabold tracking-wide drop-shadow-sm sm:mx-10 sm:text-lg md:text-xl">
                    ⭐ {store.announcementText} ⭐
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ====== ENCABEZADO FIJO ====== */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow] duration-300 ${
          stuck ? "bg-white/85 shadow-[0_10px_30px_-14px_rgb(15_23_42/0.35)] backdrop-blur-xl" : "bg-white"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-3 sm:gap-6 sm:px-6 lg:px-8">
          <a href="#top" className="flex shrink-0 items-center gap-3" aria-label={store?.storeName ?? "Inicio"}>
            {store?.logoUrl ? (
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.logoUrl} alt="" className="h-full w-full object-contain" decoding="async" />
              </span>
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-extrabold text-white">
                {(store?.storeName ?? "T").charAt(0).toUpperCase()}
              </span>
            )}
            {store && (
              <span className="hidden max-w-[16rem] truncate text-lg font-extrabold tracking-tight text-slate-900 lg:block">{store.storeName}</span>
            )}
          </a>

          <div className="relative mx-auto min-w-0 max-w-2xl flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              inputMode="search"
              aria-label="Buscar productos"
              autoComplete="off"
              enterKeyHint="search"
              placeholder="Buscar productos…"
              value={search}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "1106399264") { setAdminMounted(true); setAdminOpen(true); setSearch(""); return; }
                setSearch(val);
                setSearching(val.trim() !== debouncedSearch);
              }}
              className="h-11 w-full rounded-2xl border-2 border-transparent bg-slate-100 pl-12 pr-11 text-base text-slate-900 transition placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[color:var(--brand)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_18%,transparent)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setDebouncedSearch(""); }}
                aria-label="Borrar búsqueda"
                className="btn absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {store?.whatsapp && (
            <a
              href={store.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Escríbenos por WhatsApp"
              className="btn wa-fab hidden h-11 shrink-0 rounded-2xl px-4 text-sm font-bold sm:inline-flex"
            >
              <WhatsAppIcon className="btn-icon h-5 w-5" />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          )}

          <div className="relative shrink-0">
            <button
              type="button"
              data-cart-target
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? "artículo" : "artículos"}`}
              className={`btn btn-dark h-11 rounded-2xl px-3.5 text-sm font-bold sm:px-5 ${bumping ? "cart-bump" : ""}`}
            >
              <CartIcon className="btn-icon h-5 w-5" />
              <span className="hidden sm:inline">Carrito</span>
            </button>
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="badge-pop pointer-events-none absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-extrabold text-white ring-2 ring-white"
              >
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ====== PORTADA ====== */}
      {!store ? (
        <section className="hero-bg">
          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-5 px-4 py-10 sm:px-6 md:flex-row md:gap-10 md:py-14 lg:px-8">
            <div className="h-28 w-28 animate-pulse rounded-[1.75rem] bg-white/25 sm:h-36 sm:w-36 md:h-40 md:w-40" />
            <div className="w-full max-w-xl space-y-3">
              <div className="h-10 w-3/4 animate-pulse rounded-lg bg-white/25" />
              <div className="h-5 w-full animate-pulse rounded bg-white/20" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-white/20" />
            </div>
          </div>
        </section>
      ) : (
        <section className="relative isolate overflow-hidden text-white">
          {store.coverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.coverUrl} alt="" loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/55 to-slate-900/80" />
            </>
          ) : (
            <>
              <div className="hero-bg absolute inset-0 -z-10" />
              <span className="float-slow pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <span className="float-slow pointer-events-none absolute -bottom-24 left-1/4 -z-10 h-56 w-56 rounded-full bg-white/10 blur-2xl [animation-delay:-3s]" />
            </>
          )}

          <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-6 px-4 py-9 text-center sm:px-6 md:flex-row md:gap-10 md:py-14 md:text-left lg:px-8">
            <div className="hero-logo shrink-0">
              {store.logoUrl ? (
                <div className="grid h-28 w-28 place-items-center rounded-[1.75rem] bg-white p-2 shadow-2xl ring-4 ring-white/30 sm:h-36 sm:w-36 md:h-40 md:w-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={store.logoUrl} alt="Logo" loading="eager" decoding="async" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-[1.75rem] bg-white/95 text-5xl font-extrabold text-brand shadow-2xl ring-4 ring-white/30 sm:h-36 sm:w-36 md:h-40 md:w-40">
                  {store.storeName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <FitText as="h1" text={store.storeName} min={26} max={52} lines={2} className="font-extrabold tracking-tight drop-shadow-sm" />

              {descBlocks.length > 1 ? (
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {descBlocks.map((b, i) => (
                    <p key={i} className="whitespace-pre-line rounded-2xl bg-white/12 px-4 py-3 text-left text-sm font-semibold leading-snug ring-1 ring-white/25 backdrop-blur-sm sm:text-[15px]">
                      {b}
                    </p>
                  ))}
                </div>
              ) : descBlocks.length === 1 ? (
                <p className="mx-auto max-w-2xl whitespace-pre-line text-base font-medium text-white/90 sm:text-lg md:mx-0">{descBlocks[0]}</p>
              ) : null}

              {hasSocial && (
                <div className="flex items-center justify-center gap-2.5 md:justify-start">
                  {store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" aria-label="Facebook" className="btn h-11 w-11 rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white hover:text-[#1877f2]"><FacebookIcon className="h-5 w-5" /></a>}
                  {store.whatsapp && <a href={store.whatsapp} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp" className="btn h-11 w-11 rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white hover:text-[#25d366]"><WhatsAppIcon className="h-5 w-5" /></a>}
                  {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram" className="btn h-11 w-11 rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white hover:text-[#e1306c]"><InstagramIcon className="h-5 w-5" /></a>}
                  {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok" aria-label="TikTok" className="btn h-11 w-11 rounded-full bg-white/15 text-white ring-1 ring-white/25 hover:bg-white hover:text-slate-900"><TikTokIcon className="h-5 w-5" /></a>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ====== CATÁLOGO ====== */}
      <main className="mx-auto max-w-[1400px] px-3 pb-6 sm:px-6 lg:px-8">
        {/* Categorías */}
        <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 py-4 sm:mx-0 sm:px-0 sm:py-5" role="tablist" aria-label="Categorías">
          {[{ id: "", name: "Todas" }, ...categories].map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeCategory(c.id)}
                className={`btn shrink-0 rounded-full border-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap ${
                  active
                    ? "border-transparent bg-brand text-white shadow-lg shadow-black/10"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
                }`}
              >
                {c.name.trim()}
              </button>
            );
          })}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
          <p className="text-sm font-medium text-slate-500" aria-live="polite">
            {loading
              ? "Cargando..."
              : `${products.length} ${products.length === 1 ? "producto" : "productos"}${selectedCategory && getCategoryName(selectedCategory) ? ` · ${getCategoryName(selectedCategory)}` : ""}`}
          </p>
          <div className="flex items-center gap-3">
            {searching && (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-400">
                <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                Buscando...
              </span>
            )}
            <label className="relative inline-flex items-center">
              <SortIcon className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
              <select
                aria-label="Ordenar productos"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 transition focus:border-[color:var(--brand)] focus:outline-none"
              >
                <option value="default">Destacados</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre A–Z</option>
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-3 text-xs text-slate-400">▾</span>
            </label>
          </div>
        </div>

        {/* CUADRÍCULA */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          hasQuery ? (
            <div className="px-4 py-16 text-center sm:py-20">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-400">
                <SearchIcon className="h-9 w-9" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-800 sm:text-xl">
                {search.trim() ? `Sin resultados para «${search.trim()}»` : "No hay productos en esta categoría"}
              </h3>
              <p className="mt-1.5 text-sm text-slate-500">Prueba con otra palabra o vuelve a ver todo el catálogo.</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setDebouncedSearch(""); setSelectedCategory(""); }}
                className="btn btn-brand btn-shine mt-6 rounded-xl px-6 py-3 text-sm font-bold sm:text-base"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="py-16 text-center sm:py-20">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-400">
                <PackageIcon className="h-9 w-9" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-700 sm:text-xl">No hay productos disponibles</h3>
              <p className="mt-1 text-sm text-slate-400">Pronto agregaremos nuevos productos</p>
            </div>
          )
        ) : (
          <div className={`grid grid-cols-2 gap-3 transition-opacity duration-200 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 ${searching ? "opacity-50" : "opacity-100"}`}>
            {visible.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                currency={cur}
                buttonText={btnText}
                onOpen={setSelectedProduct}
                onAdd={addToCart}
              />
            ))}
          </div>
        )}
      </main>

      {/* ====== POLÍTICAS DE GARANTÍA ====== */}
      {showWarranty && store && (
        <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-7 flex flex-col items-center gap-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><ShieldIcon className="h-6 w-6" /></span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Políticas de Garantía</h2>
          </div>
          {store.warrantyType === "text" && store.warrantyText && (
            <RichText
              text={store.warrantyText}
              className="card mx-auto max-w-3xl p-6 text-base leading-relaxed text-slate-600 sm:p-9 sm:text-lg"
            />
          )}
          {store.warrantyType === "images" && warrantyUrls.length > 0 && (
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
              {warrantyUrls.map((url, i) => (
                <button
                  key={url + i}
                  type="button"
                  onClick={() => setWarrantyIdx(i)}
                  aria-label={`Ampliar política ${i + 1}`}
                  className="card w-full cursor-zoom-in overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Política ${i + 1}`} loading="lazy" decoding="async" className="w-full" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ====== PIE DE PÁGINA ====== */}
      {store && (
        <footer style={{ backgroundColor: store.footerColor || "#111827" }} className="relative mt-10 text-white sm:mt-16">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[color:var(--brand)] to-transparent" aria-hidden="true" />
          <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            {/* Logo del footer — solo si se configuró uno específico */}
            {store.footerLogoUrl && (
              <div className="mb-5 flex justify-center">
                <div className="h-16 w-16 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={store.footerLogoUrl} alt="Logo" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                </div>
              </div>
            )}

            {/* Título redes sociales (editable, ej: "Síguenos") */}
            {hasSocial && (
              <div className="flex flex-col items-center">
                {store.footerName && <h4 className="mb-4 text-xl font-extrabold tracking-tight">{store.footerName}</h4>}
                <div className="flex items-center gap-3.5">
                  {store.facebook && <a href={store.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="btn h-12 w-12 rounded-full bg-white/10 hover:bg-[#1877f2]"><FacebookIcon className="h-5 w-5" /></a>}
                  {store.whatsapp && <a href={store.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="btn h-12 w-12 rounded-full bg-white/10 hover:bg-[#25d366]"><WhatsAppIcon className="h-5 w-5" /></a>}
                  {store.instagram && <a href={store.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="btn h-12 w-12 rounded-full bg-white/10 hover:bg-[#e1306c]"><InstagramIcon className="h-5 w-5" /></a>}
                  {store.tiktok && <a href={store.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="btn h-12 w-12 rounded-full bg-white/10 hover:bg-white/30"><TikTokIcon className="h-5 w-5" /></a>}
                </div>
              </div>
            )}

            {/* Texto central editable (ej: "Calidad y Cumplimiento") */}
            {store.footerText && <p className="mt-5 text-center text-sm font-medium text-white/70 sm:text-base">{store.footerText}</p>}

            <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
              <p className="text-xs text-white/45 sm:text-sm">© {new Date().getFullYear()} {store.storeName}</p>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="btn rounded-full bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20"
              >
                <ArrowUp className="btn-nudge h-4 w-4" /> Volver arriba
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* ====== BOTONES FLOTANTES ====== */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-4 right-4 z-30 sm:bottom-6 sm:right-6">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Ver carrito, ${cartCount} artículos`}
            className="btn btn-brand h-14 w-14 rounded-full sm:h-16 sm:w-16"
          >
            <CartIcon className="btn-icon h-7 w-7" />
          </button>
          <span key={cartCount} className="badge-pop pointer-events-none absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1 text-xs font-extrabold text-white ring-2 ring-white">
            {cartCount}
          </span>
        </div>
      )}

      {/* ====== VENTANAS ====== */}
      {selectedProduct && (
        <ProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          categories={categories}
          currency={cur}
          onClose={closeModal}
          onAdd={addToCart}
        />
      )}
      <Cart
        items={cartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={(i, q) => setCartItems((prev) => prev.map((it, n) => (n === i ? { ...it, quantity: q } : it)))}
        onRemoveItem={(i) => setCartItems((prev) => prev.filter((_, idx) => idx !== i))}
        onClearCart={() => setCartItems([])}
        storeWhatsapp={store?.whatsapp || null}
        storeName={store?.storeName || "Tienda"}
        currency={cur}
        primaryColor={btnColor}
        onOrderSent={fetchProducts}
      />
      {adminMounted && <AdminPanel isOpen={adminOpen} onClose={() => setAdminOpen(false)} />}
      {warrantyIdx !== null && warrantyUrls.length > 0 && (
        <Lightbox images={warrantyUrls} index={warrantyIdx} alt="Política de garantía" onIndex={setWarrantyIdx} onClose={() => setWarrantyIdx(null)} />
      )}
    </div>
  );
}
