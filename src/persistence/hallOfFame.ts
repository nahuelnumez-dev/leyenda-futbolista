/** Salón de la Fama: resumen compacto de cada carrera terminada (se añade al retirarse). */
import { KEY_PREFIX, readJson, writeJson, type KeyValueStorage } from './storage';

export interface HallOfFameEntry {
  gameId: string;
  name: string;
  nickname?: string;
  nationality: string;
  position: string;
  retiredSeason: number;
  retiredAge: number;
  seasons: number;
  peakOverall: number;
  clubs: string[];
  apps: number;
  goals: number;
  assists: number;
  trophies: number;
  awards: number;
  caps?: number;
  ballonDors?: number;
  /** Etiqueta de legado: 'Jugador de club' ... 'Leyenda mundial'. */
  legacy: string;
  legacyScore: number;
  finishedAt: string;
}

const KEY = `${KEY_PREFIX}hall`;

export function loadHallOfFame(storage: KeyValueStorage): HallOfFameEntry[] {
  const list = readJson<HallOfFameEntry[]>(storage, KEY, []);
  return Array.isArray(list) ? list : [];
}

export function addToHallOfFame(storage: KeyValueStorage, entry: HallOfFameEntry): HallOfFameEntry[] {
  const list = loadHallOfFame(storage).filter((e) => e.gameId !== entry.gameId);
  list.push(entry);
  list.sort((a, b) => b.legacyScore - a.legacyScore);
  writeJson(storage, KEY, list);
  return list;
}

export function clearHallOfFame(storage: KeyValueStorage): void {
  storage.removeItem(KEY);
}
