import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { getAdminHash, setAdminHash } from "./data";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "catalogo-admin-secret-key-2024-change-me"
);
const COOKIE_NAME = "admin_session";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function initializeAdminPassword(): Promise<void> {
  const hash = await getAdminHash();
  if (!hash) {
    const newHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await setAdminHash(newHash);
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  await initializeAdminPassword();
  const hash = await getAdminHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const isValid = await verifyPassword(currentPassword);
  if (!isValid) return { success: false, error: "La contraseña actual es incorrecta" };
  if (newPassword.length < 4) return { success: false, error: "La nueva contraseña debe tener al menos 4 caracteres" };
  const hash = await bcrypt.hash(newPassword, 10);
  await setAdminHash(hash);
  return { success: true };
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<boolean> {
  try { await jwtVerify(token, SECRET_KEY); return true; } catch { return false; }
}

function parseCookies(header: string): Record<string, string> {
  const r: Record<string, string> = {};
  if (!header) return r;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    r[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
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
  const parts = [`${COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${60*60*24*7}`];
  if (secure) parts.push("Secure");
  response.headers.append("Set-Cookie", parts.join("; "));
}

export function clearSessionCookie(response: Response): void {
  response.headers.append("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}
