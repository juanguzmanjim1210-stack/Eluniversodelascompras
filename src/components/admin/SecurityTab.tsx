"use client";

import { useState, type FormEvent } from "react";
import { AlertIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, LockIcon, ShieldIcon } from "../Icons";
import { Card, Field, PageHeader, errorText, useAdmin } from "./ui";

function strength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Muy débil", color: "bg-rose-500" },
    { label: "Débil", color: "bg-rose-400" },
    { label: "Regular", color: "bg-amber-400" },
    { label: "Buena", color: "bg-lime-500" },
    { label: "Fuerte", color: "bg-emerald-500" },
    { label: "Excelente", color: "bg-emerald-600" },
  ];
  return { score, ...levels[score] };
}

export default function SecurityTab() {
  const { api, toast } = useAdmin();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const s = strength(newPassword);
  const mismatch = confirmPassword !== "" && confirmPassword !== newPassword;

  const handleChange = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) return setError("Las contraseñas nuevas no coinciden");
    if (newPassword.length < 8) return setError("La contraseña debe tener al menos 8 caracteres");

    setSaving(true);
    const r = await api("/api/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
    setSaving(false);
    if (!r.ok) return setError(errorText(r, "Error al cambiar la contraseña"));
    toast("Contraseña actualizada correctamente");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const type = show ? "text" : "password";

  return (
    <div>
      <PageHeader title="Seguridad" subtitle="Protege el acceso a tu panel de administración" />
        <div className="grid gap-4 px-3 pb-8 sm:gap-5 sm:px-6 lg:grid-cols-5">
        <Card title="Cambiar contraseña" description="Usa una contraseña que nadie más conozca" icon={<LockIcon className="h-5 w-5" />} className="lg:col-span-3">
          <form onSubmit={handleChange} className="space-y-4">
            <Field label="Contraseña actual">
              <input type={type} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="Tu contraseña actual" required className="field" />
            </Field>
            <Field label="Nueva contraseña">
              <input type={type} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" required minLength={4} className="field" />
            </Field>
            {newPassword && (
              <div>
                <div className="flex gap-1.5" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= s.score ? s.color : "bg-slate-200"}`} />)}
                </div>
                <p className="mt-1.5 text-xs font-bold text-slate-500">Seguridad: {s.label}</p>
              </div>
            )}
            <Field label="Confirmar nueva contraseña">
              <input type={type} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Repite la nueva contraseña" required className={`field ${mismatch ? "border-rose-400" : ""}`} />
              {mismatch && <span className="mt-1.5 block text-xs font-bold text-rose-500">Las contraseñas no coinciden</span>}
            </Field>

            <button type="button" onClick={() => setShow((v) => !v)} className="btn rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
              {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />} {show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            </button>

            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-600">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={saving || !currentPassword || !newPassword || !confirmPassword} className="btn btn-brand btn-shine w-full rounded-2xl py-3.5 text-base font-bold disabled:opacity-50 disabled:shadow-none">
              <LockIcon className="h-5 w-5" /> {saving ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        </Card>

        <Card title="Consejos de seguridad" icon={<ShieldIcon className="h-5 w-5" />} className="h-fit lg:col-span-2">
          <ul className="space-y-3 text-sm text-slate-600">
            {["Usa al menos 8 caracteres.", "Combina letras mayúsculas y minúsculas, números y símbolos.", "No uses datos personales: nombre, teléfono o fechas.", "No compartas tu contraseña con nadie.", "Cambia la contraseña si crees que alguien la conoce."].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
