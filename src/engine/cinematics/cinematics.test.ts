import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { createNewGame } from '../world/newGame';
import { advancePhase } from '../season/advance';
import { chooseOption } from '../events/engine';
import { checkAll } from '../events/conditions';
import { respondToOffer } from '../market/offers';
import type { GameState } from '../types/game';
import { dismissCinematic, queueCinematic, selectCelebration } from './cinematics';

function play(g: GameState, phases: number): GameState {
  let out = g;
  for (let i = 0; i < phases; i++) {
    while (out.activeEvent) {
      const ev = C.events.find((e) => e.id === out.activeEvent!.eventId)!;
      out = chooseOption(out, (ev.options.find((o) => checkAll(o.requires, out, C)) ?? ev.options[0]!).id, C);
    }
    out = advancePhase(out, C);
  }
  return out;
}

const base = () => createNewGame({ seed: 'cine', createdAt: '2026-11-19T10:00:00.000Z', name: 'Rubén Toledo', academy: { clubId: 'esp.racing', budgetM: 22, prestige: 56 } });

describe('cinemáticas', () => {
  it('la cola se limita y se vacía en orden', () => {
    const g = base();
    for (let i = 0; i < 10; i++) queueCinematic(g, { type: 'custom', importance: 'minor', value: i });
    expect(g.cinematics).toHaveLength(6);
    expect(g.cinematics![0]!.value).toBe(4);
    expect(dismissCinematic(g).cinematics![0]!.value).toBe(5);
  });

  it('el debut con el primer equipo genera su cinemática una sola vez', () => {
    let g = base();
    g.player.contract!.role = 'titular';
    for (const k of Object.keys(g.player.attributes) as (keyof typeof g.player.attributes)[]) g.player.attributes[k] = 70;
    g = play(g, 1);
    expect(g.cinematics?.some((c) => c.type === 'debut')).toBe(true);
    const after = play({ ...g, cinematics: [] }, 2);
    expect(after.cinematics?.some((c) => c.type === 'debut')).toBe(false);
  });

  it('un fichaje genera la presentación', () => {
    const g = base();
    g.calendar.phase = 'seasonEnd';
    g.offers = [{ id: 'x', kind: 'transfer', clubId: 'esp.valencia', fee: 5_000_000, salary: 900_000, years: 4, role: 'titular', season: 2026, phase: 'seasonEnd' }];
    const out = respondToOffer(g, 'x', true, C.world);
    expect(out.cinematics?.at(-1)).toMatchObject({ type: 'transfer', clubId: 'esp.valencia', importance: 'major' });
  });

  it('solo se puede elegir una celebración desbloqueada', () => {
    const g = base();
    expect(g.player.celebrations.unlocked).toContain('rodillas');
    expect(selectCelebration(g, 'rodillas').player.celebrations.selected).toBe('rodillas');
    expect(selectCelebration(g, 'voltereta').player.celebrations.selected).toBe('puno');
  });
});
