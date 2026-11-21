/**
 * Modelo declarativo de eventos. Un evento NO contiene funciones: solo datos.
 * Así se puede serializar, validar con tests y ampliar sin tocar la lógica.
 */
import type { AttributeId, Position, PositionGroup } from './attributes';
import type {
  CareerStage,
  CelebrationId,
  ClubId,
  CompetitionId,
  CountryId,
  EventId,
  LocalizedTemplate,
  PlayStyleId,
  SeasonPhase,
  TendencyId,
  TraitId,
} from './common';
import type { Relations, Reputation } from './player';

export type EventCategory =
  | 'training'
  | 'transfer'
  | 'loan'
  | 'contract'
  | 'nationalTeam'
  | 'injury'
  | 'dressingRoom'
  | 'coach'
  | 'media'
  | 'social'
  | 'personal'
  | 'ethics'
  | 'keyMatch'
  | 'agent'
  | 'retirement';

export type RelationId = keyof Relations;
export type ReputationScope = keyof Reputation;

export type Comparison = { min?: number; max?: number };

export type CareerMetric =
  | 'goals' | 'assists' | 'apps' | 'seasons' | 'clubs' | 'loans' | 'caps' | 'ntGoals' | 'hatTricks'
  | 'trophies' | 'peakOverall' | 'peakValue' | 'biggestFee' | 'followers' | 'promotions';

export type TrophyKind = 'league' | 'topLeague' | 'cup' | 'continental' | 'national' | 'any';

/** Requisito para que un evento o una opción esté disponible. Todos se combinan con AND. */
export type Condition =
  | ({ type: 'age' } & Comparison)
  | ({ type: 'overall' } & Comparison)
  | ({ type: 'attribute'; id: AttributeId } & Comparison)
  | ({ type: 'reputation'; scope: ReputationScope } & Comparison)
  | ({ type: 'relation'; who: RelationId } & Comparison)
  | ({ type: 'tendency'; id: TendencyId } & Comparison)
  | ({ type: 'money' } & Comparison)
  | ({ type: 'morale' } & Comparison)
  /** Estadística de la temporada en curso (primer equipo). */
  | ({ type: 'seasonStat'; stat: 'goals' | 'assists' | 'apps' | 'rating' } & Comparison)
  | ({ type: 'followers' } & Comparison)
  /** Estadística acumulada de la carrera (club + selección según la métrica). */
  | ({ type: 'careerStat'; stat: CareerMetric } & Comparison)
  /** Número de títulos de un tipo (o de unas competiciones concretas, por prefijo). */
  | ({ type: 'trophyCount'; kind?: TrophyKind; competitions?: string[] } & Comparison)
  /** Veces que ha quedado entre los `maxRank` primeros de un premio. */
  | ({ type: 'awardCount'; awardId: string; maxRank?: number } & Comparison)
  | ({ type: 'sentiment' } & Comparison)
  | ({ type: 'form' } & Comparison)
  | ({ type: 'clubPrestige' } & Comparison)
  | ({ type: 'divisionTier' } & Comparison)
  | ({ type: 'seasonsAtClub' } & Comparison)
  | { type: 'trait'; id: TraitId; minIntensity?: number }
  | { type: 'notTrait'; id: TraitId }
  | { type: 'flag'; id: string; value?: number | boolean }
  | { type: 'notFlag'; id: string }
  | { type: 'eventSeen'; id: EventId }
  | { type: 'eventNotSeen'; id: EventId }
  | { type: 'position'; in: Position[] }
  | { type: 'positionGroup'; in: PositionGroup[] }
  | { type: 'style'; in: PlayStyleId[] }
  | { type: 'country'; in: CountryId[] }
  | { type: 'clubCountry'; in: CountryId[] }
  | { type: 'club'; in: ClubId[] }
  | { type: 'injured'; value: boolean }
  | { type: 'onLoan'; value: boolean }
  | { type: 'hasAgent'; value: boolean }
  | ({ type: 'internationalCaps' } & Comparison)
  | { type: 'derbyUpcoming' }
  | { type: 'chance'; p: number }
  | { type: 'any'; of: Condition[] }
  | { type: 'not'; condition: Condition };

/** Consecuencia de elegir una opción. */
export type Effect =
  | { type: 'attribute'; id: AttributeId; delta: number }
  | { type: 'attributeGroup'; group: 'technical' | 'physical' | 'mental' | 'goalkeeping'; delta: number }
  | { type: 'potential'; delta: number }
  | { type: 'relation'; who: RelationId; delta: number }
  | { type: 'reputation'; scope: ReputationScope; delta: number }
  | { type: 'morale' | 'form' | 'fitness'; delta: number }
  | { type: 'money'; amount: number }
  | { type: 'followers'; delta: number; percent?: boolean }
  | { type: 'trait'; op: 'add' | 'remove' | 'intensify' | 'weaken'; id: TraitId }
  | { type: 'tendency'; id: TendencyId; delta: number }
  | { type: 'flag'; id: string; value: number | boolean }
  | { type: 'incrementFlag'; id: string; by?: number }
  | { type: 'injury'; severity: 1 | 2 | 3; weeks: number }
  | { type: 'injuryProneness'; delta: number }
  | { type: 'scheduleEvent'; id: EventId; inSeasons?: number; phase?: SeasonPhase }
  | { type: 'transferRequest' }
  | { type: 'offer'; kind: 'transfer' | 'loan' | 'renewal'; clubPrestige?: Comparison; sameCountry?: boolean }
  | { type: 'playingTime'; delta: number }
  | { type: 'news'; headline: LocalizedTemplate; tone: 'positive' | 'neutral' | 'negative' }
  | { type: 'cinematic'; template: string }
  | { type: 'unlockCelebration'; id: CelebrationId }
  | { type: 'retire' }
  /** Contrata o despide agente: 'top' (agencia grande), 'local' (de confianza) o 'none'. */
  | { type: 'setAgent'; profile: 'top' | 'local' | 'none' }
  /** Acorta (negativo) o alarga la lesión actual. */
  | { type: 'recovery'; weeks: number }
  /**
   * Estadísticas del último partido jugado (o del siguiente, si no jugó): lo que cuenta el evento se suma de verdad.
   * Con `atLeast`, `goals` y `assists` son mínimos del partido (p. ej. hat-trick = goals 3).
   */
  | ({ type: 'matchStat' } & MatchStatDelta);

export interface MatchStatDelta {
  goals?: number;
  assists?: number;
  dribbles?: number;
  keyPasses?: number;
  tackles?: number;
  saves?: number;
  /** Portería a cero en ese partido (el equipo no encaja). */
  cleanSheet?: boolean;
  /** Suma a la nota del partido. */
  rating?: number;
  atLeast?: boolean;
}

export interface EventOutcomeRoll {
  /** Probabilidad base 0-1 de éxito. */
  chance: number;
  /** Modificadores opcionales de la probabilidad según atributos o rasgos. */
  modifiers?: { attribute?: AttributeId; trait?: TraitId; perPoint?: number; flat?: number }[];
  success: { text?: LocalizedTemplate; effects: Effect[] };
  failure: { text?: LocalizedTemplate; effects: Effect[] };
}

export interface EventOption {
  id: string;
  text: LocalizedTemplate;
  requires?: Condition[];
  effects: Effect[];
  roll?: EventOutcomeRoll;
  /** Texto que se muestra tras elegir. */
  result?: LocalizedTemplate;
  /** Marca la decisión como clave para la narrativa final. */
  key?: boolean;
}

export interface GameEvent {
  id: EventId;
  category: EventCategory;
  stages: CareerStage[];
  phases: SeasonPhase[];
  /** Peso relativo en el sorteo. */
  weight: number;
  once?: boolean;
  cooldownSeasons?: number;
  requires: Condition[];
  title: LocalizedTemplate;
  text: LocalizedTemplate;
  /** Quién habla: entrenador, agente, prensa... */
  speaker?: 'coach' | 'agent' | 'press' | 'fans' | 'teammate' | 'board' | 'family' | 'social' | 'narrator';
  competition?: CompetitionId;
  options: EventOption[];
}
