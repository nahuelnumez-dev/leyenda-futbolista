/**
 * Definiciones de contenido que viven en /src/data (rasgos, tendencias, estilos, logros, países).
 * Se completan en las fases 3, 6 y 10; aquí queda fijado el contrato.
 */
import type { AttributeId, Position } from './attributes';
import type { AchievementId, CountryId, LocalizedText, PlayStyleId, TendencyId, Tier, TraitId } from './common';
import type { CareerMetric, Condition } from './events';
import type { Relations } from './player';

export interface TraitDef {
  id: TraitId;
  name: LocalizedText;
  description: LocalizedText;
  /** Rasgos incompatibles (no se pueden tener a la vez). */
  opposites?: TraitId[];
  /** Multiplicador del crecimiento de atributos: 1.1 = +10 %. */
  growth?: Partial<Record<AttributeId | 'all', number>>;
  /** Modificadores pasivos por temporada. */
  passive?: {
    morale?: number;
    injuryProneness?: number;
    followersGrowth?: number;
    relationDrift?: Partial<Record<keyof Relations, number>>;
  };
  /** Disponible en la creación del personaje. */
  selectableAtStart: boolean;
}

export interface TendencyDef {
  id: TendencyId;
  name: LocalizedText;
  description: LocalizedText;
  /** Valor a partir del cual la tendencia se muestra como activa. */
  threshold: number;
  /** Nombre del polo negativo (p. ej. «Humildad» frente a «Ego»). */
  opposite: LocalizedText;
  /** Rasgo que se gana al superar +umbral (y se pierde si baja de la mitad). */
  positiveTrait?: TraitId;
  /** Rasgo que se gana al bajar de −umbral. */
  negativeTrait?: TraitId;
}

export interface PlayStyleDef {
  id: PlayStyleId;
  name: LocalizedText;
  description: LocalizedText;
  positions: Position[];
  bonuses: Partial<Record<AttributeId, number>>;
}

export interface AchievementDef {
  id: AchievementId;
  name: LocalizedText;
  description: LocalizedText;
  tier: Tier;
  hidden?: boolean;
  /** Condiciones evaluadas al cerrar cada temporada o al retirarse. */
  requires: Condition[];
  /** Métrica de progreso opcional (p. ej. goles de carrera / 100). */
  progress?: { metric: CareerMetric; target: number };
}

export interface CountryDef {
  id: CountryId;
  name: LocalizedText;
  /** Gentilicio. */
  demonym: LocalizedText;
  language: string;
  confederation: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'CAF' | 'AFC' | 'OFC';
  neighbours: CountryId[];
  regions: { id: string; name: string; cities: string[] }[];
  /** ¿Hay archivo de ligas para este país? */
  hasLeagues: boolean;
}

export type CompetitionType = 'liga' | 'copa' | 'supercopa' | 'continental' | 'mundial' | 'selecciones';

/** /src/data/competitions.json (las ligas se definen en los archivos de cada país). */
export interface CompetitionDef {
  id: string;
  name: LocalizedText;
  type: CompetitionType;
  country?: CountryId;
  confederation?: CountryDef['confederation'];
}

/* ── Especialidades ────────────────────────────────────── */

export type SpecialtyGroup = 'shooting' | 'passing' | 'dribbling' | 'physical' | 'defending' | 'mental' | 'goalkeeping';

/** Efectos en el partido por cada nivel de la especialidad (0,1 = +10 %; `rating` suma a la nota). */
export interface SpecialtyEffects {
  goals?: number;
  assists?: number;
  dribbles?: number;
  keyPasses?: number;
  tackles?: number;
  saves?: number;
  rating?: number;
}

/**
 * Especialidad: un rasgo de juego que se desbloquea solo cuando los atributos llegan al umbral.
 * Nivel 1 con `requires`; nivel 2 (élite) con `requires` + `eliteBonus` (14) en cada atributo.
 * El estilo de juego y los rasgos afines rebajan los umbrales.
 */
export interface SpecialtyDef {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  group: SpecialtyGroup;
  /** Solo porteros (true) o solo jugadores de campo (false). */
  keeper: boolean;
  /** Si se indica, solo para estas posiciones (principal o secundarias). */
  positions?: Position[];
  requires: Partial<Record<AttributeId, number>>;
  /** Puntos extra que pide el nivel élite (14 por defecto). */
  eliteBonus?: number;
  effects: SpecialtyEffects;
  /** Estilos de juego que la facilitan (umbral −4). */
  styles?: PlayStyleId[];
  /** Rasgos que la facilitan (umbral −3). */
  traits?: TraitId[];
  /** Regate o gesto característico (sale en las noticias de los partidos). */
  signature?: boolean;
}
