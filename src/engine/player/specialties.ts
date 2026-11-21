/**
 * Especialidades: rasgos de juego ligados a los atributos (tiro colocado, ruleta, barrida...).
 * Se ganan solas al llegar a los umbrales, suben a élite con 14 puntos más y se pierden si los atributos
 * caen 3 puntos por debajo (margen para que no aparezcan y desaparezcan cada año).
 */
import type { AttributeId, Attributes } from '../types/attributes';
import type { SpecialtyDef, SpecialtyEffects } from '../types/definitions';
import type { Player, PlayerSpecialty } from '../types/player';

const LOSS_MARGIN = 3;
/** Puntos extra que pide el nivel élite en cada atributo. */
export const ELITE_BONUS = 14;

/** ¿Puede este jugador tener la especialidad (portero/campo y posición)? */
export function specialtyApplies(def: SpecialtyDef, player: Pick<Player, 'positions'>): boolean {
  const isKeeper = player.positions.main === 'POR';
  if (def.keeper !== isKeeper) return false;
  if (!def.positions) return true;
  return [player.positions.main, ...player.positions.secondary].some((p) => def.positions!.includes(p));
}

/** Rebaja del umbral por estilo de juego y rasgos afines. */
export function thresholdDiscount(def: SpecialtyDef, player: Pick<Player, 'style' | 'traits'>): number {
  let d = 0;
  if (def.styles?.includes(player.style)) d += 4;
  if (def.traits?.some((t) => player.traits.some((pt) => pt.id === t))) d += 3;
  return d;
}

/** Umbrales efectivos de un nivel para este jugador. */
export function requirements(def: SpecialtyDef, player: Pick<Player, 'style' | 'traits'>, level: 1 | 2): [AttributeId, number][] {
  const extra = level === 2 ? (def.eliteBonus ?? ELITE_BONUS) : 0;
  const discount = thresholdDiscount(def, player);
  return (Object.entries(def.requires) as [AttributeId, number][]).map(([id, v]) => [id, Math.min(99, v + extra - discount)]);
}

function meets(attrs: Attributes, reqs: [AttributeId, number][], margin = 0): boolean {
  return reqs.every(([id, v]) => attrs[id] >= v - margin);
}

/** Nivel que corresponde ahora, teniendo en cuenta el nivel que ya tenía (margen de pérdida). */
export function specialtyLevel(def: SpecialtyDef, player: Player, current: 0 | 1 | 2 = 0): 0 | 1 | 2 {
  if (!specialtyApplies(def, player)) return 0;
  const a = player.attributes;
  if (meets(a, requirements(def, player, 2), current === 2 ? LOSS_MARGIN : 0)) return 2;
  if (meets(a, requirements(def, player, 1), current >= 1 ? LOSS_MARGIN : 0)) return 1;
  return 0;
}

/** Progreso 0-1 hacia el siguiente nivel (para la interfaz). */
export function specialtyProgress(def: SpecialtyDef, player: Player, level: 1 | 2): number {
  const reqs = requirements(def, player, level);
  if (!reqs.length) return 1;
  return reqs.reduce((s, [id, v]) => s + Math.min(1, player.attributes[id] / v), 0) / reqs.length;
}

export interface SpecialtyChange {
  id: string;
  from: 0 | 1 | 2;
  to: 0 | 1 | 2;
}

/** Recalcula las especialidades del jugador (lo modifica) y devuelve los cambios. */
export function updateSpecialties(player: Player, defs: SpecialtyDef[], season: number): SpecialtyChange[] {
  const owned = new Map((player.specialties ?? []).map((s) => [s.id, s]));
  const next: PlayerSpecialty[] = [];
  const changes: SpecialtyChange[] = [];
  for (const def of defs) {
    const prev = owned.get(def.id);
    const from = (prev?.level ?? 0) as 0 | 1 | 2;
    const to = specialtyLevel(def, player, from);
    if (to > 0) next.push(to === from && prev ? prev : { id: def.id, level: to as 1 | 2, season });
    if (to !== from) changes.push({ id: def.id, from, to });
  }
  player.specialties = next;
  if (player.specialtyFocus && !defs.some((d) => d.id === player.specialtyFocus && specialtyApplies(d, player))) delete player.specialtyFocus;
  return changes;
}

/** Suma de los efectos de todas las especialidades del jugador (cada nivel cuenta una vez). */
export function matchModifiers(player: Player, defs: SpecialtyDef[]): Required<SpecialtyEffects> {
  const out: Required<SpecialtyEffects> = { goals: 0, assists: 0, dribbles: 0, keyPasses: 0, tackles: 0, saves: 0, rating: 0 };
  for (const s of player.specialties ?? []) {
    const def = defs.find((d) => d.id === s.id);
    if (!def) continue;
    for (const k of Object.keys(out) as (keyof SpecialtyEffects)[]) out[k] += (def.effects[k] ?? 0) * s.level;
  }
  return out;
}

/** Atributos que crecen más rápido por la especialidad que entrena. */
export function focusAttributes(player: Player, defs: SpecialtyDef[]): AttributeId[] {
  const def = defs.find((d) => d.id === player.specialtyFocus);
  return def ? (Object.keys(def.requires) as AttributeId[]) : [];
}

/** Elige (o quita, con null) la especialidad que entrena. Devuelve una copia del estado. */
export function withSpecialtyFocus<T extends { player: Player }>(game: T, id: string | null, defs: SpecialtyDef[]): T {
  const next = structuredClone(game);
  if (id && defs.some((d) => d.id === id && specialtyApplies(d, next.player))) next.player.specialtyFocus = id;
  else delete next.player.specialtyFocus;
  return next;
}
