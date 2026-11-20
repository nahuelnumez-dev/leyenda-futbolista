/**
 * Atajos para escribir eventos de forma compacta. Los eventos siguen siendo datos puros (GameEvent):
 * estas funciones solo construyen objetos.
 *
 * Variables disponibles en los textos: {nombre}, {apodo}, {club}, {ciudad}, {estadio}, {division}, {rival},
 * {entrenador}, {companero}, {capitan}, {agente}, {periodista}, {ciudadNatal}, {pais}, {temporada}.
 */
import type { AttributeId } from '@/engine/types/attributes';
import type { CareerStage, SeasonPhase } from '@/engine/types/common';
import type { Condition, Effect, EventOption, EventOutcomeRoll, GameEvent, RelationId, ReputationScope } from '@/engine/types/events';

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

/* ── Requisitos ──────────────────────────────────────── */
export const chance = (p: number): Condition => ({ type: 'chance', p });
export const minAge = (min: number): Condition => ({ type: 'age', min });
export const maxAge = (max: number): Condition => ({ type: 'age', max });
export const minOverall = (min: number): Condition => ({ type: 'overall', min });
export const hasTrait = (id: string): Condition => ({ type: 'trait', id });
export const noFlag = (id: string): Condition => ({ type: 'notFlag', id });
export const hasFlag = (id: string): Condition => ({ type: 'flag', id });
export const minMoney = (min: number): Condition => ({ type: 'money', min });

/* ── Etapas habituales ───────────────────────────────── */
export const PRO: CareerStage[] = ['breakthrough', 'establishment', 'prime', 'veteran'];
export const SENIOR: CareerStage[] = ['establishment', 'prime', 'veteran'];
export const ALL: CareerStage[] = ['academy', 'breakthrough', 'establishment', 'prime', 'veteran'];
export const HALVES: SeasonPhase[] = ['firstHalf', 'secondHalf'];
