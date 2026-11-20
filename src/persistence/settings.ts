import { KEY_PREFIX, readJson, writeJson, type KeyValueStorage } from './storage';

export interface Settings {
  textScale: 'normal' | 'large' | 'xlarge';
  reduceMotion: boolean;
  sound: boolean;
  volume: number;
  cinematics: 'all' | 'important' | 'off';
  language: 'es';
  /** Valor por defecto del modo Ironman para nuevas carreras. */
  ironManDefault: boolean;
  /** Muestra la pantalla de herramientas de depuración en el menú. */
  debug: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  textScale: 'normal',
  reduceMotion: false,
  sound: false,
  volume: 0.7,
  cinematics: 'all',
  language: 'es',
  ironManDefault: false,
  debug: false,
};

const KEY = `${KEY_PREFIX}settings`;

export function loadSettings(storage: KeyValueStorage): Settings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>(storage, KEY, {}) };
}

export function saveSettings(storage: KeyValueStorage, settings: Settings): void {
  try {
    writeJson(storage, KEY, settings);
  } catch {
    // Ajustes no críticos: si falla el guardado se mantienen en memoria.
  }
}
