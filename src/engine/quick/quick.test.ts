import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { careerCard } from '../legacy/legacy';
import { advanceQuick, createQuickGame, decideQuickMarket, moveOffers, playQuickSeason, recommendedOffer } from './quick';
import type { GameState } from '../types/game';
import type { Position } from '../types/attributes';

function career(seed: string, position: Position, clubId: string): { g: GameState; seasons: number } {
  let g = createQuickGame({ seed, createdAt: '2026-11-24T10:00:00.000Z', name: 'Rápido', position, clubId }, C);
  let seasons = 0;
  while (!g.retired && seasons < 40) {
    g = playQuickSeason(g, C);
    seasons++;
  }
  return { g, seasons };
}

const PROFILES: [Position, string][] = [
  ['DC', 'esp.real-madrid'],
  ['MC', 'esp.racing'],
  ['DFC', 'eng.reading'],
  ['POR', 'arg.chacarita'],
  ['ED', 'bra.santos'],
  ['MCO', 'arg.newells'],
];
const runs = PROFILES.map(([pos, club], i) => ({ pos, club, ...career(`quick-${i}`, pos, club) }));

describe('modo rápido', () => {
  it('cada temporada avanza sola, sin decisiones pendientes, hasta la retirada', () => {
    for (const r of runs) {
      expect(r.g.retired).toBe(true);
      expect(r.seasons).toBeGreaterThan(12);
      expect(r.seasons).toBeLessThanOrEqual(30);
      expect(r.g.activeEvent).toBeNull();
      expect(r.g.eventLog).toHaveLength(0);
    }
  });

  it('guarda una ficha por temporada con estadísticas, equipo y clasificación', () => {
    for (const r of runs) {
      const log = r.g.quickLog ?? [];
      expect(log.length).toBe(r.g.career.seasons.length);
      const pro = log.filter((s) => s.table.length > 0);
      expect(pro.length).toBeGreaterThan(5);
      for (const s of pro) {
        expect(s.table.some((row) => row.clubId === s.clubId)).toBe(true);
        expect(s.coach.length).toBeGreaterThan(3);
      }
      expect(log.reduce((a, s) => a + s.apps, 0)).toBeGreaterThan(200);
    }
    // Los fichajes quedan apuntados en la temporada en que se firmaron.
    const moves = runs.flatMap((r) => (r.g.quickLog ?? []).flatMap((s) => s.moves));
    expect(moves.length).toBeGreaterThan(runs.length);
  });

  it('las carreras son creíbles', () => {
    const table = runs.map((r) => {
      const card = careerCard(r.g, C);
      return { perfil: `${r.club} ${r.pos}`, temp: r.seasons, pico: card.peakOverall, clubes: card.clubs.length, goles: card.goals, titulos: card.trophies, intl: card.caps, legado: card.legacy };
    });
    console.table(table);
    const peaks = table.map((t) => t.pico).sort((a, b) => a - b);
    expect(peaks[Math.floor(peaks.length / 2)]).toBeGreaterThan(72);
  });

  it('en modo manual se detiene en el mercado y deja elegir', () => {
    let g = createQuickGame({ seed: 'quick-manual', createdAt: '2026-11-24T10:00:00.000Z', name: 'Manual', position: 'DC', clubId: 'esp.real-madrid' }, C);
    let stops = 0;
    let moved = 0;
    for (let i = 0; i < 200 && !g.retired; i++) {
      g = advanceQuick(g, C, 'manual');
      if (g.quickMarket) {
        stops++;
        const offers = moveOffers(g);
        expect(offers.length).toBeGreaterThan(0);
        // Alterna: unas veces se queda, otras ficha por la última oferta (no la recomendada).
        const pick = stops % 2 ? offers.at(-1)! : undefined;
        const before = g.player.contract!.clubId;
        g = decideQuickMarket(g, pick?.id ?? null, C);
        expect(g.quickMarket).toBeUndefined();
        expect(moveOffers(g)).toHaveLength(0);
        if (pick) {
          moved++;
          expect(g.player.contract!.clubId).not.toBe(before);
        } else expect(g.player.contract!.clubId).toBe(before);
      }
    }
    expect(g.retired).toBe(true);
    expect(stops).toBeGreaterThan(2);
    const logged = (g.quickLog ?? []).flatMap((s) => s.moves);
    expect(logged.length).toBe(moved);
    expect(recommendedOffer(g)).toBeUndefined();
  });

  it('apunta los logros de cada temporada', () => {
    const all = runs.flatMap((r) => (r.g.quickLog ?? []).flatMap((s) => s.achievements));
    expect(all.length).toBeGreaterThan(runs.length * 3);
  });

  it('es determinista', () => {
    const a = career('quick-det', 'DC', 'esp.betis');
    const b = career('quick-det', 'DC', 'esp.betis');
    expect(a.g.quickLog).toEqual(b.g.quickLog);
  });
});
