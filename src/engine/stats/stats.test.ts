import { describe, expect, it } from 'vitest';
import type { CompetitionStats, SeasonRecord } from '../types/career';
import { createAttributes } from '../player/defaults';
import { bestSeason, byClub, careerTotals, radarAxes, radarProfile, seasonSeries } from './stats';

function stats(competitionId: string, apps: number, goals: number, assists: number, ratingSum: number): CompetitionStats {
  return { competitionId, apps, starts: apps, minutes: apps * 90, goals, assists, ratingSum, mvp: 0, yellow: 0, red: 0, cleanSheets: 0, keyPasses: 0, dribbles: 0, tackles: 0, saves: 0, hatTricks: 0, maxGoalsInMatch: 0 };
}

function season(year: number, clubId: string, s: CompetitionStats[]): SeasonRecord {
  return { season: year, age: year - 2011, clubId, divisionId: 'x', onLoan: false, overallStart: 60, overallEnd: 62, stats: s, marketValueEnd: 1_000_000 };
}

const seasons = [
  season(2026, 'a', [stats('youth', 20, 10, 2, 140)]),
  season(2027, 'a', [stats('esp.laliga', 10, 2, 1, 65), stats('youth', 10, 5, 0, 70)]),
  season(2028, 'a', [stats('esp.laliga', 30, 12, 6, 210)]),
  season(2029, 'b', [stats('eng.premier-league', 34, 15, 9, 238)]),
];

describe('estadísticas', () => {
  it('los totales de carrera excluyen juveniles', () => {
    const t = careerTotals(seasons);
    expect(t.apps).toBe(74);
    expect(t.goals).toBe(29);
    expect(t.assists).toBe(16);
    expect(t.rating).toBeCloseTo(513 / 74, 2);
  });

  it('agrupa por club las temporadas consecutivas', () => {
    const clubs = byClub(seasons);
    expect(clubs).toHaveLength(2);
    expect(clubs[0]).toMatchObject({ clubId: 'a', from: 2026, to: 2028, seasons: 3 });
    expect(clubs[0]!.totals.goals).toBe(14);
    expect(clubs[1]!.totals.apps).toBe(34);
  });

  it('la serie y la mejor temporada', () => {
    expect(seasonSeries(seasons).map((p) => p.goals)).toEqual([0, 2, 12, 15]);
    expect(bestSeason(seasons, 'goals')?.season).toBe(2029);
  });

  it('el radar promedia cada eje', () => {
    const attrs = createAttributes(50);
    attrs.pace = 90;
    attrs.acceleration = 70;
    expect(radarProfile(attrs, radarAxes('DC'))[0]).toBe(80);
    expect(radarAxes('POR')[0]!.id).toBe('diving');
  });
});
