/**
 * Traducción mínima y tipada. Los textos de la interfaz viven en es.json;
 * para añadir un idioma, crea en.json con las mismas claves y regístralo en DICTIONARIES.
 * Los textos de contenido (eventos, rasgos...) usan LocalizedText dentro de /src/data.
 */
import es from './es.json';
import type { LocalizedText } from '@/engine/types/common';

type Dict = typeof es;

/** Todas las claves 'a.b.c' del diccionario base. */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<Dict>;
export type Lang = 'es';

const DICTIONARIES: Record<Lang, Dict> = { es };
let current: Lang = 'es';

export function setLanguage(lang: Lang): void {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Sustituye {variables} en una plantilla. */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

export function t(key: TKey, vars?: Record<string, string | number>): string {
  const text = lookup(DICTIONARIES[current], key) ?? lookup(DICTIONARIES.es, key) ?? key;
  return interpolate(text, vars);
}

/** Para claves construidas dinámicamente (p. ej. `pos.${position}`). */
export function tDynamic(key: string, vars?: Record<string, string | number>): string {
  return t(key as TKey, vars);
}

/** Texto de contenido localizado con respaldo a español. */
export function lt(text: LocalizedText, vars?: Record<string, string | number>): string {
  return interpolate(text[current] ?? text.es, vars);
}
