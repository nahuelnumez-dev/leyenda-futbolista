/**
 * Ranuras de guardado: autoguardado + 3 manuales.
 * Cada ranura guarda la partida comprimida (lz-string) y, aparte, un resumen ligero
 * para poder listar las ranuras sin descomprimir nada.
 */
import LZString from 'lz-string';
import { WORLD } from '@/data';
import { ageInSeason, formatSeason } from '@/engine/world/newGame';
import { deserializeGame, serializeGame, SaveError } from '@/engine/save/serialize';
import type { GameState } from '@/engine/types/game';
import { isQuotaError, KEY_PREFIX, readJson, writeJson, type KeyValueStorage } from './storage';

export const SLOT_IDS = ['auto', '1', '2', '3'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SlotMeta {
  slotId: SlotId;
  gameId: string;
  playerName: string;
  nickname?: string;
  age: number;
  seasonLabel: string;
  clubId?: string;
  position: string;
  savedAt: string;
  ironMan: boolean;
  retired: boolean;
  /** Tamaño comprimido aproximado en KB. */
  sizeKb: number;
}

const dataKey = (slot: SlotId) => `${KEY_PREFIX}slot:${slot}`;
const metaKey = (slot: SlotId) => `${KEY_PREFIX}slotmeta:${slot}`;

/** Calendario de la liga del club (las sudamericanas usan año natural: "2026"). */
function calendarOf(clubId: string | undefined): 'europeo' | 'anual' {
  const country = clubId ? WORLD.clubById.get(clubId)?.country : undefined;
  return WORLD.leagues.find((l) => l.country === country)?.calendar ?? 'europeo';
}

export function buildMeta(slotId: SlotId, game: GameState, savedAt: string, sizeKb: number): SlotMeta {
  const p = game.player;
  return {
    slotId,
    gameId: game.id,
    playerName: p.identity.name,
    ...(p.identity.nickname ? { nickname: p.identity.nickname } : {}),
    age: ageInSeason(p.identity.birthDate, game.calendar.season),
    seasonLabel: formatSeason(game.calendar.season, calendarOf(p.contract?.clubId)),
    ...(p.contract ? { clubId: p.contract.clubId } : {}),
    position: p.positions.main,
    savedAt,
    ironMan: game.options.ironMan,
    retired: game.retired,
    sizeKb,
  };
}

export function saveToSlot(storage: KeyValueStorage, slotId: SlotId, game: GameState, savedAt: string): SlotMeta {
  const compressed = LZString.compressToUTF16(serializeGame(game, savedAt));
  const sizeKb = Math.round((compressed.length * 2) / 1024);
  const meta = buildMeta(slotId, game, savedAt, sizeKb);
  try {
    storage.setItem(dataKey(slotId), compressed);
    writeJson(storage, metaKey(slotId), meta);
  } catch (err) {
    if (isQuotaError(err)) {
      throw new SaveError('quota', 'No queda espacio en el navegador. Borra alguna ranura o exporta la partida.');
    }
    throw err;
  }
  return meta;
}

export function loadFromSlot(storage: KeyValueStorage, slotId: SlotId): GameState {
  const compressed = storage.getItem(dataKey(slotId));
  if (!compressed) throw new SaveError('empty', 'Esta ranura está vacía.');
  const json = LZString.decompressFromUTF16(compressed);
  if (!json) throw new SaveError('corrupt', 'No se pudo descomprimir la partida.');
  return deserializeGame(json).game;
}

export function deleteSlot(storage: KeyValueStorage, slotId: SlotId): void {
  storage.removeItem(dataKey(slotId));
  storage.removeItem(metaKey(slotId));
}

export function listSlots(storage: KeyValueStorage): Record<SlotId, SlotMeta | null> {
  const out = {} as Record<SlotId, SlotMeta | null>;
  for (const id of SLOT_IDS) {
    const meta = readJson<SlotMeta | null>(storage, metaKey(id), null);
    out[id] = meta && storage.getItem(dataKey(id)) ? meta : null;
  }
  return out;
}

/** Ranura guardada más recientemente (para "Continuar"). */
export function latestSlot(storage: KeyValueStorage): SlotMeta | null {
  const metas = Object.values(listSlots(storage)).filter((m): m is SlotMeta => m !== null && !m.retired);
  metas.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return metas[0] ?? null;
}

/** JSON legible para descargar. */
export function exportGame(game: GameState, savedAt: string): string {
  return serializeGame(game, savedAt, true);
}

/** Valida un JSON importado y devuelve la partida. Lanza SaveError si no es válido. */
export function importGame(json: string): GameState {
  return deserializeGame(json).game;
}

export function exportFileName(game: GameState): string {
  const slug = game.player.identity.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `leyenda-${slug || 'carrera'}-${game.calendar.season}.json`;
}
