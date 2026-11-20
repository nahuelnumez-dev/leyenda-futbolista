/**
 * Motor de eventos: sorteo de eventos para cada fase y resolución de decisiones.
 * Los eventos son datos (src/data/events); aquí solo vive la lógica genérica.
 */
import { Rng } from '../rng';
import type { SeasonPhase } from '../types/common';
import type { GameEvent } from '../types/events';
import type { EventOutcome, GameState } from '../types/game';
import { checkAll } from './conditions';
import { applyEffects } from './effects';
import { careerStage, fill, playerAge, templateVars, type EventContent } from './context';
import type { TendencyDef, TraitDef } from '../types/definitions';
import { applyTendencyTraits } from '../personality/personality';

export interface EventsContent extends EventContent {
  events: GameEvent[];
  /** Opcionales: si están, las decisiones pueden hacer ganar o perder rasgos por tendencia. */
  tendencies?: TendencyDef[];
  traits?: TraitDef[];
}

/** Eventos por fase (la pretemporada y el mercado tienen menos; las vueltas, más). */
export const EVENTS_PER_PHASE: Record<SeasonPhase, [min: number, max: number]> = {
  preseason: [1, 1],
  firstHalf: [1, 2],
  winterWindow: [0, 1],
  secondHalf: [1, 2],
  seasonEnd: [1, 1],
};

function onCooldown(game: GameState, ev: GameEvent): boolean {
  if (ev.once && game.eventLog.some((r) => r.eventId === ev.id)) return true;
  if (ev.cooldownSeasons) {
    const last = game.eventLog.findLast((r) => r.eventId === ev.id);
    if (last && game.calendar.season - last.season < ev.cooldownSeasons) return true;
  }
  return false;
}

/** Eventos que pueden salir ahora mismo (sin tirar los `chance`). */
export function eligibleEvents(game: GameState, content: EventsContent, phase: SeasonPhase): GameEvent[] {
  const stage = careerStage(game);
  return content.events.filter(
    (ev) => ev.phases.includes(phase) && ev.stages.includes(stage) && !onCooldown(game, ev) && checkAll(ev.requires, game, content),
  );
}

/**
 * Prepara la cola de eventos de la fase actual: primero los programados por decisiones anteriores,
 * después un sorteo ponderado entre los elegibles.
 */
export function queuePhaseEvents(game: GameState, content: EventsContent, rng: Rng): void {
  const phase = game.calendar.phase;
  const season = game.calendar.season;
  const vars = templateVars(game, content);
  const chosen: GameEvent[] = [];

  // Programados
  const due = game.scheduledEvents.filter((s) => s.season <= season && (!s.phase || s.phase === phase));
  game.scheduledEvents = game.scheduledEvents.filter((s) => !due.includes(s));
  for (const s of due) {
    const ev = content.events.find((e) => e.id === s.eventId);
    if (ev && checkAll(ev.requires, game, content, rng)) chosen.push(ev);
  }

  // Sorteo
  const [min, max] = EVENTS_PER_PHASE[phase];
  const target = rng.int(min, max);
  const pool = eligibleEvents(game, content, phase).filter((ev) => !chosen.includes(ev));
  while (chosen.length < target + due.length && pool.length) {
    const ev = rng.weighted(pool, (e) => e.weight);
    pool.splice(pool.indexOf(ev), 1);
    // Los requisitos `chance` se tiran ahora.
    if (checkAll(ev.requires, game, content, rng)) chosen.push(ev);
  }

  const queue = chosen.map((ev) => ({ eventId: ev.id, vars }));
  const [first, ...rest] = queue;
  game.activeEvent = first ?? null;
  game.eventQueue = rest;
}

/** ¿Hay decisiones pendientes que impidan avanzar? */
export function hasPendingEvent(game: GameState): boolean {
  return game.activeEvent !== null;
}

/**
 * Elige una opción del evento activo. Devuelve una copia nueva con los efectos aplicados,
 * el registro en el historial y el siguiente evento de la cola.
 */
export function chooseOption(input: GameState, optionId: string, content: EventsContent): GameState {
  const game = structuredClone(input);
  const active = game.activeEvent;
  if (!active) return game;
  const ev = content.events.find((e) => e.id === active.eventId);
  const option = ev?.options.find((o) => o.id === optionId);
  if (!ev || !option) throw new Error(`Opción desconocida: ${active.eventId}/${optionId}`);
  if (!checkAll(option.requires, game, content)) throw new Error(`La opción ${optionId} no está disponible`);

  const rng = Rng.fromState(game.rngState);
  const vars = active.vars;
  const changes: EventOutcome['changes'] = [];
  applyEffects(game, option.effects, content, rng, vars, changes);

  let success: boolean | undefined;
  let text = option.result ? fill(option.result.es, vars) : undefined;
  if (option.roll) {
    let chance = option.roll.chance;
    for (const m of option.roll.modifiers ?? []) {
      if (m.attribute) chance += ((game.player.attributes[m.attribute] - 50) * (m.perPoint ?? 0.01));
      if (m.trait && game.player.traits.some((t) => t.id === m.trait)) chance += m.flat ?? 0.1;
    }
    success = rng.chance(Math.min(0.95, Math.max(0.05, chance)));
    const branch = success ? option.roll.success : option.roll.failure;
    applyEffects(game, branch.effects, content, rng, vars, changes);
    if (branch.text) text = fill(branch.text.es, vars);
  }

  if (content.tendencies && content.traits) changes.push(...applyTendencyTraits(game, { tendencies: content.tendencies, traits: content.traits }));

  game.eventLog.push({
    eventId: ev.id,
    optionId,
    season: game.calendar.season,
    phase: game.calendar.phase,
    age: playerAge(game),
    ...(option.key ? { key: true } : {}),
    ...(success !== undefined ? { success } : {}),
  });
  game.lastOutcome = { eventId: ev.id, optionId, ...(text ? { text } : {}), ...(success !== undefined ? { success } : {}), changes };

  const [next, ...rest] = game.eventQueue ?? [];
  game.activeEvent = next ?? null;
  game.eventQueue = rest;
  game.rngState = rng.getState();
  return game;
}
