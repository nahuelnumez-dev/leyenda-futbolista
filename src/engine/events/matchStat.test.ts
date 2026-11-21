import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT } from '@/data';
import { EVENTS } from '@/data/events';
import { PLAY_STYLES } from '@/data/playStyles';
import { TRAITS } from '@/data/traits';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from '../player/defaults';
import { advancePhase } from '../season/advance';
import { applyEffects } from './effects';
import { chooseOption } from './engine';
import type { GameState } from '../types/game';

function forward(seed: string): GameState {
  return createNewGame({
    seed, createdAt: '2026-11-21T10:00:00.000Z', name: 'Nico Gol',
    character: {
      name: 'Nico Gol', birthDay: 1, birthMonth: 1, birthPlace: { country: 'ESP', region: 'Andalucía', city: 'Sevilla' }, nationalities: ['ESP'],
      foot: 'derecho', appearance: defaultAppearance(), mainPosition: 'DC', secondaryPositions: [], style: 'goleador-nato', traits: ['trabajador', 'leal'], preferredNumber: 9,
    },
    content: { styles: PLAY_STYLES, traits: TRAITS }, academy: { clubId: 'esp.betis', budgetM: 150 },
  });
}

/** Avanza una fase resolviendo antes las decisiones pendientes con la primera opción. */
function step(g: GameState): GameState {
  let game = g;
  while (game.activeEvent) {
    const ev = ENGINE_CONTENT.events.find((e) => e.id === game.activeEvent!.eventId)!;
    game = chooseOption(game, ev.options[0]!.id, ENGINE_CONTENT);
  }
  return advancePhase(game, ENGINE_CONTENT);
}

describe('estadísticas de los eventos', () => {
  it('hay el doble de decisiones que en la v1.5 (344)', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(688);
  });

  it('un hat-trick narrado suma 3 goles a ese partido y a la temporada', () => {
    let g = step(forward('hat-trick')); // primera vuelta jugada
    const played = g.current!.matches.filter((m) => m.minutes > 0);
    expect(played.length).toBeGreaterThan(0);
    const target = played.at(-1)!;
    const goalsBefore = g.current!.matches.reduce((s, m) => s + m.goals, 0) - target.goals;
    const out: { key: string; value?: number }[] = [];
    applyEffects(g, [{ type: 'matchStat', goals: 3, atLeast: true }, { type: 'matchStat', assists: 1 }], ENGINE_CONTENT, Rng.fromSeed('x'), {}, out as never);
    const after = g.current!.matches.filter((m) => m.minutes > 0).at(-1)!;
    expect(after.goals).toBeGreaterThanOrEqual(3);
    expect(after.assists).toBeGreaterThanOrEqual(1);
    expect(after.gf).toBeGreaterThanOrEqual(after.goals + after.assists);
    expect(out.some((o) => o.key === 'effects.matchStat.goals')).toBe(true);
    // Cierra la temporada: las estadísticas reflejan el hat-trick.
    for (let i = 0; i < 3; i++) g = step(g);
    const season = g.career.seasons.at(-1)!;
    const total = season.stats.reduce((s, c) => s + c.goals, 0);
    expect(total).toBeGreaterThanOrEqual(goalsBefore + 3);
    expect(season.stats.reduce((s, c) => s + c.hatTricks, 0)).toBeGreaterThanOrEqual(1);
  });

  it('si aún no ha jugado, la estadística espera al siguiente partido', () => {
    let g = forward('pendiente');
    g.current = { season: g.calendar.season, overallStart: 50, matches: [] };
    applyEffects(g, [{ type: 'matchStat', saves: 0, goals: 2 }], ENGINE_CONTENT, Rng.fromSeed('x'), {}, [] as never);
    expect(g.pendingMatchStats).toHaveLength(1);
    delete g.current;
    g = step(g);
    expect(g.pendingMatchStats).toBeUndefined();
    expect(g.current!.matches.filter((m) => m.minutes > 0)[0]!.goals).toBeGreaterThanOrEqual(2);
  });
});
