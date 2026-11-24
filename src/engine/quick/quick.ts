/**
 * Modo rápido (rama `rapida`): la carrera avanza temporada a temporada sin decisiones ni eventos.
 * Las ofertas, la selección y las cinemáticas se resuelven solas con una política fija y razonable,
 * y de cada temporada se guarda una ficha compacta (estadísticas, equipo y clasificación) para verla de un vistazo.
 */
import type { GameState, Offer, StandingRow } from '../types/game';
import type { ClubId, DivisionId, SeasonYear } from '../types/common';
import type { SquadRole } from '../types/player';
import type { CompetitionStats } from '../types/career';
import { advancePhase } from '../season/advance';
import { respondToOffer } from '../market/offers';
import { personName, type EventContent } from '../events/context';
import type { EngineContent } from '../season/advance';
import type { Position } from '../types/attributes';
import { Rng } from '../rng';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from '../player/defaults';

export interface QuickSeason {
  season: SeasonYear;
  age: number;
  clubId: ClubId;
  divisionId: DivisionId | null;
  onLoan: boolean;
  role: SquadRole;
  shirtNumber: number;
  coach: string;
  overallStart: number;
  overallEnd: number;
  /** Totales de club (liga, copas y competiciones continentales). */
  apps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  /** Nota media (0 si no jugó). */
  rating: number;
  /** Desglose por competición (club). */
  competitions: { competitionId: string; apps: number; goals: number; assists: number; rating: number }[];
  /** Clasificación final de su liga. */
  table: StandingRow[];
  position?: number;
  champion: boolean;
  promoted: boolean;
  relegated: boolean;
  cupRound?: string;
  continental?: { competitionId: string; round: string };
  trophies: string[];
  awards: { awardId: string; rank: number; scope?: string }[];
  national: { caps: number; goals: number; tournament?: { competitionId: string; result: string } };
  marketValue: number;
  /** Fichajes y cesiones aceptados durante la temporada. */
  moves: { kind: Offer['kind']; clubId: ClubId; fee: number }[];
}

const ROLE_RANK: Record<SquadRole, number> = { cantera: 0, promesa: 1, rotacion: 2, titular: 3, estrella: 4 };

/** Agrega estadísticas de varias competiciones. */
export function totals(stats: CompetitionStats[]): { apps: number; goals: number; assists: number; cleanSheets: number; rating: number } {
  const apps = stats.reduce((s, c) => s + c.apps, 0);
  const ratingSum = stats.reduce((s, c) => s + c.ratingSum, 0);
  return {
    apps,
    goals: stats.reduce((s, c) => s + c.goals, 0),
    assists: stats.reduce((s, c) => s + c.assists, 0),
    cleanSheets: stats.reduce((s, c) => s + c.cleanSheets, 0),
    rating: apps ? Math.round((ratingSum / apps) * 100) / 100 : 0,
  };
}

/**
 * Política automática de ofertas: cambia de club si mejora claramente el prestigio o si pasa de suplente a titular;
 * renueva si el contrato se acaba y no hay nada mejor.
 */
export function pickOffer(game: GameState): Offer | undefined {
  const contract = game.player.contract;
  if (!contract) return undefined;
  const prestige = (id: ClubId) => game.world.clubs[id]?.prestige ?? 0;
  const current = prestige(contract.loanFrom ?? contract.clubId);
  const myRole = ROLE_RANK[contract.role];
  const offers = game.offers ?? [];
  const moves = offers
    .filter((o) => o.kind !== 'renewal')
    .filter((o) => prestige(o.clubId) > current + 3 || (myRole <= 2 && ROLE_RANK[o.role] >= 3 && prestige(o.clubId) >= current - 15))
    .sort((a, b) => prestige(b.clubId) + ROLE_RANK[b.role] * 4 - (prestige(a.clubId) + ROLE_RANK[a.role] * 4));
  if (moves[0]) return moves[0];
  const expiring = contract.endSeason <= game.calendar.season;
  return expiring ? offers.find((o) => o.kind === 'renewal') : undefined;
}

/** Quita lo que en la versión normal pide intervención del jugador. */
function autopilot(input: GameState, content: EngineContent, moves: QuickSeason['moves']): GameState {
  let game = input;
  if (game.activeEvent || game.eventQueue?.length || game.cinematics?.length || game.pendingNationalChoice?.length) {
    game = structuredClone(game);
    game.activeEvent = null;
    game.eventQueue = [];
    game.cinematics = [];
    if (game.pendingNationalChoice?.length) {
      const own = game.player.identity.nationalities[0];
      const chosen = game.pendingNationalChoice.includes(own ?? '') ? own! : game.pendingNationalChoice[0]!;
      game.player.nationalTeam.chosen = chosen;
      game.pendingNationalChoice = [];
    }
  }
  const offer = pickOffer(game);
  if (offer) {
    game = respondToOffer(game, offer.id, true, content.world);
    if (offer.kind !== 'renewal') moves.push({ kind: offer.kind, clubId: offer.clubId, fee: offer.fee });
  }
  return game;
}

/** Prepara una partida recién creada para el modo rápido (sin eventos de inicio). */
export function startQuick(game: GameState): GameState {
  const g = structuredClone(game);
  g.activeEvent = null;
  g.eventQueue = [];
  g.cinematics = [];
  g.quickLog = [];
  return g;
}

/**
 * Juega una temporada completa (cinco fases) y añade su ficha a `quickLog`.
 * Devuelve la partida al inicio de la pretemporada siguiente, o retirada.
 */
export function playQuickSeason(input: GameState, content: EngineContent & EventContent): GameState {
  if (input.retired) return input;
  const moves: QuickSeason['moves'] = [];
  let game = input;
  const season = game.calendar.season;
  let snapshot: QuickSeason | undefined;
  for (let guard = 0; guard < 8; guard++) {
    game = autopilot(game, content, moves);
    if (game.retired) break;
    const before = game.calendar.phase;
    game = advancePhase(game, content);
    if (before === 'secondHalf') snapshot = buildSnapshot(game, content, season, moves);
    if (game.retired || (game.calendar.season > season && game.calendar.phase === 'preseason')) break;
  }
  // Lo que se resolvería en la pretemporada siguiente se olvida (no hay decisiones).
  game = { ...game, activeEvent: null, eventQueue: [], cinematics: [] };
  // Los fichajes del final de temporada se apuntan en la temporada que acaba.
  if (snapshot) game = { ...game, quickLog: [...(game.quickLog ?? []), { ...snapshot, moves: [...moves] }] };
  return game;
}

function buildSnapshot(game: GameState, content: EngineContent & EventContent, season: SeasonYear, moves: QuickSeason['moves']): QuickSeason | undefined {
  const record = game.career.seasons.findLast((s) => s.season === season);
  const summary = game.lastSummary;
  const contract = game.player.contract;
  if (!record || !record.clubId || !contract) return undefined;
  const table = record.divisionId ? [...(game.world.standings[record.divisionId] ?? [])] : [];
  table.sort((a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
  const club = totals(record.stats.filter((s) => s.competitionId !== 'youth' || record.stats.length === 1));
  return {
    season,
    age: record.age,
    clubId: record.clubId,
    divisionId: record.divisionId,
    onLoan: record.onLoan,
    role: summary?.roleBefore ?? contract.role,
    shirtNumber: contract.shirtNumber,
    coach: personName(content, game.seed, 'coach', record.clubId, season),
    overallStart: record.overallStart,
    overallEnd: record.overallEnd,
    ...club,
    competitions: record.stats.map((s) => ({ competitionId: s.competitionId, apps: s.apps, goals: s.goals, assists: s.assists, rating: s.apps ? Math.round((s.ratingSum / s.apps) * 100) / 100 : 0 })),
    table,
    ...(record.leaguePosition ? { position: record.leaguePosition } : {}),
    champion: summary?.champion ?? false,
    promoted: summary?.promoted ?? false,
    relegated: summary?.relegated ?? false,
    ...(summary?.cupRound ? { cupRound: summary.cupRound } : {}),
    ...(summary?.continental ? { continental: summary.continental } : {}),
    trophies: game.career.trophies.filter((t) => t.season === season).map((t) => t.competitionId),
    awards: game.career.awards.filter((a) => a.season === season).map((a) => ({ awardId: a.awardId, rank: a.rank, ...(a.scope ? { scope: a.scope } : {}) })),
    national: {
      caps: summary?.national?.caps ?? 0,
      goals: summary?.national?.goals ?? 0,
      ...(summary?.national?.tournament?.played ? { tournament: { competitionId: summary.national.tournament.competitionId, result: summary.national.tournament.result } } : {}),
    },
    marketValue: record.marketValueEnd,
    moves: [...moves],
  };
}

/* ── Creación en un paso ───────────────────────────────── */

export interface QuickNewGame {
  seed: string;
  createdAt: string;
  name: string;
  position: Position;
  /** Club de cantera (de ahí salen país, región y ciudad de nacimiento). */
  clubId: ClubId;
}

/** Crea una carrera completa con valores por defecto: estilo de su posición, dos rasgos al azar y aspecto básico. */
export function createQuickGame(params: QuickNewGame, content: EngineContent): GameState {
  const club = content.world.clubById.get(params.clubId);
  if (!club) throw new Error(`Club desconocido: ${params.clubId}`);
  const rng = Rng.fromSeed(`${params.seed}:quick`);
  const styles = content.styles.filter((s) => s.positions.includes(params.position));
  const style = rng.pick(styles.length ? styles : content.styles);
  const selectable = content.traits.filter((t) => t.selectableAtStart);
  const first = rng.pick(selectable);
  const rest = selectable.filter((t) => t.id !== first.id && !(t.opposites ?? []).includes(first.id) && !(first.opposites ?? []).includes(t.id));
  const second = rng.pick(rest.length ? rest : selectable.filter((t) => t.id !== first.id));
  const game = createNewGame({
    seed: params.seed,
    createdAt: params.createdAt,
    name: params.name,
    content: { styles: content.styles, traits: content.traits, tendencies: content.tendencies },
    academy: { clubId: club.id, budgetM: club.budgetM, prestige: club.prestige },
    character: {
      name: params.name,
      birthDay: rng.int(1, 28),
      birthMonth: rng.int(1, 12),
      birthPlace: { country: club.country, region: club.region, city: club.city },
      nationalities: [club.country],
      foot: rng.chance(0.75) ? 'derecho' : 'izquierdo',
      appearance: defaultAppearance(),
      mainPosition: params.position,
      secondaryPositions: [],
      style: style.id,
      traits: [first.id, second.id],
      preferredNumber: DEFAULT_NUMBER[params.position],
    },
  });
  return startQuick(game);
}

const DEFAULT_NUMBER: Record<Position, number> = { POR: 1, LD: 2, LI: 3, DFC: 4, MCD: 5, MC: 8, MCO: 10, MD: 7, MI: 11, ED: 7, EI: 11, DC: 9 };
