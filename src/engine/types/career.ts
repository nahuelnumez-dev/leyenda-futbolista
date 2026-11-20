import type { ClubId, CompetitionId, CountryId, DivisionId, EventId, SeasonPhase, SeasonYear, Tier } from './common';
import type { Attributes } from './attributes';
import type { Reputation } from './player';

/** Estadísticas de una temporada en una competición. */
export interface CompetitionStats {
  competitionId: CompetitionId;
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  /** Suma de notas (media = ratingSum / apps). */
  ratingSum: number;
  mvp: number;
  yellow: number;
  red: number;
  cleanSheets: number;
  keyPasses: number;
  dribbles: number;
  tackles: number;
  saves: number;
  hatTricks: number;
  maxGoalsInMatch: number;
}

export interface SeasonRecord {
  season: SeasonYear;
  age: number;
  clubId: ClubId | null;
  divisionId: DivisionId | null;
  onLoan: boolean;
  overallStart: number;
  overallEnd: number;
  /** Puesto final del club en liga. */
  leaguePosition?: number;
  stats: CompetitionStats[];
  /** Estadísticas con la selección esa temporada. */
  nationalStats?: CompetitionStats[];
  marketValueEnd: number;
  /** Fotos de fin de temporada para las gráficas (opcionales en partidas antiguas). */
  attributesEnd?: Attributes;
  reputationEnd?: Reputation;
  followersEnd?: number;
}

export type SpellType = 'academy' | 'permanent' | 'loan';
export type SpellEnd = 'transfer' | 'loanEnd' | 'free' | 'released' | 'retired' | 'promotedToFirstTeam';

export interface ClubSpell {
  clubId: ClubId;
  type: SpellType;
  fromSeason: SeasonYear;
  toSeason?: SeasonYear;
  endReason?: SpellEnd;
  /** Traspaso pagado al llegar (euros). */
  feeIn?: number;
  feeOut?: number;
  highlights: string[];
}

export interface TrophyRecord {
  competitionId: CompetitionId;
  season: SeasonYear;
  clubId?: ClubId;
  nationalTeam?: CountryId;
}

export interface AwardRecord {
  awardId: string;
  season: SeasonYear;
  /** 1 = ganador; 2-3 podio (para premios con votación). */
  rank: number;
  /** División, para los premios de liga. */
  scope?: string;
}

export interface PersonalRecords {
  bestSeasonGoals?: { season: SeasonYear; goals: number };
  bestSeasonAssists?: { season: SeasonYear; assists: number };
  mostGoalsInMatch?: { season: SeasonYear; goals: number; opponent?: ClubId };
  longestScoringStreak: number;
  hatTricks: number;
  peakOverall: number;
  peakOverallSeason?: SeasonYear;
  peakMarketValue: number;
  biggestTransferFee: number;
}

export interface NationalTeamRecord {
  country?: CountryId;
  caps: number;
  goals: number;
  assists: number;
  debutSeason?: SeasonYear;
  youthCaps: Record<string, number>;
  tournaments: { competitionId: CompetitionId; season: SeasonYear; result: string }[];
}

export interface CareerHistory {
  seasons: SeasonRecord[];
  spells: ClubSpell[];
  trophies: TrophyRecord[];
  awards: AwardRecord[];
  records: PersonalRecords;
  nationalTeam: NationalTeamRecord;
  /** Atributos al empezar la carrera (para comparar en las gráficas). */
  startAttributes?: Attributes;
}

/** Decisión tomada, para la narrativa final y para condiciones `eventSeen`. */
export interface EventRecord {
  eventId: EventId;
  optionId: string;
  season: SeasonYear;
  phase: SeasonPhase;
  age: number;
  key?: boolean;
  success?: boolean;
}

export type NewsSource = 'press' | 'fans' | 'social' | 'coach' | 'board' | 'agent' | 'family' | 'teammate' | 'system';

export interface NewsItem {
  id: string;
  season: SeasonYear;
  phase: SeasonPhase;
  source: NewsSource;
  headline: string;
  body?: string;
  tone: 'positive' | 'neutral' | 'negative';
  read?: boolean;
}

export interface SocialState {
  followers: number;
  /** -100 a 100: cómo te ven en redes. */
  sentiment: number;
}

export interface AchievementState {
  unlocked: boolean;
  tier?: Tier;
  unlockedSeason?: SeasonYear;
  progress?: number;
}
