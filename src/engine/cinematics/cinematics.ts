/**
 * Cinemáticas: momentos clave que la interfaz reproduce con <Cinematic type data />.
 * El motor solo las encola con sus datos; no sabe nada de animaciones.
 */
import type { GameState } from '../types/game';

export type CinematicType =
  | 'debut'
  | 'firstGoal'
  | 'hatTrick'
  | 'transfer'
  | 'loan'
  | 'trophy'
  | 'award'
  | 'nationalDebut'
  | 'tournament'
  | 'promotion'
  | 'relegation'
  | 'injury'
  | 'achievement'
  | 'retirement'
  | 'custom';

export interface CinematicData {
  type: CinematicType;
  /** 'major': se ve siempre (salvo si están desactivadas); 'minor': solo con «todas». */
  importance: 'major' | 'minor';
  season: number;
  clubId?: string;
  opponentId?: string;
  opponentName?: string;
  competitionId?: string;
  awardId?: string;
  country?: string;
  /** Cifra destacada (goles, traspaso...). */
  value?: number;
  /** Plantilla de un evento (efecto 'cinematic'). */
  template?: string;
  /** Celebración elegida en el momento (goles). */
  celebration?: string;
}

/** Máximo de cinemáticas pendientes (no se acumulan sin fin si están desactivadas). */
const MAX_QUEUE = 6;

export function queueCinematic(game: GameState, c: Omit<CinematicData, 'season'>): void {
  const item: CinematicData = { season: game.calendar.season, ...c };
  game.cinematics = [...(game.cinematics ?? []), item].slice(-MAX_QUEUE);
}

/** Quita la primera cinemática pendiente. Devuelve una copia nueva. */
export function dismissCinematic(input: GameState): GameState {
  const game = structuredClone(input);
  game.cinematics = (game.cinematics ?? []).slice(1);
  return game;
}

/** Celebración elegida (si está desbloqueada). */
export function selectCelebration(input: GameState, id: string): GameState {
  const game = structuredClone(input);
  if (game.player.celebrations.unlocked.includes(id)) game.player.celebrations.selected = id;
  return game;
}
