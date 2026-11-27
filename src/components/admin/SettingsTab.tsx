"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AppearancePalette, StoreSettings } from "@/lib/types";
import Photo from "../Photo";
import { GlobeIcon, ImageIcon, MegaphoneIcon, PaletteIcon, SaveIcon, ShieldIcon, StoreIcon, WhatsAppIcon } from "../Icons";
import { Card, ColorField, Field, LoadingBlock, PageHeader, Switch, errorText, useAdmin } from "./ui";
import { DEFAULT_APPEARANCE, isLegacyGreen, normalizeAppearance } from "@/lib/theme";
import { THUMB_WIDTHS } from "@/lib/img";

interface Form {
  storeName: string;
  storeDescription: string;
  logoUrl: string;
  coverUrl: string;
  facebook: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  primaryColor: string;
  buttonText: string;
  currency: string;
  footerText: string;
  footerLogoUrl: string;
  footerName: string;
  footerColor: string;
  announcementText: string;
  announcementActive: boolean;
  announcementColor: string;
  announcementSpeed: number;
  warrantyType: string;
  warrantyText: string;
  warrantyImages: string;
  appearance: StoreSettings["appearance"];
}

/** El verde de fábrica se muestra ya como el azul/rojo del logo: es lo que ven los clientes. */
function toForm(d: StoreSettings): Form {
  const appearance = normalizeAppearance(d.appearance);
  return {
    storeName: d.storeName || "",
    storeDescription: d.storeDescription || "",
    logoUrl: d.logoUrl || "",
    coverUrl: d.coverUrl || "",
    facebook: d.facebook || "",
    whatsapp: d.whatsapp || "",
    instagram: d.instagram || "",
    tiktok: d.tiktok || "",
    primaryColor: isLegacyGreen(d.primaryColor) ? appearance.palette.blue : d.primaryColor,
    buttonText: d.buttonText || "Comprar",
    currency: d.currency || "$",
    footerText: d.footerText || "",
    footerLogoUrl: d.footerLogoUrl || "",
    footerName: d.footerName || "",
    footerColor: d.footerColor || "#111827",
    announcementText: d.announcementText || "",
    announcementActive: d.announcementActive ?? false,
    announcementColor: isLegacyGreen(d.announcementColor) ? appearance.palette.red : d.announcementColor,
    announcementSpeed: d.announcementSpeed || 40,
    warrantyType: d.warrantyType || "none",
    warrantyText: d.warrantyText || "",
    warrantyImages: d.warrantyImages || "",
    appearance,
  };
}

/** Etiquetas de la paleta del logo, en el orden en que se muestran. */
const PALETTE_LABELS: ReadonlyArray<[keyof AppearancePalette, string]> = [
  ["navy", "Azul marino"],
  ["blue", "Azul principal"],
  ["sky", "Azul cielo"],
  ["red", "Rojo"],
  ["gold", "Dorado"],
  ["yellow", "Amarillo"],
];

const FOOTER_SWATCHES = ["#0a1a5c", "#111827", "#1e293b", "#0f172a", "#18181b", "#1a1a2e", "#16213e", "#0d1b2a", "#2d1b69", "#1b4332", "#7f1d1d", "#78350f", "#365314"].map((hex) => ({ name: hex, hex }));

const CURRENCIES = [
  ["$", "$ (Peso / Dólar)"],
  ["€", "€ (Euro)"],
  ["S/.", "S/. (Sol)"],
  ["Q", "Q (Quetzal)"],
  ["L", "L (Lempira)"],
  ["C$", "C$ (Córdoba)"],
  ["₡", "₡ (Colón)"],
  ["Bs", "Bs (Bolívar)"],
  ["RD$", "RD$ (Peso Dom.)"],
];

export default function SettingsTab() {
  const { api, toast } = useAdmin();
  const [f, setF] = useState<Form | null>(null);
  const [saved, setSaved] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await api<StoreSettings>("/api/store-settings");
    if (!r.ok || !r.data) return toast(errorText(r, "No se pudo cargar la configuración"), "error");
    const form = toForm(r.data);
    setF(form);
    setSaved(JSON.stringify(form));
  }, [api, toast]);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => !!f && JSON.stringify(f) !== saved, [f, saved]);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setF((prev) => (prev ? { ...prev, [key]: value } : prev));

  const setPal = (key: keyof AppearancePalette, value: string) =>
    setF((prev) => (prev ? { ...prev, appearance: { ...prev.appearance, palette: { ...prev.appearance.palette, [key]: value } } } : prev));
  const setApp = (key: "tricolor" | "stars" | "titleGradient" | "logoFloat", value: boolean) =>
    setF((prev) => (prev ? { ...prev, appearance: { ...prev.appearance, [key]: value } } : prev));
  const resetPalette = () =>
    setF((prev) => (prev ? { ...prev, appearance: { ...prev.appearance, palette: { ...DEFAULT_APPEARANCE.palette } } } : prev));

  /** Los atajos de color siguen la paleta editable del logo. */
  const logoSwatches = useMemo(
    () =>
      f
        ? PALETTE_LABELS.map(([key, name]) => ({ name, hex: f.appearance.palette[key] }))
        : [],
    [f]
  );

  const handleSave = async () => {
    if (!f) return;
    setSaving(true);
    const r = await api("/api/store-settings", {
      method: "PUT",
      body: {
        storeName: f.storeName, storeDescription: f.storeDescription, logoUrl: f.logoUrl, coverUrl: f.coverUrl,
        facebook: f.facebook, whatsapp: f.whatsapp, instagram: f.instagram, tiktok: f.tiktok,
        primaryColor: f.primaryColor, buttonText: f.buttonText, currency: f.currency,
        footerText: f.footerText, footerLogoUrl: f.footerLogoUrl, footerName: f.footerName, footerColor: f.footerColor,
        announcementText: f.announcementText, announcementActive: f.announcementActive,
        announcementColor: f.announcementColor, announcementSpeed: f.announcementSpeed,
        warrantyType: f.warrantyType, warrantyText: f.warrantyText, warrantyImages: f.warrantyImages,
        appearance: f.appearance,
      },
    });
    setSaving(false);
    if (!r.ok) return toast(errorText(r, "No se pudo guardar"), "error");
    setSaved(JSON.stringify(f));
    // La apariencia vive en una columna que puede no existir todavía en la base
    // de datos: se comprueba que quedó escrita antes de dar el guardado por bueno.
    const expected = JSON.stringify(f.appearance);
    const after = await api<StoreSettings>("/api/store-settings");
    if (after.ok && JSON.stringify(after.data?.appearance) !== expected) {
      toast("Se guardó la tienda, pero faltan los ajustes de apariencia. Ejecuta «npx drizzle-kit push» en la base de datos.", "error");
      return;
    }
    toast("Guardado. Los cambios ya se ven en el catálogo.");
  };

  if (!f) return <LoadingBlock />;

  const warrantyUrls = f.warrantyImages.split("\n").map((u) => u.trim()).filter(Boolean);

  return (
    <div>
      <PageHeader title="Tienda" subtitle="Nombre, logo, colores, anuncios y pie de página" />

      <div className="grid gap-4 px-3 pb-6 sm:px-5 sm:gap-5 lg:grid-cols-2">
        <Card title="Información" description="Lo primero que ven tus clientes" icon={<StoreIcon className="h-5 w-5" />}>
          <Field label="Nombre de la tienda">
            <input value={f.storeName} onChange={(e) => set("storeName", e.target.value)} placeholder="Nombre de la tienda" className="field" />
          </Field>
          <Field label="Descripción / eslogan" hint="Separa cada mensaje con una línea en blanco y se mostrará como una tarjeta en la portada.">
            <textarea value={f.storeDescription} onChange={(e) => set("storeDescription", e.target.value)} rows={5} placeholder="Descripción / Eslogan" className="field resize-y" />
          </Field>
        </Card>

        <Card title="Logo y portada" description="Sube la imagen a imgbb.com y pega el enlace" icon={<ImageIcon className="h-5 w-5" />}>
          <div className="flex items-center gap-3">
            <span className="logo-chip grid h-14 w-14 shrink-0 place-items-center text-slate-300 sm:h-16 sm:w-16">
              {f.logoUrl ? <Photo src={f.logoUrl} sizes="64px" widths={THUMB_WIDTHS} alt="" draggable={false} /> : <ImageIcon className="h-6 w-6" />}
            </span>
            <Field label="URL del logo" hint="Se muestra en círculo. Funciona mejor con un logo cuadrado o redondo." className="min-w-0 flex-1">
              <input value={f.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://i.ibb.co/…" className="field font-mono text-xs sm:text-sm" />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-300 sm:h-16 sm:w-16">
              {f.coverUrl ? <Photo src={f.coverUrl} sizes="64px" widths={THUMB_WIDTHS} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6" />}
            </span>
            <Field label="URL de la portada (opcional)" hint="Si la dejas vacía se usa el fondo con los colores del logo." className="min-w-0 flex-1">
              <input value={f.coverUrl} onChange={(e) => set("coverUrl", e.target.value)} placeholder="https://i.ibb.co/…" className="field font-mono text-xs sm:text-sm" />
            </Field>
          </div>
        </Card>

        <Card title="Colores y botones" description="Los atajos son los colores de tu logo" icon={<PaletteIcon className="h-5 w-5" />}>
          <Field label="Color principal de la tienda">
            <ColorField value={f.primaryColor} onChange={(v) => set("primaryColor", v)} swatches={logoSwatches} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Texto del botón de compra">
              <input value={f.buttonText} onChange={(e) => set("buttonText", e.target.value)} placeholder="Ej: Comprar, Pedir…" className="field" />
            </Field>
            <Field label="Moneda">
              <select value={f.currency} onChange={(e) => set("currency", e.target.value)} className="field">
                {CURRENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3" style={{ "--brand": f.primaryColor } as CSSProperties}>
            <span className="text-xs font-bold text-slate-500">Vista previa</span>
            <span className="btn btn-brand btn-shine pointer-events-none rounded-xl px-5 py-2.5 text-sm font-bold">{f.buttonText || "Comprar"}</span>
          </div>
        </Card>

        <Card
          title="Apariencia del catálogo"
          description="Los colores de tu logo y los elementos decorativos de la portada"
          icon={<PaletteIcon className="h-5 w-5" />}
          className="lg:col-span-2"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Colores del logo ── */}
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Colores del logo</p>
                <button type="button" onClick={resetPalette} className="btn rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-brand">
                  Restaurar
                </button>
              </div>
              <div className="space-y-2">
                {PALETTE_LABELS.map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 sm:gap-2.5 sm:px-2.5">
                    <span className="w-[4.5rem] shrink-0 text-[11px] font-bold leading-tight text-slate-600 sm:w-24 sm:text-xs">{label}</span>
                    <input
                      type="color"
                      aria-label={`Color ${label}`}
                      value={f.appearance.palette[key]}
                      onChange={(e) => setPal(key, e.target.value)}
                      className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5 sm:h-8 sm:w-8"
                    />
                    <input
                      value={f.appearance.palette[key]}
                      onChange={(e) => setPal(key, e.target.value)}
                      spellCheck={false}
                      aria-label={`Código de ${label}`}
                      className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-1.5 font-mono text-[11px] text-slate-700 focus:border-[color:var(--brand)] focus:outline-none sm:px-2 sm:text-xs"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-slate-400">
                Estos colores pintan la portada, los botones, la franja tricolor y los atajos de arriba.
              </p>
            </div>

            {/* ── Elementos de la portada ── */}
            <div className="min-w-0">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Elementos de la portada</p>
              <div className="space-y-2.5">
                <Switch checked={f.appearance.tricolor} onChange={(v) => setApp("tricolor", v)} label="Franja tricolor" description="Amarillo · azul · rojo en la portada y sobre el pie" />
                <Switch checked={f.appearance.stars} onChange={(v) => setApp("stars", v)} label="Estrellas" description="Fondo cósmico cuando no hay imagen de portada" />
                <Switch checked={f.appearance.titleGradient} onChange={(v) => setApp("titleGradient", v)} label="Título en degradé" description="El nombre de la tienda en blanco y crema" />
                <Switch checked={f.appearance.logoFloat} onChange={(v) => setApp("logoFloat", v)} label="Logo flotante" description="Vuelo, órbita dorada y sombra" />
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                <div className="hero-bg px-4 py-5 text-center">
                  <p className={`text-base font-extrabold ${f.appearance.titleGradient ? "title-gold" : "text-white"}`}>{f.storeName || "Tu tienda"}</p>
                </div>
                <div className={`flex items-center justify-center gap-4 bg-white px-4 py-3 ${f.appearance.tricolor ? "" : "hidden"}`}>
                  <span className="h-2 w-10 rounded-full" style={{ backgroundColor: f.appearance.palette.yellow }} />
                  <span className="h-2 w-10 rounded-full" style={{ backgroundColor: f.appearance.palette.blue }} />
                  <span className="h-2 w-10 rounded-full" style={{ backgroundColor: f.appearance.palette.red }} />
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-slate-400">Vista previa de cómo se vería la portada.</p>
            </div>
          </div>
        </Card>

        <Card title="Anuncio / promoción" description="Banner animado arriba del catálogo" icon={<MegaphoneIcon className="h-5 w-5" />}>
          <Switch checked={f.announcementActive} onChange={(v) => set("announcementActive", v)} label="Mostrar anuncio en el catálogo" />
          <Field label="Texto del anuncio">
            <input value={f.announcementText} onChange={(e) => set("announcementText", e.target.value)} placeholder="Ej: ¡Envío gratis en compras mayores a $100.000!" className="field" />
          </Field>
          <Field label="Color del banner">
            <ColorField value={f.announcementColor} onChange={(v) => set("announcementColor", v)} swatches={logoSwatches} />
          </Field>
          <Field label={`Velocidad (${f.announcementSpeed} s)`}>
            <input type="range" min={10} max={80} value={f.announcementSpeed} onChange={(e) => set("announcementSpeed", parseInt(e.target.value, 10))} className="w-full accent-[color:var(--brand)]" />
            <span className="flex justify-between text-[11px] text-slate-400"><span>Rápido</span><span>Lento</span></span>
          </Field>
          {f.announcementText && (
            <div style={{ backgroundColor: f.announcementColor }} className="overflow-hidden rounded-xl py-2.5 text-white">
              <div className="marquee-track whitespace-nowrap" style={{ animationDuration: `${f.announcementSpeed}s` }}>
                {[0, 1].map((h) => (
                  <span key={h} className="inline-flex">
                    {[0, 1, 2].map((i) => <span key={i} className="mx-6 text-sm font-extrabold tracking-wide">⭐ {f.announcementText} ⭐</span>)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="WhatsApp para pedidos" description="A este número llegan los pedidos" icon={<WhatsAppIcon className="h-5 w-5" />}>
          <Field label="Enlace de WhatsApp" hint="Abre WhatsApp, entra a tu perfil, copia el enlace y pégalo aquí.">
            <input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="https://wa.me/573001234567" className="field font-mono text-xs sm:text-sm" />
          </Field>
        </Card>

        <Card title="Redes sociales" description="Aparecen en la portada y en el pie de página" icon={<GlobeIcon className="h-5 w-5" />}>
          <Field label="Facebook"><input value={f.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" className="field text-sm" /></Field>
          <Field label="Instagram"><input value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" className="field text-sm" /></Field>
          <Field label="TikTok"><input value={f.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@…" className="field text-sm" /></Field>
        </Card>

        <Card title="Políticas de garantía" description="Elige cómo mostrarlas en el catálogo" icon={<ShieldIcon className="h-5 w-5" />} className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {([["none", "Sin políticas"], ["text", "Texto"], ["images", "Imágenes"]] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => set("warrantyType", val)} className={`btn rounded-xl py-2.5 text-xs font-bold sm:text-sm ${f.warrantyType === val ? "btn-brand" : "btn-ghost"}`}>
                {label}
              </button>
            ))}
          </div>
          {f.warrantyType === "text" && (
            <Field label="Texto de las políticas" hint="Usa **texto** para poner en negrita.">
              <textarea value={f.warrantyText} onChange={(e) => set("warrantyText", e.target.value)} rows={7} placeholder={"Escribe aquí tus políticas de garantía…"} className="field resize-y" />
            </Field>
          )}
          {f.warrantyType === "images" && (
            <>
              <Field label="Enlaces de las imágenes, uno por línea" hint="Sube tus imágenes a imgbb.com y pega los enlaces.">
                <textarea value={f.warrantyImages} onChange={(e) => set("warrantyImages", e.target.value)} rows={4} placeholder={"https://i.ibb.co/xxxx/politica1.jpg\nhttps://i.ibb.co/yyyy/politica2.jpg"} className="field resize-y font-mono text-xs sm:text-sm" />
              </Field>
              {warrantyUrls.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {warrantyUrls.map((u, i) => (
                    <li key={u + i} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <Photo src={u} sizes="200px" widths={[256, 384]} alt={`Política ${i + 1}`} className="w-full" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>

        <Card title="Pie de página" description="Fondo, logo y mensajes del final de la tienda" icon={<StoreIcon className="h-5 w-5" />} className="lg:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Logo del pie (opcional)" hint="Si lo dejas vacío no aparece logo.">
                <input value={f.footerLogoUrl} onChange={(e) => set("footerLogoUrl", e.target.value)} placeholder="https://i.ibb.co/…" className="field font-mono text-xs sm:text-sm" />
              </Field>
              <Field label="Título sobre las redes (ej: Síguenos)">
                <input value={f.footerName} onChange={(e) => set("footerName", e.target.value)} placeholder="Ej: Síguenos" className="field" />
              </Field>
              <Field label="Texto central (ej: Calidad y cumplimiento)">
                <input value={f.footerText} onChange={(e) => set("footerText", e.target.value)} placeholder="Ej: Calidad y cumplimiento" className="field" />
              </Field>
              <Field label="Color de fondo">
                <ColorField value={f.footerColor} onChange={(v) => set("footerColor", v)} swatches={FOOTER_SWATCHES} />
              </Field>
            </div>
            <div style={{ backgroundColor: f.footerColor }} className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 text-center text-white sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Vista previa</p>
              {f.footerLogoUrl && (
                <span className="logo-chip h-14 w-14 sm:h-16 sm:w-16"><Photo src={f.footerLogoUrl} sizes="64px" widths={THUMB_WIDTHS} alt="" draggable={false} /></span>
              )}
              {f.footerName && <p className="text-base font-extrabold">{f.footerName}</p>}
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => <span key={i} className="h-9 w-9 rounded-full bg-white/15 ring-1 ring-white/25" />)}
              </div>
              {f.footerText && <p className="text-sm text-white/70">{f.footerText}</p>}
              <p className="text-[11px] text-white/40">© {new Date().getFullYear()} {f.storeName}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Barra de guardado fija ── */}
      <div className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs font-bold sm:text-sm ${dirty ? "text-amber-600" : "text-emerald-600"}`}>{dirty ? "● Sin guardar" : "✓ Todo guardado"}</p>
          <div className="flex gap-2">
            {dirty && <button type="button" onClick={load} disabled={saving} className="btn btn-ghost rounded-xl px-3 py-2.5 text-xs font-bold sm:px-4 sm:text-sm">Descartar</button>}
            <button type="button" onClick={handleSave} disabled={!dirty || saving} className="btn btn-brand btn-shine rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-50 disabled:shadow-none sm:px-5 sm:text-sm">
              <SaveIcon className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
