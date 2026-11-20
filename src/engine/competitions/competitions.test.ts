import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT as C } from '@/data';
import { createNewGame } from '../world/newGame';
import { initialClubs } from '../season/advance';
import { continentalQualifiers, continentalRun, cupMatchesFor, simulateCup } from './clubCompetitions';
import { chooseNationalTeam, nationalWindow, simulateTournament, tournamentsIn } from './nationalTeam';
import { createNpcStars, seasonAwards } from './awards';

function game(seed = 'comp') {
  const g = createNewGame({ seed, createdAt: '2026-11-19T10:00:00.000Z', name: 'Hugo Domínguez', academy: { clubId: 'esp.real-madrid', budgetM: 1000, prestige: 99 } });
  g.world.clubs = initialClubs(C.world);
  return g;
}

describe('copas nacionales', () => {
  it('cada copa tiene un único campeón y el cuadro cuadra', () => {
    const g = game();
    for (const country of ['ESP', 'ENG', 'ARG', 'BRA']) {
      const cup = simulateCup(g, C.world, country)!;
      expect(cup.rounds.at(-1)!.name).toBe('Final');
      expect(cup.rounds.at(-1)!.ties).toHaveLength(1);
      expect(cup.rounds.at(-1)!.ties[0]!.winner).toBe(cup.winner);
      // Ningún filial.
      expect(cup.rounds.flatMap((r) => r.ties.flatMap((t) => [t.home, t.away])).some((id) => C.world.clubById.get(id)?.parentClubId)).toBe(false);
    }
  });

  it('es determinista y reparte los partidos del club en las dos vueltas', () => {
    const g = game();
    const a = simulateCup(g, C.world, 'ESP')!;
    expect(simulateCup(g, C.world, 'ESP')).toEqual(a);
    const ms = cupMatchesFor(a, a.winner, g);
    expect(ms.some((m) => m.half === 1)).toBe(true);
    expect(ms.at(-1)!.round.startsWith('Final')).toBe(true);
  });
});

describe('competiciones continentales', () => {
  it('clasifica a los primeros de cada liga', () => {
    const q = continentalQualifiers(C.world, initialClubs(C.world), {});
    const count = (c: string) => Object.values(q).filter((x) => x === c).length;
    // ESP, ENG, ITA y GER llevan 4; FRA, 3; POR, NED, TUR y BEL, 2; SCO, 1.
    expect(count('uefa.champions')).toBe(28);
    // ARG 5, BRA 6; URU, COL, CHI, ECU, PAR y PER, 4.
    expect(count('conmebol.libertadores')).toBe(35);
    // JPN, KOR y KSA 3; QAT y UAE 2.
    expect(count('afc.champions-elite')).toBe(13);
    expect(count('concacaf.champions-cup')).toBe(12);
    expect(q['esp.real-madrid']).toBe('uefa.champions');
    expect(q['ger.bayern']).toBe('uefa.champions');
    expect(q['ksa.al-hilal']).toBe('afc.champions-elite');
  });

  it('el recorrido termina en eliminación o en título', () => {
    const g = game();
    g.world.continental = continentalQualifiers(C.world, g.world.clubs, {});
    for (let s = 0; s < 10; s++) {
      g.calendar.season = 2026 + s;
      const run = continentalRun(g, C.world, C.intl, 'esp.real-madrid', 'uefa.champions');
      expect(run.matches.filter((m) => m.round === 'Fase de liga')).toHaveLength(6);
      if (run.champion) expect(run.matches.at(-1)!.round.startsWith('Final')).toBe(true);
    }
  });
});

describe('selecciones', () => {
  it('hay torneo cada verano par a partir de 2028', () => {
    expect(tournamentsIn(C.intl, 2028).map((t) => t.id).sort()).toEqual(['conmebol.copa-america', 'uefa.euro']);
    expect(tournamentsIn(C.intl, 2030).map((t) => t.id)).toEqual(['fifa.world-cup']);
    expect(tournamentsIn(C.intl, 2029)).toEqual([]);
  });

  it('el torneo tiene campeón entre los participantes', () => {
    for (const t of C.intl.tournaments) {
      const out = simulateTournament(C.intl, t, t.firstYear, 'torneo', 'ESP');
      expect(out.participants.length % 4).toBe(0);
      expect(out.participants).toContain(out.champion);
      if (out.result) expect(out.matches.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('con doble nacionalidad hay que elegir antes de la absoluta', () => {
    const g = game('doble');
    g.player.nationalTeam.eligible = ['ESP', 'ARG'];
    for (const k of Object.keys(g.player.attributes) as (keyof typeof g.player.attributes)[]) g.player.attributes[k] = 90;
    g.player.reputation.national = 90;
    g.calendar.season = 2040; // edad absoluta
    expect(nationalWindow(g, C.intl, 1)).toBe('choice');
    const chosen = chooseNationalTeam(g, 'ARG', C.intl);
    expect(chosen.player.nationalTeam.chosen).toBe('ARG');
    const w = nationalWindow(chosen, C.intl, 1);
    expect(w).not.toBe('choice');
    if (w && w !== 'choice') expect(w.country).toBe('ARG');
  });
});

describe('premios', () => {
  it('hay estrellas rivales y un ganador de cada premio', () => {
    const g = game();
    const stars = createNpcStars(C.world, g.world.clubs, C.names, g.seed, 2026);
    expect(stars.length).toBeGreaterThan(20);
    const { winners } = seasonAwards(g, C.world, stars, { goals: 0, assists: 0, rating: 0, apps: 0, trophyBonus: 0 }, new Set());
    expect(winners.filter((w) => w.awardId === 'balon-de-oro')).toHaveLength(1);
    expect(winners.filter((w) => w.awardId === 'top-scorer')).toHaveLength(C.world.leagues.length);
  });

  it('un jugador dominante en una gran liga gana el Balón de Oro', () => {
    const g = game();
    for (const k of Object.keys(g.player.attributes) as (keyof typeof g.player.attributes)[]) g.player.attributes[k] = 94;
    g.player.positions.main = 'DC';
    const stars = createNpcStars(C.world, g.world.clubs, C.names, g.seed, 2026);
    const { playerAwards } = seasonAwards(g, C.world, stars, { goals: 45, assists: 15, rating: 8.4, apps: 36, trophyBonus: 16 }, new Set(['esp.real-madrid']));
    expect(playerAwards.find((a) => a.awardId === 'balon-de-oro')?.rank).toBe(1);
  });
});
