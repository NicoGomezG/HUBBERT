/**
 * Caché en memoria con TTL para lecturas de la API de Discord que el panel
 * repite en cada navegación (canales, roles, emojis, usuario del bot).
 * Guarda la promesa, así que requests simultáneos comparten una sola llamada.
 * Si la llamada falla, la entrada se descarta para no cachear el error.
 */
const store = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as Promise<T>;

  const value = load();
  const entry = { expiresAt: now + ttlMs, value };
  store.set(key, entry);
  value.catch(() => {
    if (store.get(key) === entry) store.delete(key);
  });
  return value;
}

export function invalidateCached(key: string): void {
  store.delete(key);
}

export const DISCORD_CACHE_TTL_MS = 30_000;
