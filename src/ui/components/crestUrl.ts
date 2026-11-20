/**
 * Dirección de un escudo. Por defecto es el PNG de /public/crests.
 * En la versión web empaquetada (VITE_CREST_PACK=1) todos los escudos van reducidos en un único
 * archivo `crests-pack.json` (ruta → data URI), que se carga una vez antes de pintar la app.
 */
let pack: Record<string, string> | null = null;

export async function loadCrestPack(): Promise<void> {
  if (import.meta.env.VITE_CREST_PACK !== '1') return;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}crests-pack.json`);
    if (res.ok) pack = (await res.json()) as Record<string, string>;
  } catch {
    pack = null; // Sin paquete: se usan los escudos genéricos dibujados.
  }
}

export function crestUrl(file: string): string {
  if (pack) return pack[file] ?? '';
  return `${import.meta.env.BASE_URL}${file}`;
}
