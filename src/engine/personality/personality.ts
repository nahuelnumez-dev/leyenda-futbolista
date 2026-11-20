/**
 * Personalidad: tendencias que generan rasgos, consecuencias de las relaciones y reacciones
 * del entorno (afición, prensa, redes, entrenador, vestuario).
 */
import type { Rng } from '../rng';
import type { NewsSource } from '../types/career';
import type { LocalizedText } from '../types/common';
import type { Condition } from '../types/events';
import type { TendencyDef, TraitDef } from '../types/definitions';
import type { GameState } from '../types/game';
import type { Relations, SquadRole } from '../types/player';
import { checkAll } from '../events/conditions';
import { fill, templateVars, type EventContent } from '../events/context';

export interface PersonalityContent extends EventContent {
  tendencies: TendencyDef[];
  traits: TraitDef[];
  reactions: ReactionDef[];
}

/** Plantilla de reacción del entorno (dato declarativo, como los eventos). */
export interface ReactionDef {
  id: string;
  source: NewsSource;
  tone: 'positive' | 'neutral' | 'negative';
  weight: number;
  requires: Condition[];
  text: LocalizedText;
}

const clamp = (v: number, min = -100, max = 100) => Math.min(max, Math.max(min, v));
const fromTendencyFlag = (traitId: string) => `traitFromTendency:${traitId}`;

/** Tendencias iniciales según los rasgos elegidos al crear el personaje. */
export function seedTendencies(game: GameState, tendencies: TendencyDef[]): void {
  const has = (id?: string) => Boolean(id && game.player.traits.some((t) => t.id === id));
  for (const def of tendencies) {
    let v = game.player.tendencies[def.id] ?? 0;
    if (has(def.positiveTrait)) v += 30;
    if (has(def.negativeTrait)) v -= 30;
    if (v !== 0) game.player.tendencies[def.id] = clamp(v);
  }
}

function addTrait(game: GameState, id: string, traits: TraitDef[], changes: { key: string; value: number | string }[]): void {
  if (game.player.traits.some((t) => t.id === id)) return;
  const def = traits.find((t) => t.id === id);
  // Un rasgo opuesto se pierde al ganar el nuevo.
  for (const opp of def?.opposites ?? []) {
    if (game.player.traits.some((t) => t.id === opp)) {
      game.player.traits = game.player.traits.filter((t) => t.id !== opp);
      changes.push({ key: 'effects.traitRemove', value: opp });
    }
  }
  game.player.traits.push({ id, intensity: 1 });
  game.flags[fromTendencyFlag(id)] = true;
  changes.push({ key: 'effects.traitAdd', value: id });
}

function removeTrait(game: GameState, id: string, changes: { key: string; value: number | string }[]): void {
  // Solo se pierden los rasgos que se ganaron por tendencia (no los elegidos al crear el personaje).
  if (!game.flags[fromTendencyFlag(id)] || !game.player.traits.some((t) => t.id === id)) return;
  game.player.traits = game.player.traits.filter((t) => t.id !== id);
  delete game.flags[fromTendencyFlag(id)];
  changes.push({ key: 'effects.traitRemove', value: id });
}

/** Aplica los umbrales: gana o pierde rasgos según las tendencias actuales. */
export function applyTendencyTraits(game: GameState, content: Pick<PersonalityContent, 'tendencies' | 'traits'>): { key: string; value: number | string }[] {
  const changes: { key: string; value: number | string }[] = [];
  for (const def of content.tendencies) {
    const v = game.player.tendencies[def.id] ?? 0;
    if (def.positiveTrait) {
      if (v >= def.threshold) addTrait(game, def.positiveTrait, content.traits, changes);
      else if (v < def.threshold / 2) removeTrait(game, def.positiveTrait, changes);
    }
    if (def.negativeTrait) {
      if (v <= -def.threshold) addTrait(game, def.negativeTrait, content.traits, changes);
      else if (v > -def.threshold / 2) removeTrait(game, def.negativeTrait, changes);
    }
  }
  return changes;
}

/** Mueve una tendencia (las decisiones de mercado y otras acciones automáticas la usan). */
export function nudgeTendency(game: GameState, id: string, delta: number): void {
  game.player.tendencies[id] = clamp((game.player.tendencies[id] ?? 0) + delta);
}

const ROLE_DOWN: Record<SquadRole, SquadRole> = { estrella: 'titular', titular: 'rotacion', rotacion: 'rotacion', promesa: 'promesa', cantera: 'cantera' };

/**
 * Consecuencias de las relaciones muy deterioradas (se revisan tras cada vuelta).
 * Devuelve titulares para el buzón.
 */
export function relationConsequences(game: GameState): { headline: string; tone: 'negative' | 'neutral' }[] {
  const p = game.player;
  const r = p.relations;
  const out: { headline: string; tone: 'negative' | 'neutral' }[] = [];
  const key = (k: string) => `${k}:${game.calendar.season}`;
  if (r.coach <= -50 && p.contract && !game.flags[key('coachConflict')]) {
    p.contract.role = ROLE_DOWN[p.contract.role];
    game.flags[key('coachConflict')] = true;
    out.push({ headline: 'El entrenador te aparta del once: la relación está rota.', tone: 'negative' });
  }
  if (r.board <= -50 && !game.flags['transferRequest']) {
    game.flags['transferRequest'] = true;
    out.push({ headline: 'La directiva te pone en la lista de transferibles.', tone: 'negative' });
  }
  if (r.dressingRoom <= -40) {
    p.status.morale = clamp(p.status.morale - 8, 0, 100);
    out.push({ headline: 'Te sientes aislado en el vestuario. Nadie te pasa el balón en los rondos.', tone: 'negative' });
  }
  if (r.fans <= -50) {
    p.reputation.local = clamp(p.reputation.local - 5, 0, 100);
    out.push({ headline: 'La afición te ha dado la espalda: pitos cada vez que tocas el balón.', tone: 'negative' });
  }
  if (r.family <= -30) {
    p.status.morale = clamp(p.status.morale - 5, 0, 100);
    out.push({ headline: 'Las cosas en casa no van bien. Lo notas en el campo.', tone: 'negative' });
  }
  return out;
}

/** Al final de cada temporada las relaciones vuelven un 10 % hacia 0 y las tendencias un 5 %. */
export function seasonDrift(game: GameState): void {
  const r = game.player.relations;
  for (const k of Object.keys(r) as (keyof Relations)[]) {
    if (k === 'family') continue;
    r[k] = Math.round(r[k] * 0.9);
  }
  for (const [k, v] of Object.entries(game.player.tendencies)) game.player.tendencies[k] = Math.round((v ?? 0) * 0.95);
  game.social.sentiment = Math.round(game.social.sentiment * 0.7);
}

/**
 * Reacciones del entorno tras una vuelta: entre 1 y `max` mensajes de afición, prensa, redes,
 * entrenador o compañeros, elegidos entre las plantillas que encajan con la situación.
 */
export function reactions(game: GameState, content: PersonalityContent, rng: Rng, max = 2): void {
  const pool = content.reactions.filter((r) => checkAll(r.requires, game, content));
  if (!pool.length) return;
  const vars = templateVars(game, content);
  const n = rng.int(1, max);
  for (let i = 0; i < n && pool.length; i++) {
    const r = rng.weighted(pool, (x) => x.weight);
    pool.splice(pool.indexOf(r), 1);
    game.inbox.unshift({
      id: `re-${game.calendar.season}-${game.calendar.phase}-${r.id}`,
      season: game.calendar.season,
      phase: game.calendar.phase,
      source: r.source,
      headline: fill(r.text.es, vars),
      tone: r.tone,
    });
    const delta = r.tone === 'positive' ? 6 : r.tone === 'negative' ? -6 : 0;
    game.social.sentiment = clamp(game.social.sentiment + delta);
  }
  game.inbox = game.inbox.slice(0, 40);
}
