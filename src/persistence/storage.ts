/** Acceso seguro a almacenamiento clave-valor (localStorage o uno en memoria para tests). */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEY_PREFIX = 'leyenda:';

export function createMemoryStorage(): KeyValueStorage & { dump(): Record<string, string> } {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

let fallback: KeyValueStorage | null = null;

/** localStorage si está disponible; si no (modo privado, bloqueado), uno en memoria. */
export function getBrowserStorage(): KeyValueStorage {
  try {
    const ls = globalThis.localStorage;
    const probe = `${KEY_PREFIX}probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    fallback ??= createMemoryStorage();
    return fallback;
  }
}

export function isQuotaError(err: unknown): boolean {
  return err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22);
}

export function readJson<T>(storage: KeyValueStorage, key: string, fallbackValue: T): T {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function writeJson(storage: KeyValueStorage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value));
}
