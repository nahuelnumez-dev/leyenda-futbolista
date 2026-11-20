/**
 * Evolución anual de atributos: crecimiento hacia el potencial (rápido de joven, nulo a los ~29),
 * más rápido si juega y según rasgos y estilo; declive físico a partir de los 30.
 */
import type { Rng } from '../rng';
import {
  ALL_ATTRIBUTES,
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  GOALKEEPING_ATTRIBUTES,
  type AttributeId,
  type Attributes,
  type Position,
} from '../types/attributes';
import type { PlayStyleDef, TraitDef } from '../types/definitions';
import type { Player } from '../types/player';
import { OVERALL_WEIGHTS } from './overall';

/** Ritmo de crecimiento por edad (fracción del hueco hasta el objetivo que se cubre en un año). */
export function growthRate(age: number): number {
  const table: Record<number, number> = { 20: 0.16, 21: 0.15, 22: 0.13, 23: 0.11, 24: 0.09, 25: 0.07, 26: 0.05, 27: 0.04, 28: 0.03 };
  if (age <= 19) return 0.17;
  return table[age] ?? 0;
}

const PHYSICAL_DECLINE: AttributeId[] = ['pace', 'acceleration', 'stamina', 'agility', 'jumping'];
const LATE_DECLINE: AttributeId[] = ['dribbling', 'strength', 'reflexes', 'diving', 'rushingOut'];
const WISDOM: AttributeId[] = ['vision', 'composure', 'leadership', 'positioning', 'concentration'];

function relevance(attr: AttributeId, main: Position, secondary: Position[]): number {
  const w = (p: Position) => Math.min(1, (OVERALL_WEIGHTS[p][attr] ?? 0) / 2.5);
  return Math.max(w(main), ...secondary.map((p) => w(p) * 0.7));
}

export interface GrowthInput {
  player: Player;
  age: number;
  /** 0-1: cuánto ha jugado (minutos del primer equipo + juveniles ponderados). */
  playRatio: number;
  traits: TraitDef[];
  style?: PlayStyleDef;
}

/** Devuelve los atributos nuevos y la variación de cada uno. */
export function seasonGrowth(rng: Rng, { player, age, playRatio, traits, style }: GrowthInput): { attributes: Attributes; delta: Partial<Record<AttributeId, number>> } {
  const pot = player.potential.hidden;
  const isKeeper = player.positions.main === 'POR';
  const gk = new Set<AttributeId>(GOALKEEPING_ATTRIBUTES);
  const rate = growthRate(age);
  const play = 0.8 + 0.4 * Math.max(0, Math.min(1, playRatio));
  const out = { ...player.attributes };
  const delta: Partial<Record<AttributeId, number>> = {};

  const traitMult = (id: AttributeId) =>
    traits.reduce((m, t) => m * (t.growth?.[id] ?? 1) * (t.growth?.all ?? 1), 1);

  for (const id of ALL_ATTRIBUTES) {
    const v = out[id];
    let change = 0;
    if (gk.has(id) && !isKeeper) {
      change = 0;
    } else {
      const rel = relevance(id, player.positions.main, player.positions.secondary);
      const target = Math.min(ATTRIBUTE_MAX, rel >= 0.8 ? pot + 3 : rel >= 0.4 ? pot - 6 : pot * 0.72);
      const styleBoost = style?.bonuses[id] ? 1.15 : 1;
      if (rate > 0 && target > v) change += (target - v) * rate * play * traitMult(id) * styleBoost + rng.normal(0, 0.7);
      else if (rate > 0) change += rng.normal(0, 0.4);
    }

    // Declive con la edad
    if (age >= 30 && PHYSICAL_DECLINE.includes(id)) change -= (age - 29) * 1.3 + Math.abs(rng.normal(0, 0.6));
    if (age >= 31 && !gk.has(id) && !WISDOM.includes(id)) change -= (age - 30) * 0.35;
    if (age >= 32 && LATE_DECLINE.includes(id)) change -= (age - 31) * 0.6 + Math.abs(rng.normal(0, 0.4));
    if (age >= 26 && age <= 31 && WISDOM.includes(id)) change += 0.5 + rng.normal(0, 0.3);
    if (age >= 34 && !PHYSICAL_DECLINE.includes(id) && !WISDOM.includes(id)) change -= 0.5 * (age - 33);

    const next = Math.round(Math.min(ATTRIBUTE_MAX, Math.max(ATTRIBUTE_MIN, v + change)));
    if (next !== v) delta[id] = next - v;
    out[id] = next;
  }
  return { attributes: out, delta };
}

/** El rango visible del potencial se estrecha con la edad (a los 24 ya es casi exacto). */
export function narrowPotential(hidden: number, previous: [number, number], age: number): [number, number] {
  const width = Math.max(2, 22 - (age - 15) * 2.5);
  const lo = Math.max(previous[0], Math.round(hidden - width * 0.6));
  const hi = Math.min(previous[1], Math.round(hidden + width * 0.4));
  return [Math.min(lo, hidden), Math.max(hi, hidden)];
}

/** Valor de mercado en euros según media, edad, potencial y prestigio del club. */
export function marketValue(overall: number, age: number, potential: number, clubPrestige: number): number {
  const base = Math.pow(1.16, overall - 40) * 50_000;
  const ageMult = age <= 19 ? 1.5 + Math.max(0, potential - overall) / 40 : age <= 23 ? 1.4 : age <= 27 ? 1.1 : age <= 30 ? 0.75 : age <= 32 ? 0.45 : 0.2;
  const clubMult = 0.85 + clubPrestige / 300;
  const value = base * ageMult * clubMult;
  // Redondeo «de mercado»
  const step = value > 10_000_000 ? 500_000 : value > 1_000_000 ? 100_000 : 10_000;
  return Math.max(10_000, Math.round(value / step) * step);
}
