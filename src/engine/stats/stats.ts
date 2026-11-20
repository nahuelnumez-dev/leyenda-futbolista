/**
 * Cálculos para la pantalla de estadísticas y las gráficas. Funciones puras sobre GameState.
 */
import type { AttributeId, Attributes, Position } from '../types/attributes';
import type { ClubId, SeasonYear } from '../types/common';
import type { CompetitionStats, SeasonRecord } from '../types/career';
import type { GameState, MatchLog } from '../types/game';

export interface Totals {
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  /** Media de nota (0 si no hay partidos). */
  rating: number;
  hatTricks: number;
  cleanSheets: number;
  dribbles: number;
  keyPasses: number;
  tackles: number;
  saves: number;
}

const EMPTY: Totals = { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, rating: 0, hatTricks: 0, cleanSheets: 0, dribbles: 0, keyPasses: 0, tackles: 0, saves: 0 };

function sum(stats: CompetitionStats[]): Totals {
  const t = { ...EMPTY };
  let ratingSum = 0;
  for (const s of stats) {
    t.apps += s.apps;
    t.starts += s.starts;
    t.minutes += s.minutes;
    t.goals += s.goals;
    t.assists += s.assists;
    t.hatTricks += s.hatTricks;
    t.cleanSheets += s.cleanSheets;
    t.dribbles += s.dribbles ?? 0;
    t.keyPasses += s.keyPasses ?? 0;
    t.tackles += s.tackles ?? 0;
    t.saves += s.saves ?? 0;
    ratingSum += s.ratingSum;
  }
  t.rating = t.apps ? Math.round((ratingSum / t.apps) * 100) / 100 : 0;
  return t;
}

const isSenior = (s: CompetitionStats) => s.competitionId !== 'youth';

/** Totales de la carrera en el primer equipo (excluye juveniles). */
export function careerTotals(seasons: SeasonRecord[]): Totals {
  return sum(seasons.flatMap((s) => s.stats.filter(isSenior)));
}

/** Totales de una temporada cerrada (solo primer equipo). */
export function seasonTotals(season: SeasonRecord): Totals {
  return sum(season.stats.filter(isSenior));
}

/** Totales de la temporada en curso a partir de los partidos. */
export function currentTotals(matches: MatchLog[], youth = false): Totals {
  const ms = matches.filter((m) => (m.competition === 'youth') === youth && m.minutes > 0);
  const rated = ms.filter((m) => m.rating !== null);
  return {
    apps: ms.length,
    starts: ms.filter((m) => m.started).length,
    minutes: ms.reduce((s, m) => s + m.minutes, 0),
    goals: ms.reduce((s, m) => s + m.goals, 0),
    assists: ms.reduce((s, m) => s + m.assists, 0),
    rating: rated.length ? Math.round((rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length) * 100) / 100 : 0,
    hatTricks: ms.filter((m) => m.goals >= 3).length,
    cleanSheets: ms.filter((m) => m.started && m.ga === 0).length,
    dribbles: ms.reduce((s, m) => s + (m.dribbles ?? 0), 0),
    keyPasses: ms.reduce((s, m) => s + (m.keyPasses ?? 0), 0),
    tackles: ms.reduce((s, m) => s + (m.tackles ?? 0), 0),
    saves: ms.reduce((s, m) => s + (m.saves ?? 0), 0),
  };
}

export interface ClubSummary {
  clubId: ClubId;
  from: SeasonYear;
  to: SeasonYear;
  seasons: number;
  totals: Totals;
}

/** Resumen por club (en orden cronológico), uniendo temporadas consecutivas en el mismo club. */
export function byClub(seasons: SeasonRecord[]): ClubSummary[] {
  const out: ClubSummary[] = [];
  for (const s of seasons) {
    if (!s.clubId) continue;
    const last = out.at(-1);
    if (last && last.clubId === s.clubId) {
      last.to = s.season;
      last.seasons++;
      last.totals = sum(seasonStatsFor(seasons, last));
    } else {
      out.push({ clubId: s.clubId, from: s.season, to: s.season, seasons: 1, totals: seasonTotals(s) });
    }
  }
  return out;
}

function seasonStatsFor(seasons: SeasonRecord[], c: ClubSummary): CompetitionStats[] {
  return seasons.filter((s) => s.clubId === c.clubId && s.season >= c.from && s.season <= c.to).flatMap((s) => s.stats.filter(isSenior));
}

export interface SeasonPoint {
  season: SeasonYear;
  age: number;
  overall: number;
  goals: number;
  assists: number;
  apps: number;
  rating: number;
  value: number;
}

/** Serie temporal de la carrera para las gráficas de evolución. */
export function seasonSeries(seasons: SeasonRecord[]): SeasonPoint[] {
  return seasons.map((s) => {
    const t = seasonTotals(s);
    return { season: s.season, age: s.age, overall: s.overallEnd, goals: t.goals, assists: t.assists, apps: t.apps, rating: t.rating, value: s.marketValueEnd };
  });
}

/** Mejor temporada según una estadística. */
export function bestSeason(seasons: SeasonRecord[], key: 'goals' | 'assists' | 'rating'): SeasonPoint | null {
  const series = seasonSeries(seasons).filter((p) => p.apps >= (key === 'rating' ? 10 : 1));
  return series.reduce<SeasonPoint | null>((best, p) => (!best || p[key] > best[key] ? p : best), null);
}

export interface RadarAxis {
  id: string;
  attributes: AttributeId[];
}

/** Ejes del radar: seis grupos para jugadores de campo y seis para porteros. */
export const OUTFIELD_RADAR: RadarAxis[] = [
  { id: 'pace', attributes: ['pace', 'acceleration'] },
  { id: 'shooting', attributes: ['finishing', 'shooting', 'penalties'] },
  { id: 'passing', attributes: ['shortPassing', 'longPassing', 'vision', 'crossing'] },
  { id: 'dribbling', attributes: ['dribbling', 'ballControl', 'agility'] },
  { id: 'defending', attributes: ['positioning', 'concentration', 'aggression', 'heading'] },
  { id: 'physical', attributes: ['strength', 'stamina', 'jumping'] },
];

export const KEEPER_RADAR: RadarAxis[] = [
  { id: 'diving', attributes: ['diving'] },
  { id: 'reflexes', attributes: ['reflexes'] },
  { id: 'gkPositioning', attributes: ['gkPositioning'] },
  { id: 'rushingOut', attributes: ['rushingOut'] },
  { id: 'kicking', attributes: ['kicking', 'shortPassing'] },
  { id: 'mentality', attributes: ['composure', 'concentration', 'leadership'] },
];

export function radarAxes(position: Position): RadarAxis[] {
  return position === 'POR' ? KEEPER_RADAR : OUTFIELD_RADAR;
}

/** Valor de cada eje (media de sus atributos, 0-99). */
export function radarProfile(attributes: Attributes, axes: RadarAxis[]): number[] {
  return axes.map((a) => Math.round(a.attributes.reduce((s, id) => s + attributes[id], 0) / a.attributes.length));
}

/** Notas de la temporada en curso, partido a partido (solo los jugados en el primer equipo). */
export function ratingTimeline(game: GameState): { md: number; rating: number; goals: number; assists: number; opponentId?: ClubId }[] {
  return (game.current?.matches ?? [])
    .filter((m) => m.competition !== 'youth' && m.rating !== null)
    .map((m) => ({ md: m.md, rating: m.rating!, goals: m.goals, assists: m.assists, ...(m.opponentId ? { opponentId: m.opponentId } : {}) }));
}
