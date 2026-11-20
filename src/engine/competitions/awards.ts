/**
 * Estrellas rivales ficticias y premios individuales (Balón de Oro, mejor joven, goleador y mejor
 * jugador de cada liga). Los rivales compiten con el jugador por los premios.
 */
import { Rng } from '../rng';
import type { WorldData } from '../data/world';
import type { ClubId, SeasonYear } from '../types/common';
import type { AwardWinner, GameState, NpcStar } from '../types/game';
import type { Position } from '../types/attributes';
import { overallFor } from '../player/overall';
import { teamLevel } from '../season/league';
import { ageInSeason } from '../world/newGame';
import { namePoolFor, type NamePool } from '../events/context';

/** Escaparate para el Balón de Oro: las grandes ligas europeas pesan más. */
const SHOWCASE: Record<string, number> = { ESP: 4, ENG: 4, ITA: 3, GER: 3, FRA: 2, POR: -3, NED: -3 };
const POSITIONS: Position[] = ['DC', 'DC', 'ED', 'EI', 'MCO', 'MC', 'MC', 'DFC', 'POR', 'LD'];
const GOALS_PER_GAME: Partial<Record<Position, number>> = { DC: 0.55, ED: 0.32, EI: 0.32, MCO: 0.25, MC: 0.12, MCD: 0.05, DFC: 0.05, LD: 0.04, LI: 0.04, POR: 0 };
const ASSISTS_PER_GAME: Partial<Record<Position, number>> = { DC: 0.15, ED: 0.25, EI: 0.25, MCO: 0.3, MC: 0.18, MCD: 0.08, DFC: 0.03, LD: 0.12, LI: 0.12, POR: 0.01 };

/**
 * Crea entre 1 y 3 estrellas en cada club grande de primera división. En las ligas más modestas (MLS,
 * Perú...) los dos clubes más fuertes tienen siempre una, para que haya candidatos a los premios de la liga.
 */
export function createNpcStars(world: WorldData, clubs: GameState['world']['clubs'], names: Record<string, NamePool>, seed: string, season: SeasonYear): NpcStar[] {
  const rng = Rng.fromSeed(`${seed}:npc-stars`);
  const stars: NpcStar[] = [];
  const byDivision = new Map<string, [string, number][]>();
  for (const [id, dyn] of Object.entries(clubs)) {
    if (world.divisionById.get(dyn.divisionId)?.tier !== 1) continue;
    byDivision.set(dyn.divisionId, [...(byDivision.get(dyn.divisionId) ?? []), [id, dyn.prestige]]);
  }
  const leaders = new Set([...byDivision.values()].flatMap((list) => list.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 2).map(([id]) => id)));
  for (const [id, dyn] of Object.entries(clubs)) {
    const club = world.clubById.get(id);
    const tier = world.divisionById.get(dyn.divisionId)?.tier;
    if (!club || tier !== 1 || (dyn.prestige < 70 && !leaders.has(id))) continue;
    const n = dyn.prestige >= 90 ? 3 : dyn.prestige >= 80 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const pool = namePoolFor(names, world, club.country);
      const age = rng.int(19, 31);
      const overall = Math.min(93, Math.round(teamLevel(dyn.prestige) + rng.int(1, 7)));
      stars.push({
        id: `npc-${id}-${i}`,
        name: `${rng.pick(pool.first)} ${rng.pick(pool.last)}`,
        nationality: club.country,
        clubId: id,
        position: rng.pick(POSITIONS),
        birthYear: season - age,
        overall,
        potential: Math.min(95, overall + Math.max(0, 25 - age) + rng.int(0, 3)),
      });
    }
  }
  return stars;
}

/** Evolución anual de las estrellas: crecen hasta los 27 y declinan después; las retiradas se sustituyen. */
export function ageNpcStars(stars: NpcStar[], season: SeasonYear, world: WorldData, clubs: GameState['world']['clubs'], names: Record<string, NamePool>, seed: string): NpcStar[] {
  const rng = Rng.fromSeed(`${seed}:npc-age:${season}`);
  return stars.map((s) => {
    const age = season - s.birthYear;
    if (age >= 35) {
      // Retirada: llega una estrella nueva al mismo club.
      const club = world.clubById.get(s.clubId);
      const pool = namePoolFor(names, world, club?.country);
      const newAge = rng.int(18, 22);
      const overall = Math.round(teamLevel(clubs[s.clubId]?.prestige ?? 75) - rng.int(0, 4));
      return { ...s, id: `${s.id}-${season}`, name: `${rng.pick(pool.first)} ${rng.pick(pool.last)}`, birthYear: season - newAge, overall, potential: Math.min(95, overall + rng.int(4, 10)), last: undefined } as NpcStar;
    }
    const delta = age < 27 ? Math.min(s.potential - s.overall, rng.int(0, 3)) : age < 30 ? rng.int(-1, 1) : -rng.int(1, 3);
    return { ...s, overall: Math.max(60, Math.min(95, s.overall + delta)) };
  });
}

interface Candidate {
  name: string;
  clubId?: ClubId;
  isPlayer: boolean;
  age: number;
  overall: number;
  goals: number;
  assists: number;
  rating: number;
  division?: string;
  bonus: number;
}

export interface PlayerSeasonForAwards {
  goals: number;
  assists: number;
  rating: number;
  apps: number;
  /** Puntos extra por títulos (liga, copa, continental, selección). */
  trophyBonus: number;
}

/**
 * Calcula los premios de la temporada. Devuelve los ganadores y los puestos del jugador.
 * Puntuación ≈ media + nota + goles y asistencias + títulos + prestigio del club.
 */
export function seasonAwards(
  game: GameState,
  world: WorldData,
  stars: NpcStar[],
  player: PlayerSeasonForAwards,
  champions: Set<ClubId>,
): { winners: AwardWinner[]; playerAwards: { awardId: string; rank: number; scope?: string }[]; stars: NpcStar[] } {
  const season = game.calendar.season;
  const rng = Rng.fromSeed(`${game.seed}:awards:${season}`);
  const clubs = game.world.clubs;
  const divisionOf = (id?: ClubId) => (id ? clubs[id]?.divisionId : undefined);

  // Temporada simulada de cada estrella
  const updated = stars.map((s) => {
    const pos = s.position as Position;
    const apps = rng.int(26, 36);
    const quality = 1 + (s.overall - 82) / 20;
    const goals = rng.poisson((GOALS_PER_GAME[pos] ?? 0.1) * apps * quality);
    const assists = rng.poisson((ASSISTS_PER_GAME[pos] ?? 0.1) * apps * quality);
    const rating = Math.round((6.8 + (s.overall - 80) / 18 + rng.normal(0, 0.2)) * 100) / 100;
    return { ...s, last: { goals, assists, rating } };
  });

  const p = game.player;
  const clubId = p.contract?.clubId;
  const prestigeBonus = (id?: ClubId) => ((id ? clubs[id]?.prestige : 0) ?? 0) * 0.08;
  // Escaparate: el Balón de Oro mira sobre todo a las grandes ligas europeas.
  const showcase = (id?: ClubId) => {
    const club = id ? world.clubById.get(id) : undefined;
    const tier = id ? world.divisionById.get(clubs[id]?.divisionId ?? '')?.tier : undefined;
    if (!club || tier !== 1) return -8;
    const conf = world.countryById.get(club.country)?.confederation;
    return SHOWCASE[club.country] ?? (conf === 'UEFA' ? -5 : conf === 'AFC' ? -9 : -7);
  };
  const candidates: Candidate[] = updated.map((s) => ({
    name: s.name,
    clubId: s.clubId,
    isPlayer: false,
    age: season - s.birthYear,
    overall: s.overall,
    goals: s.last!.goals,
    assists: s.last!.assists,
    rating: s.last!.rating,
    division: divisionOf(s.clubId),
    bonus: (champions.has(s.clubId) ? 6 : 0) + prestigeBonus(s.clubId) + rng.normal(0, 2),
  }));
  if (player.apps >= 8) {
    candidates.push({
      name: p.identity.name,
      ...(clubId ? { clubId } : {}),
      isPlayer: true,
      age: ageInSeason(p.identity.birthDate, season),
      overall: overallFor(p.attributes, p.positions.main),
      goals: player.goals,
      assists: player.assists,
      rating: player.rating,
      division: divisionOf(clubId),
      bonus: player.trophyBonus + prestigeBonus(clubId),
    });
  }
  const score = (c: Candidate) => c.overall + (c.rating - 6.5) * 6 + c.goals * 0.35 + c.assists * 0.25 + c.bonus;

  const winners: AwardWinner[] = [];
  const playerAwards: { awardId: string; rank: number; scope?: string }[] = [];
  const award = (awardId: string, list: Candidate[], by: (c: Candidate) => number, scope?: string, podium = 3) => {
    const ranked = [...list].sort((a, b) => by(b) - by(a));
    const top = ranked[0];
    if (!top) return;
    winners.push({ season, awardId, ...(scope ? { scope } : {}), name: top.name, ...(top.clubId ? { clubId: top.clubId } : {}), isPlayer: top.isPlayer });
    const rank = ranked.findIndex((c) => c.isPlayer) + 1;
    if (rank > 0 && rank <= podium) playerAwards.push({ awardId, rank, ...(scope ? { scope } : {}) });
  };

  const worldScore = (c: Candidate) => score(c) + showcase(c.clubId);
  award('balon-de-oro', candidates, worldScore, undefined, 30);
  award('golden-boy', candidates.filter((c) => c.age <= 21), worldScore);
  // Premios de cada primera división
  for (const league of world.leagues) {
    const top = league.divisions.find((d) => d.tier === 1);
    if (!top) continue;
    const inLeague = candidates.filter((c) => c.division === top.id);
    if (!inLeague.length) continue;
    award('top-scorer', inLeague, (c) => c.goals + c.assists * 0.01, top.id, 1);
    award('best-player', inLeague, score, top.id, 1);
    award('best-young', inLeague.filter((c) => c.age <= 21), score, top.id, 1);
  }
  return { winners, playerAwards, stars: updated };
}
