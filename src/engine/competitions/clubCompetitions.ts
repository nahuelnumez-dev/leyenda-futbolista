/**
 * Copas nacionales (eliminatorias a partido único) y competiciones continentales de clubes.
 * Todo es determinista para una semilla y temporada, así que cada vuelta puede recalcular el cuadro.
 */
import { Rng } from '../rng';
import type { WorldData } from '../data/world';
import type { ClubDynamic } from '../types/club';
import type { ClubId, CountryId } from '../types/common';
import type { GameState, StandingRow } from '../types/game';
import { simulateScore, sortTable, tableKey, teamLevel } from '../season/league';
import type { GenericOpponent, InternationalContent, ResolvedMatch } from './types';

/** Copa nacional de un país: la primera de sus copas de tipo 'copa'. */
export function domesticCup(world: WorldData, country: CountryId): string | undefined {
  const league = world.leagues.find((l) => l.country === country);
  return league?.cups?.find((id) => world.competitions.find((c) => c.id === id)?.type === 'copa');
}

const ROUND_NAMES: Record<number, string> = { 2: 'Final', 4: 'Semifinales', 8: 'Cuartos de final', 16: 'Octavos de final', 32: 'Dieciseisavos', 64: 'Treintaidosavos' };

export interface CupTie {
  home: ClubId;
  away: ClubId;
  hg: number;
  ag: number;
  winner: ClubId;
  penalties: boolean;
}

export interface CupRound {
  name: string;
  /** Equipos al empezar la ronda. */
  size: number;
  ties: CupTie[];
}

export interface CupResult {
  competitionId: string;
  rounds: CupRound[];
  winner: ClubId;
}

/** Eliminatoria: si hay empate, penaltis con ligera ventaja para el más fuerte. */
function playTie(rng: Rng, home: ClubId, away: ClubId, clubs: Record<ClubId, ClubDynamic>): CupTie {
  const lh = teamLevel(clubs[home]?.prestige ?? 40);
  const la = teamLevel(clubs[away]?.prestige ?? 40);
  const [hg, ag] = simulateScore(rng, lh, la);
  if (hg !== ag) return { home, away, hg, ag, winner: hg > ag ? home : away, penalties: false };
  const pHome = Math.min(0.7, Math.max(0.3, 0.5 + (lh - la) / 80));
  return { home, away, hg, ag, winner: rng.chance(pHome) ? home : away, penalties: true };
}

/** Simula la copa completa de un país (los filiales no participan). */
export function simulateCup(game: GameState, world: WorldData, country: CountryId): CupResult | null {
  const competitionId = domesticCup(world, country);
  if (!competitionId) return null;
  const clubs = game.world.clubs;
  const rng = Rng.fromSeed(`${game.seed}:cup:${game.calendar.season}:${country}`);
  let alive = Object.keys(clubs)
    .filter((id) => world.clubById.get(id)?.country === country && !world.clubById.get(id)?.parentClubId)
    .sort();
  const rounds: CupRound[] = [];
  // Ronda previa para dejar una potencia de 2: juegan los más modestos.
  const target = 2 ** Math.floor(Math.log2(alive.length));
  if (alive.length > target) {
    const byPrestige = [...alive].sort((a, b) => (clubs[a]!.prestige - clubs[b]!.prestige) || a.localeCompare(b));
    const extra = alive.length - target;
    const playing = rng.shuffle(byPrestige.slice(0, extra * 2));
    const ties: CupTie[] = [];
    for (let i = 0; i < playing.length; i += 2) ties.push(playTie(rng, playing[i]!, playing[i + 1]!, clubs));
    rounds.push({ name: 'Ronda previa', size: playing.length, ties });
    const losers = new Set(ties.map((t) => (t.winner === t.home ? t.away : t.home)));
    alive = alive.filter((id) => !losers.has(id));
  }
  while (alive.length > 1) {
    const order = rng.shuffle(alive);
    const ties: CupTie[] = [];
    for (let i = 0; i < order.length; i += 2) {
      const a = order[i]!;
      const b = order[i + 1]!;
      // Juega en casa el de menor prestigio (como en muchas copas).
      const [home, away] = (clubs[a]!.prestige <= clubs[b]!.prestige ? [a, b] : [b, a]) as [ClubId, ClubId];
      ties.push(playTie(rng, home, away, clubs));
    }
    rounds.push({ name: ROUND_NAMES[alive.length] ?? `Ronda de ${alive.length}`, size: alive.length, ties });
    alive = ties.map((t) => t.winner);
  }
  return { competitionId, rounds, winner: alive[0]! };
}

/** Partidos de un club en la copa: hasta octavos en la 1.ª vuelta; de cuartos en adelante, en la 2.ª. */
export function cupMatchesFor(cup: CupResult, clubId: ClubId, game: GameState): ResolvedMatch[] {
  const out: ResolvedMatch[] = [];
  for (const r of cup.rounds) {
    const tie = r.ties.find((t) => t.home === clubId || t.away === clubId);
    if (!tie) continue;
    const home = tie.home === clubId;
    const opp = home ? tie.away : tie.home;
    out.push({
      round: r.name + (tie.penalties ? ' (pen.)' : ''),
      half: r.size > 8 ? 1 : 2,
      opponentId: opp,
      home,
      gf: home ? tie.hg : tie.ag,
      ga: home ? tie.ag : tie.hg,
      opponentLevel: teamLevel(game.world.clubs[opp]?.prestige ?? 40),
    });
  }
  return out;
}

/** Ronda alcanzada por un club ('Campeón' si ganó). */
export function cupRoundReached(cup: CupResult, clubId: ClubId): string | undefined {
  if (cup.winner === clubId) return 'Campeón';
  let last: string | undefined;
  for (const r of cup.rounds) if (r.ties.some((t) => t.home === clubId || t.away === clubId)) last = r.name;
  return last;
}

/* ── Competiciones continentales ───────────────────────── */

/**
 * Clasificados para la próxima temporada según las tablas finales de primera división.
 * Sin tablas (primera temporada), se usa el orden de prestigio.
 */
export function continentalQualifiers(world: WorldData, clubs: Record<ClubId, ClubDynamic>, standings: Record<string, StandingRow[]>): Record<ClubId, string> {
  const out: Record<ClubId, string> = {};
  for (const league of world.leagues) {
    const top = league.divisions.find((d) => d.tier === 1);
    const rules = league.continental;
    if (!top || !rules?.length) continue;
    const rows = standings[tableKey(top.id)];
    const order = rows?.length
      ? sortTable(rows).map((r) => r.clubId)
      : Object.entries(clubs)
          .filter(([, d]) => d.divisionId === top.id)
          .sort((a, b) => b[1].prestige - a[1].prestige)
          .map(([id]) => id);
    for (const r of rules) for (const id of order.slice(r.from - 1, r.to)) out[id] = r.competitionId;
  }
  return out;
}

const STAGES_UEFA = [
  { name: 'Octavos de final', range: [80, 86] },
  { name: 'Cuartos de final', range: [82, 88] },
  { name: 'Semifinales', range: [84, 89] },
  { name: 'Final', range: [85, 90] },
] as const;

type ContinentalZone = 'uefa' | 'conmebol' | 'afc' | 'concacaf';

/** Nivel relativo de cada competición (las menores tienen rivales más flojos). */
const COMPETITION_SHIFT: Record<string, number> = {
  'uefa.champions': 0, 'uefa.europa': -4, 'uefa.conference': -7,
  'conmebol.libertadores': 0, 'conmebol.sudamericana': -4,
  'afc.champions-elite': 0, 'afc.champions-two': -5,
  'concacaf.champions-cup': 0,
};
/** Las eliminatorias de cada confederación, respecto a la escala de la Champions. */
const ZONE_SHIFT: Record<ContinentalZone, number> = { uefa: 0, conmebol: -9, afc: -13, concacaf: -12 };

export function zoneOf(competitionId: string): ContinentalZone | undefined {
  const z = competitionId.split('.')[0];
  return z === 'uefa' || z === 'conmebol' || z === 'afc' || z === 'concacaf' ? z : undefined;
}

export interface ContinentalRun {
  competitionId: string;
  matches: ResolvedMatch[];
  /** Última ronda jugada o 'Campeón'. */
  reached: string;
  champion: boolean;
}

/**
 * Recorrido del club del jugador: fase de liga (6 partidos, 1.ª vuelta) y eliminatorias (2.ª vuelta).
 * Los rivales salen de los clasificados del juego y de rivales genéricos de otras ligas.
 */
export function continentalRun(game: GameState, _world: WorldData, intl: InternationalContent, clubId: ClubId, competitionId: string): ContinentalRun {
  const rng = Rng.fromSeed(`${game.seed}:continental:${game.calendar.season}:${competitionId}:${clubId}`);
  const clubs = game.world.clubs;
  const zone = zoneOf(competitionId) ?? 'uefa';
  const tierShift = COMPETITION_SHIFT[competitionId] ?? -7;
  const myLevel = teamLevel(clubs[clubId]?.prestige ?? 50);
  const genericBase = zone === 'conmebol' ? intl.conmebolOpponents : zone === 'afc' ? intl.afcOpponents : zone === 'concacaf' ? intl.concacafOpponents : intl.uefaOpponents;
  const generic: GenericOpponent[] = genericBase.map((o) => ({ ...o, strength: o.strength + tierShift }));
  const qualified = Object.entries(game.world.continental ?? {})
    .filter(([id, c]) => c === competitionId && id !== clubId)
    .map(([id]) => ({ id, strength: teamLevel(clubs[id]?.prestige ?? 50) }));

  type Opp = { id?: string; label?: string; strength: number };
  const pool: Opp[] = [...qualified.map((q) => ({ id: q.id, strength: q.strength })), ...generic.map((g) => ({ label: g.label, strength: g.strength }))];
  const matches: ResolvedMatch[] = [];
  const play = (round: string, half: 1 | 2, opp: Opp, home: boolean, knockout: boolean): boolean => {
    const [a, b] = simulateScore(rng, home ? myLevel : opp.strength, home ? opp.strength : myLevel);
    const gf = home ? a : b;
    const ga = home ? b : a;
    let won = gf > ga;
    let label = round;
    if (knockout && gf === ga) {
      won = rng.chance(Math.min(0.7, Math.max(0.3, 0.5 + (myLevel - opp.strength) / 80)));
      label = `${round} (pen.)`;
    }
    matches.push({ round: label, half, ...(opp.id ? { opponentId: opp.id } : { opponentName: opp.label! }), home, gf, ga, opponentLevel: opp.strength });
    return knockout ? won : gf > ga;
  };

  // Fase de liga: 6 rivales distintos, 3 en casa y 3 fuera.
  let points = 0;
  const leagueOpps = rng.shuffle(pool).slice(0, 6);
  leagueOpps.forEach((opp, i) => {
    const before = matches.length;
    play('Fase de liga', 1, opp, i % 2 === 0, false);
    const m = matches[before]!;
    points += m.gf > m.ga ? 3 : m.gf === m.ga ? 1 : 0;
  });
  if (points < 7) return { competitionId, matches, reached: 'Fase de liga', champion: false };
  let reached = 'Fase de liga';
  if (points < 11) {
    reached = 'Playoff';
    const opp = rng.pick(pool.filter((o) => !leagueOpps.includes(o))) ?? rng.pick(pool);
    if (!play('Playoff', 2, opp, true, true)) return { competitionId, matches, reached, champion: false };
  }
  const shift = ZONE_SHIFT[zone];
  for (const stage of STAGES_UEFA) {
    reached = stage.name;
    const strength = rng.int(stage.range[0] + shift + tierShift, stage.range[1] + shift + tierShift);
    // Rival: un clasificado del juego de nivel parecido o uno genérico.
    const near = pool.filter((o) => Math.abs(o.strength - strength) <= 4);
    const opp = near.length ? rng.pick(near) : { label: rng.pick(generic).label, strength };
    if (!play(stage.name, 2, opp, stage.name === 'Final' ? false : rng.chance(0.5), true)) return { competitionId, matches, reached, champion: false };
  }
  return { competitionId, matches, reached: 'Campeón', champion: true };
}
