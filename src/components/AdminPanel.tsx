"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { StoreSettings } from "@/lib/types";
import Photo from "./Photo";
import { CloseIcon, DashboardIcon, ExternalIcon, LockIcon, LogOutIcon, PackageIcon, StoreIcon, TagIcon } from "./Icons";
import { AdminProvider, type AdminTab } from "./admin/ui";
import LoginView from "./admin/LoginView";
import DashboardTab from "./admin/DashboardTab";
import ProductsTab from "./admin/ProductsTab";
import ProductEditor from "./admin/ProductEditor";
import CategoriesTab from "./admin/CategoriesTab";
import SettingsTab from "./admin/SettingsTab";
import SecurityTab from "./admin/SecurityTab";
import { THUMB_WIDTHS } from "@/lib/img";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type StoreBrief = Pick<StoreSettings, "storeName" | "logoUrl">;

const NAV = [
  { key: "dashboard", label: "Resumen", Icon: DashboardIcon },
  { key: "products", label: "Productos", Icon: PackageIcon },
  { key: "categories", label: "Categorías", Icon: TagIcon },
  { key: "settings", label: "Tienda", Icon: StoreIcon },
  { key: "security", label: "Seguridad", Icon: LockIcon },
] as const;

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [notice, setNotice] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [store, setStore] = useState<StoreBrief | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        setIsAuthenticated(data.authenticated);
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
    // Logo y nombre para la pantalla de acceso y la barra lateral (dato público).
    fetch("/api/store-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: StoreSettings) => setStore({ storeName: d.storeName, logoUrl: d.logoUrl }))
      .catch(() => {});
  }, [isOpen]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setNotice("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Contraseña incorrecta");
      } else {
        setIsAuthenticated(true);
        setPassword("");
      }
    } catch {
      setLoginError("Error de conexión");
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    setActiveTab("dashboard");
    setEditingProductId(null);
    onClose();
  };

  // Una petición respondió 401: la sesión caducó, se vuelve al acceso.
  const handleExpired = useCallback(() => {
    setIsAuthenticated(false);
    setNotice("Tu sesión expiró. Vuelve a ingresar para continuar.");
  }, []);

  const openProduct = useCallback((id: string) => {
    setEditingProductId(id);
    setActiveTab("edit-product");
  }, []);

  const goTo = useCallback((tab: AdminTab) => {
    setEditingProductId(null);
    setActiveTab(tab);
  }, []);

  if (!isOpen) return null;

  const authed = isAuthenticated && !checkingAuth;

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-label="Panel de administración">
      <div className="modal-backdrop absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />

      <div
        className={`modal-panel relative flex w-full flex-col overflow-hidden bg-[#f3f6fc] shadow-2xl ${
          authed
            ? "md:rounded-[1.75rem] md:h-[min(94dvh,900px)] md:max-w-6xl md:flex-row"
            : "md:rounded-[1.75rem] md:max-w-md"
        }`}
      >
        {checkingAuth ? (
          <div className="grid h-full min-h-[24rem] flex-1 place-items-center">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-300 border-t-[color:var(--brand)]" />
          </div>
        ) : !isAuthenticated ? (
          <>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="btn btn-glass absolute right-4 top-4 z-20 h-10 w-10 rounded-full">
              <CloseIcon className="h-5 w-5" />
            </button>
            <LoginView
              storeName={store?.storeName ?? "Tu tienda"}
              logoUrl={store?.logoUrl ?? null}
              password={password}
              setPassword={setPassword}
              onSubmit={handleLogin}
              error={loginError}
              notice={notice}
              loading={loggingIn}
            />
          </>
        ) : (
          <AdminProvider onExpired={handleExpired}>
            <Workspace
              store={store}
              activeTab={activeTab}
              editingProductId={editingProductId}
              goTo={goTo}
              openProduct={openProduct}
              onLogout={handleLogout}
              onClose={onClose}
            />
          </AdminProvider>
        )}
      </div>
    </div>
  );
}

function Workspace({
  store,
  activeTab,
  editingProductId,
  goTo,
  openProduct,
  onLogout,
  onClose,
}: {
  store: StoreBrief | null;
  activeTab: AdminTab;
  editingProductId: string | null;
  goTo: (tab: AdminTab) => void;
  openProduct: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const mainRef = useRef<HTMLElement>(null);
  const current = activeTab === "edit-product" ? "products" : activeTab;

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [activeTab, editingProductId]);

  const logo = store?.logoUrl ? (
    <Photo src={store.logoUrl} sizes="48px" widths={THUMB_WIDTHS} alt="" draggable={false} />
  ) : (
    <span className="grid h-full w-full place-items-center bg-brand text-lg font-extrabold text-white">{(store?.storeName ?? "T").charAt(0).toUpperCase()}</span>
  );

  return (
    <>
      {/* ───── Barra lateral (escritorio) ───── */}
      <aside className="admin-side hidden w-64 shrink-0 flex-col p-4 text-white md:flex">
        <div className="relative mb-7 flex items-center gap-3 px-1 pt-1">
          <span className="logo-chip h-12 w-12 shrink-0">{logo}</span>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-extrabold leading-snug">{store?.storeName ?? "Mi tienda"}</p>
            <p className="text-[11px] font-semibold text-white/60">Panel de administración</p>
          </div>
        </div>

        <nav className="relative space-y-1.5" aria-label="Secciones">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} type="button" onClick={() => goTo(key)} aria-current={current === key ? "page" : undefined} className="admin-nav">
              <Icon className="h-5 w-5 shrink-0" /> {label}
            </button>
          ))}
        </nav>

        <div className="relative mt-auto space-y-2">
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-glass w-full rounded-xl py-2.5 text-sm font-bold">
            <ExternalIcon className="h-4 w-4" /> Ver catálogo
          </a>
          <button type="button" onClick={onLogout} className="btn btn-glass w-full rounded-xl py-2.5 text-sm font-bold">
            <LogOutIcon className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barra superior móvil */}
        <header className="flex shrink-0 items-center gap-2 border-b border-slate-200/70 bg-white/80 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-3 md:hidden">
          <span className="logo-chip h-9 w-9 shrink-0">{logo}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold leading-snug text-slate-900">{store?.storeName ?? "Mi tienda"}</p>
            <p className="text-[11px] font-semibold text-slate-500">Panel de administración</p>
          </div>
          <button type="button" onClick={onLogout} aria-label="Cerrar sesión" className="btn btn-ghost h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10">
            <LogOutIcon className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={onClose} aria-label="Cerrar panel" className="btn btn-ghost h-9 w-9 shrink-0 rounded-xl sm:h-10 sm:w-10">
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {/* Barra superior escritorio */}
        <header className="hidden shrink-0 items-center justify-end border-b border-slate-200/70 bg-white/60 px-6 py-3 backdrop-blur-xl md:flex">
          <button type="button" onClick={onClose} className="btn btn-ghost rounded-xl px-4 py-2 text-sm font-bold">
            <CloseIcon className="h-4 w-4" /> Cerrar panel
          </button>
        </header>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {activeTab === "dashboard" && <DashboardTab goTo={goTo} openProduct={openProduct} />}
          {activeTab === "products" && <ProductsTab onEdit={openProduct} />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "edit-product" && editingProductId && <ProductEditor key={editingProductId} productId={editingProductId} onBack={() => goTo("products")} />}
        </main>

        {/* Navegación inferior (móvil) */}
        <nav className="grid shrink-0 grid-cols-5 border-t border-slate-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Secciones">
          {NAV.map(({ key, label, Icon }) => {
            const active = current === key;
            return (
              <button key={key} type="button" onClick={() => goTo(key)} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold transition leading-tight sm:text-[10px] ${active ? "text-brand" : "text-slate-400"}`}>
                <span className={`grid h-7 w-10 place-items-center rounded-full transition-colors duration-300 sm:w-12 ${active ? "bg-brand-soft" : ""}`}>
                  <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                </span>
                {label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
