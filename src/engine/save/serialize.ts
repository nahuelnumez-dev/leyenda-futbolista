/**
 * Serialización de partidas: sobre con versión, validación con zod y migraciones.
 * Lógica pura: no toca el almacenamiento del navegador (eso vive en src/persistence).
 */
import { z } from 'zod';
import { GAME_STATE_VERSION, type GameState } from '../types/game';
import { migrateGame } from './migrations';

export const SAVE_FORMAT = 'leyenda-save';

export interface SaveEnvelope {
  format: typeof SAVE_FORMAT;
  version: number;
  savedAt: string;
  game: GameState;
}

export class SaveError extends Error {
  constructor(
    public readonly code: 'invalid-json' | 'not-a-save' | 'too-new' | 'corrupt' | 'quota' | 'empty',
    message: string,
  ) {
    super(message);
    this.name = 'SaveError';
  }
}

const num = z.number().finite();

const envelopeSchema = z.object({
  format: z.literal(SAVE_FORMAT),
  version: z.number().int().positive(),
  savedAt: z.string(),
  game: z.unknown(),
});

/**
 * Validación estructural de la partida. Comprueba lo imprescindible para que el juego no se rompa;
 * no valida cada campo anidado (eso lo garantiza el tipado del motor).
 */
const gameSchema = z.object({
  version: z.number().int(),
  id: z.string().min(1),
  createdAt: z.string(),
  seed: z.string(),
  rngState: z.tuple([num, num, num, num]),
  options: z.object({ ironMan: z.boolean(), customSeed: z.boolean() }),
  calendar: z.object({
    startSeason: z.number().int(),
    season: z.number().int(),
    phase: z.enum(['preseason', 'firstHalf', 'winterWindow', 'secondHalf', 'seasonEnd']),
    step: z.number().int().nonnegative(),
  }),
  world: z.object({
    clubs: z.record(z.string(), z.unknown()),
    standings: z.record(z.string(), z.array(z.unknown())),
    history: z.array(z.unknown()),
    npcStars: z.array(z.unknown()),
  }),
  player: z.object({
    identity: z.object({
      name: z.string().min(1),
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      nationalities: z.array(z.string()).min(1).max(2),
    }),
    positions: z.object({ main: z.string(), secondary: z.array(z.string()).max(2) }),
    attributes: z.record(z.string(), num),
    status: z.object({ morale: num, form: num, fitness: num }),
  }),
  career: z.object({
    seasons: z.array(z.unknown()),
    spells: z.array(z.unknown()),
    trophies: z.array(z.unknown()),
    awards: z.array(z.unknown()),
  }),
  flags: z.record(z.string(), z.union([num, z.boolean()])),
  eventLog: z.array(z.unknown()),
  scheduledEvents: z.array(z.unknown()),
  inbox: z.array(z.unknown()),
  achievements: z.record(z.string(), z.unknown()),
  retired: z.boolean(),
});

export function createEnvelope(game: GameState, savedAt: string): SaveEnvelope {
  return { format: SAVE_FORMAT, version: GAME_STATE_VERSION, savedAt, game };
}

export function serializeGame(game: GameState, savedAt: string, pretty = false): string {
  return JSON.stringify(createEnvelope(game, savedAt), null, pretty ? 2 : undefined);
}

/** Valida y migra un sobre ya parseado. Devuelve la partida lista para usar. */
export function parseEnvelope(raw: unknown): SaveEnvelope {
  const env = envelopeSchema.safeParse(raw);
  if (!env.success) throw new SaveError('not-a-save', 'El archivo no es una partida de Leyenda.');
  if (env.data.version > GAME_STATE_VERSION) {
    throw new SaveError('too-new', 'La partida se creó con una versión más nueva del juego.');
  }

  const migrated = migrateGame(env.data.game, env.data.version);
  const check = gameSchema.safeParse(migrated);
  if (!check.success) {
    const where = check.error.issues[0]?.path.join('.') ?? '?';
    throw new SaveError('corrupt', `La partida está dañada (campo: ${where}).`);
  }
  // Se devuelve el objeto original (no el parseado) para no perder campos no validados.
  return { format: SAVE_FORMAT, version: GAME_STATE_VERSION, savedAt: env.data.savedAt, game: migrated as GameState };
}

export function deserializeGame(json: string): SaveEnvelope {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new SaveError('invalid-json', 'El archivo no es un JSON válido.');
  }
  return parseEnvelope(raw);
}
