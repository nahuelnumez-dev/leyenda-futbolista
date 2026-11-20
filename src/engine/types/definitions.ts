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
