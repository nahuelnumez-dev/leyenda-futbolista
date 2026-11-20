import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { ACHIEVEMENTS } from '@/data/achievements';
import { createNewGame } from '../world/newGame';
import { advancePhase } from '../season/advance';
import { chooseOption } from '../events/engine';
import { checkAll } from '../events/conditions';
import type { GameState } from '../types/game';
import { careerCard, evaluateAchievements, legacyScore, retireNow, retirementDue } from './legacy';

function play(g: GameState, phases: number): GameState {
  let out = g;
  for (let i = 0; i < phases && !out.retired; i++) {
    while (out.activeEvent) {
      const ev = C.events.find((e) => e.id === out.activeEvent!.eventId)!;
      // Evita retirarse antes de tiempo eligiendo la primera opción que no sea retirarse.
      const option = ev.options.find((o) => checkAll(o.requires, out, C) && !o.effects.some((e) => e.type === 'retire')) ?? ev.options[0]!;
      out = chooseOption(out, option.id, C);
    }
    out = advancePhase(out, C);
  }
  return out;
}

const base = () => createNewGame({ seed: 'legado', createdAt: '2026-11-19T10:00:00.000Z', name: 'Javier Peralta', academy: { clubId: 'esp.sevilla', budgetM: 130, prestige: 79 } });

describe('logros', () => {
  it('los ids son únicos y todos tienen requisitos', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.requires.length).toBeGreaterThan(0);
    for (const tier of ['bronze', 'silver', 'gold', 'legend']) expect(ACHIEVEMENTS.some((a) => a.tier === tier)).toBe(true);
  });

  it('se desbloquean una sola vez y guardan el progreso', () => {
    const g = base();
    g.flags['firstTeamDebut'] = 2026;
    const first = evaluateAchievements(g, C);
    expect(first.map((a) => a.id)).toContain('debut');
    expect(evaluateAchievements(g, C).map((a) => a.id)).not.toContain('debut');
    expect(g.achievements['100-goles']?.progress).toBe(0);
  });
});

describe('retirada y legado', () => {
  it('se retira como muy tarde a los 40 y la carrera no avanza más', () => {
    const g = play(base(), 5 * 27);
    expect(g.retired).toBe(true);
    const lastAge = g.career.seasons.at(-1)!.age;
    expect(lastAge).toBeGreaterThanOrEqual(35);
    expect(lastAge).toBeLessThanOrEqual(40);
    expect(g.career.spells.every((s) => s.toSeason !== undefined)).toBe(true);
    expect(() => advancePhase(g, C)).toThrow();
    expect(g.cinematics?.some((c) => c.type === 'retirement')).toBe(true);
    const card = careerCard(g, C);
    expect(card.seasons).toBe(g.career.seasons.length);
    expect(card.legacyScore).toBeGreaterThan(0);
  });

  it('la retirada voluntaria solo se permite al final de temporada y con 30 años', () => {
    const g = base();
    g.calendar.phase = 'seasonEnd';
    expect(retireNow(g, C).retired).toBe(false); // 15 años
    g.calendar.season = 2042; // 31 años
    expect(retireNow(g, C).retired).toBe(true);
    g.calendar.phase = 'firstHalf';
    expect(retireNow(g, C).retired).toBe(false);
  });

  it('la despedida anunciada retira al año siguiente', () => {
    const g = base();
    g.eventLog.push({ eventId: 'vet-retirada', optionId: 'ultima', season: 2044, phase: 'seasonEnd', age: 33 });
    g.calendar.season = 2044;
    expect(retirementDue(g)).toBe(false);
    g.calendar.season = 2045;
    expect(retirementDue(g)).toBe(true);
  });

  it('más títulos y premios dan más legado', () => {
    const g = base();
    const before = legacyScore(g, C).score;
    g.career.trophies.push({ competitionId: 'uefa.champions', season: 2030, clubId: 'esp.sevilla' });
    g.career.awards.push({ awardId: 'balon-de-oro', season: 2030, rank: 1 });
    const after = legacyScore(g, C);
    expect(after.score).toBe(before + 45 + 100);
  });
});
