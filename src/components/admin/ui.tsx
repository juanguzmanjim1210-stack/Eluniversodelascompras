"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon, MinusIcon, PlusIcon } from "../Icons";

export type AdminTab = "dashboard" | "products" | "categories" | "settings" | "security" | "edit-product";

/* ════════════════════════════ API ════════════════════════════ */

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}
export interface ApiInit {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}
export type Api = <T = unknown>(url: string, init?: ApiInit) => Promise<ApiResult<T>>;

async function request<T>(url: string, init?: ApiInit): Promise<ApiResult<T>> {
  try {
    const hasBody = init?.body !== undefined;
    const res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(init?.body) : undefined,
      cache: "no-store",
    });
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/** Mensaje legible a partir de una respuesta fallida. */
export function errorText(r: ApiResult<unknown>, fallback: string): string {
  if (r.status === 0) return "Sin conexión con el servidor";
  if (r.status === 401) return "Tu sesión expiró. Vuelve a ingresar.";
  const d = r.data as { error?: string } | null;
  return d?.error || fallback;
}

/* ═══════════════ Avisos, confirmaciones y sesión ═══════════════ */

type ToastKind = "success" | "error" | "info";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  danger?: boolean;
}

interface AdminContextValue {
  api: Api;
  toast: (text: string, kind?: ToastKind) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin debe usarse dentro de <AdminProvider>");
  return ctx;
}

export function AdminProvider({ children, onExpired }: { children: ReactNode; onExpired: () => void }) {
  const [toasts, setToasts] = useState<{ id: number; kind: ToastKind; text: string }[]>([]);
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(1);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = seq.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 5200 : 3200);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve })),
    []
  );

  const api = useCallback(
    async <T,>(url: string, init?: ApiInit): Promise<ApiResult<T>> => {
      const r = await request<T>(url, init);
      if (r.status === 401) onExpired(); // la sesión caducó: vuelve al acceso
      return r;
    },
    [onExpired]
  );

  const close = useCallback(
    (value: boolean) => {
      dialog?.resolve(value);
      setDialog(null);
    },
    [dialog]
  );

  // Esc cancela la confirmación sin cerrar el panel que hay debajo.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dialog, close]);

  const value = useMemo(() => ({ api, toast, confirm }), [api, toast, confirm]);

  return (
    <AdminContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[95] flex flex-col items-center gap-2 px-4 md:bottom-24" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card-enter pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl border border-white/20 bg-slate-900/90 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                t.kind === "success" ? "bg-emerald-500" : t.kind === "error" ? "bg-rose-500" : "bg-sky-500"
              }`}
            >
              {t.kind === "success" ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.5} /> : t.kind === "error" ? <AlertIcon className="h-3.5 w-3.5" /> : <InfoIcon className="h-3.5 w-3.5" />}
            </span>
            {t.text}
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[96] grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-label={dialog.title}>
          <div className="modal-backdrop absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={() => close(false)} />
          <div className="modal-panel admin-card relative w-full max-w-sm p-6">
            <span className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${dialog.danger ? "bg-rose-50 text-rose-500" : "bg-brand-soft text-brand"}`}>
              <AlertIcon className="h-6 w-6" />
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">{dialog.title}</h3>
            {dialog.message && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{dialog.message}</p>}
            <div className="mt-6 flex gap-2.5">
              <button type="button" onClick={() => close(false)} className="btn btn-ghost flex-1 rounded-xl py-3 text-sm font-bold">
                Cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`btn flex-1 rounded-xl py-3 text-sm font-bold ${dialog.danger ? "btn-danger" : "btn-brand"}`}
              >
                {dialog.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminContext.Provider>
  );
}

/* ═══════════════════════ Piezas de formulario ═══════════════════════ */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3 pt-4 sm:gap-3 sm:px-6 sm:pb-4 sm:pt-5">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  icon,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-card overflow-hidden ${className}`}>
      {title && (
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            {icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand sm:h-9 sm:w-9 sm:rounded-xl">{icon}</span>}
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 sm:text-[15px]">{title}</h3>
              {description && <p className="text-[11px] text-slate-500 sm:text-xs">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0 whitespace-nowrap">{action}</div>}
        </header>
      )}
      <div className="space-y-4 p-3 sm:p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-snug text-slate-400">{hint}</span>}
    </label>
  );
}

/** Interruptor grande con título y descripción. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  tone = "brand",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  tone?: "brand" | "danger";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-slate-300 sm:gap-3 sm:px-3.5 sm:py-3"
    >
      <Toggle checked={checked} tone={tone} />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-800 sm:text-sm">{label}</span>
        {description && <span className="block text-[11px] text-slate-500 sm:text-xs">{description}</span>}
      </span>
    </button>
  );
}

/** Solo el interruptor (sin texto), para filas de lista. */
export function Toggle({ checked, tone = "brand" }: { checked: boolean; tone?: "brand" | "danger" }) {
  return (
    <span
      aria-hidden="true"
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
        checked ? (tone === "danger" ? "bg-rose-500" : "bg-brand") : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? "translate-x-5" : ""}`}
        style={{ transitionTimingFunction: "var(--ease-spring)" }}
      />
    </span>
  );
}

export function ColorField({
  value,
  onChange,
  swatches,
}: {
  value: string;
  onChange: (v: string) => void;
  swatches: ReadonlyArray<{ name: string; hex: string }>;
}) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label="Elegir color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 sm:h-11 sm:w-11"
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} className="field py-2.5 font-mono text-xs sm:text-sm" aria-label="Código de color" />
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {swatches.map((s) => {
          const active = value.toLowerCase() === s.hex.toLowerCase();
          return (
            <button
              key={s.hex + s.name}
              type="button"
              title={s.name}
              aria-label={s.name}
              onClick={() => onChange(s.hex)}
              className={`h-7 w-7 rounded-full border-2 transition duration-200 sm:h-8 sm:w-8 ${
                active ? "scale-110 border-slate-900 shadow-md" : "border-white shadow ring-1 ring-slate-200 hover:scale-110"
              }`}
              style={{ backgroundColor: s.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 ${className}`} />;
}

export function LoadingBlock({ text = "Cargando…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-24 text-sm font-semibold text-slate-400">
      <Spinner /> {text}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">{icon}</span>
      <p className="text-base font-extrabold text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ═════════════ Cantidad de stock: se ESCRIBE directamente ═════════════ */

/**
 * Campo de cantidad. Se puede teclear el número completo («25») sin usar las
 * flechas: el valor se guarda solo, un instante después de dejar de escribir,
 * al salir del campo o al pulsar Intro. Los botones − y + siguen disponibles
 * para ajustes rápidos y también se agrupan en un único guardado.
 *
 * (Antes cada tecla enviaba una petición y recargaba el valor del servidor:
 * al teclear «25» se guardaba «2» y se borraba el resto antes de escribir el 5.)
 */
export function StockInput({
  value,
  onCommit,
  label = "Cantidad en stock",
}: {
  value: number;
  /** Guarda el valor; debe devolver true si el servidor lo aceptó. */
  onCommit: (next: number) => Promise<boolean>;
  label?: string;
}) {
  const [text, setText] = useState(String(value));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const confirmed = useRef(value); // último valor que el servidor aceptó
  const focused = useRef(false);
  const timer = useRef<number | null>(null);

  // Si el valor cambia desde fuera y el usuario no está escribiendo, se sincroniza.
  useEffect(() => {
    confirmed.current = value;
    if (!focused.current) setText(String(value));
  }, [value]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const commit = useCallback(
    async (raw: string) => {
      const n = raw.trim() === "" ? 0 : Math.min(999999, Math.max(0, parseInt(raw, 10) || 0));
      setText(String(n));
      if (n === confirmed.current) {
        setState("idle");
        return;
      }
      setState("saving");
      const ok = await onCommit(n);
      if (ok) {
        confirmed.current = n;
        setState("saved");
        window.setTimeout(() => setState((s) => (s === "saved" ? "idle" : s)), 1700);
      } else {
        setState("error");
        setText(String(confirmed.current));
      }
    },
    [onCommit]
  );

  const schedule = (raw: string) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(raw), 900);
  };

  const nudge = (delta: number) => {
    const n = Math.max(0, (parseInt(text, 10) || 0) + delta);
    setText(String(n));
    schedule(String(n));
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button type="button" aria-label="Quitar una unidad" onClick={() => nudge(-1)} className="btn btn-ghost h-8 w-8 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl">
        <MinusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          value={text}
          onFocus={(e) => {
            focused.current = true;
            e.target.select(); // al entrar queda seleccionado: se escribe encima
          }}
          onChange={(e) => {
            const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
            setText(clean);
            schedule(clean);
          }}
          onBlur={() => {
            focused.current = false;
            if (timer.current) window.clearTimeout(timer.current);
            commit(text);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={`no-spin h-8 w-14 rounded-lg border-2 bg-white text-center text-sm font-extrabold tabular-nums text-slate-900 transition focus:outline-none focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_18%,transparent)] sm:h-9 sm:w-[4.5rem] sm:rounded-xl sm:text-base ${
            state === "error" ? "border-rose-400" : state === "saved" ? "border-emerald-400" : "border-slate-200 focus:border-[color:var(--brand)]"
          }`}
        />
      </div>
      <button type="button" aria-label="Agregar una unidad" onClick={() => nudge(1)} className="btn btn-ghost h-8 w-8 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl">
        <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
      <span className="grid h-5 w-5 place-items-center sm:h-6 sm:w-6" aria-live="polite">
        {state === "saving" && <Spinner className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        {state === "saved" && <CheckIcon className="check-draw h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" strokeWidth={3} />}
        {state === "error" && <CloseIcon className="h-4 w-4 text-rose-500 sm:h-5 sm:w-5" strokeWidth={3} />}
      </span>
    </div>
  );
}
