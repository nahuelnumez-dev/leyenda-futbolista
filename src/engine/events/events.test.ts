import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT } from '@/data';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { advancePhase } from '../season/advance';
import type { GameState, Offer } from '../types/game';
import { checkAll } from './conditions';
import { chooseOption, eligibleEvents, queuePhaseEvents } from './engine';
import { fill, templateVars } from './context';
import { generateOffers, respondToOffer } from '../market/offers';

const C = ENGINE_CONTENT;

function base(seed = 'eventos', clubId = 'esp.betis'): GameState {
  return createNewGame({ seed, createdAt: '2026-11-19T10:00:00.000Z', name: 'Iván Garrido', academy: { clubId, budgetM: 150, prestige: 79 } });
}

/** Resuelve todas las decisiones pendientes con la primera opción disponible. */
function resolveAll(g: GameState): GameState {
  let out = g;
  while (out.activeEvent) {
    const ev = C.events.find((e) => e.id === out.activeEvent!.eventId)!;
    const o = ev.options.find((x) => checkAll(x.requires, out, C)) ?? ev.options[0]!;
    out = chooseOption(out, o.id, C);
  }
  return out;
}

describe('motor de eventos', () => {
  it('rellena las variables de los textos', () => {
    const g = base();
    const vars = templateVars(g, C);
    expect(vars.club).toBe('Real Betis');
    expect(vars.rival).toBe('Sevilla');
    expect(fill('Hola {nombre}, bienvenido a {club}', vars)).toBe('Hola Iván, bienvenido a Real Betis');
    // El entrenador es estable dentro de la temporada.
    expect(templateVars(g, C).entrenador).toBe(vars.entrenador);
  });

  it('el primer día en la cantera sale en la primera pretemporada', () => {
    const g = base();
    expect(eligibleEvents(g, C, 'preseason').some((e) => e.id === 'aca-primer-dia')).toBe(true);
  });

  it('elegir una opción aplica efectos, la registra y pasa al siguiente evento', () => {
    const g = base();
    g.activeEvent = { eventId: 'aca-primer-dia', vars: templateVars(g, C) };
    g.eventQueue = [{ eventId: 'aca-estudios', vars: {} }];
    const before = g.player.relations.dressingRoom;
    const next = chooseOption(g, 'confianza', C);
    expect(next.player.relations.dressingRoom).toBe(before + 8);
    expect(next.eventLog.at(-1)).toMatchObject({ eventId: 'aca-primer-dia', optionId: 'confianza' });
    expect(next.lastOutcome?.text).toContain('nombre');
    expect(next.activeEvent?.eventId).toBe('aca-estudios');
    // El original no se modifica.
    expect(g.eventLog).toHaveLength(0);
  });

  it('no se puede avanzar con una decisión pendiente', () => {
    const g = advancePhase(base(), C);
    if (g.activeEvent) expect(() => advancePhase(g, C)).toThrow();
    else expect(g.activeEvent).toBeNull();
  });

  it('los eventos «once» no se repiten', () => {
    let g = base();
    for (let i = 0; i < 25; i++) g = advancePhase(resolveAll(g), C);
    const counts = new Map<string, number>();
    for (const r of g.eventLog) counts.set(r.eventId, (counts.get(r.eventId) ?? 0) + 1);
    for (const ev of C.events.filter((e) => e.once)) expect(counts.get(ev.id) ?? 0).toBeLessThanOrEqual(1);
    expect(g.eventLog.length).toBeGreaterThan(10);
  });

  it('un evento programado aparece en su fase', () => {
    const g = base();
    g.flags['fixing'] = true;
    g.player.contract!.role = 'titular';
    g.scheduledEvents.push({ eventId: 'off-amano-investigacion', season: g.calendar.season, phase: 'preseason' });
    queuePhaseEvents(g, C, Rng.fromSeed('x'));
    const ids = [g.activeEvent?.eventId, ...(g.eventQueue ?? []).map((e) => e.eventId)];
    expect(ids).toContain('off-amano-investigacion');
  });
});

describe('mercado', () => {
  function star(): GameState {
    const g = base('estrella', 'esp.mirandes');
    // Un jugador muy superior a su club recibe ofertas.
    for (const k of Object.keys(g.player.attributes) as (keyof typeof g.player.attributes)[]) g.player.attributes[k] = 80;
    g.player.contract = { clubId: 'esp.mirandes', startSeason: 2026, endSeason: 2029, salary: 300000, role: 'estrella', shirtNumber: 10 };
    g.player.reputation.national = 60;
    g.player.marketValue = 8_000_000;
    g.world.clubs = advancePhase(g, C).world.clubs;
    g.calendar.phase = 'seasonEnd';
    return g;
  }

  it('genera ofertas de clubes que pueden pagarlas', () => {
    const g = star();
    const offers = generateOffers(g, C.world, Rng.fromSeed('o1'), { kind: 'transfer', max: 3 });
    expect(offers.length).toBeGreaterThan(0);
    for (const o of offers) {
      expect(o.clubId).not.toBe('esp.mirandes');
      expect(g.world.clubs[o.clubId]!.budgetM * 1_000_000 * 0.45).toBeGreaterThanOrEqual(g.player.marketValue);
    }
  });

  it('aceptar un traspaso cambia de club y cierra la etapa anterior', () => {
    const g = star();
    const offer: Offer = { id: 'x', kind: 'transfer', clubId: 'esp.sevilla', fee: 9_000_000, salary: 1_500_000, years: 4, role: 'titular', season: 2026, phase: 'seasonEnd' };
    g.offers = [offer];
    const out = respondToOffer(g, 'x', true, C.world);
    expect(out.player.contract?.clubId).toBe('esp.sevilla');
    expect(out.player.contract?.endSeason).toBe(2030);
    expect(out.career.spells.at(-1)).toMatchObject({ clubId: 'esp.sevilla', type: 'permanent', feeIn: 9_000_000, fromSeason: 2027 });
    expect(out.career.records.biggestTransferFee).toBe(9_000_000);
    expect(out.offers).toEqual([]);
  });

  it('una cesión vuelve al club propietario al acabar la temporada', () => {
    let g = base('cesion', 'esp.betis');
    g.player.contract = { clubId: 'esp.betis', startSeason: 2026, endSeason: 2030, salary: 100000, role: 'promesa', shirtNumber: 28 };
    g.calendar.phase = 'winterWindow';
    g.world.clubs = advancePhase(base('cesion'), C).world.clubs;
    g.offers = [{ id: 'l', kind: 'loan', clubId: 'esp.racing', fee: 0, salary: 100000, years: 1, role: 'titular', season: 2026, phase: 'winterWindow' }];
    g = respondToOffer(g, 'l', true, C.world);
    expect(g.player.contract).toMatchObject({ clubId: 'esp.racing', loanFrom: 'esp.betis' });
    g.current = { season: 2026, overallStart: 50, matches: [] };
    // 2.ª vuelta y cierre
    g = advancePhase(resolveAll(g), C);
    g = advancePhase(resolveAll(g), C);
    expect(g.player.contract?.clubId).toBe('esp.betis');
    expect(g.player.contract?.loanFrom).toBeUndefined();
    expect(g.career.spells.some((s) => s.type === 'loan' && s.endReason === 'loanEnd')).toBe(true);
  });
});
