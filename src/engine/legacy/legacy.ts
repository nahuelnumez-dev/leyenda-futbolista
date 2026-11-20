/**
 * Legado: logros, retirada, puntuación de legado y ficha resumen de la carrera (para el Salón de la Fama).
 */
import type { AchievementDef } from '../types/definitions';
import type { Tier } from '../types/common';
import type { GameState } from '../types/game';
import { checkAll, careerMetric, trophyKind } from '../events/conditions';
import type { EventContent } from '../events/context';
import { queueCinematic } from '../cinematics/cinematics';
import { ageInSeason } from '../world/newGame';
import { overallFor } from '../player/overall';
import { Rng } from '../rng';

export interface LegacyContent extends EventContent {
  achievements: AchievementDef[];
  tierPoints: Record<Tier, number>;
}

/** Edad a la que se retira sí o sí. */
export const MAX_AGE = 40;
/** Edad mínima para retirarse por decisión propia. */
export const MIN_RETIRE_AGE = 30;

/** Comprueba los logros y devuelve los recién desbloqueados (además de actualizar su progreso). */
export function evaluateAchievements(game: GameState, content: LegacyContent): AchievementDef[] {
  const unlocked: AchievementDef[] = [];
  for (const def of content.achievements) {
    const state = game.achievements[def.id];
    if (state?.unlocked) continue;
    if (checkAll(def.requires, game, content)) {
      game.achievements[def.id] = { unlocked: true, tier: def.tier, unlockedSeason: game.calendar.season, progress: 1 };
      unlocked.push(def);
      game.inbox.unshift({
        id: 'ach-' + def.id,
        season: game.calendar.season,
        phase: game.calendar.phase,
        source: 'system',
        headline: 'Logro desbloqueado: ' + def.name.es,
        tone: 'positive',
      });
      if (def.tier === 'gold' || def.tier === 'legend') queueCinematic(game, { type: 'achievement', importance: def.tier === 'legend' ? 'major' : 'minor', template: def.id });
    } else if (def.progress) {
      const value = careerMetric(game, def.progress.metric);
      game.achievements[def.id] = { unlocked: false, progress: Math.min(0.99, value / def.progress.target) };
    }
  }
  game.inbox = game.inbox.slice(0, 40);
  return unlocked;
}

export type LegacyRank = 'world-legend' | 'icon' | 'star' | 'great' | 'club' | 'journeyman';

export interface LegacyBreakdown {
  score: number;
  rank: LegacyRank;
  parts: { key: string; points: number }[];
}

const TROPHY_POINTS = (id: string, kind: string, tier: number | undefined): number => {
  if (id.includes('world-cup')) return 90;
  if (kind === 'national') return 55;
  if (id === 'uefa.champions' || id === 'conmebol.libertadores') return 45;
  if (id === 'afc.champions-elite' || id === 'concacaf.champions-cup') return 30;
  if (kind === 'continental') return 20;
  if (kind === 'league') return tier === 1 ? 25 : 8;
  return 12;
};

/** Puntuación de legado: rendimiento, títulos, premios, selección, pico de nivel y logros. */
export function legacyScore(game: GameState, content: LegacyContent): LegacyBreakdown {
  const goals = careerMetric(game, 'goals');
  const assists = careerMetric(game, 'assists');
  const apps = careerMetric(game, 'apps');
  const nt = game.career.nationalTeam;
  const trophies = game.career.trophies.reduce((sum, tr) => {
    const kind = trophyKind(tr.competitionId, content, Boolean(tr.nationalTeam));
    return sum + TROPHY_POINTS(tr.competitionId, kind, content.world.divisionById.get(tr.competitionId)?.tier);
  }, 0);
  const awards = game.career.awards.reduce((sum, a) => {
    if (a.awardId === 'balon-de-oro') return sum + (a.rank === 1 ? 100 : a.rank <= 3 ? 30 : a.rank <= 10 ? 10 : 2);
    if (a.awardId === 'golden-boy') return sum + 20;
    return sum + (a.rank === 1 ? 10 : 0);
  }, 0);
  const achievements = Object.values(game.achievements).reduce((s, st) => s + (st.unlocked && st.tier ? content.tierPoints[st.tier] : 0), 0);
  const peak = Math.max(0, game.career.records.peakOverall - 70) * 4;
  const parts = [
    { key: 'goals', points: Math.round(goals * 1.2 + assists * 0.8) },
    { key: 'apps', points: Math.round(apps * 0.15) },
    { key: 'trophies', points: trophies },
    { key: 'awards', points: awards },
    { key: 'national', points: Math.round(nt.caps * 0.6 + nt.goals) },
    { key: 'peak', points: peak },
    { key: 'achievements', points: achievements },
  ];
  const score = parts.reduce((s, p) => s + p.points, 0);
  const rank: LegacyRank = score >= 1600 ? 'world-legend' : score >= 1000 ? 'icon' : score >= 600 ? 'star' : score >= 320 ? 'great' : score >= 140 ? 'club' : 'journeyman';
  return { score, rank, parts };
}

/** ¿Toca retirarse al cerrar esta temporada? */
export function retirementDue(game: GameState): boolean {
  const age = ageInSeason(game.player.identity.birthDate, game.calendar.season);
  if (age + 1 > MAX_AGE) return true;
  if (game.flags['retireRequested']) return true;
  // Temporada de despedida anunciada en una temporada anterior.
  const farewell = game.eventLog.find((e) => e.eventId === 'vet-retirada' && e.optionId === 'ultima');
  if (farewell && farewell.season < game.calendar.season) return true;
  // Retirada natural: a partir de los 36 el cuerpo empieza a decir basta, antes si el nivel ha caído mucho.
  if (age >= 36) {
    const drop = Math.max(0, game.career.records.peakOverall - overallFor(game.player.attributes, game.player.positions.main) - 5);
    const p = Math.min(0.9, (age - 35) * 0.25 + drop * 0.05);
    if (Rng.fromSeed(`${game.seed}:retire:${game.calendar.season}`).chance(p)) {
      game.flags['naturalRetirement'] = true;
      return true;
    }
  }
  return false;
}

/** Retira al jugador (modifica la partida que recibe). */
export function retire(game: GameState, content: LegacyContent): void {
  if (game.retired) return;
  game.retired = true;
  game.flags['retired'] = true;
  game.flags['retiredSeason'] = game.calendar.season;
  for (const s of game.career.spells) {
    if (s.toSeason === undefined) {
      s.toSeason = game.calendar.season;
      s.endReason = 'retired';
    }
  }
  game.offers = [];
  game.activeEvent = null;
  game.eventQueue = [];
  evaluateAchievements(game, content);
  queueCinematic(game, { type: 'retirement', importance: 'major', ...(game.player.contract ? { clubId: game.player.contract.clubId } : {}), value: game.career.seasons.length });
}

/** Retirada por decisión propia al final de una temporada. Devuelve una copia nueva. */
export function retireNow(input: GameState, content: LegacyContent): GameState {
  const game = structuredClone(input);
  const age = ageInSeason(game.player.identity.birthDate, game.calendar.season);
  if (game.calendar.phase !== 'seasonEnd' || age < MIN_RETIRE_AGE) return game;
  retire(game, content);
  return game;
}

/** Ficha compacta de una carrera terminada (el Salón de la Fama guarda esto). */
export interface CareerCard {
  gameId: string;
  name: string;
  nickname?: string;
  nationality: string;
  position: string;
  retiredSeason: number;
  retiredAge: number;
  seasons: number;
  peakOverall: number;
  clubs: string[];
  apps: number;
  goals: number;
  assists: number;
  caps: number;
  trophies: number;
  awards: number;
  ballonDors: number;
  legacy: LegacyRank;
  legacyScore: number;
}

export function careerCard(game: GameState, content: LegacyContent): CareerCard {
  const { score, rank } = legacyScore(game, content);
  const clubs: string[] = [];
  for (const s of game.career.spells) if (s.type !== 'academy' || !clubs.length) if (!clubs.includes(s.clubId)) clubs.push(s.clubId);
  return {
    gameId: game.id,
    name: game.player.identity.name,
    ...(game.player.identity.nickname ? { nickname: game.player.identity.nickname } : {}),
    nationality: game.player.nationalTeam.chosen ?? game.player.identity.nationalities[0] ?? '',
    position: game.player.positions.main,
    retiredSeason: game.calendar.season,
    retiredAge: ageInSeason(game.player.identity.birthDate, game.calendar.season),
    seasons: game.career.seasons.length,
    peakOverall: Math.max(game.career.records.peakOverall, overallFor(game.player.attributes, game.player.positions.main)),
    clubs,
    apps: careerMetric(game, 'apps'),
    goals: careerMetric(game, 'goals'),
    assists: careerMetric(game, 'assists'),
    caps: game.career.nationalTeam.caps,
    trophies: game.career.trophies.length,
    awards: game.career.awards.filter((a) => a.rank === 1).length,
    ballonDors: game.career.awards.filter((a) => a.awardId === 'balon-de-oro' && a.rank === 1).length,
    legacy: rank,
    legacyScore: score,
  };
}
