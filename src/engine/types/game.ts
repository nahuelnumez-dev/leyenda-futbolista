import type { AchievementState, CareerHistory, EventRecord, NewsItem, SocialState } from './career';
import type { ClubDynamic } from './club';
import type { AchievementId, ClubId, DivisionId, EventId, SeasonPhase, SeasonYear } from './common';
import type { Player, SquadRole } from './player';
import type { AttributeId } from './attributes';
import type { CinematicData } from '../cinematics/cinematics';
import type { RngState } from '../rng';

export const GAME_STATE_VERSION = 1;

export interface StandingRow {
  clubId: ClubId;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueHistoryEntry {
  season: SeasonYear;
  divisionId: DivisionId;
  championId: ClubId;
  promoted: ClubId[];
  relegated: ClubId[];
}

/** Estrella rival ficticia que compite por los premios individuales. */
export interface NpcStar {
  id: string;
  name: string;
  nationality: string;
  clubId: ClubId;
  position: string;
  birthYear: number;
  overall: number;
  potential: number;
  /** Última temporada simulada. */
  last?: { goals: number; assists: number; rating: number };
}

export interface WorldState {
  clubs: Record<ClubId, ClubDynamic>;
  standings: Record<string, StandingRow[]>;
  history: LeagueHistoryEntry[];
  npcStars: NpcStar[];
  /** Clubes clasificados para competiciones continentales esta temporada. */
  continental?: Record<ClubId, string>;
  /** Ganadores de premios individuales por temporada. */
  awardWinners?: AwardWinner[];
}

export interface AwardWinner {
  season: SeasonYear;
  awardId: string;
  /** División (premios de liga) o vacío (premios mundiales). */
  scope?: string;
  name: string;
  clubId?: ClubId;
  isPlayer: boolean;
}

export interface ScheduledEvent {
  eventId: EventId;
  season: SeasonYear;
  phase?: SeasonPhase;
}

export interface ActiveEvent {
  eventId: EventId;
  /** Variables ya resueltas para la plantilla ({club}, {rival}...). */
  vars: Record<string, string>;
}

/** Oferta de traspaso, cesión o renovación pendiente de respuesta. */
export interface Offer {
  id: string;
  kind: 'transfer' | 'loan' | 'renewal';
  clubId: ClubId;
  /** Traspaso pagado al club actual (euros); 0 en cesiones y renovaciones. */
  fee: number;
  /** Sueldo anual ofrecido (euros). */
  salary: number;
  /** Temporadas de contrato (en cesiones, 1). */
  years: number;
  /** Rol que tendría según su media. */
  role: SquadRole;
  season: SeasonYear;
  phase: SeasonPhase;
}

export interface GameOptions {
  /** Si es true, la partida se guarda tras cada decisión y no se puede volver atrás. */
  ironMan: boolean;
  /** Si el jugador fijó la semilla al crear la partida. */
  customSeed: boolean;
}

/** Un partido del jugador (o de su club si no jugó) en la temporada en curso. */
export interface MatchLog {
  /** Jornada (en ligas) o número de partido (juveniles). */
  md: number;
  /** Id de la competición: división ('esp.laliga') o 'youth' para el filial/juveniles. */
  competition: string;
  opponentId?: ClubId;
  /** Rival sin club en el juego (selecciones, «el campeón de Italia»...). */
  opponentName?: string;
  /** Ronda (copas y torneos): 'Octavos', 'Final'... */
  round?: string;
  home: boolean;
  gf: number;
  ga: number;
  started: boolean;
  minutes: number;
  /** Nota 1-10 (null si no jugó). */
  rating: number | null;
  goals: number;
  assists: number;
}

/** Estado de la temporada en curso (se reinicia cada temporada). */
export interface CurrentSeason {
  season: SeasonYear;
  overallStart: number;
  matches: MatchLog[];
  /** Partidos con la selección (no cuentan en las estadísticas de club). */
  ntMatches?: MatchLog[];
}

/** Resumen que se muestra al cerrar la temporada. */
export interface SeasonSummary {
  season: SeasonYear;
  clubId: ClubId | null;
  divisionId: DivisionId | null;
  position?: number;
  tableSize?: number;
  champion: boolean;
  promoted: boolean;
  relegated: boolean;
  overallStart: number;
  overallEnd: number;
  growth: Partial<Record<AttributeId, number>>;
  roleBefore: SquadRole | null;
  roleAfter: SquadRole | null;
  /** Subido al primer equipo esta temporada. */
  firstTeamPromotion: boolean;
  /** Títulos ganados (ids de competición). */
  trophies?: string[];
  /** Premios individuales con su puesto. */
  awards?: { awardId: string; rank: number; scope?: string }[];
  /** Copa: ronda alcanzada. Continental: competición y ronda. */
  cupRound?: string;
  continental?: { competitionId: string; round: string };
  /** Selección: partidos esta temporada y torneo de verano. */
  national?: { caps: number; goals: number; category?: string; tournament?: { competitionId: string; result: string; played: boolean } };
}

export interface GameState {
  version: number;
  id: string;
  createdAt: string;
  seed: string;
  rngState: RngState;
  options: GameOptions;
  calendar: {
    /** Primera temporada de la carrera. */
    startSeason: SeasonYear;
    season: SeasonYear;
    phase: SeasonPhase;
    /** Paso dentro de la fase (evento n.º X). */
    step: number;
  };
  world: WorldState;
  player: Player;
  career: CareerHistory;
  flags: Record<string, number | boolean>;
  eventLog: EventRecord[];
  scheduledEvents: ScheduledEvent[];
  activeEvent: ActiveEvent | null;
  inbox: NewsItem[];
  social: SocialState;
  achievements: Record<AchievementId, AchievementState>;
  retired: boolean;
  /** Temporada en curso (partidos jugados). */
  current?: CurrentSeason;
  /** Resumen de la última temporada cerrada. */
  lastSummary?: SeasonSummary;
  /** Eventos pendientes después del activo. */
  eventQueue?: ActiveEvent[];
  /** Ofertas recibidas en esta ventana de fichajes. */
  offers?: Offer[];
  /** Cinemáticas pendientes de reproducir. */
  cinematics?: CinematicData[];
  /** Selecciones entre las que debe elegir antes de su primera convocatoria absoluta. */
  pendingNationalChoice?: string[];
  /** Resultado de la última decisión, para mostrarlo en pantalla. */
  lastOutcome?: EventOutcome;
}

/** Lo que pasó al elegir una opción de un evento. */
export interface EventOutcome {
  eventId: EventId;
  optionId: string;
  text?: string;
  success?: boolean;
  /** Cambios legibles: [clave i18n, valor]. */
  changes: { key: string; value: number | string }[];
}
