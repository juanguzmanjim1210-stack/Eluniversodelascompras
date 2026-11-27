import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";
import { getAdminHash, setAdminHash } from "./data";

const COOKIE_NAME = "admin_session";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

let cachedSecret: string | null = null;
let warnedAboutSecret = false;

/**
 * Secreto para firmar las sesiones del panel.
 *
 * Orden de prioridad:
 *  1. `JWT_SECRET` del entorno (lo recomendado en producción).
 *  2. Un secreto derivado de `DATABASE_URL` cuando falta el primero.
 *
 * El paso 2 existe porque, sin secreto, el panel no llegaba a abrirse en
 * absoluto: `/api/auth/login` respondía 503 *antes* de comprobar la
 * contraseña, así que el error se veía justo al escribirla.
 *
 * No se usa una cadena fija escrita en el código: cualquier persona con el
 * repositorio podría usarla para forjar la cookie `admin_session`. Se
 * deriva con SHA-256, lo que da un valor estable entre reinicios y entre
 * funciones serverless (sale de una variable que casi nunca cambia),
 * distinto en cada despliegue, y no expuesto en el cliente. Al salir de
 * `DATABASE_URL` —que ya es un secreto— quien pudiera derivarlo tendría
 * acceso a la base de datos de todos modos.
 */
export function getJwtSecret(): string {
  if (cachedSecret) return cachedSecret;

  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 16) {
    cachedSecret = secret;
    return secret;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const derived = createHash("sha256").update(databaseUrl).digest("hex");
    if (!warnedAboutSecret) {
      warnedAboutSecret = true;
      console.warn(
        "[auth] JWT_SECRET no definido: usando un secreto derivado de DATABASE_URL. Añade JWT_SECRET a las variables de entorno para poder rotarlo sin cerrar las sesiones abiertas."
      );
    }
    cachedSecret = derived;
    return derived;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Faltan JWT_SECRET y DATABASE_URL: no hay con qué firmar la sesión del panel."
    );
  }

  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn("[auth] Sin secretos disponibles: usando secreto de desarrollo. No sirve para producción.");
  }
  const fallback = "catalogo-admin-secret-key-local-only";
  cachedSecret = fallback;
  return fallback;
}

/** Comparación de cadenas sin filtrar el tiempo de ejecución. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function initializeAdminPassword(): Promise<void> {
  const hash = await getAdminHash();
  if (!hash) {
    // No password exists yet - create one from ADMIN_PASSWORD env var
    const newHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await setAdminHash(newHash);
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  await initializeAdminPassword();
  const hash = await getAdminHash();
  if (!hash) return false;

  const matches = await bcrypt.compare(password, hash);
  if (matches) return true;

  // If the password they typed matches ADMIN_PASSWORD env var,
  // reset the hash (in case DB had a stale hash from before)
  if (password === DEFAULT_PASSWORD) {
    const newHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await setAdminHash(newHash);
    return true;
  }

  return false;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyPassword(currentPassword);
  if (!isValid) return { success: false, error: "La contraseña actual es incorrecta" };
  if (newPassword.length < 8) {
    return { success: false, error: "La nueva contraseña debe tener al menos 8 caracteres" };
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await setAdminHash(hash);
  return { success: true };
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(getJwtSecret()));
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, new TextEncoder().encode(getJwtSecret()));
    return true;
  } catch {
    return false;
  }
}

function parseCookies(header: string): Record<string, string> {
  const r: Record<string, string> = {};
  if (!header) return r;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    r[pair.substring(0, idx).trim()] = decodeURIComponent(pair.substring(idx + 1).trim());
  }
  return r;
}

export function getTokenFromRequest(request: Request): string | null {
  return parseCookies(request.headers.get("cookie") || "")[COOKIE_NAME] || null;
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  return verifyToken(token);
}

export function setSessionCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  const parts = [`${COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${60 * 60 * 24 * 7}`];
  if (secure) parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(response: Response): void {
  response.headers.append("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
