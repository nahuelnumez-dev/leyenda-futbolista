/**
 * Máquina de fases de la temporada. Cada llamada a `advancePhase` avanza una fase:
 *
 *   preseason ──► firstHalf ──► winterWindow ──► secondHalf ──► seasonEnd ──► preseason (temporada siguiente)
 *               (1.ª vuelta)                  (2.ª vuelta)    (cierre: ascensos,
 *                                                              evolución, resumen)
 *
 * La Fase 5 enganchará aquí los eventos y decisiones de cada fase.
 */
import { Rng } from '../rng';
import type { WorldData } from '../data/world';
import type { ClubDynamic } from '../types/club';
import type { ClubId, SeasonPhase } from '../types/common';
import type { PlayStyleDef, SpecialtyDef, TraitDef } from '../types/definitions';
import type { CompetitionStats, SeasonRecord } from '../types/career';
import type { GameState, MatchLog, SeasonSummary } from '../types/game';
import type { Contract, SquadRole } from '../types/player';
import { overallFor } from '../player/overall';
import { playMatch } from '../player/matches';
import { marketValue, narrowPotential, seasonGrowth } from '../player/growth';
import { applyMatchStat } from '../events/effects';
import { focusAttributes, matchModifiers, updateSpecialties } from '../player/specialties';
import { academyOptions } from '../player/academy';
import { generateOffers, returnFromLoan } from '../market/offers';
import { queuePhaseEvents, hasPendingEvent, type EventsContent } from '../events/engine';
import { INJURY_TYPES } from '../events/effects';
import { applyTendencyTraits, reactions, relationConsequences, seasonDrift, type PersonalityContent } from '../personality/personality';
import { ageInSeason } from '../world/newGame';
import { applyResult, emptyRow, parseTableKey, roundRobin, simulateScore, sortTable, tableKey, teamLevel } from './league';
import { applyPromotions, updatePrestige } from './promotion';
import type { InternationalContent, ResolvedMatch } from '../competitions/types';
import { domesticCup, continentalQualifiers, continentalRun, cupMatchesFor, cupRoundReached, simulateCup } from '../competitions/clubCompetitions';
import { categoryLabel, nationalWindow, playerCountry, simulateTournament, teamOf, tournamentsIn } from '../competitions/nationalTeam';
import { ageNpcStars, createNpcStars, seasonAwards } from '../competitions/awards';
import { queueCinematic } from '../cinematics/cinematics';
import { evaluateAchievements, retire, retirementDue, type LegacyContent } from '../legacy/legacy';

export interface EngineContent extends Omit<EventsContent, 'tendencies' | 'traits'>, PersonalityContent, Pick<LegacyContent, 'achievements' | 'tierPoints'> {
  intl: InternationalContent;
  world: WorldData;
  styles: PlayStyleDef[];
  traits: TraitDef[];
  specialties: SpecialtyDef[];
}

export const NEXT_PHASE: Record<SeasonPhase, SeasonPhase> = {
  preseason: 'firstHalf',
  firstHalf: 'winterWindow',
  winterWindow: 'secondHalf',
  secondHalf: 'seasonEnd',
  seasonEnd: 'preseason',
};

/** Partidos de juveniles por vuelta (para los que aún están en la cantera). */
export const YOUTH_MATCHES_PER_HALF = 14;
/** Diferencia de nivel entre el primer equipo y su cantera. */
const YOUTH_GAP = 24;
/** Edad a la que un juvenil sube sí o sí al primer equipo. */
const FIRST_TEAM_AGE = 18;

/* ── Mundo ─────────────────────────────────────────────── */

/** Crea el estado dinámico de los clubes a partir de los datos estáticos (división, grupo, prestigio). */
export function initialClubs(world: WorldData): Record<ClubId, ClubDynamic> {
  const clubs: Record<ClubId, ClubDynamic> = {};
  for (const div of world.divisionById.values()) {
    for (const club of div.clubs) {
      const group = div.groups?.find((g) => g.clubIds.includes(club.id));
      clubs[club.id] = { divisionId: div.id, ...(group ? { groupId: group.id } : {}), prestige: club.prestige, budgetM: club.budgetM };
    }
  }
  return clubs;
}

/** Partidas guardadas antes de añadir ligas: los clubes nuevos entran al empezar una temporada. */
function addMissingClubs(game: GameState, content: EngineContent): void {
  const missing = Object.fromEntries(Object.entries(initialClubs(content.world)).filter(([id]) => !game.world.clubs[id]));
  if (!Object.keys(missing).length) return;
  Object.assign(game.world.clubs, missing);
  if (game.world.npcStars.length) game.world.npcStars.push(...createNpcStars(content.world, missing, content.names, game.seed + ':nuevas-ligas', game.calendar.season));
}

/** Tablas activas: una por división o por grupo. */
export function activeTables(clubs: Record<ClubId, ClubDynamic>): Map<string, ClubId[]> {
  const tables = new Map<string, ClubId[]>();
  for (const [id, d] of Object.entries(clubs)) {
    const key = tableKey(d.divisionId, d.groupId);
    tables.set(key, [...(tables.get(key) ?? []), id]);
  }
  for (const list of tables.values()) list.sort();
  return tables;
}

/** El calendario depende solo de la semilla, la temporada y la tabla: es el mismo en las dos vueltas. */
function fixturesFor(world: WorldData, key: string, clubIds: ClubId[], season: number, seed: string) {
  const { divisionId } = parseTableKey(key);
  const rounds = world.divisionById.get(divisionId)?.format?.rounds ?? 2;
  const order = Rng.fromSeed(`${seed}:fixtures:${season}:${key}`).shuffle(clubIds);
  return roundRobin(order, rounds);
}

/* ── Jugador ───────────────────────────────────────────── */

function clubLevel(game: GameState, clubId: ClubId): number {
  return teamLevel(game.world.clubs[clubId]?.prestige ?? 40);
}

/** Rol en la plantilla según la media frente al nivel del equipo. */
export function roleFor(overall: number, level: number, age: number): SquadRole {
  const diff = overall - level;
  if (diff >= 6) return 'estrella';
  if (diff >= -2) return 'titular';
  if (diff >= -8) return 'rotacion';
  return age <= 21 ? 'promesa' : 'rotacion';
}

/** Sueldo anual (euros) según media y presupuesto del club. */
export function salaryFor(overall: number, budgetM: number): number {
  const raw = Math.pow(1.12, overall - 45) * 12_000 * (0.6 + Math.min(1000, budgetM) / 250);
  return Math.round(raw / 1000) * 1000;
}

/** Partidas antiguas o sin club: se le asigna la cantera más accesible de su zona. */
function ensureClub(game: GameState, world: WorldData): void {
  if (game.player.contract && world.clubById.has(game.player.contract.clubId)) return;
  const choice = academyOptions(world, game.player.identity.birthPlace, game.player.potential.hidden, game.seed);
  const club = world.clubById.get(choice.fallback.clubId)!;
  game.player.contract = {
    clubId: club.id,
    startSeason: game.calendar.season,
    endSeason: game.calendar.season + 2,
    salary: Math.round((3000 + club.budgetM * 30) / 100) * 100,
    role: 'cantera',
    shirtNumber: game.player.preferredNumber,
  };
  game.career.spells.push({ clubId: club.id, type: 'academy', fromSeason: game.calendar.season, highlights: [] });
}

/* ── Lesiones ──────────────────────────────────────────── */

const NO_MATCH = { started: false, minutes: 0, rating: null, goals: 0, assists: 0, dribbles: 0, keyPasses: 0, tackles: 0, saves: 0 };

/** Si está lesionado, se pierde el partido y descuenta una semana. */
function sidelined(game: GameState): boolean {
  const inj = game.player.status.injury;
  if (!inj) return false;
  inj.weeksOut -= 1;
  if (inj.weeksOut <= 0) delete game.player.status.injury;
  return true;
}

/** Riesgo de lesión al jugar: 1,2 % por partido, más con propensión, rasgos y mala forma física. */
function maybeInjure(game: GameState, rng: Rng, content: EngineContent): void {
  const p = game.player;
  const traitRisk = p.traits.reduce((s, t) => s + (content.traits.find((d) => d.id === t.id)?.passive?.injuryProneness ?? 0), 0);
  const proneness = Math.max(0, p.status.injuryProneness + traitRisk);
  const chance = 0.012 * (1 + proneness / 40) * (p.status.fitness < 50 ? 1.5 : 1);
  if (!rng.chance(chance)) return;
  const severity = rng.weighted([1, 2, 3] as const, (x) => (x === 1 ? 72 : x === 2 ? 23 : 5));
  const weeks = severity === 1 ? rng.int(1, 3) : severity === 2 ? rng.int(4, 8) : rng.int(18, 32);
  const type = rng.pick(INJURY_TYPES[severity]);
  p.status.injury = { type, severity, weeksOut: weeks, season: game.calendar.season };
  p.status.injuryProneness = Math.min(100, p.status.injuryProneness + severity * 2);
  if (severity === 3) queueCinematic(game, { type: 'injury', importance: 'minor', value: weeks });
  game.inbox.unshift({
    id: 'inj-' + game.calendar.season + '-' + game.inbox.length,
    season: game.calendar.season,
    phase: game.calendar.phase,
    source: 'system',
    headline: 'Lesión: ' + type + '. Baja de ' + weeks + (weeks === 1 ? ' semana.' : ' semanas.'),
    tone: 'negative',
  });
}

/* ── Partidos de copa, continentales y de selección ───── */

/** Añade la actuación del jugador a un partido ya resuelto de otra competición. */
function playResolved(
  game: GameState,
  rng: Rng,
  content: EngineContent,
  m: ResolvedMatch,
  competition: string,
  md: number,
  ctx: { role: SquadRole; reserve: boolean; canCallUp: boolean; level: number },
): MatchLog {
  const callUp = ctx.canCallUp && rng.chance(0.35);
  const pm = sidelined(game)
    ? NO_MATCH
    : ctx.reserve && !callUp
      ? NO_MATCH
      : playMatch(rng, game.player, ctx.role, { level: ctx.level, teamGoals: m.gf, conceded: m.ga, callUp: ctx.reserve, mods: matchModifiers(game.player, content.specialties) });
  if (pm.minutes > 0) maybeInjure(game, rng, content);
  return {
    md,
    competition,
    ...(m.opponentId ? { opponentId: m.opponentId } : {}),
    ...(m.opponentName ? { opponentName: m.opponentName } : {}),
    round: m.round,
    home: m.home,
    gf: m.gf,
    ga: m.ga,
    ...pm,
  };
}

/** Copa nacional y competición continental del club del jugador en esta vuelta. */
function clubCups(game: GameState, content: EngineContent, half: 1 | 2, prng: Rng, ctx: { role: SquadRole; reserve: boolean; canCallUp: boolean; level: number }): MatchLog[] {
  const myClub = game.player.contract!.clubId;
  const country = content.world.clubById.get(myClub)?.country;
  const logs: MatchLog[] = [];
  const cup = country ? simulateCup(game, content.world, country) : null;
  if (cup) {
    cupMatchesFor(cup, myClub, game)
      .filter((m) => m.half === half)
      .forEach((m, i) => logs.push(playResolved(game, prng, content, m, cup.competitionId, (half - 1) * 10 + i + 1, ctx)));
  }
  const comp = game.world.continental?.[myClub];
  if (comp) {
    const run = continentalRun(game, content.world, content.intl, myClub, comp);
    run.matches
      .filter((m) => m.half === half)
      .forEach((m, i) => logs.push(playResolved(game, prng, content, m, comp, (half - 1) * 10 + i + 1, { ...ctx, canCallUp: false })));
  }
  return logs;
}

/** Hitos del primer equipo en una vuelta: debut, primer gol y hat-trick. */
function milestones(game: GameState, logs: MatchLog[]): void {
  const firstTeam = logs.filter((l) => l.competition !== 'youth' && l.minutes > 0);
  const debut = firstTeam[0];
  if (debut && !game.flags['firstTeamDebut']) {
    game.flags['firstTeamDebut'] = game.calendar.season;
    queueCinematic(game, { type: 'debut', importance: 'major', clubId: game.player.contract!.clubId, ...(debut.opponentId ? { opponentId: debut.opponentId } : {}) });
  }
  const goal = firstTeam.find((l) => l.goals > 0);
  if (goal && !game.flags['firstGoal']) {
    game.flags['firstGoal'] = game.calendar.season;
    queueCinematic(game, {
      type: 'firstGoal',
      importance: 'major',
      clubId: game.player.contract!.clubId,
      ...(goal.opponentId ? { opponentId: goal.opponentId } : {}),
      ...(game.player.celebrations.selected ? { celebration: game.player.celebrations.selected } : {}),
    });
  }
  const hat = firstTeam.find((l) => l.goals >= 3);
  if (hat) {
    queueCinematic(game, {
      type: 'hatTrick',
      importance: 'minor',
      clubId: game.player.contract!.clubId,
      value: hat.goals,
      ...(hat.opponentId ? { opponentId: hat.opponentId } : {}),
      ...(game.player.celebrations.selected ? { celebration: game.player.celebrations.selected } : {}),
    });
  }
}

/** Ventana internacional tras cada vuelta. */
function nationalBreak(game: GameState, content: EngineContent, half: 1 | 2, prng: Rng): void {
  const w = nationalWindow(game, content.intl, half);
  if (w === 'choice') {
    game.pendingNationalChoice = [...new Set(game.player.nationalTeam.eligible)];
    return;
  }
  if (!w) return;
  const nt = game.career.nationalTeam;
  const comp = 'nt.' + w.country + (w.category === 'absoluta' ? '' : '.' + w.category);
  const firstTime = w.category === 'absoluta' ? nt.caps === 0 : !nt.youthCaps[w.category];
  const logs = w.matches.map((m, i) =>
    playResolved(game, prng, content, m, comp, (half - 1) * 2 + i + 1, { role: 'titular', reserve: false, canCallUp: false, level: w.level }),
  );
  game.current!.ntMatches = [...(game.current!.ntMatches ?? []), ...logs];
  const played = logs.filter((l) => l.minutes > 0);
  if (w.category === 'absoluta') {
    nt.country = w.country;
    nt.caps += played.length;
    nt.goals += played.reduce((a, l) => a + l.goals, 0);
    nt.assists += played.reduce((a, l) => a + l.assists, 0);
    if (played.length && nt.debutSeason === undefined) {
      nt.debutSeason = game.calendar.season;
      queueCinematic(game, { type: 'nationalDebut', importance: 'major', country: w.country });
    }
    game.player.reputation.national = Math.min(100, game.player.reputation.national + 3);
  } else {
    nt.youthCaps[w.category] = (nt.youthCaps[w.category] ?? 0) + played.length;
  }
  if (firstTime) {
    const name = teamOf(content.intl, w.country)?.name.es ?? w.country;
    game.inbox.unshift({
      id: 'nt-' + game.calendar.season + '-' + half + '-' + w.category,
      season: game.calendar.season,
      phase: game.calendar.phase,
      source: 'press',
      headline: 'Primera convocatoria con ' + name + (w.category === 'absoluta' ? '' : ' (' + categoryLabel(w.category) + ')') + '.',
      tone: 'positive',
    });
    game.flags['ntCalled:' + w.category] = true;
  }
}

/* ── Simulación de una vuelta ──────────────────────────── */

function simulateHalf(game: GameState, content: EngineContent, half: 1 | 2, root: Rng): void {
  const { world } = content;
  const season = game.calendar.season;
  const contract = game.player.contract!;
  const myClub = contract.clubId;
  const role = contract.role;
  const prng = root.fork(`player:${season}:${half}`);
  const ovr = overallFor(game.player.attributes, game.player.positions.main);
  const level = clubLevel(game, myClub);
  const mods = matchModifiers(game.player, content.specialties);
  // Juega en el filial/juveniles si aún es canterano o si es una promesa muy lejos del nivel del primer equipo.
  const reserve = role === 'cantera' || (role === 'promesa' && ovr < level - 12);
  const canCallUp = reserve && ovr >= level - 14;
  const logs: MatchLog[] = [];

  for (const [key, ids] of activeTables(game.world.clubs)) {
    const days = fixturesFor(world, key, ids, season, game.seed);
    const mid = Math.ceil(days.length / 2);
    const slice = half === 1 ? days.slice(0, mid) : days.slice(mid);
    const offset = half === 1 ? 0 : mid;
    const table = new Map((half === 1 ? ids.map(emptyRow) : (game.world.standings[key] ?? ids.map(emptyRow))).map((r) => [r.clubId, { ...r }]));
    const mrng = root.fork(`matches:${season}:${key}:${half}`);

    slice.forEach((day, i) => {
      for (const [home, away] of day) {
        const [hg, ag] = simulateScore(mrng, clubLevel(game, home), clubLevel(game, away));
        applyResult(table, home, away, hg, ag);
        if (home !== myClub && away !== myClub) continue;
        const isHome = home === myClub;
        const gf = isHome ? hg : ag;
        const ga = isHome ? ag : hg;
        const callUp = canCallUp && prng.chance(0.35);
        const pm = sidelined(game)
          ? NO_MATCH
          : reserve && !callUp
            ? NO_MATCH
            : playMatch(prng, game.player, role, { level, teamGoals: gf, conceded: ga, callUp: reserve, mods });
        if (pm.minutes > 0) maybeInjure(game, prng, content);
        logs.push({ md: offset + i + 1, competition: parseTableKey(key).divisionId, opponentId: isHome ? away : home, home: isHome, gf, ga, ...pm });
      }
    });
    game.world.standings[key] = sortTable([...table.values()]);
  }

  // Copa y competición continental
  logs.push(...clubCups(game, content, half, prng, { role, reserve, canCallUp, level }));

  // Filial / juveniles.
  if (reserve) {
    // Categoría según la edad: a los 15 juega con chicos de su edad (nivel más bajo); a los 18-19, en el filial.
    const age = ageInSeason(game.player.identity.birthDate, season);
    const yLevel = level - YOUTH_GAP - Math.max(0, 17 - age) * 4;
    for (let i = 0; i < YOUTH_MATCHES_PER_HALF; i++) {
      const opp = yLevel + prng.normal(0, 5);
      const home = i % 2 === 0;
      const [a, b] = simulateScore(prng, home ? yLevel : opp, home ? opp : yLevel);
      const gf = home ? a : b;
      const ga = home ? b : a;
      const pm = game.player.status.injury ? NO_MATCH : playMatch(prng, game.player, 'titular', { level: yLevel, teamGoals: gf, conceded: ga, mods });
      if (pm.minutes > 0) maybeInjure(game, prng, content);
      logs.push({ md: (half - 1) * YOUTH_MATCHES_PER_HALF + i + 1, competition: 'youth', home, gf, ga, ...pm });
    }
  }

  // Lo que contó un evento sin que jugara se suma al primer partido que juegue.
  const firstPlayed = logs.find((l) => l.minutes > 0);
  if (firstPlayed && game.pendingMatchStats?.length) {
    for (const d of game.pendingMatchStats) applyMatchStat(game, firstPlayed, d);
    delete game.pendingMatchStats;
  }
  game.current!.matches.push(...logs);
  milestones(game, logs);
  signatureHighlight(game, content, logs, prng);
  nationalBreak(game, content, half, prng);

  // Forma y moral según cómo le ha ido en esta vuelta.
  const played = logs.filter((l) => l.rating !== null);
  if (played.length) {
    const avg = played.reduce((s, l) => s + (l.rating ?? 0), 0) / played.length;
    game.player.status.form = Math.round(Math.min(95, Math.max(25, 50 + (avg - 6.3) * 30)));
  }
  const firstTeam = logs.filter((l) => l.competition !== 'youth');
  const share = firstTeam.length ? firstTeam.filter((l) => l.minutes > 0).length / firstTeam.length : 0;
  if (!reserve) {
    const expected = role === 'estrella' || role === 'titular' ? 0.75 : role === 'rotacion' ? 0.45 : 0.2;
    game.player.status.morale = Math.round(Math.min(100, Math.max(10, game.player.status.morale + (share - expected) * 25)));
  }
}

/* ── Especialidades ────────────────────────────────────── */

function inboxNews(game: GameState, id: string, headline: string, tone: 'positive' | 'neutral' | 'negative'): void {
  game.inbox.unshift({ id: `${id}-${game.calendar.season}-${game.inbox.length}`, season: game.calendar.season, phase: game.calendar.phase, source: 'system', headline, tone });
}

/** Avisos al ganar, mejorar o perder especialidades. */
function specialtyNews(game: GameState, content: EngineContent, changes: { id: string; from: number; to: number }[]): void {
  for (const c of changes) {
    const name = content.specialties.find((d) => d.id === c.id)?.name.es ?? c.id;
    if (c.to > c.from) inboxNews(game, 'spec', c.to === 2 ? `Especialidad élite: ${name}. Eres de los mejores del mundo en esto.` : `Nueva especialidad: ${name}.`, 'positive');
    else inboxNews(game, 'spec', c.to === 0 ? `Has perdido la especialidad ${name}: tus atributos ya no llegan.` : `${name} deja de ser de nivel élite.`, 'negative');
  }
}

/** De vez en cuando, uno de sus regates característicos se lleva los titulares de la jornada. */
function signatureHighlight(game: GameState, content: EngineContent, logs: MatchLog[], rng: Rng): void {
  const moves = (game.player.specialties ?? []).map((s) => content.specialties.find((d) => d.id === s.id)).filter((d) => d?.signature);
  const best = logs.filter((l) => l.competition !== 'youth' && (l.dribbles ?? 0) >= 3).sort((a, b) => (b.dribbles ?? 0) - (a.dribbles ?? 0))[0];
  if (!moves.length || !best || !rng.chance(0.6)) return;
  const move = rng.pick(moves)!;
  const rival = best.opponentId ? (content.world.clubById.get(best.opponentId)?.shortName ?? 'el rival') : (best.opponentName ?? 'el rival');
  inboxNews(game, 'sig', `La ${move.name.es.toLowerCase()} de ${game.player.identity.nickname ?? game.player.identity.name} ante ${rival} es lo más visto de la jornada.`, 'positive');
  game.social.followers = Math.round(game.social.followers * 1.02);
}

/* ── Cierre de temporada ───────────────────────────────── */

function aggregate(matches: MatchLog[], competitionId: string): CompetitionStats {
  const ms = matches.filter((m) => m.competition === competitionId && m.minutes > 0);
  let maxGoals = 0;
  for (const m of ms) maxGoals = Math.max(maxGoals, m.goals);
  return {
    competitionId,
    apps: ms.length,
    starts: ms.filter((m) => m.started).length,
    minutes: ms.reduce((s, m) => s + m.minutes, 0),
    goals: ms.reduce((s, m) => s + m.goals, 0),
    assists: ms.reduce((s, m) => s + m.assists, 0),
    ratingSum: Math.round(ms.reduce((s, m) => s + (m.rating ?? 0), 0) * 10) / 10,
    mvp: ms.filter((m) => (m.rating ?? 0) >= 8.5).length,
    yellow: 0,
    red: 0,
    cleanSheets: ms.filter((m) => m.started && m.ga === 0).length,
    keyPasses: ms.reduce((s, m) => s + (m.keyPasses ?? 0), 0),
    dribbles: ms.reduce((s, m) => s + (m.dribbles ?? 0), 0),
    tackles: ms.reduce((s, m) => s + (m.tackles ?? 0), 0),
    saves: ms.reduce((s, m) => s + (m.saves ?? 0), 0),
    hatTricks: ms.filter((m) => m.goals >= 3).length,
    maxGoalsInMatch: maxGoals,
  };
}

function closeSeason(game: GameState, content: EngineContent, root: Rng): void {
  const { world } = content;
  const season = game.calendar.season;
  const player = game.player;
  const contract = player.contract!;
  const clubId = contract.clubId;
  const dyn = game.world.clubs[clubId]!;
  const key = tableKey(dyn.divisionId, dyn.groupId);
  const table = game.world.standings[key] ?? [];
  const position = table.findIndex((r) => r.clubId === clubId) + 1;
  const age = ageInSeason(player.identity.birthDate, season);
  const ovrStart = game.current?.overallStart ?? overallFor(player.attributes, player.positions.main);
  const matches = game.current?.matches ?? [];

  // Mundo: ascensos, descensos, prestigio
  const { clubs, moves } = applyPromotions(root.fork(`promotions:${season}`), world, game.world.clubs, game.world.standings, season);
  game.world.clubs = updatePrestige(world, clubs, game.world.standings, moves);
  game.world.history.push(...moves.history);

  // Estadísticas de la temporada
  const competitions = [...new Set(matches.map((m) => m.competition))];
  const stats = competitions.map((c) => aggregate(matches, c)).filter((s) => s.apps > 0);
  const leagueMatches = matches.filter((m) => m.competition !== 'youth');
  const youthMatches = matches.filter((m) => m.competition === 'youth');
  const firstMinutes = leagueMatches.reduce((s, m) => s + m.minutes, 0);
  const youthMinutes = youthMatches.reduce((s, m) => s + m.minutes, 0);
  const playRatio = Math.min(1, firstMinutes / Math.max(1, leagueMatches.length * 90) + (0.6 * youthMinutes) / Math.max(1, youthMatches.length * 90));

  // Evolución
  const traits = player.traits.map((t) => content.traits.find((d) => d.id === t.id)).filter((d): d is TraitDef => !!d);
  const style = content.styles.find((s) => s.id === player.style);
  const { attributes, delta } = seasonGrowth(root.fork(`growth:${season}`), { player, age, playRatio, traits, focus: focusAttributes(player, content.specialties), ...(style ? { style } : {}) });
  player.attributes = attributes;
  player.potential.shownRange = narrowPotential(player.potential.hidden, player.potential.shownRange, age + 1);
  const ovrEnd = overallFor(attributes, player.positions.main);
  specialtyNews(game, content, updateSpecialties(player, content.specialties, season));

  // Reputación, relaciones y seguidores
  updateReputation(game, content, leagueMatches);
  seasonDrift(game);
  applyTendencyTraits(game, content);

  // Fin de cesión: vuelve a su club
  const roleBefore = contract.role;
  returnFromLoan(game);
  const current = player.contract!;
  const ownClub = current.clubId;
  const newLevel = teamLevel(game.world.clubs[ownClub]!.prestige);
  let firstTeamPromotion = false;
  let newContract: Contract = { ...current };
  if (current.role === 'cantera') {
    if (age + 1 >= FIRST_TEAM_AGE || ovrEnd >= newLevel - 10) {
      firstTeamPromotion = true;
      newContract = {
        ...contract,
        startSeason: season + 1,
        endSeason: season + 4,
        role: roleFor(ovrEnd, newLevel, age + 1),
        salary: salaryFor(ovrEnd, game.world.clubs[ownClub]!.budgetM),
      };
      const spell = game.career.spells.findLast((s) => s.clubId === clubId && !s.toSeason);
      if (spell) {
        spell.toSeason = season;
        spell.endReason = 'promotedToFirstTeam';
      }
      game.career.spells.push({ clubId, type: 'permanent', fromSeason: season + 1, highlights: [] });
    }
  } else {
    newContract.role = roleFor(ovrEnd, newLevel, age + 1);
    // Si el contrato se acaba sin haber renovado, el club le renueva un año con el mismo sueldo.
    if (current.endSeason <= season) {
      newContract = { ...newContract, startSeason: season + 1, endSeason: season + 1 };
    }
  }
  player.contract = newContract;

  // Títulos de la temporada
  const trophies: string[] = [];
  if (moves.champions.has(clubId)) trophies.push(dyn.divisionId);
  const country = world.clubById.get(clubId)?.country;
  const cup = country && domesticCup(world, country) ? simulateCup(game, world, country) : null;
  const cupRound = cup ? cupRoundReached(cup, clubId) : undefined;
  if (cup && cup.winner === clubId) trophies.push(cup.competitionId);
  const contComp = game.world.continental?.[clubId];
  const contRun = contComp ? continentalRun(game, world, content.intl, clubId, contComp) : null;
  if (contRun?.champion) trophies.push(contRun.competitionId);
  for (const t of trophies) {
    game.career.trophies.push({ competitionId: t, season, clubId });
    queueCinematic(game, { type: 'trophy', importance: 'major', competitionId: t, clubId });
  }
  if (moves.promoted.has(clubId)) {
    queueCinematic(game, { type: 'promotion', importance: 'major', clubId });
    game.flags['promotions'] = Number(game.flags['promotions'] ?? 0) + 1;
  }
  if (trophies.includes(dyn.divisionId) && cup?.winner === clubId && contRun?.champion) game.flags['treble'] = true;
  if (moves.relegated.has(clubId)) queueCinematic(game, { type: 'relegation', importance: 'minor', clubId });

  // Torneo de selecciones del verano
  const ntMatches = [...(game.current?.ntMatches ?? [])];
  let tournamentSummary: { competitionId: string; result: string; played: boolean } | undefined;
  const myCountry = playerCountry(game);
  for (const t of tournamentsIn(content.intl, season + 1)) {
    const outcome = simulateTournament(content.intl, t, season + 1, game.seed, myCountry);
    if (!outcome.result || !myCountry) continue;
    const calledRecently = ntMatches.some((m) => m.competition === 'nt.' + myCountry && m.minutes > 0) || game.career.nationalTeam.caps >= 5;
    const inSquad = calledRecently && !player.status.injury;
    const trng = root.fork('tournament:' + t.id);
    const level = teamOf(content.intl, myCountry)?.strength ?? 70;
    if (inSquad) {
      const logs = outcome.matches.map((m, i) => playResolved(game, trng, content, m, t.id, i + 1, { role: 'titular', reserve: false, canCallUp: false, level }));
      ntMatches.push(...logs);
      const played = logs.filter((l) => l.minutes > 0);
      game.career.nationalTeam.caps += played.length;
      game.career.nationalTeam.goals += played.reduce((a, l) => a + l.goals, 0);
      game.career.nationalTeam.assists += played.reduce((a, l) => a + l.assists, 0);
      game.career.nationalTeam.tournaments.push({ competitionId: t.id, season: season + 1, result: outcome.result });
      if (outcome.result === 'Campeón') {
        trophies.push(t.id);
        game.career.trophies.push({ competitionId: t.id, season: season + 1, nationalTeam: myCountry });
        queueCinematic(game, { type: 'tournament', importance: 'major', competitionId: t.id, country: myCountry });
      }
    }
    tournamentSummary = { competitionId: t.id, result: outcome.result, played: inSquad };
    game.inbox.unshift({
      id: 'tour-' + t.id + '-' + (season + 1),
      season,
      phase: 'seasonEnd',
      source: 'press',
      headline: (teamOf(content.intl, myCountry)?.name.es ?? myCountry) + ': ' + outcome.result.toLowerCase() + (inSquad ? '' : ' (sin ti en la convocatoria)'),
      tone: outcome.result === 'Campeón' ? 'positive' : 'neutral',
    });
  }

  // Premios individuales
  const clubMatches = matches.filter((m) => m.competition !== 'youth' && m.minutes > 0);
  const rated = clubMatches.filter((m) => m.rating !== null);
  const trophyBonus = trophies.reduce((b, t) => b + (t.includes('world-cup') ? 15 : t.startsWith('uefa.champions') || t.includes('libertadores') ? 10 : t === 'afc.champions-elite' || t === 'concacaf.champions-cup' ? 7 : t.includes('euro') || t.includes('copa-america') ? 10 : t === dyn.divisionId ? 6 : 3), 0);
  if (!game.world.npcStars.length) game.world.npcStars = createNpcStars(world, game.world.clubs, content.names, game.seed, season);
  const aw = seasonAwards(
    game,
    world,
    game.world.npcStars,
    {
      goals: clubMatches.reduce((a, m) => a + m.goals, 0),
      assists: clubMatches.reduce((a, m) => a + m.assists, 0),
      rating: rated.length ? rated.reduce((a, m) => a + (m.rating ?? 0), 0) / rated.length : 0,
      apps: clubMatches.length,
      trophyBonus,
    },
    moves.champions,
  );
  game.world.awardWinners = [...(game.world.awardWinners ?? []), ...aw.winners].slice(-200);
  for (const a of aw.playerAwards) {
    game.career.awards.push({ awardId: a.awardId, season, rank: a.rank, ...(a.scope ? { scope: a.scope } : {}) });
    if (a.rank === 1) queueCinematic(game, { type: 'award', importance: a.awardId === 'balon-de-oro' || a.awardId === 'golden-boy' ? 'major' : 'minor', awardId: a.awardId, ...(a.scope ? { competitionId: a.scope } : {}), ...(clubId ? { clubId } : {}) });
  }
  game.world.npcStars = ageNpcStars(aw.stars, season + 1, world, game.world.clubs, content.names, game.seed);

  // Clasificados para las competiciones continentales de la próxima temporada
  game.world.continental = continentalQualifiers(world, game.world.clubs, game.world.standings);

  // Valor de mercado y récords
  player.marketValue = marketValue(ovrEnd, age + 1, player.potential.hidden, game.world.clubs[ownClub]!.prestige);
  game.career.records.peakOverall = Math.max(game.career.records.peakOverall, ovrEnd);
  game.career.records.peakMarketValue = Math.max(game.career.records.peakMarketValue, player.marketValue);
  game.career.records.hatTricks += stats.reduce((s, c) => s + c.hatTricks, 0);

  const record: SeasonRecord = {
    season,
    age,
    clubId,
    divisionId: dyn.divisionId,
    onLoan: Boolean(contract.loanFrom),
    overallStart: ovrStart,
    overallEnd: ovrEnd,
    ...(position > 0 ? { leaguePosition: position } : {}),
    stats,
    marketValueEnd: player.marketValue,
    attributesEnd: { ...player.attributes },
    reputationEnd: { ...player.reputation },
    followersEnd: game.social.followers,
    ...(ntMatches.length ? { nationalStats: [...new Set(ntMatches.map((m) => m.competition))].map((c) => aggregate(ntMatches, c)).filter((x) => x.apps > 0) } : {}),
  };
  game.career.seasons.push(record);

  const summary: SeasonSummary = {
    season,
    clubId,
    divisionId: dyn.divisionId,
    ...(position > 0 ? { position, tableSize: table.length } : {}),
    champion: moves.champions.has(clubId),
    promoted: moves.promoted.has(clubId),
    relegated: moves.relegated.has(clubId),
    overallStart: ovrStart,
    overallEnd: ovrEnd,
    growth: delta,
    roleBefore,
    roleAfter: newContract.role,
    firstTeamPromotion,
    trophies,
    awards: aw.playerAwards,
    ...(cupRound ? { cupRound } : {}),
    ...(contRun ? { continental: { competitionId: contRun.competitionId, round: contRun.reached } } : {}),
    national: {
      caps: ntMatches.filter((m) => m.minutes > 0).length,
      goals: ntMatches.reduce((a, m) => a + m.goals, 0),
      ...(tournamentSummary ? { tournament: tournamentSummary } : {}),
    },
  };
  game.lastSummary = summary;

  evaluateAchievements(game, content);
  if (retirementDue(game)) retire(game, content);
}

/* ── Reputación ────────────────────────────────────────── */

/**
 * La reputación se acerca cada temporada a un objetivo que depende de la media, del rendimiento
 * y del prestigio del club. Los rasgos mueven las relaciones; la fama, los seguidores.
 */
function updateReputation(game: GameState, content: EngineContent, league: MatchLog[]): void {
  const p = game.player;
  const played = league.filter((m) => m.minutes > 0);
  const apps = played.length;
  const avg = apps ? played.reduce((s, m) => s + (m.rating ?? 6), 0) / apps : 6;
  const perf = (avg - 6.4) * Math.min(1, apps / 25);
  const ovr = overallFor(p.attributes, p.positions.main);
  const prestige = game.world.clubs[p.contract!.clubId]?.prestige ?? 40;
  const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
  const approach = (cur: number, target: number, k: number) => clamp(cur + (target - cur) * k);
  p.reputation.local = approach(p.reputation.local, (apps / 30) * 60 + perf * 20 + (prestige - 40) * 0.4, 0.5);
  p.reputation.national = approach(p.reputation.national, (ovr - 45) * 1.6 + perf * 15 + (prestige - 50) * 0.3, 0.45);
  p.reputation.world = approach(p.reputation.world, (ovr - 62) * 2.2 + perf * 10 + (prestige - 60) * 0.5, 0.35);

  const defs = p.traits.map((t) => content.traits.find((d) => d.id === t.id)).filter((d): d is TraitDef => !!d);
  for (const d of defs) {
    for (const [who, delta] of Object.entries(d.passive?.relationDrift ?? {})) {
      const k = who as keyof typeof p.relations;
      p.relations[k] = Math.max(-100, Math.min(100, p.relations[k] + (delta ?? 0) * 3));
    }
    if (d.passive?.morale) p.status.morale = Math.max(10, Math.min(100, p.status.morale + d.passive.morale * 2));
  }
  const followMult = defs.reduce((m, d) => m * (d.passive?.followersGrowth ?? 1), 1);
  const target = 50 * Math.pow(10, p.reputation.world / 25 + p.reputation.national / 60) * followMult;
  game.social.followers = Math.round(game.social.followers + (target - game.social.followers) * 0.5);
}

/** Tras cada vuelta: reacciones del entorno, consecuencias de las relaciones rotas y logros. */
function afterHalf(game: GameState, content: EngineContent, root: Rng): void {
  evaluateAchievements(game, content);
  reactions(game, content, root.fork('reactions:' + game.calendar.season + ':' + game.calendar.phase));
  for (const c of relationConsequences(game)) {
    game.inbox.unshift({ id: 'rc-' + game.calendar.season + '-' + game.inbox.length, season: game.calendar.season, phase: game.calendar.phase, source: 'system', headline: c.headline, tone: c.tone });
  }
}

/* ── Avance ────────────────────────────────────────────── */

/** Avanza una fase. Devuelve una copia nueva del estado (no modifica la original). */
export function advancePhase(input: GameState, content: EngineContent): GameState {
  if (input.retired) throw new Error('La carrera ha terminado');
  if (hasPendingEvent(input)) throw new Error('Hay una decisión pendiente');
  const game = structuredClone(input);
  if (Object.keys(game.world.clubs).length === 0) game.world.clubs = initialClubs(content.world);
  else if (game.calendar.phase === 'preseason') addMissingClubs(game, content);
  game.world.continental ??= continentalQualifiers(content.world, game.world.clubs, {});
  // Celebraciones iniciales (partidas creadas antes de la Fase 9).
  for (const id of ['puno', 'rodillas']) if (!game.player.celebrations.unlocked.includes(id)) game.player.celebrations.unlocked.push(id);
  if (!game.world.npcStars.length) game.world.npcStars = createNpcStars(content.world, game.world.clubs, content.names, game.seed, game.calendar.season);
  ensureClub(game, content.world);
  if (game.player.marketValue === 0) {
    const age = ageInSeason(game.player.identity.birthDate, game.calendar.season);
    const ovr = overallFor(game.player.attributes, game.player.positions.main);
    game.player.marketValue = marketValue(ovr, age, game.player.potential.hidden, game.world.clubs[game.player.contract!.clubId]?.prestige ?? 40);
  }
  const root = Rng.fromState(game.rngState);
  const phase = game.calendar.phase;

  if (phase === 'preseason') {
    game.flags['continental'] = Boolean(game.world.continental?.[game.player.contract!.clubId]);
    game.current = { season: game.calendar.season, overallStart: overallFor(game.player.attributes, game.player.positions.main), matches: [] };
    game.world.standings = {};
    simulateHalf(game, content, 1, root);
    afterHalf(game, content, root);
  } else if (phase === 'winterWindow') {
    game.current ??= { season: game.calendar.season, overallStart: overallFor(game.player.attributes, game.player.positions.main), matches: [] };
    simulateHalf(game, content, 2, root);
    afterHalf(game, content, root);
  } else if (phase === 'secondHalf') {
    closeSeason(game, content, root);
  } else if (phase === 'seasonEnd') {
    game.calendar.season += 1;
    game.world.standings = {};
    delete game.current;
    game.player.status.form = 60;
  }
  game.calendar.phase = NEXT_PHASE[phase];
  game.calendar.step = 0;
  delete game.lastOutcome;

  // Ofertas: solo en el mercado de invierno y al final de temporada.
  const next = game.calendar.phase;
  if (game.retired) {
    root.next();
    game.rngState = root.getState();
    return game;
  }
  game.offers = next === 'winterWindow' || next === 'seasonEnd' ? generateOffers(game, content.world, root.fork('offers:' + game.calendar.season + ':' + next)) : [];
  // Eventos de la nueva fase.
  queuePhaseEvents(game, content, root.fork('events:' + game.calendar.season + ':' + next));
  // Se consume un número para que cada fase parta de un estado distinto del generador.
  root.next();
  game.rngState = root.getState();
  return game;
}
