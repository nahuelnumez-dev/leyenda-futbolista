/**
 * Migraciones de partidas guardadas. Cuando cambie la forma de GameState:
 *  1. sube GAME_STATE_VERSION en types/game.ts
 *  2. añade aquí la función `n → n+1` que transforma el objeto antiguo.
 */
import { GAME_STATE_VERSION } from '../types/game';

type Migration = (game: Record<string, unknown>) => Record<string, unknown>;

/** MIGRATIONS[n] convierte una partida de la versión n a la n+1. */
export const MIGRATIONS: Record<number, Migration> = {
  // 1: (g) => ({ ...g, nuevoCampo: valorPorDefecto, version: 2 }),
};

export function migrateGame(game: unknown, fromVersion: number, migrations = MIGRATIONS, target = GAME_STATE_VERSION): unknown {
  if (typeof game !== 'object' || game === null) return game;
  let current = game as Record<string, unknown>;
  for (let v = fromVersion; v < target; v++) {
    const step = migrations[v];
    if (!step) throw new Error(`Falta la migración de la versión ${v} a la ${v + 1}`);
    current = { ...step(current), version: v + 1 };
  }
  return current;
}
