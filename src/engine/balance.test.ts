/**
 * Prueba de balance: simula carreras completas con perfiles distintos y comprueba que los resultados
 * caen en rangos creíbles. `npm run balance` muestra la tabla completa.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { createNewGame } from './world/newGame';
import { defaultAppearance } from './player/defaults';
import { advancePhase } from './season/advance';
import { chooseOption } from './events/engine';
import { isMinigameEvent, minigameFor, resolveMinigame, simulateMinigame } from './minigames/minigames';
import { checkAll } from './events/conditions';
import { respondToOffer } from './market/offers';
import { Rng } from './rng';
import { careerCard } from './legacy/legacy';
import type { Position } from './types/attributes';
import type { GameState } from './types/game';

const PROFILES: { club: string; pos: Position; style: string; country: string; region: string; city: string }[] = [
  { club: 'esp.real-madrid', pos: 'DC', style: 'goleador-nato', country: 'ESP', region: 'Comunidad de Madrid', city: 'Madrid' },
  { club: 'esp.racing', pos: 'MC', style: 'organizador', country: 'ESP', region: 'Cantabria', city: 'Santander' },
  { club: 'eng.reading', pos: 'DFC', style: 'central-muro', country: 'ENG', region: 'Sudeste de Inglaterra', city: 'Reading' },
  { club: 'eng.chelsea', pos: 'EI', style: 'extremo-regateador', country: 'ENG', region: 'Londres', city: 'Londres' },
  { club: 'arg.newells', pos: 'MCO', style: 'enganche', country: 'ARG', region: 'Santa Fe', city: 'Rosario' },
  { club: 'arg.chacarita', pos: 'POR', style: 'portero-clasico', country: 'ARG', region: 'Buenos Aires', city: 'Villa Maipú' },
  { club: 'bra.santos', pos: 'ED', style: 'extremo-velocista', country: 'BRA', region: 'São Paulo', city: 'Santos' },
  { club: 'bra.bahia', pos: 'LD', style: 'lateral-ofensivo', country: 'BRA', region: 'Bahia', city: 'Salvador' },
];

/** Jugador «razonable»: juega los minijuegos con habilidad media, elige opciones al azar y acepta la mejor oferta si mejora de club. */
function simulate(seed: string, profile: (typeof PROFILES)[number]) {
  let g: GameState = createNewGame({
    seed,
    createdAt: '2026-11-20T10:00:00.000Z',
    name: 'Sim',
    content: { styles: C.styles, traits: C.traits, tendencies: C.tendencies },
    academy: { clubId: profile.club, budgetM: 50, prestige: 70 },
    character: {
      name: 'Sim', birthDay: 3, birthMonth: 3, birthPlace: { country: profile.country, region: profile.region, city: profile.city }, nationalities: [profile.country],
      foot: 'derecho', appearance: defaultAppearance(), mainPosition: profile.pos, secondaryPositions: [], style: profile.style, traits: ['trabajador', 'competitivo'], preferredNumber: 8,
    },
  });
  const rng = Rng.fromSeed(seed + ':choices');
  let decisions = 0;
  let minigames = 0;
  let phases = 0;
  while (!g.retired && phases < 200) {
    while (g.activeEvent) {
      const ev = C.events.find((e) => e.id === g.activeEvent!.eventId)!;
      decisions++;
      if (isMinigameEvent(ev)) {
        g = resolveMinigame(g, simulateMinigame(minigameFor(g, ev), rng, 0.6), C);
        minigames++;
        continue;
      }
      const options = ev.options.filter((o) => checkAll(o.requires, g, C) && !o.effects.some((e) => e.type === 'retire'));
      g = chooseOption(g, rng.pick(options.length ? options : ev.options).id, C);
    }
    if (g.pendingNationalChoice?.length) g = { ...g, player: { ...g.player, nationalTeam: { ...g.player.nationalTeam, chosen: g.pendingNationalChoice[0]! } }, pendingNationalChoice: [] };
    const current = g.world.clubs[g.player.contract?.clubId ?? '']?.prestige ?? 0;
    const ROLE_RANK = { cantera: 0, promesa: 1, rotacion: 2, titular: 3, estrella: 4 } as const;
    const myRole = ROLE_RANK[g.player.contract?.role ?? 'cantera'];
    const best = (g.offers ?? []).filter((o) => o.kind !== 'renewal' && ((g.world.clubs[o.clubId]?.prestige ?? 0) > current + 3 || (myRole <= 2 && ROLE_RANK[o.role] >= 3))).sort((a, b) => (g.world.clubs[b.clubId]?.prestige ?? 0) - (g.world.clubs[a.clubId]?.prestige ?? 0))[0];
    if (best) g = respondToOffer(g, best.id, true, C.world);
    g = advancePhase(g, C);
    phases++;
  }
  const card = careerCard(g, C);
  return { g, card, decisions, minigames, phases, potential: g.player.potential.hidden };
}

const runs = PROFILES.flatMap((p, i) => [0, 1].map((k) => ({ profile: p, ...simulate(`balance-${i}-${k}`, p) })));

describe('balance de carreras completas', () => {
  it('todas las carreras terminan en retirada en un número razonable de fases', () => {
    for (const r of runs) {
      expect(r.g.retired).toBe(true);
      expect(r.phases).toBeLessThanOrEqual(130);
    }
  });

  it('el pico de media se acerca al potencial', () => {
    const gaps = runs.map((r) => r.potential - r.card.peakOverall).sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)]!;
    expect(median).toBeGreaterThanOrEqual(-3);
    expect(median).toBeLessThanOrEqual(10);
  });

  it('hay decisiones suficientes para que una carrera dure 30-60 minutos', () => {
    // ~15 s por decisión, ~25 s por minijuego y ~4 s por fase de lectura.
    for (const r of runs) {
      const minutes = ((r.decisions - r.minigames) * 15 + r.minigames * 25 + r.phases * 4) / 60;
      expect(minutes).toBeGreaterThan(20);
      expect(minutes).toBeLessThan(75);
    }
  });

  it('los premios grandes son escasos', () => {
    const ballonDors = runs.reduce((s, r) => s + r.card.ballonDors, 0);
    expect(ballonDors).toBeLessThan(runs.length * 2);
    const table = runs.map((r) => ({
      perfil: `${r.profile.club} ${r.profile.pos}`,
      pot: r.potential,
      pico: r.card.peakOverall,
      temp: r.card.seasons,
      clubes: r.card.clubs.length,
      paises: [...new Set(r.card.clubs.map((id) => id.slice(0, 3)))].join(" "),
      goles: r.card.goals,
      titulos: r.card.trophies,
      intl: r.card.caps,
      bdo: r.card.ballonDors,
      legado: `${r.card.legacyScore} (${r.card.legacy})`,
      decisiones: r.decisions,
      minijuegos: r.minigames,
    }));
    console.table(table);
  });
});
