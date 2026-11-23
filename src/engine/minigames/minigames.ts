/**
 * Versión alternativa: las situaciones se resuelven con minijuegos de fútbol en lugar de elegir una opción.
 *
 * El motor solo decide QUÉ minijuego toca, con qué dificultad y qué pasa al ganar o perder. El minijuego se juega en la
 * interfaz, que devuelve cuántas rondas superó el jugador. Las situaciones que cambian la carrera de forma estructural
 * (traspasos, agentes, retirada...) siguen siendo decisiones clásicas.
 */
import { Rng } from '../rng';
import { POSITION_GROUP, type AttributeId, type PositionGroup } from '../types/attributes';
import type { Effect, EventCategory, GameEvent, MatchStatDelta } from '../types/events';
import type { EventOutcome, GameState } from '../types/game';
import { applyEffects } from '../events/effects';
import { fill, playerAge } from '../events/context';
import { overallFor } from '../player/overall';
import type { EventsContent } from '../events/engine';
import { applyTendencyTraits } from '../personality/personality';

export const MINIGAME_IDS = ['penalty', 'save', 'dribble', 'tackle', 'pass', 'tactics', 'keepy'] as const;
export type MinigameId = (typeof MINIGAME_IDS)[number];

export type MinigameTier = 'great' | 'win' | 'loss' | 'disaster';

export interface MinigameSpec {
  id: MinigameId;
  /** 0 (muy fácil) – 1 (muy difícil). La interfaz la traduce en velocidad, tamaño de zonas, etc. */
  difficulty: number;
  /** Intentos que tiene el jugador. */
  rounds: number;
  /** Aciertos necesarios para ganar. */
  needed: number;
  /** Atributos que hacen más fácil el minijuego (y que mejora al ganarlo en un entrenamiento). */
  attributes: [AttributeId, AttributeId];
  /** Semilla para que la interfaz genere siempre la misma secuencia en esta situación. */
  seed: string;
}

export interface MinigameResult {
  successes: number;
}

const BASE: Record<MinigameId, { rounds: number; needed: number; attributes: [AttributeId, AttributeId] }> = {
  penalty: { rounds: 5, needed: 3, attributes: ['finishing', 'composure'] },
  save: { rounds: 5, needed: 3, attributes: ['reflexes', 'diving'] },
  dribble: { rounds: 6, needed: 4, attributes: ['dribbling', 'agility'] },
  tackle: { rounds: 5, needed: 3, attributes: ['positioning', 'concentration'] },
  pass: { rounds: 5, needed: 3, attributes: ['shortPassing', 'vision'] },
  tactics: { rounds: 4, needed: 3, attributes: ['vision', 'concentration'] },
  keepy: { rounds: 10, needed: 7, attributes: ['ballControl', 'composure'] },
};

/** Un portero juega con el pie y la cabeza con sus propios atributos. */
const GOALKEEPER_ATTRIBUTES: Partial<Record<MinigameId, { attributes: [AttributeId, AttributeId] }>> = {
  keepy: { attributes: ['kicking', 'composure'] },
  pass: { attributes: ['kicking', 'vision'] },
  tactics: { attributes: ['gkPositioning', 'concentration'] },
};

/** Efectos que convierten una situación en decisión estructural (se mantiene la elección clásica). */
const STRUCTURAL = new Set<Effect['type']>(['retire', 'setAgent', 'transferRequest', 'offer']);

function allEffects(ev: GameEvent): Effect[] {
  return ev.options.flatMap((o) => [...o.effects, ...(o.roll ? [...o.roll.success.effects, ...o.roll.failure.effects] : [])]);
}

/** ¿Esta situación se juega con un minijuego? */
export function isMinigameEvent(ev: GameEvent): boolean {
  return !allEffects(ev).some((e) => STRUCTURAL.has(e.type));
}

/** Lo que cuenta el evento en las estadísticas del partido (de la primera opción que lo tenga). */
export function eventMatchStat(ev: GameEvent): MatchStatDelta | undefined {
  for (const o of ev.options) {
    const found = [...o.effects, ...(o.roll?.success.effects ?? [])].find((e) => e.type === 'matchStat');
    if (found && found.type === 'matchStat') {
      const { type: _t, ...delta } = found;
      return delta;
    }
  }
  return undefined;
}

type Theme = 'match' | 'training' | 'team' | 'public' | 'business' | 'life' | 'injury';

const THEME: Record<EventCategory, Theme> = {
  keyMatch: 'match',
  nationalTeam: 'match',
  training: 'training',
  coach: 'team',
  dressingRoom: 'team',
  media: 'public',
  social: 'public',
  transfer: 'business',
  loan: 'business',
  contract: 'business',
  agent: 'business',
  personal: 'life',
  ethics: 'life',
  retirement: 'life',
  injury: 'injury',
};

export function themeOf(ev: GameEvent): Theme {
  return THEME[ev.category];
}

const BY_GROUP: Record<Theme, Record<PositionGroup, MinigameId[]>> = {
  match: { goalkeeper: ['save'], defender: ['tackle', 'pass'], midfielder: ['pass', 'dribble', 'tackle'], forward: ['penalty', 'dribble'] },
  training: {
    goalkeeper: ['save', 'keepy', 'pass'],
    defender: ['tackle', 'keepy', 'pass'],
    midfielder: ['pass', 'keepy', 'tactics', 'dribble'],
    forward: ['penalty', 'dribble', 'keepy'],
  },
  team: { goalkeeper: ['tactics', 'save'], defender: ['tactics', 'tackle'], midfielder: ['tactics', 'pass'], forward: ['tactics', 'penalty'] },
  public: { goalkeeper: ['keepy', 'tactics'], defender: ['keepy', 'tactics'], midfielder: ['keepy', 'tactics'], forward: ['keepy', 'penalty'] },
  business: { goalkeeper: ['tactics', 'pass'], defender: ['tactics', 'pass'], midfielder: ['tactics', 'pass'], forward: ['tactics', 'penalty'] },
  life: { goalkeeper: ['keepy', 'tactics'], defender: ['keepy', 'tactics'], midfielder: ['keepy', 'tactics'], forward: ['keepy', 'tactics'] },
  injury: { goalkeeper: ['keepy'], defender: ['keepy'], midfielder: ['keepy'], forward: ['keepy'] },
};

/** Minijuego coherente con lo que cuenta el evento (el validador ya garantiza la coherencia con la posición). */
function fromMatchStat(delta: MatchStatDelta, group: PositionGroup): MinigameId | undefined {
  if (delta.saves || (delta.cleanSheet && group === 'goalkeeper')) return 'save';
  if (delta.goals) return 'penalty';
  if (delta.assists || delta.keyPasses) return 'pass';
  if (delta.dribbles) return 'dribble';
  if (delta.tackles || delta.cleanSheet) return 'tackle';
  return undefined;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Qué minijuego toca en la situación activa y con qué dificultad. */
export function minigameFor(game: GameState, ev: GameEvent): MinigameSpec {
  const group = POSITION_GROUP[game.player.positions.main];
  const theme = themeOf(ev);
  const seed = `${ev.id}:${game.calendar.season}:${game.calendar.phase}:${game.eventLog.length}`;
  const stat = eventMatchStat(ev);
  let id: MinigameId = (stat && fromMatchStat(stat, group)) || Rng.fromSeed(seed).pick(BY_GROUP[theme][group]);
  // Un portero no tira penaltis ni regatea en un partido: se queda en su terreno.
  if (group === 'goalkeeper' && (id === 'penalty' || id === 'dribble')) id = 'save';

  const base = { ...BASE[id], ...(group === 'goalkeeper' ? GOALKEEPER_ATTRIBUTES[id] : {}) };
  const attrs = game.player.attributes;
  const skill = (attrs[base.attributes[0]] + attrs[base.attributes[1]]) / 2;
  const pressure = ev.category === 'keyMatch' || ev.category === 'nationalTeam' ? 0.08 : 0;
  // Referencia a medio camino entre la media del jugador y 60: un canterano no sufre por sus atributos bajos,
  // pero mejorar (sobre todo en los atributos del minijuego) siempre lo hace más fácil.
  const reference = (overallFor(attrs, game.player.positions.main) + 60) / 2;
  const difficulty = clamp(0.5 + pressure - (skill - reference) / 80, 0.1, 0.95);
  return { id, difficulty: Math.round(difficulty * 100) / 100, rounds: base.rounds, needed: base.needed, attributes: base.attributes, seed };
}

export function tierFor(spec: Pick<MinigameSpec, 'rounds' | 'needed'>, successes: number): MinigameTier {
  if (successes >= spec.needed) return successes >= spec.rounds ? 'great' : 'win';
  return successes <= Math.floor(spec.needed / 2) ? 'disaster' : 'loss';
}

/** Recompensas y penalizaciones según el tipo de situación. */
export function minigameEffects(game: GameState, ev: GameEvent, spec: MinigameSpec, tier: MinigameTier): Effect[] {
  const won = tier === 'great' || tier === 'win';
  const great = tier === 'great';
  const disaster = tier === 'disaster';
  const theme = themeOf(ev);
  const out: Effect[] = [];
  const hasMatch = Boolean(game.current) && ['firstHalf', 'winterWindow', 'secondHalf'].includes(game.calendar.phase);

  switch (theme) {
    case 'match': {
      const stat = eventMatchStat(ev);
      if (won) {
        if (stat) out.push({ type: 'matchStat', ...stat, ...(great ? { rating: (stat.rating ?? 0) + 0.5 } : {}) });
        else if (hasMatch) out.push({ type: 'matchStat', rating: great ? 1 : 0.5 });
        out.push({ type: 'form', delta: great ? 8 : 5 }, { type: 'morale', delta: 4 }, { type: 'reputation', scope: 'local', delta: 2 }, { type: 'relation', who: 'fans', delta: 3 });
        if (great) out.push({ type: 'reputation', scope: 'national', delta: 2 }, { type: 'followers', delta: 3, percent: true });
      } else {
        if (hasMatch) out.push({ type: 'matchStat', rating: disaster ? -1 : -0.5 });
        out.push({ type: 'form', delta: -5 }, { type: 'morale', delta: -4 }, { type: 'relation', who: 'coach', delta: -2 });
        if (disaster) out.push({ type: 'reputation', scope: 'local', delta: -2 }, { type: 'relation', who: 'fans', delta: -3 });
      }
      break;
    }
    case 'training':
      if (won) {
        out.push({ type: 'attribute', id: spec.attributes[0], delta: 1 }, { type: 'relation', who: 'coach', delta: 3 }, { type: 'form', delta: 3 });
        if (great) out.push({ type: 'attribute', id: spec.attributes[1], delta: 1 }, { type: 'playingTime', delta: 1 });
      } else {
        out.push({ type: 'relation', who: 'coach', delta: -3 }, { type: 'morale', delta: -3 });
        if (disaster) out.push({ type: 'fitness', delta: -10 }, { type: 'form', delta: -4 });
      }
      break;
    case 'team': {
      const who = ev.category === 'coach' ? 'coach' : 'dressingRoom';
      if (won) {
        out.push({ type: 'relation', who, delta: great ? 7 : 4 }, { type: 'morale', delta: 3 }, { type: 'tendency', id: 'solidaridad', delta: 3 });
        if (great) out.push({ type: 'attribute', id: 'leadership', delta: 1 });
      } else {
        out.push({ type: 'relation', who, delta: disaster ? -7 : -4 }, { type: 'morale', delta: -3 }, { type: 'tendency', id: 'temperamento', delta: 3 });
      }
      break;
    }
    case 'public':
      if (won) {
        out.push({ type: 'followers', delta: great ? 8 : 4, percent: true }, { type: 'relation', who: 'press', delta: 3 }, { type: 'reputation', scope: 'national', delta: 1 }, { type: 'tendency', id: 'carisma', delta: 3 });
        if (great) out.push({ type: 'relation', who: 'fans', delta: 3 });
      } else {
        out.push({ type: 'relation', who: 'press', delta: -4 }, { type: 'morale', delta: -3 }, { type: 'followers', delta: -1, percent: true });
        if (disaster) out.push({ type: 'reputation', scope: 'national', delta: -2 }, { type: 'relation', who: 'fans', delta: -2 });
      }
      break;
    case 'business': {
      const salary = game.player.contract?.salary ?? 0;
      const bonus = Math.max(2000, Math.round((salary * (great ? 0.06 : 0.03)) / 1000) * 1000);
      if (won) {
        out.push({ type: 'money', amount: bonus }, { type: 'relation', who: 'board', delta: 3 }, { type: 'morale', delta: 2 });
        if (game.player.agent) out.push({ type: 'relation', who: 'agent', delta: 3 });
        if (great) out.push({ type: 'reputation', scope: 'national', delta: 1 });
      } else {
        out.push({ type: 'relation', who: 'board', delta: -3 }, { type: 'morale', delta: -3 });
        if (disaster) out.push({ type: 'money', amount: -Math.round(bonus / 2) }, { type: 'tendency', id: 'ego', delta: 3 });
      }
      break;
    }
    case 'life':
      if (won) {
        out.push({ type: 'relation', who: 'family', delta: 4 }, { type: 'morale', delta: great ? 8 : 5 }, { type: 'tendency', id: 'profesionalidad', delta: 3 });
        if (great) out.push({ type: 'form', delta: 3 });
      } else {
        out.push({ type: 'relation', who: 'family', delta: -3 }, { type: 'morale', delta: -4 }, { type: 'form', delta: -2 });
        if (disaster) out.push({ type: 'tendency', id: 'rebeldia', delta: 3 }, { type: 'fitness', delta: -6 });
      }
      break;
    case 'injury': {
      const injured = Boolean(game.player.status.injury);
      if (won) {
        if (injured) out.push({ type: 'recovery', weeks: great ? -2 : -1 });
        out.push({ type: 'fitness', delta: 8 }, { type: 'morale', delta: 3 });
      } else {
        if (injured) out.push({ type: 'recovery', weeks: 1 });
        out.push({ type: 'morale', delta: -4 });
        if (disaster) out.push({ type: 'injuryProneness', delta: 2 }, { type: 'fitness', delta: -6 });
      }
      break;
    }
  }
  return out;
}

const TIER_TEXT: Record<MinigameTier, string> = {
  great: '¡Perfecto! Lo bordaste y todos lo han visto.',
  win: '¡Superado! Lo has sacado adelante.',
  loss: 'No ha salido. Te quedas con mal sabor de boca.',
  disaster: 'Un desastre. Va a costar olvidar este día.',
};

/**
 * Resuelve la situación activa con el resultado del minijuego. Devuelve una copia nueva con los efectos aplicados,
 * el registro en el historial y el siguiente evento de la cola.
 */
export function resolveMinigame(input: GameState, result: MinigameResult, content: EventsContent): GameState {
  const game = structuredClone(input);
  const active = game.activeEvent;
  if (!active) return game;
  const ev = content.events.find((e) => e.id === active.eventId);
  if (!ev) throw new Error(`Evento desconocido: ${active.eventId}`);
  if (!isMinigameEvent(ev)) throw new Error(`El evento ${ev.id} se decide eligiendo una opción`);
  const spec = minigameFor(input, ev);
  const successes = clamp(Math.round(result.successes), 0, spec.rounds);
  const tier = tierFor(spec, successes);
  const won = tier === 'great' || tier === 'win';

  const rng = Rng.fromState(game.rngState);
  const changes: EventOutcome['changes'] = [];
  applyEffects(game, minigameEffects(input, ev, spec, tier), content, rng, active.vars, changes);
  if (content.tendencies && content.traits) changes.push(...applyTendencyTraits(game, { tendencies: content.tendencies, traits: content.traits }));

  const optionId = `mg:${spec.id}:${tier}`;
  game.eventLog.push({ eventId: ev.id, optionId, season: game.calendar.season, phase: game.calendar.phase, age: playerAge(game), success: won });
  game.lastOutcome = { eventId: ev.id, optionId, text: fill(TIER_TEXT[tier], active.vars), success: won, changes, minigame: { id: spec.id, successes, rounds: spec.rounds, tier } };

  const [next, ...rest] = game.eventQueue ?? [];
  game.activeEvent = next ?? null;
  game.eventQueue = rest;
  game.rngState = rng.getState();
  return game;
}

/** Simula a un jugador humano (para el balance y los tests): `skill` 0-1 es su habilidad con los minijuegos. */
export function simulateMinigame(spec: MinigameSpec, rng: Rng, skill = 0.6): MinigameResult {
  const p = clamp(0.35 + skill * 0.6 - spec.difficulty * 0.35, 0.05, 0.97);
  let successes = 0;
  for (let i = 0; i < spec.rounds; i++) if (rng.chance(p)) successes++;
  return { successes };
}
