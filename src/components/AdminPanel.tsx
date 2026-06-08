"use client";
import { useState, useEffect, useCallback } from "react";
import type { Product, Category, StoreSettings } from "@/lib/types";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "products" | "categories" | "settings" | "security" | "edit-product";

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/auth/check")
        .then((r) => r.json())
        .then((data) => {
          setIsAuthenticated(data.authenticated);
          setCheckingAuth(false);
        })
        .catch(() => setCheckingAuth(false));
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
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
    setActiveTab("products");
    onClose();
  };

  const openProductEditor = (productId: string) => {
    setEditingProductId(productId);
    setActiveTab("edit-product");
  };

  const closeProductEditor = () => {
    setEditingProductId(null);
    setActiveTab("products");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in">
        <div className="bg-gray-900 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold">⚙️</span>
            </div>
            <span className="font-bold">Panel de Administración</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {checkingAuth ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : !isAuthenticated ? (
            <LoginForm password={password} setPassword={setPassword} onSubmit={handleLogin} error={loginError} loading={loggingIn} />
          ) : (
            <div className="flex flex-col h-full">
              {activeTab !== "edit-product" && (
                <div className="flex border-b bg-gray-50 flex-shrink-0 overflow-x-auto">
                  <button onClick={() => setActiveTab("products")} className={`flex-1 px-3 py-3 text-xs font-medium transition whitespace-nowrap ${activeTab === "products" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                    📦 Productos
                  </button>
                  <button onClick={() => setActiveTab("categories")} className={`flex-1 px-3 py-3 text-xs font-medium transition whitespace-nowrap ${activeTab === "categories" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                    🏷️ Categorías
                  </button>
                  <button onClick={() => setActiveTab("settings")} className={`flex-1 px-3 py-3 text-xs font-medium transition whitespace-nowrap ${activeTab === "settings" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                    🏪 Tienda
                  </button>
                  <button onClick={() => setActiveTab("security")} className={`flex-1 px-3 py-3 text-xs font-medium transition whitespace-nowrap ${activeTab === "security" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"}`}>
                    🔐 Seguridad
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {activeTab === "products" && <ProductsTab onEdit={openProductEditor} />}
                {activeTab === "categories" && <CategoriesTab />}
                {activeTab === "settings" && <SettingsTab />}
                {activeTab === "security" && <SecurityTab />}
                {activeTab === "edit-product" && editingProductId && <ProductEditor productId={editingProductId} onBack={closeProductEditor} />}
              </div>

              <div className="border-t p-3 bg-gray-50 flex-shrink-0">
                <button onClick={handleLogout} className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium">
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}

// ============ LOGIN FORM ============
function LoginForm({ password, setPassword, onSubmit, error, loading }: { password: string; setPassword: (v: string) => void; onSubmit: (e: React.FormEvent) => void; error: string; loading: boolean }) {
  return (
    <div className="p-8 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Acceso Administrador</h2>
        <p className="text-gray-500 text-sm mt-1">Ingresa tu contraseña</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" autoFocus className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">⚠️ {error}</p>}
        <button type="submit" disabled={loading || !password} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Contraseña inicial: la configurada en tu servidor
      </p>
    </div>
  );
}

// ============ SECURITY TAB (CHANGE PASSWORD) ============
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas nuevas no coinciden" });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 4 caracteres" });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al cambiar contraseña" });
      } else {
        setMessage({ type: "success", text: "¡Contraseña actualizada correctamente!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    }

    setSaving(false);
  };

  return (
    <div className="p-4">
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔐</span>
          <h3 className="font-semibold text-gray-900">Cambiar Contraseña</h3>
        </div>
        <p className="text-sm text-gray-500">
          Cambia la contraseña de acceso al panel de administración. Asegúrate de usar una contraseña segura.
        </p>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Tu contraseña actual"
            required
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tu nueva contraseña"
            required
            minLength={4}
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            required
            className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {message.type === "success" ? "✓" : "⚠️"} {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? "Guardando..." : "🔒 Cambiar Contraseña"}
        </button>
      </form>

      <div className="mt-6 bg-yellow-50 rounded-xl p-4">
        <h4 className="font-medium text-yellow-800 text-sm mb-2">💡 Consejos de Seguridad</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Usa al menos 8 caracteres</li>
          <li>• Combina letras, números y símbolos</li>
          <li>• No uses información personal</li>
          <li>• No compartas tu contraseña</li>
        </ul>
      </div>
    </div>
  );
}

// ============ PRODUCTS TAB ============
function ProductsTab({ onEdit }: { onEdit: (id: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");

  const fetchData = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch("/api/products"), fetch("/api/categories")]);
    setProducts(await pRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, categoryId: categoryId || null, basePrice: basePrice || "0" }),
    });
    setName(""); setDescription(""); setCategoryId(""); setBasePrice("");
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleActive = async (product: Product) => {
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, active: !product.active }),
    });
    fetchData();
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Productos ({products.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto *" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Precio" className="px-3 py-2 border rounded-lg text-sm" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Sin categoría</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" className="w-full px-3 py-2 border rounded-lg text-sm" />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium">Crear Producto</button>
        </form>
      )}

      <div className="space-y-2">
        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay productos</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">📷</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{p.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.active ? "Activo" : "Inactivo"}</span>
                </div>
                <p className="text-xs text-gray-500">${parseFloat(p.basePrice).toFixed(2)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggleActive(p)} className="p-1.5 text-xs hover:bg-gray-100 rounded" title={p.active ? "Desactivar" : "Activar"}>{p.active ? "🔴" : "🟢"}</button>
                <button onClick={() => onEdit(p.id)} className="p-1.5 text-xs hover:bg-blue-50 text-blue-600 rounded">✏️</button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-xs hover:bg-red-50 text-red-600 rounded">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ CATEGORIES TAB ============
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName("");
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar categoría?")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
  };

  if (loading) return <div className="p-6 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-4">
      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nueva categoría..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Crear</button>
      </form>

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay categorías</p>
        ) : (
          categories.map((c) => (
            <div key={c.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
              <span className="font-medium text-sm">{c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs hover:bg-red-50 px-2 py-1 rounded">Eliminar</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ SETTINGS TAB ============
function SettingsTab() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [buttonText, setButtonText] = useState("Comprar");
  const [currency, setCurrency] = useState("$");
  const [footerText, setFooterText] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [announcementColor, setAnnouncementColor] = useState("#16a34a");
  const [announcementSpeed, setAnnouncementSpeed] = useState(40);

  useEffect(() => {
    fetch("/api/store-settings").then((r) => r.json()).then((data: StoreSettings) => {
      setSettings(data);
      setStoreName(data.storeName || "");
      setStoreDescription(data.storeDescription || "");
      setLogoUrl(data.logoUrl || "");
      setCoverUrl(data.coverUrl || "");
      setFacebook(data.facebook || "");
      setWhatsapp(data.whatsapp || "");
      setInstagram(data.instagram || "");
      setTiktok(data.tiktok || "");
      setPrimaryColor(data.primaryColor || "#16a34a");
      setButtonText(data.buttonText || "Comprar");
      setCurrency(data.currency || "$");
      setFooterText(data.footerText || "");
      setAnnouncementColor(data.announcementColor || "#16a34a");
      setAnnouncementSpeed(data.announcementSpeed || 40);
      setAnnouncementText(data.announcementText || "");
      setAnnouncementActive(data.announcementActive ?? false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    await fetch("/api/store-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeName, storeDescription, logoUrl, coverUrl, facebook, whatsapp, instagram, tiktok, primaryColor, buttonText, currency, footerText, announcementText, announcementActive, announcementColor, announcementSpeed }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!settings) return <div className="p-6 text-center text-gray-400">Cargando...</div>;

  return (
    <div className="p-4 space-y-4">
      {/* Store Info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🏪 Información de la Tienda</h4>
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Nombre de la tienda" className="w-full px-3 py-2 border rounded-lg text-sm" />
        <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} placeholder="Descripción / Eslogan" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>

      {/* Logo & Cover */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🖼️ Logo y Portada</h4>
        <p className="text-xs text-gray-500">Sube a imgbb.com y pega el enlace</p>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            {logoUrl && <img src={logoUrl} alt="" className="w-10 h-10 rounded object-contain bg-white border" />}
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="URL del logo" className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
          </div>
          <div className="flex gap-2 items-center">
            {coverUrl && <img src={coverUrl} alt="" className="w-10 h-10 rounded object-cover bg-white border" />}
            <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL de la portada / banner" className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono" />
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-yellow-50 rounded-xl p-4 space-y-3 border border-yellow-200">
        <h4 className="font-semibold text-sm text-yellow-800">📢 Anuncio / Promoción</h4>
        <p className="text-xs text-yellow-600">Banner animado que se desliza arriba del catálogo</p>
        <input value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Ej: ¡Envío gratis en compras mayores a $100.000!" className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-yellow-800 mb-1">Color del banner</label>
            <div className="flex items-center gap-2">
              <input type="color" value={announcementColor} onChange={(e) => setAnnouncementColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
              <input value={announcementColor} onChange={(e) => setAnnouncementColor(e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-xs font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-yellow-800 mb-1">Velocidad ({announcementSpeed}s)</label>
            <input type="range" min="10" max="80" value={announcementSpeed} onChange={(e) => setAnnouncementSpeed(parseInt(e.target.value))} className="w-full mt-2" />
            <div className="flex justify-between text-[10px] text-yellow-700"><span>Rápido</span><span>Lento</span></div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} className="rounded" />
          Mostrar anuncio en el catálogo
        </label>
        {announcementActive && announcementText && (
          <div style={{ backgroundColor: announcementColor }} className="rounded-lg overflow-hidden py-2">
            <div className="whitespace-nowrap inline-flex" style={{ animation: `marquee-preview ${announcementSpeed}s linear infinite` }}>
              {[0,1].map((h) => (
                <span key={h} className="inline-flex">
                  {[0,1,2].map((i) => (
                    <span key={i} className="mx-6 text-xs font-bold tracking-wide uppercase text-white" style={{ fontFamily: "'Courier New', monospace" }}>★ {announcementText} ★</span>
                  ))}
                </span>
              ))}
            </div>
            <style>{`@keyframes marquee-preview { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🎨 Apariencia del Catálogo</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color de botones</label>
            <div className="flex items-center gap-2">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
              <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-2 py-1.5 border rounded text-xs font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Moneda</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="$">$ (Peso / Dólar)</option>
              <option value="€">€ (Euro)</option>
              <option value="S/.">S/. (Sol)</option>
              <option value="Q">Q (Quetzal)</option>
              <option value="L">L (Lempira)</option>
              <option value="C$">C$ (Córdoba)</option>
              <option value="₡">₡ (Colón)</option>
              <option value="Bs">Bs (Bolívar)</option>
              <option value="RD$">RD$ (Peso Dom.)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto del botón de compra</label>
          <input value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="Ej: Comprar, Pedir, Agregar..." className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Vista previa:</span>
            <span style={{ backgroundColor: primaryColor }} className="text-white text-xs px-4 py-1.5 rounded-lg font-medium">🛒 {buttonText || "Comprar"}</span>
          </div>
        </div>
      </div>

      {/* WhatsApp for Orders */}
      <div className="bg-green-50 rounded-xl p-4 space-y-3 border border-green-200">
        <h4 className="font-semibold text-sm text-green-800">📱 WhatsApp para Pedidos</h4>
        <p className="text-xs text-green-600">Pega aquí el enlace de tu WhatsApp</p>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/573001234567" className="w-full px-3 py-2 border border-green-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 font-mono" />
        <p className="text-xs text-green-600">💡 Abre WhatsApp → tu perfil → copia el enlace y pégalo aquí</p>
      </div>

      {/* Social Media */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🌐 Redes Sociales</h4>
        <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
        <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
        <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok URL" className="w-full px-3 py-2 border rounded-lg text-sm" />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🦶 Texto del Pie de Página</h4>
        <textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Ej: Envíos a todo el país · Pagos contra entrega" rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50">
        {saving ? "Guardando..." : saved ? "✓ Guardado — cambios visibles en el catálogo" : "💾 Guardar Todo"}
      </button>
    </div>
  );
}

// ============ PRODUCT EDITOR ============
function ProductEditor({ productId, onBack }: { productId: string; onBack: () => void }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [active, setActive] = useState(true);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [productStock, setProductStock] = useState(0);
  const [varColor, setVarColor] = useState("");
  const [varSize, setVarSize] = useState("");
  const [varPrice, setVarPrice] = useState("");
  const [varStock, setVarStock] = useState("0");

  const fetchProduct = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch(`/api/products/${productId}`), fetch("/api/categories")]);
    const p: Product = await pRes.json();
    setProduct(p);
    setCategories(await cRes.json());
    setName(p.name);
    setDescription(p.description || "");
    setCategoryId(p.categoryId || "");
    setBasePrice(p.basePrice);
    setComparePrice(p.comparePrice || "");
    setProductStock(p.stock ?? 0);
    setActive(p.active);

    setImageUrls(p.images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url));
  }, [productId]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const [infoSaved, setInfoSaved] = useState(false);
  const [imagesSaved, setImagesSaved] = useState(false);

  const handleSaveInfo = async () => {
    setSaving(true);
    await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, categoryId: categoryId || null, basePrice, comparePrice: comparePrice || null, stock: productStock, active }),
    });
    setSaving(false);
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 2500);
    fetchProduct();
  };

  const handleSaveImages = async () => {
    const urls = imageUrls.filter((u) => u.trim() !== "");
    await fetch(`/api/products/${productId}/images`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls }) });
    setImagesSaved(true);
    setTimeout(() => setImagesSaved(false), 2500);
    fetchProduct();
  };

  const addImage = () => {
    if (!newImageUrl.trim() || imageUrls.length >= 10) return;
    // Smart detection: extract all image URLs from pasted text
    const text = newImageUrl.trim();
    const urlRegex = /https?:\/\/[^\s,;"""''<>]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s,;"""''<>]*)?/gi;
    const ibbRegex = /https?:\/\/i\.ibb\.co\/[^\s,;"""''<>]+/gi;
    const found = new Set<string>();
    // Match standard image URLs
    const imgMatches = text.match(urlRegex);
    if (imgMatches) imgMatches.forEach((u) => found.add(u));
    // Match ibb.co URLs (even without extension)
    const ibbMatches = text.match(ibbRegex);
    if (ibbMatches) ibbMatches.forEach((u) => found.add(u));
    // If no pattern matched, treat the whole thing as lines of URLs
    if (found.size === 0) {
      const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter((l) => l.startsWith("http"));
      lines.forEach((l) => found.add(l));
    }
    if (found.size > 0) {
      const newUrls = Array.from(found);
      setImageUrls((prev) => {
        const combined = [...prev, ...newUrls];
        return combined.slice(0, 10);
      });
    } else {
      // Single URL fallback
      setImageUrls((prev) => [...prev, text]);
    }
    setNewImageUrl("");
  };

  const removeImage = (i: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color: varColor, size: varSize, price: varPrice || "0", stock: parseInt(varStock) || 0 }),
    });
    setVarColor(""); setVarSize(""); setVarPrice(""); setVarStock("0");
    fetchProduct();
  };

  const handleDeleteVariant = async (vId: string) => {
    await fetch(`/api/products/${productId}/variants?variantId=${vId}`, { method: "DELETE" });
    fetchProduct();
  };

  if (!product) return <div className="p-6 text-center text-gray-400">Cargando...</div>;

  // Discount calculation for preview
  const discountPercent = comparePrice && parseFloat(comparePrice) > 0 && parseFloat(basePrice) < parseFloat(comparePrice)
    ? Math.round(((parseFloat(comparePrice) - parseFloat(basePrice)) / parseFloat(comparePrice)) * 100)
    : 0;

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">← Volver a productos</button>

      {/* Info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">📝 Información</h4>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto" className="w-full px-3 py-2 border rounded-lg text-sm" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Sin categoría</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción del producto" rows={3} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded" />
          Producto activo (visible en catálogo)
        </label>
      </div>

      {/* Pricing */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">💰 Precios</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio de venta *</label>
            <input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio antes (opcional)</label>
            <input type="number" step="0.01" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="Precio normal" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        {discountPercent > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">-{discountPercent}%</span>
            <div className="text-xs">
              <span className="text-gray-400 line-through">${parseFloat(comparePrice).toFixed(2)}</span>
              <span className="font-bold text-red-600 ml-2">${parseFloat(basePrice).toFixed(2)}</span>
            </div>
            <span className="text-xs text-gray-500 ml-auto">Así se verá en el catálogo</span>
          </div>
        )}
        <p className="text-xs text-gray-400">Si pones un precio antes mayor al precio de venta, se mostrará el descuento automáticamente</p>
      </div>

      {/* Stock del producto */}
      <div className="bg-orange-50 rounded-xl p-3 space-y-2 border border-orange-200">
        <h4 className="font-semibold text-xs text-orange-800">📦 Stock</h4>
        <div className="flex items-center gap-2">
          <button onClick={() => setProductStock(Math.max(0, productStock - 1))} className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center font-bold text-sm">−</button>
          <input type="number" min="0" value={productStock} onChange={(e) => setProductStock(parseInt(e.target.value) || 0)} className="w-16 text-center border rounded-lg py-1.5 text-sm font-bold" />
          <button onClick={() => setProductStock(productStock + 1)} className="w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center font-bold text-sm">+</button>
          <span className={`text-xs font-bold ml-1 ${productStock <= 0 ? "text-red-500" : "text-green-600"}`}>
            {productStock <= 0 ? "Agotado" : `${productStock} disp.`}
          </span>
        </div>
        {product && product.variants.length > 0 && (
          <p className="text-[10px] text-orange-500">⚠️ Con variantes, el stock se edita por variante abajo</p>
        )}
      </div>

      {/* Save Info */}
      <button onClick={handleSaveInfo} disabled={saving} className={`w-full text-white py-2.5 rounded-lg text-sm font-medium transition-all ${infoSaved ? "bg-green-500 animate-save-success" : "bg-blue-600 hover:bg-blue-700"}`}>
        {saving ? "⏳ Guardando..." : infoSaved ? "✅ ¡Guardado correctamente!" : "💾 Guardar Información y Precios"}
      </button>

      {/* Images */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🖼️ Imágenes ({imageUrls.length}/10)</h4>
        {/* Smart image input */}
        {imageUrls.length < 10 && (
          <div className="space-y-2">
            <textarea
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addImage(); } }}
              placeholder={"Pega uno o varios enlaces de imágenes aquí...\n\nEjemplo:\nhttps://i.ibb.co/xxxx/foto1.jpg\nhttps://i.ibb.co/yyyy/foto2.png"}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono resize-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={addImage} disabled={!newImageUrl.trim()} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5">
                🔍 Detectar y Agregar
              </button>
            </div>
            <p className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg">💡 Pega varios enlaces de imgbb a la vez — se detectan automáticamente</p>
          </div>
        )}
        {/* Image grid with previews */}
        {imageUrls.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-white border">
                  <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; (e.target as HTMLImageElement).alt = "❌"; }} />
                </div>
                <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition shadow-lg font-bold">✕</button>
                <span className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[9px] px-1 rounded">{i + 1}</span>
              </div>
            ))}
          </div>
        )}
        {imageUrls.length > 0 && (
          <button onClick={handleSaveImages} className={`w-full text-white py-2 rounded-lg text-sm font-medium transition-all ${imagesSaved ? "bg-green-500 animate-save-success" : "bg-green-600 hover:bg-green-700"}`}>
            {imagesSaved ? "✅ ¡Imágenes guardadas!" : "💾 Guardar Imágenes"}
          </button>
        )}
        <p className="text-[10px] text-gray-400">Acepta JPG, PNG, WebP, GIF — enlaces de imgbb.com o cualquier imagen</p>
      </div>

      {/* Variants */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">🎨 Variantes y Stock</h4>
        {product.variants.map((v) => (
          <div key={v.id} className="bg-white rounded-lg px-3 py-2.5 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 flex-wrap items-center">
                {v.color && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{v.color}</span>}
                {v.size && <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{v.size}</span>}
                {parseFloat(v.price) > 0 ? <span className="font-medium text-green-700">${parseFloat(v.price).toFixed(2)}</span> : <span className="text-gray-400 text-[10px]">Precio del producto</span>}
              </div>
              <button onClick={() => handleDeleteVariant(v.id)} className="text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded">✕</button>
            </div>
            {/* Stock editable */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${v.stock <= 0 ? "text-red-500" : "text-green-600"}`}>
                📦 Stock: {v.stock} {v.stock <= 0 ? "(Agotado)" : ""}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={async () => {
                    await fetch(`/api/products/${productId}/variants/stock`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ variantId: v.id, quantity: -1 }),
                    });
                    fetchProduct();
                  }}
                  className="w-7 h-7 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center font-bold text-sm"
                >−</button>
                <input
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={async (e) => {
                    const val = parseInt(e.target.value) || 0;
                    await fetch(`/api/products/${productId}/variants/stock`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ variantId: v.id, setStock: val }),
                    });
                    fetchProduct();
                  }}
                  className="w-14 text-center border rounded-lg py-1 text-sm font-bold"
                />
                <button
                  onClick={async () => {
                    await fetch(`/api/products/${productId}/variants/stock`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ variantId: v.id, quantity: -(-1) }),
                    });
                    fetchProduct();
                  }}
                  className="w-7 h-7 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center font-bold text-sm"
                >+</button>
              </div>
            </div>
          </div>
        ))}
        <form onSubmit={handleAddVariant} className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input value={varColor} onChange={(e) => setVarColor(e.target.value)} placeholder="Color" className="px-2 py-1.5 border rounded text-sm" />
            <input value={varSize} onChange={(e) => setVarSize(e.target.value)} placeholder="Talla" className="px-2 py-1.5 border rounded text-sm" />
            <input type="number" value={varStock} onChange={(e) => setVarStock(e.target.value)} placeholder="Stock" className="px-2 py-1.5 border rounded text-sm" />
          </div>
          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">💲 Precio diferente (opcional)</summary>
            <input type="number" step="0.01" value={varPrice} onChange={(e) => setVarPrice(e.target.value)} placeholder="Dejar en 0 = usa precio del producto" className="w-full px-2 py-1.5 border rounded text-sm mt-1" />
          </details>
        </form>
        <button onClick={handleAddVariant} className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium">+ Agregar Variante</button>
      </div>
    </div>
  );
}
