/*
  Límite de intentos en memoria (ventana deslizante).

  Se usa para frenar fuerza bruta contra el login, el cambio de contraseña
  y el reset. Al desplegar en serverless (Vercel) cada instancia mantiene
  su propio contador: reduce mucho el abuso, aunque no es un límite global.
*/

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 8;
const MAX_BUCKETS = 5000;

type Bucket = { hits: number[] };

const store = new Map<string, Bucket>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function prune(bucket: Bucket, now: number): void {
  const cutoff = now - WINDOW_MS;
  while (bucket.hits.length > 0 && bucket.hits[0] <= cutoff) bucket.hits.shift();
}

function getBucket(key: string): Bucket {
  let bucket = store.get(key);
  if (!bucket) {
    if (store.size >= MAX_BUCKETS) {
      const now = Date.now();
      for (const [k, b] of store) {
        prune(b, now);
        if (b.hits.length === 0) store.delete(k);
      }
    }
    bucket = { hits: [] };
    store.set(key, bucket);
  }
  return bucket;
}

/** Devuelve false cuando se superó el límite de intentos. */
export function checkRateLimit(request: Request, scope: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = getBucket(`${scope}:${getClientIp(request)}`);
  prune(bucket, now);

  if (bucket.hits.length >= MAX_ATTEMPTS) {
    const retryAfterMs = bucket.hits[0] + WINDOW_MS - now;
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Registra un intento fallido. */
export function registerFailure(request: Request, scope: string): void {
  const bucket = getBucket(`${scope}:${getClientIp(request)}`);
  bucket.hits.push(Date.now());
}

/** Borra los intentos tras un acceso correcto. */
export function clearFailures(request: Request, scope: string): void {
  store.delete(`${scope}:${getClientIp(request)}`);
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: "Demasiados intentos. Inténtalo de nuevo en unos minutos." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    }
  );
}
