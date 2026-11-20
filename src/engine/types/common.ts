/**
 * Tipos básicos compartidos por todo el motor.
 * Los identificadores son strings legibles para que los archivos de datos sean fáciles de revisar.
 */

/** Código FIFA de tres letras: 'ESP', 'ENG', 'ARG', 'BRA', 'SCO'... */
export type CountryId = string;
/** Formato `<pais>.<slug>`, p. ej. 'esp.real-madrid'. Único en todo el juego. */
export type ClubId = string;
/** Formato `<pais>.<slug>`, p. ej. 'esp.laliga'. */
export type DivisionId = string;
/** Competición (liga, copa, continental, selecciones), p. ej. 'esp.copa-del-rey', 'uefa.champions'. */
export type CompetitionId = string;
export type EventId = string;
export type TraitId = string;
export type TendencyId = string;
export type PlayStyleId = string;
export type AchievementId = string;
export type CelebrationId = string;

/** Año en que empieza la temporada (2026 = "2026-27" en Europa, "2026" en Sudamérica). */
export type SeasonYear = number;

/** Texto traducible. `es` es obligatorio; el resto de idiomas se añade sin tocar código. */
export interface LocalizedText {
  es: string;
  [lang: string]: string;
}

/** Texto con variables `{club}`, `{rival}`, `{entrenador}`... que el motor rellena. */
export type LocalizedTemplate = LocalizedText;

export type CalendarType = 'europeo' | 'anual';

export type Foot = 'derecho' | 'izquierdo' | 'ambidiestro';

export const SEASON_PHASES = ['preseason', 'firstHalf', 'winterWindow', 'secondHalf', 'seasonEnd'] as const;
export type SeasonPhase = (typeof SEASON_PHASES)[number];

export const CAREER_STAGES = ['academy', 'breakthrough', 'establishment', 'prime', 'veteran', 'retirement'] as const;
export type CareerStage = (typeof CAREER_STAGES)[number];

export type Tier = 'bronze' | 'silver' | 'gold' | 'legend';
