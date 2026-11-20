/**
 * Creación del personaje: talento oculto y atributos iniciales a los 15 años.
 * Todo depende de la semilla (mismas elecciones + misma semilla = mismo jugador).
 */
import { Rng } from '../rng';
import { ALL_ATTRIBUTES, ATTRIBUTE_MAX, ATTRIBUTE_MIN, GOALKEEPING_ATTRIBUTES, type AttributeId, type Attributes, type Position } from '../types/attributes';
import type { CountryId, Foot, PlayStyleId, TraitId } from '../types/common';
import type { PlayStyleDef, TendencyDef, TraitDef } from '../types/definitions';
import type { AvatarConfig } from '../types/player';
import { createAttributes } from './defaults';
import { OVERALL_WEIGHTS, overallFor } from './overall';

/** Todo lo que el jugador elige en el asistente de creación. */
export interface CharacterInput {
  name: string;
  nickname?: string;
  /** Día y mes de nacimiento; el año se calcula para tener 15 años al empezar. */
  birthDay: number;
  birthMonth: number;
  birthPlace: { country: CountryId; region: string; city: string };
  /** 1 o 2 nacionalidades; la primera es la principal. */
  nationalities: CountryId[];
  foot: Foot;
  appearance: AvatarConfig;
  mainPosition: Position;
  secondaryPositions: Position[];
  style: PlayStyleId;
  traits: TraitId[];
  preferredNumber: number;
}

export interface CreationContent {
  styles: PlayStyleDef[];
  traits: TraitDef[];
  /** Si se pasa, los rasgos elegidos fijan las tendencias iniciales. */
  tendencies?: TendencyDef[];
}

export const MAX_SECONDARY_POSITIONS = 2;
export const POTENTIAL_RANGE: [number, number] = [60, 97];

/** Bonus iniciales por rasgo (pequeños: el efecto real es el crecimiento). */
const TRAIT_START_BONUS: Record<string, Partial<Record<AttributeId, number>>> = {
  // Todos suman unos +6 puntos repartidos en su temática.
  trabajador: { stamina: 3, teamwork: 3 },
  'talento-natural': { dribbling: 3, ballControl: 3 },
  lider: { leadership: 4, teamwork: 2 },
  timido: { concentration: 3, positioning: 3 },
  mediatico: { composure: 3, dribbling: 3 },
  temperamental: { aggression: 4, strength: 2 },
  'sangre-fria': { composure: 3, penalties: 3 },
  profesional: { stamina: 3, concentration: 3 },
  fiestero: { agility: 3, dribbling: 3 },
  ambicioso: { finishing: 3, vision: 3 },
  leal: { teamwork: 3, concentration: 3 },
  'fisico-de-hierro': { strength: 3, stamina: 3 },
  competitivo: { concentration: 3, aggression: 3 },
  creativo: { vision: 3, freeKicks: 3 },
  familiar: { composure: 3, teamwork: 3 },
  vago: { composure: 3, ballControl: 3 },
  fragil: { acceleration: 3, agility: 3 },
  divo: { dribbling: 3, shooting: 3 },
  humilde: { teamwork: 3, positioning: 3 },
  rebelde: { dribbling: 3, vision: 3 },
  solidario: { teamwork: 3, stamina: 3 },
  idolo: { composure: 3, finishing: 3 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Talento (potencial oculto) de una semilla. Se calcula aparte porque las pruebas de cantera lo usan antes de crear la partida. */
export function rollPotential(seed: string): number {
  const rng = Rng.fromSeed(seed).fork('potential');
  return Math.round(clamp(rng.normal(79, 8), POTENTIAL_RANGE[0], POTENTIAL_RANGE[1]));
}

/** Rango de potencial que ven los ojeadores (amplio a los 15 años). */
export function shownPotentialRange(potential: number, seed: string): [number, number] {
  const rng = Rng.fromSeed(seed).fork('potential-shown');
  const round5 = (v: number) => Math.round(v / 5) * 5;
  const low = round5(potential - rng.int(6, 14));
  const high = round5(potential + rng.int(4, 10));
  return [clamp(low, 40, 95), clamp(Math.max(high, low + 10), 50, 99)];
}

/** Relevancia 0-1 de un atributo para un conjunto de posiciones (principal pesa el doble). */
function relevance(attr: AttributeId, main: Position, secondary: Position[]): number {
  const w = (pos: Position) => Math.min(1, (OVERALL_WEIGHTS[pos][attr] ?? 0) / 2.5);
  let r = w(main);
  for (const s of secondary) r = Math.max(r, w(s) * 0.6);
  return r;
}

/** Atributos iniciales a los 15 años según talento, posición, estilo, físico y rasgos. */
export function generateStartingAttributes(input: CharacterInput, potential: number, seed: string, content: CreationContent): Attributes {
  const rng = Rng.fromSeed(seed).fork('attributes');
  const attrs = createAttributes(0);
  const isKeeper = input.mainPosition === 'POR';
  // Base 20-34 según el talento.
  const base = 20 + (potential - POTENTIAL_RANGE[0]) * 0.38;
  const gk = new Set<AttributeId>(GOALKEEPING_ATTRIBUTES);

  for (const id of ALL_ATTRIBUTES) {
    let v: number;
    if (gk.has(id) && !isKeeper) v = rng.int(4, 14);
    else {
      const rel = relevance(id, input.mainPosition, input.secondaryPositions);
      const keeperPenalty = isKeeper && !gk.has(id) && rel === 0 ? -6 : 0;
      v = base + 16 * rel + keeperPenalty + rng.normal(0, 4);
    }
    attrs[id] = v;
  }

  const add = (bonus: Partial<Record<AttributeId, number>>) => {
    for (const [id, delta] of Object.entries(bonus) as [AttributeId, number][]) attrs[id] += delta;
  };

  const style = content.styles.find((s) => s.id === input.style);
  if (style) add(style.bonuses);
  for (const t of input.traits) add(TRAIT_START_BONUS[t] ?? {});

  // Físico
  const { height, build } = input.appearance;
  if (height >= 188) add({ heading: 4, jumping: 3, strength: 3, agility: -3, acceleration: -2 });
  else if (height <= 170) add({ agility: 4, acceleration: 3, dribbling: 2, heading: -4, strength: -3 });
  if (isKeeper && height >= 188) add({ diving: 2, gkPositioning: 2 });
  if (build === 'robusto') add({ strength: 4, pace: -2, stamina: -1 });
  if (build === 'delgado') add({ agility: 2, acceleration: 1, strength: -3 });
  if (input.foot === 'ambidiestro') add({ shooting: 2, crossing: 1, shortPassing: 1 });

  for (const id of ALL_ATTRIBUTES) attrs[id] = Math.round(clamp(attrs[id], ATTRIBUTE_MIN, ATTRIBUTE_MAX));
  return attrs;
}

/** Errores de validación del personaje (claves i18n). Lista vacía = válido. */
export function validateCharacter(input: CharacterInput, content: CreationContent, traitCount: number): string[] {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push('creation.errors.name');
  if (input.nationalities.length < 1 || input.nationalities.length > 2) errors.push('creation.errors.nationality');
  if (input.secondaryPositions.length > MAX_SECONDARY_POSITIONS || input.secondaryPositions.includes(input.mainPosition)) {
    errors.push('creation.errors.positions');
  }
  if ((input.mainPosition === 'POR') !== input.secondaryPositions.every((p) => p === 'POR') && input.secondaryPositions.length > 0) {
    errors.push('creation.errors.keeperMix');
  }
  const style = content.styles.find((s) => s.id === input.style);
  if (!style || !style.positions.includes(input.mainPosition)) errors.push('creation.errors.style');
  const defs = input.traits.map((id) => content.traits.find((t) => t.id === id));
  if (input.traits.length !== traitCount || defs.some((d) => !d?.selectableAtStart)) errors.push('creation.errors.traits');
  for (const d of defs) {
    if (d?.opposites?.some((o) => input.traits.includes(o))) errors.push('creation.errors.opposites');
  }
  if (input.preferredNumber < 1 || input.preferredNumber > 99) errors.push('creation.errors.number');
  if (input.birthMonth < 1 || input.birthMonth > 12 || input.birthDay < 1 || input.birthDay > daysInMonth(input.birthMonth)) {
    errors.push('creation.errors.birthDate');
  }
  return [...new Set(errors)];
}

export function daysInMonth(month: number): number {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

/** Estilos disponibles para una posición. */
export function stylesFor(position: Position, content: CreationContent): PlayStyleDef[] {
  return content.styles.filter((s) => s.positions.includes(position));
}

/** Vista previa para el asistente: media inicial con las elecciones actuales. */
export function previewOverall(input: CharacterInput, seed: string, content: CreationContent): number {
  const attrs = generateStartingAttributes(input, rollPotential(seed), seed, content);
  return overallFor(attrs, input.mainPosition);
}
