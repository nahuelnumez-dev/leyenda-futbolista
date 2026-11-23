import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { TRAITS } from '@/data/traits';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from '../player/defaults';
import { advancePhase } from '../season/advance';
import { chooseOption } from '../events/engine';
import type { Position } from '../types/attributes';
import type { GameState } from '../types/game';
import { eventMatchStat, isMinigameEvent, minigameFor, resolveMinigame, simulateMinigame, tierFor } from './minigames';

function newGame(seed: string, pos: Position = 'DC'): GameState {
  return createNewGame({
    seed, createdAt: '2026-11-23T10:00:00.000Z', name: 'Mini Juego',
    character: {
      name: 'Mini Juego', birthDay: 1, birthMonth: 1, birthPlace: { country: 'ESP', region: 'Andalucía', city: 'Sevilla' }, nationalities: ['ESP'],
      foot: 'derecho', appearance: defaultAppearance(), mainPosition: pos, secondaryPositions: [], style: pos === 'POR' ? 'portero-clasico' : 'goleador-nato', traits: ['trabajador', 'leal'], preferredNumber: 9,
    },
    content: { styles: PLAY_STYLES, traits: TRAITS, tendencies: C.tendencies }, academy: { clubId: 'esp.betis', budgetM: 150 },
  });
}

/** Juega varias temporadas resolviendo los minijuegos con un resultado fijo. */
function play(seed: string, successRate: number, phases = 25, pos: Position = 'DC'): GameState {
  let g = newGame(seed, pos);
  for (let i = 0; i < phases && !g.retired; i++) {
    while (g.activeEvent) {
      const ev = C.events.find((e) => e.id === g.activeEvent!.eventId)!;
      if (isMinigameEvent(ev)) {
        const spec = minigameFor(g, ev);
        g = resolveMinigame(g, { successes: Math.round(spec.rounds * successRate) }, C);
      } else g = chooseOption(g, ev.options[0]!.id, C);
    }
    g = advancePhase(g, C);
  }
  return g;
}

describe('minijuegos', () => {
  it('casi todas las situaciones se juegan con minijuegos; las estructurales siguen siendo decisiones', () => {
    const mini = C.events.filter(isMinigameEvent).length;
    expect(mini).toBeGreaterThan(C.events.length * 0.9);
    expect(isMinigameEvent(C.events.find((e) => e.id === 'vet-retirada')!)).toBe(false);
  });

  it('el minijuego respeta la posición y lo que cuenta el evento', () => {
    const gk = newGame('mg-gk', 'POR');
    for (const ev of C.events.filter(isMinigameEvent)) {
      const spec = minigameFor(gk, ev);
      expect(['penalty', 'dribble']).not.toContain(spec.id);
    }
    const fw = newGame('mg-fw', 'DC');
    const goalEvent = C.events.find((e) => isMinigameEvent(e) && eventMatchStat(e)?.goals)!;
    expect(minigameFor(fw, goalEvent).id).toBe('penalty');
  });

  it('los niveles de resultado', () => {
    const spec = { rounds: 5, needed: 3 };
    expect(tierFor(spec, 5)).toBe('great');
    expect(tierFor(spec, 3)).toBe('win');
    expect(tierFor(spec, 2)).toBe('loss');
    expect(tierFor(spec, 1)).toBe('disaster');
  });

  it('mejores atributos hacen el minijuego más fácil', () => {
    const g = newGame('mg-diff');
    const ev = C.events.find((e) => isMinigameEvent(e) && eventMatchStat(e)?.goals)!;
    const easy = structuredClone(g);
    easy.player.attributes.finishing = 95;
    easy.player.attributes.composure = 95;
    expect(minigameFor(easy, ev).difficulty).toBeLessThan(minigameFor(g, ev).difficulty);
  });

  it('ganar suma estadísticas y recompensas; perder penaliza', () => {
    const winner = play('mg-career', 1);
    const loser = play('mg-career', 0);
    const wins = winner.eventLog.filter((e) => e.optionId.startsWith('mg:'));
    expect(wins.length).toBeGreaterThan(10);
    expect(wins.every((e) => e.success)).toBe(true);
    expect(loser.eventLog.filter((e) => e.optionId.startsWith('mg:')).every((e) => !e.success)).toBe(true);
    const rel = (g: GameState) => Object.values(g.player.relations).reduce((s, v) => s + v, 0);
    expect(rel(winner)).toBeGreaterThan(rel(loser));
    expect(winner.player.reputation.local).toBeGreaterThanOrEqual(loser.player.reputation.local);
  });

  it('el resultado queda en el último desenlace y es determinista', () => {
    let g = newGame('mg-outcome');
    for (let i = 0; i < 10 && !(g.activeEvent && isMinigameEvent(C.events.find((e) => e.id === g.activeEvent!.eventId)!)); i++) {
      while (g.activeEvent && !isMinigameEvent(C.events.find((e) => e.id === g.activeEvent!.eventId)!)) g = chooseOption(g, C.events.find((e) => e.id === g.activeEvent!.eventId)!.options[0]!.id, C);
      if (!g.activeEvent) g = advancePhase(g, C);
    }
    expect(g.activeEvent).not.toBeNull();
    const ev = C.events.find((e) => e.id === g.activeEvent!.eventId)!;
    const spec = minigameFor(g, ev);
    const a = resolveMinigame(g, { successes: spec.rounds }, C);
    const b = resolveMinigame(g, { successes: spec.rounds }, C);
    expect(a).toEqual(b);
    expect(a.lastOutcome?.minigame).toMatchObject({ id: spec.id, tier: 'great', successes: spec.rounds });
    expect(a.lastOutcome?.changes.length).toBeGreaterThan(0);
  });

  it('simulateMinigame: más habilidad, más aciertos', () => {
    const spec = minigameFor(newGame('mg-sim'), C.events.find(isMinigameEvent)!);
    const total = (skill: number) => {
      const rng = Rng.fromSeed('sim');
      let s = 0;
      for (let i = 0; i < 200; i++) s += simulateMinigame(spec, rng, skill).successes;
      return s;
    };
    expect(total(0.9)).toBeGreaterThan(total(0.2));
  });
});
