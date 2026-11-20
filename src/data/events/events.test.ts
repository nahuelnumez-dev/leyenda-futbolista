/** Validación de los eventos: ids, opciones, referencias a otros eventos, rasgos, atributos y variables de texto. */
import { describe, expect, it } from 'vitest';
import { ALL_ATTRIBUTES } from '@/engine/types/attributes';
import type { Condition, Effect, GameEvent } from '@/engine/types/events';
import { TEMPLATE_VARS } from '@/engine/events/context';
import { TRAITS } from '../traits';
import { TENDENCIES } from '../tendencies';
import { REACTIONS } from '../reactions';
import { CELEBRATIONS } from '../celebrations';
import { EVENTS } from './index';

const traitIds = new Set(TRAITS.map((t) => t.id));
const eventIds = new Set(EVENTS.map((e) => e.id));
const attrIds = new Set<string>(ALL_ATTRIBUTES);
const vars = new Set<string>(TEMPLATE_VARS);
const tendencyIds = new Set(TENDENCIES.map((t) => t.id));

function texts(e: GameEvent): string[] {
  const out = [e.title.es, e.text.es];
  for (const o of e.options) {
    out.push(o.text.es);
    if (o.result) out.push(o.result.es);
    if (o.roll) out.push(o.roll.success.text?.es ?? '', o.roll.failure.text?.es ?? '');
    for (const ef of allEffects(o)) if (ef.type === 'news') out.push(ef.headline.es);
  }
  return out;
}

function allEffects(o: GameEvent['options'][number]): Effect[] {
  return [...o.effects, ...(o.roll?.success.effects ?? []), ...(o.roll?.failure.effects ?? [])];
}

function allConditions(e: GameEvent): Condition[] {
  const flat = (cs: Condition[]): Condition[] => cs.flatMap((c) => (c.type === 'any' ? flat(c.of) : c.type === 'not' ? flat([c.condition]) : [c]));
  return flat([...e.requires, ...e.options.flatMap((o) => o.requires ?? [])]);
}

describe('eventos', () => {
  it('hay al menos 150 eventos', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(150);
  });

  it('los ids son únicos', () => {
    expect(eventIds.size).toBe(EVENTS.length);
  });

  it.each(EVENTS.map((e) => [e.id, e] as const))('%s es coherente', (_id, e) => {
    expect(e.options.length).toBeGreaterThanOrEqual(2);
    expect(new Set(e.options.map((o) => o.id)).size).toBe(e.options.length);
    expect(e.stages.length).toBeGreaterThan(0);
    expect(e.phases.length).toBeGreaterThan(0);
    for (const o of e.options) {
      for (const ef of allEffects(o)) {
        if (ef.type === 'scheduleEvent') expect(eventIds.has(ef.id), `evento programado ${ef.id}`).toBe(true);
        if (ef.type === 'trait') expect(traitIds.has(ef.id), `rasgo ${ef.id}`).toBe(true);
        if (ef.type === 'attribute') expect(attrIds.has(ef.id), `atributo ${ef.id}`).toBe(true);
        if (ef.type === 'tendency') expect(tendencyIds.has(ef.id), `tendencia ${ef.id}`).toBe(true);
        if (ef.type === 'unlockCelebration') expect(CELEBRATIONS.some((c) => c.id === ef.id), `celebración ${ef.id}`).toBe(true);
      }
      if (o.roll) expect(o.roll.chance).toBeGreaterThan(0);
    }
    for (const c of allConditions(e)) {
      if (c.type === 'trait' || c.type === 'notTrait') expect(traitIds.has(c.id), `rasgo ${c.id}`).toBe(true);
      if (c.type === 'eventSeen' || c.type === 'eventNotSeen') expect(eventIds.has(c.id)).toBe(true);
      if (c.type === 'tendency') expect(tendencyIds.has(c.id), `tendencia ${c.id}`).toBe(true);
    }
    for (const text of texts(e)) {
      for (const m of text.matchAll(/\{(\w+)\}/g)) expect(vars.has(m[1]!), `variable {${m[1]}} en ${e.id}`).toBe(true);
    }
  });

  it('los eventos con peso 0 solo salen programados desde otro evento', () => {
    const scheduled = new Set(EVENTS.flatMap((e) => e.options.flatMap(allEffects)).filter((ef) => ef.type === 'scheduleEvent').map((ef) => (ef as { id: string }).id));
    for (const e of EVENTS.filter((x) => x.weight === 0)) expect(scheduled.has(e.id), e.id).toBe(true);
  });
});

describe('tendencias y reacciones', () => {
  it('los rasgos de las tendencias existen', () => {
    for (const t of TENDENCIES) {
      if (t.positiveTrait) expect(traitIds.has(t.positiveTrait), t.positiveTrait).toBe(true);
      if (t.negativeTrait) expect(traitIds.has(t.negativeTrait), t.negativeTrait).toBe(true);
    }
  });

  it('las reacciones son coherentes', () => {
    expect(new Set(REACTIONS.map((r) => r.id)).size).toBe(REACTIONS.length);
    for (const r of REACTIONS) {
      for (const m of r.text.es.matchAll(/{(w+)}/g)) expect(vars.has(m[1]!), `{${m[1]}} en ${r.id}`).toBe(true);
      for (const c of r.requires) {
        if (c.type === 'trait') expect(traitIds.has(c.id), c.id).toBe(true);
        if (c.type === 'tendency') expect(tendencyIds.has(c.id), c.id).toBe(true);
      }
    }
  });
});
