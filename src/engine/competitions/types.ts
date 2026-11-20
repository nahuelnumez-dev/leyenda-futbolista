/** Tipos de selecciones, torneos y rivales continentales (los datos viven en src/data/international.ts). */
import type { LocalizedText } from '../types/common';

export type Confederation = 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';

export interface NationalTeamDef {
  id: string;
  name: LocalizedText;
  confederation: Confederation;
  /** Misma escala que el nivel de los clubes (88 ≈ un grande de Europa). */
  strength: number;
}

export interface TournamentDef {
  id: string;
  firstYear: number;
  every: number;
  /** Confederaciones que participan (vacío = todas). */
  confederations: Confederation[];
  teams: number;
  slots?: Partial<Record<Confederation, number>>;
}

export interface GenericOpponent {
  label: string;
  strength: number;
}

export interface AwardDef {
  id: string;
  name: LocalizedText;
}

export interface InternationalContent {
  nationalTeams: NationalTeamDef[];
  tournaments: TournamentDef[];
  uefaOpponents: GenericOpponent[];
  conmebolOpponents: GenericOpponent[];
  afcOpponents: GenericOpponent[];
  concacafOpponents: GenericOpponent[];
}

/** Partido ya resuelto de una competición (el motor de temporada añade la actuación del jugador). */
export interface ResolvedMatch {
  round: string;
  half: 1 | 2;
  opponentId?: string;
  opponentName?: string;
  home: boolean;
  gf: number;
  ga: number;
  /** Nivel del rival (para la nota del jugador). */
  opponentLevel: number;
}
