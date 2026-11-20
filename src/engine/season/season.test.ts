import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT, WORLD } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { TRAITS } from '@/data/traits';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from '../player/defaults';
import { overallFor } from '../player/overall';
import { growthRate, marketValue } from '../player/growth';
import type { CharacterInput } from '../player/create';
import type { GameState } from '../types/game';
import { advancePhase as rawAdvance, activeTables, initialClubs, type EngineContent } from './advance';
import { chooseOption } from '../events/engine';
import { checkAll } from '../events/conditions';

/** Avanza una fase resolviendo antes las decisiones pendientes con la primera opción disponible. */
function advancePhase(game: GameState, c: EngineContent): GameState {
  let g = game;
  while (g.activeEvent) {
    const ev = c.events.find((e) => e.id === g.activeEvent!.eventId)!;
    const option = ev.options.find((o) => checkAll(o.requires, g, c)) ?? ev.options[0]!;
    g = chooseOption(g, option.id, c);
  }
  return rawAdvance(g, c);
}
import { roundRobin, simulateScore } from './league';

const content: EngineContent = ENGINE_CONTENT;

const character: CharacterInput = {
  name: 'Mateo Ruiz',
  birthDay: 3,
  birthMonth: 2,
  birthPlace: { country: 'ESP', region: 'Andalucía', city: 'Sevilla' },
  nationalities: ['ESP'],
  foot: 'izquierdo',
  appearance: defaultAppearance(),
  mainPosition: 'MCO',
  secondaryPositions: ['MC'],
  style: 'enganche',
  traits: ['trabajador', 'creativo'],
  preferredNumber: 10,
};

function newCareer(seed: string, clubId = 'esp.betis'): GameState {
  return createNewGame({
    seed,
    createdAt: '2026-11-19T10:00:00.000Z',
    name: character.name,
    character,
    content: { styles: PLAY_STYLES, traits: TRAITS },
    academy: { clubId, budgetM: 150 },
  });
}

/** Avanza `n` temporadas completas (5 fases cada una). */
function playSeasons(game: GameState, n: number): GameState {
  let g = game;
  for (let i = 0; i < n * 5; i++) g = advancePhase(g, content);
  return g;
}

describe('calendario y partidos', () => {
  it('todos contra todos: cada pareja juega una vez por vuelta', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const days = roundRobin(ids, 2);
    expect(days).toHaveLength(10);
    const pairs = new Map<string, number>();
    for (const day of days) for (const [h, a] of day) pairs.set(`${h}-${a}`, (pairs.get(`${h}-${a}`) ?? 0) + 1);
    expect(pairs.size).toBe(30); // 15 parejas × ida y vuelta
    expect([...pairs.values()].every((v) => v === 1)).toBe(true);
  });

  it('con número impar, cada equipo descansa una jornada', () => {
    const days = roundRobin(['a', 'b', 'c', 'd', 'e'], 1);
    expect(days).toHaveLength(5);
    for (const id of ['a', 'b', 'c', 'd', 'e']) expect(days.filter((d) => d.some((m) => m.includes(id)))).toHaveLength(4);
  });

  it('los goles medios son realistas y el mejor equipo gana más', () => {
    const rng = Rng.fromSeed('goles');
    let goals = 0;
    let strongWins = 0;
    let weakWins = 0;
    for (let i = 0; i < 2000; i++) {
      const [h, a] = simulateScore(rng, 75, 75);
      goals += h + a;
      const [s, w] = simulateScore(rng, 85, 65);
      if (s > w) strongWins++;
      if (w > s) weakWins++;
    }
    expect(goals / 2000).toBeGreaterThan(2.2);
    expect(goals / 2000).toBeLessThan(3.2);
    expect(strongWins).toBeGreaterThan(weakWins * 3);
  });
});

describe('temporada', () => {
  it('juega las dos vueltas: cada equipo juega todos sus partidos', () => {
    let g = newCareer('vueltas');
    g = advancePhase(g, content); // 1.ª vuelta
    expect(g.calendar.phase).toBe('firstHalf');
    g = advancePhase(advancePhase(g, content), content); // invierno + 2.ª vuelta
    expect(g.calendar.phase).toBe('secondHalf');
    const laliga = g.world.standings['esp.laliga']!;
    expect(laliga).toHaveLength(20);
    expect(laliga.every((r) => r.played === 38)).toBe(true);
    const totalPoints = laliga.reduce((s, r) => s + r.points, 0);
    const draws = laliga.reduce((s, r) => s + r.drawn, 0) / 2;
    expect(totalPoints).toBe(380 * 3 - draws);
    const pf = g.world.standings['esp.primera-federacion#g1']!;
    expect(pf.every((r) => r.played === 38)).toBe(true);
    expect(g.world.standings['arg.liga-profesional']!.every((r) => r.played === 29)).toBe(true);
  });

  it('es determinista', () => {
    expect(playSeasons(newCareer('det'), 1)).toEqual(playSeasons(newCareer('det'), 1));
  });

  it('los ascensos y descensos mantienen el tamaño de las divisiones', () => {
    const before = activeTables(initialClubs(WORLD));
    const g = playSeasons(newCareer('ascensos'), 3);
    const after = activeTables(g.world.clubs);
    for (const [key, ids] of before) expect(after.get(key)?.length, key).toBe(ids.length);
    // Tres temporadas de historial de todas las tablas.
    expect(g.world.history.length).toBe(before.size * 3);
    // Nunca un filial en la misma división que su primer equipo.
    for (const club of WORLD.clubById.values()) {
      if (!club.parentClubId) continue;
      expect(g.world.clubs[club.id]!.divisionId).not.toBe(g.world.clubs[club.parentClubId]!.divisionId);
    }
  });

  it('el canterano juega en juveniles, crece y sube al primer equipo a los 18', () => {
    let g = newCareer('canterano');
    g = playSeasons(g, 1);
    const s1 = g.career.seasons[0]!;
    expect(s1.age).toBe(15);
    expect(s1.stats.find((s) => s.competitionId === 'youth')?.apps).toBeGreaterThan(10);
    expect(s1.overallEnd).toBeGreaterThan(s1.overallStart);
    expect(g.lastSummary?.season).toBe(2026);
    g = playSeasons(g, 2);
    expect(g.player.contract?.role).not.toBe('cantera');
    expect(g.career.spells.some((s) => s.endReason === 'promotedToFirstTeam')).toBe(true);
  });

  it('una carrera de 20 temporadas tiene una curva creíble', () => {
    const g = playSeasons(newCareer('carrera-larga'), 20);
    const ovr = g.career.seasons.map((s) => s.overallEnd);
    const peak = Math.max(...ovr);
    const peakAge = g.career.seasons[ovr.indexOf(peak)]!.age;
    expect(peak).toBeGreaterThan(g.player.potential.hidden - 12);
    expect(peakAge).toBeGreaterThanOrEqual(22);
    expect(peakAge).toBeLessThanOrEqual(32);
    // Declive al final de la carrera.
    expect(ovr[ovr.length - 1]!).toBeLessThan(peak);
    const goals = g.career.seasons.flatMap((s) => s.stats).filter((s) => s.competitionId !== 'youth').reduce((s, c) => s + c.goals, 0);
    expect(goals).toBeGreaterThan(10);
    expect(overallFor(g.player.attributes, 'MCO')).toBe(ovr[ovr.length - 1]);
  });
});

describe('potencial independiente del club y del país', () => {
  it('con la misma semilla, la media a los 22 años es parecida en clubes de distinto nivel y país', () => {
    const at22 = (clubId: string) => {
      const g = playSeasons(newCareer('mismo-talento', clubId), 8);
      return { pot: g.player.potential.hidden, ovr: g.career.seasons.find((s) => s.age === 22)!.overallEnd };
    };
    const big = at22('esp.barcelona');
    const small = at22('arg.villa-dalmine');
    expect(big.pot).toBe(small.pot);
    expect(Math.abs(big.ovr - small.ovr)).toBeLessThanOrEqual(3);
  });
});

describe('estadísticas de detalle', () => {
  it('los jugadores de campo suman regates y pases clave; los porteros, paradas y porterías a cero', () => {
    const totals = (g: GameState) => g.career.seasons.flatMap((s) => s.stats).filter((s) => s.competitionId !== 'youth');
    const field = totals(playSeasons(newCareer('detalle'), 9));
    const apps = field.reduce((s, c) => s + c.apps, 0);
    expect(apps).toBeGreaterThan(20);
    const dribbles = field.reduce((s, c) => s + c.dribbles, 0) / apps;
    const keyPasses = field.reduce((s, c) => s + c.keyPasses, 0) / apps;
    expect(dribbles).toBeGreaterThan(0.3);
    expect(dribbles).toBeLessThan(4);
    expect(keyPasses).toBeGreaterThan(0.5);
    expect(keyPasses).toBeLessThan(4);
    expect(field.every((c) => c.saves === 0)).toBe(true);

    const keeper = createNewGame({
      seed: 'portero', createdAt: '2026-11-19T10:00:00.000Z', name: 'Iker Portero',
      character: { ...character, mainPosition: 'POR', secondaryPositions: [], style: 'portero-clasico', traits: ['sangre-fria', 'profesional'] },
      content: { styles: PLAY_STYLES, traits: TRAITS }, academy: { clubId: 'esp.betis', budgetM: 150 },
    });
    const gk = totals(playSeasons(keeper, 9));
    const gkApps = gk.reduce((s, c) => s + c.apps, 0);
    expect(gkApps).toBeGreaterThan(10);
    const saves = gk.reduce((s, c) => s + c.saves, 0) / gkApps;
    expect(saves).toBeGreaterThan(1.5);
    expect(saves).toBeLessThan(5);
    expect(gk.reduce((s, c) => s + c.cleanSheets, 0)).toBeGreaterThan(0);
  });
});

describe('evolución y valor', () => {
  it('el ritmo de crecimiento baja con la edad', () => {
    expect(growthRate(16)).toBeGreaterThan(growthRate(23));
    expect(growthRate(30)).toBe(0);
  });

  it('el valor de mercado sube con la media y baja con la edad', () => {
    expect(marketValue(85, 24, 88, 80)).toBeGreaterThan(marketValue(75, 24, 80, 80));
    expect(marketValue(85, 24, 88, 80)).toBeGreaterThan(marketValue(85, 33, 88, 80));
    expect(marketValue(90, 25, 92, 95)).toBeGreaterThan(50_000_000);
  });
});

describe('partidas anteriores a las ligas nuevas', () => {
  it('incorporan los clubes que faltan al empezar la temporada', () => {
    // Simula una partida guardada cuando solo existían España, Inglaterra, Argentina y Brasil.
    let g = playSeasons(newCareer('old-save'), 1);
    const old = ['esp.', 'eng.', 'arg.', 'bra.'];
    g = structuredClone(g);
    for (const id of Object.keys(g.world.clubs)) if (!old.some((p) => id.startsWith(p))) delete g.world.clubs[id];
    g.world.npcStars = g.world.npcStars.filter((s) => old.some((p) => s.clubId.startsWith(p)));
    expect(g.world.clubs['ita.inter']).toBeUndefined();
    expect(g.calendar.phase).toBe('preseason');
    g = advancePhase(g, content);
    expect(Object.keys(g.world.clubs)).toHaveLength(WORLD.clubById.size);
    expect(g.world.clubs['ita.inter']?.divisionId).toBe('ita.serie-a');
    expect(g.world.npcStars.some((s) => s.clubId === 'ger.bayern')).toBe(true);
    expect(g.world.standings['ksa.pro-league']?.length).toBe(18);
    g = playSeasons(g, 1);
    expect(g.world.clubs['jpn.kobe']).toBeDefined();
  });
});
