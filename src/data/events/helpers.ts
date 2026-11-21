/**
 * Atajos para escribir eventos de forma compacta. Los eventos siguen siendo datos puros (GameEvent):
 * estas funciones solo construyen objetos.
 *
 * Variables disponibles en los textos: {nombre}, {apodo}, {club}, {ciudad}, {estadio}, {division}, {rival},
 * {entrenador}, {companero}, {capitan}, {agente}, {periodista}, {ciudadNatal}, {pais}, {temporada}.
 */
import type { AttributeId } from '@/engine/types/attributes';
import type { CareerStage, SeasonPhase } from '@/engine/types/common';
import type { EventCategory } from '@/engine/types/events';
import type { Condition, Effect, EventOption, EventOutcomeRoll, GameEvent, MatchStatDelta, RelationId, ReputationScope } from '@/engine/types/events';

export const es = (text: string) => ({ es: text });

type EventInput = Omit<GameEvent, 'title' | 'text'> & { title: string; text: string };

export function ev(e: EventInput): GameEvent {
  return { ...e, title: es(e.title), text: es(e.text) };
}

export function opt(id: string, text: string, effects: Effect[] = [], extra: { result?: string; requires?: Condition[]; roll?: EventOutcomeRoll; key?: boolean } = {}): EventOption {
  const { result, ...rest } = extra;
  return { id, text: es(text), effects, ...(result ? { result: es(result) } : {}), ...rest };
}

/** Tirada con probabilidad base y, opcionalmente, un atributo que la mejora (+1 % por punto sobre 50). */
export function roll(chance: number, success: { text: string; effects: Effect[] }, failure: { text: string; effects: Effect[] }, attribute?: AttributeId): EventOutcomeRoll {
  return {
    chance,
    ...(attribute ? { modifiers: [{ attribute, perPoint: 0.01 }] } : {}),
    success: { text: es(success.text), effects: success.effects },
    failure: { text: es(failure.text), effects: failure.effects },
  };
}

/* ── Efectos ─────────────────────────────────────────── */
export const rel = (who: RelationId, delta: number): Effect => ({ type: 'relation', who, delta });
export const family = (delta: number): Effect => ({ type: 'relation', who: 'family', delta });
export const attr = (id: AttributeId, delta: number): Effect => ({ type: 'attribute', id, delta });
export const group = (g: 'technical' | 'physical' | 'mental' | 'goalkeeping', delta: number): Effect => ({ type: 'attributeGroup', group: g, delta });
export const rep = (scope: ReputationScope, delta: number): Effect => ({ type: 'reputation', scope, delta });
export const morale = (delta: number): Effect => ({ type: 'morale', delta });
export const form = (delta: number): Effect => ({ type: 'form', delta });
export const fitness = (delta: number): Effect => ({ type: 'fitness', delta });
export const money = (amount: number): Effect => ({ type: 'money', amount });
export const followers = (delta: number): Effect => ({ type: 'followers', delta, percent: true });
export const flag = (id: string, value: number | boolean = true): Effect => ({ type: 'flag', id, value });
export const addTrait = (id: string): Effect => ({ type: 'trait', op: 'add', id });
export const removeTrait = (id: string): Effect => ({ type: 'trait', op: 'remove', id });
export const tendency = (id: string, delta: number): Effect => ({ type: 'tendency', id, delta });
export const injury = (severity: 1 | 2 | 3, weeks: number): Effect => ({ type: 'injury', severity, weeks });
export const news = (headline: string, tone: 'positive' | 'neutral' | 'negative' = 'neutral'): Effect => ({ type: 'news', headline: es(headline), tone });
export const schedule = (id: string, inSeasons = 0, phase?: SeasonPhase): Effect => ({ type: 'scheduleEvent', id, inSeasons, ...(phase ? { phase } : {}) });
export const playingTime = (delta: number): Effect => ({ type: 'playingTime', delta });
export const potential = (delta: number): Effect => ({ type: 'potential', delta });
export const celebration = (id: string): Effect => ({ type: 'unlockCelebration', id });

/* ── Estadísticas del partido (cuentan de verdad) ────── */
export const stat = (d: MatchStatDelta): Effect => ({ type: 'matchStat', ...d });
export const goal = (n = 1): Effect => stat({ goals: n });
/** El partido termina con al menos `n` goles suyos (doblete = 2, hat-trick = 3). */
export const goalsAtLeast = (n: number): Effect => stat({ goals: n, atLeast: true });
export const assist = (n = 1): Effect => stat({ assists: n });
export const dribble = (n = 1): Effect => stat({ dribbles: n });
export const keyPass = (n = 1): Effect => stat({ keyPasses: n });
export const tackle = (n = 1): Effect => stat({ tackles: n });
export const save = (n = 1): Effect => stat({ saves: n });
export const cleanSheet = (): Effect => stat({ cleanSheet: true });
export const matchRating = (delta: number): Effect => stat({ rating: delta });

/* ── Requisitos ──────────────────────────────────────── */
export const chance = (p: number): Condition => ({ type: 'chance', p });
export const minAge = (min: number): Condition => ({ type: 'age', min });
export const maxAge = (max: number): Condition => ({ type: 'age', max });
export const minOverall = (min: number): Condition => ({ type: 'overall', min });
export const hasTrait = (id: string): Condition => ({ type: 'trait', id });
export const noFlag = (id: string): Condition => ({ type: 'notFlag', id });
export const hasFlag = (id: string): Condition => ({ type: 'flag', id });
export const minMoney = (min: number): Condition => ({ type: 'money', min });
/* Posiciones */
export const KEEPER: Condition = { type: 'position', in: ['POR'] };
export const OUTFIELD: Condition = { type: 'positionGroup', in: ['defender', 'midfielder', 'forward'] };
export const ATTACKERS: Condition = { type: 'positionGroup', in: ['midfielder', 'forward'] };
export const FORWARDS: Condition = { type: 'positionGroup', in: ['forward'] };
export const MIDFIELDERS: Condition = { type: 'positionGroup', in: ['midfielder'] };
export const DEFENDERS: Condition = { type: 'positionGroup', in: ['defender'] };
export const WINGERS: Condition = { type: 'position', in: ['ED', 'EI', 'MD', 'MI'] };
export const FULLBACKS: Condition = { type: 'position', in: ['LD', 'LI'] };
export const CENTREBACKS: Condition = { type: 'position', in: ['DFC'] };
export const STRIKERS: Condition = { type: 'position', in: ['DC'] };
export const PLAYMAKERS: Condition = { type: 'position', in: ['MC', 'MCO', 'MCD'] };

/* ── Etapas habituales ───────────────────────────────── */
export const PRO: CareerStage[] = ['breakthrough', 'establishment', 'prime', 'veteran'];
export const SENIOR: CareerStage[] = ['establishment', 'prime', 'veteran'];
export const ALL: CareerStage[] = ['academy', 'breakthrough', 'establishment', 'prime', 'veteran'];
export const HALVES: SeasonPhase[] = ['firstHalf', 'secondHalf'];
/** Fases en las que ya se ha jugado algún partido de la temporada (válidas para efectos de estadísticas). */
export const MATCH_PHASES: SeasonPhase[] = ['firstHalf', 'winterWindow', 'secondHalf'];

/* ── Atajos para escribir muchos eventos de partido ─── */

/** Resultado de una tirada: texto y efectos. */
export const out = (text: string, ...effects: Effect[]) => ({ text, effects });

export interface QuickEvent {
  stages?: CareerStage[];
  phases?: SeasonPhase[];
  weight?: number;
  cd?: number;
  once?: boolean;
  speaker?: GameEvent['speaker'];
  category?: EventCategory;
}

/** Evento compacto: por defecto, de partido (keyMatch), para profesionales y tras haber jugado partidos. */
export function mev(id: string, requires: Condition[], title: string, text: string, options: EventOption[], o: QuickEvent = {}): GameEvent {
  return ev({
    id,
    category: o.category ?? 'keyMatch',
    stages: o.stages ?? PRO,
    phases: o.phases ?? MATCH_PHASES,
    weight: o.weight ?? 10,
    ...(o.once ? { once: true } : { cooldownSeasons: o.cd ?? 2 }),
    requires,
    speaker: o.speaker ?? 'narrator',
    title,
    text,
    options,
  });
}
