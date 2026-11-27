"use client";

import { useState, type FormEvent } from "react";
import Photo from "../Photo";
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon } from "../Icons";
import { THUMB_WIDTHS } from "@/lib/img";

interface LoginViewProps {
  storeName: string;
  logoUrl: string | null;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  error: string;
  notice?: string;
  loading: boolean;
}

export default function LoginView({ storeName, logoUrl, password, setPassword, onSubmit, error, notice, loading }: LoginViewProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden p-5">
      <div className="hero-bg absolute inset-0" />
      <div className="stars" aria-hidden="true" />

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm rounded-[1.75rem] border border-white/40 bg-white/80 p-7 shadow-2xl backdrop-blur-2xl"
      >
        <div className="mb-5 flex flex-col items-center text-center">
          {logoUrl ? (
            <span className="logo-chip mb-4 h-20 w-20">
              <Photo src={logoUrl} sizes="80px" widths={THUMB_WIDTHS} alt="" draggable={false} />
            </span>
          ) : (
            <span className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-lg">
              <LockIcon className="h-9 w-9" />
            </span>
          )}
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Panel de administración</h2>
          <p className="mt-0.5 text-sm font-medium text-slate-500">{storeName}</p>
        </div>

        {notice && (
          <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-semibold text-amber-700">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {notice}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-slate-600">Contraseña</span>
          <span className="relative block">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña de administrador"
              autoComplete="current-password"
              autoFocus
              className="field pr-12"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="btn absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-lg text-slate-400 hover:text-slate-700"
            >
              {show ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </span>
        </label>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-600">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={loading || !password} className="btn btn-brand btn-shine mt-5 w-full rounded-2xl py-3.5 text-base font-bold disabled:opacity-50 disabled:shadow-none">
          {loading ? (
            <>
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Verificando…
            </>
          ) : (
            <>
              <LockIcon className="h-5 w-5" /> Ingresar
            </>
          )}
        </button>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">Acceso exclusivo del propietario. Si es tu primer ingreso, usa la contraseña configurada en tu servidor.</p>
      </form>
    </div>
  );
}
