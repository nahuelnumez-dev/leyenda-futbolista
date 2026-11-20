/**
 * Selección nacional: categoría (sub-17, sub-20, sub-21, absoluta), convocatorias en cada vuelta y
 * torneos de verano (Mundial, Eurocopa, Copa América) simulados con grupos y eliminatorias.
 */
import { Rng } from '../rng';
import type { CountryId, SeasonYear } from '../types/common';
import type { GameState } from '../types/game';
import { overallFor } from '../player/overall';
import { simulateScore } from '../season/league';
import { ageInSeason } from '../world/newGame';
import type { InternationalContent, NationalTeamDef, ResolvedMatch, TournamentDef } from './types';

export type NtCategory = 'sub17' | 'sub20' | 'sub21' | 'absoluta';

const DEFAULT_STRENGTH = 70;

export function teamOf(intl: InternationalContent, country: CountryId | undefined): NationalTeamDef | undefined {
  return intl.nationalTeams.find((t) => t.id === country);
}

/** País por el que juega (elegido o el único posible). */
export function playerCountry(game: GameState): CountryId | undefined {
  const nt = game.player.nationalTeam;
  return nt.chosen ?? (nt.eligible.length === 1 ? nt.eligible[0] : undefined);
}

/** Nivel exigido para cada categoría respecto a la fuerza de la selección absoluta. */
function categoryFor(age: number): { category: NtCategory; gap: number }[] {
  const out: { category: NtCategory; gap: number }[] = [{ category: 'absoluta', gap: 9 }];
  if (age <= 21) out.push({ category: 'sub21', gap: 16 });
  if (age <= 19) out.push({ category: 'sub20', gap: 22 });
  if (age <= 16) out.push({ category: 'sub17', gap: 30 });
  return out;
}

export interface NtWindow {
  country: CountryId;
  category: NtCategory;
  matches: ResolvedMatch[];
  /** Nivel del equipo en esa categoría. */
  level: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

/**
 * Ventana internacional tras cada vuelta: ¿le convocan y para qué categoría?
 * Si puede jugar con varias selecciones y aún no ha elegido, devuelve 'choice' en vez de convocarle a la absoluta.
 */
export function nationalWindow(game: GameState, intl: InternationalContent, half: 1 | 2): NtWindow | 'choice' | null {
  const p = game.player;
  const age = ageInSeason(p.identity.birthDate, game.calendar.season);
  const ovr = overallFor(p.attributes, p.positions.main);
  const rng = Rng.fromSeed(`${game.seed}:nt:${game.calendar.season}:${half}`);
  const eligible = p.nationalTeam.eligible.length ? p.nationalTeam.eligible : p.identity.nationalities;
  // Mientras no elija, en categorías inferiores juega con su primera nacionalidad.
  const country = playerCountry(game) ?? eligible[0];
  if (!country) return null;
  const team = teamOf(intl, country);
  const strength = team?.strength ?? DEFAULT_STRENGTH;

  for (const { category, gap } of categoryFor(age)) {
    // Retirado de la selección absoluta por decisión propia.
    if (category === 'absoluta' && game.flags['ntRetired']) continue;
    const level = strength - gap;
    const p0 = sigmoid((ovr - level) / 2.5 + (p.reputation.national - 40) / 40 + (p.status.form - 60) / 40 + (p.status.injury ? -5 : 0));
    if (!rng.chance(p0)) continue;
    if (category === 'absoluta' && !p.nationalTeam.chosen && eligible.length > 1) return 'choice';
    // Dos partidos por ventana (amistosos o clasificación) contra rivales algo más flojos.
    const matches: ResolvedMatch[] = [0, 1].map((i) => {
      const oppLevel = level - rng.int(0, 10);
      const home = i === 0;
      const [a, b] = simulateScore(rng, home ? level : oppLevel, home ? oppLevel : level);
      const rival = rng.pick(intl.nationalTeams.filter((t) => t.id !== country));
      return { round: category === 'absoluta' ? 'Amistoso / clasificación' : categoryLabel(category), half, opponentName: rival.name.es, home, gf: home ? a : b, ga: home ? b : a, opponentLevel: oppLevel };
    });
    return { country, category, matches, level };
  }
  return null;
}

export function categoryLabel(c: NtCategory): string {
  return c === 'absoluta' ? 'Absoluta' : c === 'sub21' ? 'Sub-21' : c === 'sub20' ? 'Sub-20' : 'Sub-17';
}

/* ── Torneos de verano ─────────────────────────────────── */

/** Torneos que se juegan en el verano de `year`. */
export function tournamentsIn(intl: InternationalContent, year: number): TournamentDef[] {
  return intl.tournaments.filter((t) => year >= t.firstYear && (year - t.firstYear) % t.every === 0);
}

export interface TournamentOutcome {
  tournament: TournamentDef;
  year: number;
  participants: CountryId[];
  champion: CountryId;
  /** Resultado del país del jugador ('Campeón', 'Final', 'Semifinales'...) o null si no participó. */
  result: string | null;
  /** Partidos del país del jugador. */
  matches: ResolvedMatch[];
}

const KO_NAMES: Record<number, string> = { 16: 'Octavos de final', 8: 'Cuartos de final', 4: 'Semifinales', 2: 'Final' };

/** Simula un torneo: clasificación por fuerza con algo de azar, grupos de 4 y eliminatorias. */
export function simulateTournament(intl: InternationalContent, t: TournamentDef, year: SeasonYear, seed: string, country: CountryId | undefined): TournamentOutcome {
  const rng = Rng.fromSeed(`${seed}:tournament:${t.id}:${year}`);
  const noisy = (team: NationalTeamDef) => team.strength + rng.normal(0, 3);
  const pool = intl.nationalTeams.filter((n) => t.confederations.length === 0 || t.confederations.includes(n.confederation));
  let participants: NationalTeamDef[];
  if (t.slots) {
    participants = [];
    for (const [conf, n] of Object.entries(t.slots)) {
      const ranked = pool.filter((p) => p.confederation === conf).map((p) => ({ p, s: noisy(p) })).sort((a, b) => b.s - a.s);
      participants.push(...ranked.slice(0, n).map((x) => x.p));
    }
  } else {
    // Copa América: todas las sudamericanas y las mejores invitadas.
    const ranked = pool.map((p) => ({ p, s: noisy(p) + (p.confederation === 'CONMEBOL' ? 50 : 0) })).sort((a, b) => b.s - a.s);
    participants = ranked.slice(0, t.teams).map((x) => x.p);
  }
  // Grupos de 4 y un número de grupos potencia de 2 (para que las eliminatorias cuadren).
  const groupsCount = 2 ** Math.floor(Math.log2(Math.max(1, Math.floor(Math.min(participants.length, t.teams) / 4))));
  participants = participants.slice(0, groupsCount * 4);
  const strength = new Map(participants.map((p) => [p.id, p.strength]));
  const name = (id: CountryId) => intl.nationalTeams.find((n) => n.id === id)?.name.es ?? id;
  const mine: ResolvedMatch[] = [];
  let result: string | null = participants.some((p) => p.id === country) ? 'Fase de grupos' : null;

  const record = (round: string, a: CountryId, b: CountryId, ga: number, gb: number) => {
    if (a !== country && b !== country) return;
    const isA = a === country;
    mine.push({ round, half: 2, opponentName: name(isA ? b : a), home: isA, gf: isA ? ga : gb, ga: isA ? gb : ga, opponentLevel: strength.get(isA ? b : a) ?? 70 });
  };

  // Grupos de 4 (bombos por fuerza)
  const seeded = [...participants].sort((a, b) => b.strength - a.strength);
  const nGroups = participants.length / 4;
  const groups: CountryId[][] = Array.from({ length: nGroups }, () => []);
  for (let pot = 0; pot < 4; pot++) {
    const potTeams = rng.shuffle(seeded.slice(pot * nGroups, (pot + 1) * nGroups));
    potTeams.forEach((team, i) => groups[i]!.push(team.id));
  }
  const qualified: CountryId[] = [];
  for (const g of groups) {
    const pts = new Map(g.map((id) => [id, 0]));
    const gd = new Map(g.map((id) => [id, 0]));
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        const a = g[i]!;
        const b = g[j]!;
        const [x, y] = simulateScore(rng, strength.get(a)!, strength.get(b)!);
        record('Fase de grupos', a, b, x, y);
        pts.set(a, pts.get(a)! + (x > y ? 3 : x === y ? 1 : 0));
        pts.set(b, pts.get(b)! + (y > x ? 3 : x === y ? 1 : 0));
        gd.set(a, gd.get(a)! + x - y);
        gd.set(b, gd.get(b)! + y - x);
      }
    }
    const order = [...g].sort((a, b) => pts.get(b)! - pts.get(a)! || gd.get(b)! - gd.get(a)! || strength.get(b)! - strength.get(a)!);
    qualified.push(order[0]!, order[1]!);
  }

  // Eliminatorias: cruces 1.º contra 2.º de otro grupo.
  let alive: CountryId[] = [];
  for (let i = 0; i < qualified.length; i += 4) alive.push(qualified[i]!, qualified[i + 3] ?? qualified[i + 1]!, qualified[i + 2]!, qualified[i + 1]!);
  alive = alive.filter((v, i, arr) => arr.indexOf(v) === i);
  while (alive.length > 1) {
    const round = KO_NAMES[alive.length] ?? 'Eliminatoria';
    const next: CountryId[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      const a = alive[i]!;
      const b = alive[i + 1]!;
      const [x, y] = simulateScore(rng, strength.get(a)!, strength.get(b)!);
      let w = x > y ? a : b;
      let label = round;
      if (x === y) {
        w = rng.chance(Math.min(0.7, Math.max(0.3, 0.5 + (strength.get(a)! - strength.get(b)!) / 60))) ? a : b;
        label = `${round} (pen.)`;
      }
      record(label, a, b, x, y);
      if (a === country || b === country) result = w === country ? (round === 'Final' ? 'Campeón' : result) : round;
      next.push(w);
    }
    alive = next;
  }
  return { tournament: t, year, participants: participants.map((p) => p.id), champion: alive[0]!, result, matches: mine };
}

/** Elige con qué selección jugará (definitivo). Devuelve una copia nueva. */
export function chooseNationalTeam(input: GameState, country: CountryId, intl: InternationalContent): GameState {
  const game = structuredClone(input);
  if (!game.player.nationalTeam.eligible.includes(country)) return game;
  game.player.nationalTeam.chosen = country;
  delete game.pendingNationalChoice;
  game.inbox.unshift({
    id: 'nt-choice-' + game.calendar.season,
    season: game.calendar.season,
    phase: game.calendar.phase,
    source: 'press',
    headline: game.player.identity.name + ' elige jugar con ' + (teamOf(intl, country)?.name.es ?? country) + '.',
    tone: 'neutral',
  });
  return game;
}
