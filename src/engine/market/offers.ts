/**
 * Mercado: ofertas de traspaso, cesión y renovación, y su aceptación.
 * Las ofertas llegan en el mercado de invierno y al terminar la temporada (y cuando un evento las provoca).
 */
import type { Rng } from '../rng';
import type { WorldData } from '../data/world';
import type { Club } from '../types/club';
import type { ClubId } from '../types/common';
import type { Comparison } from '../types/events';
import type { GameState, Offer } from '../types/game';
import type { SquadRole } from '../types/player';
import { overallFor } from '../player/overall';
import { teamLevel } from '../season/league';
import { ageInSeason } from '../world/newGame';
import { nudgeTendency } from '../personality/personality';
import { queueCinematic } from '../cinematics/cinematics';

/** Rol según la media frente al nivel del equipo (misma escala que el motor de temporada). */
function roleAt(overall: number, level: number, age: number): SquadRole {
  const diff = overall - level;
  if (diff >= 6) return 'estrella';
  if (diff >= -2) return 'titular';
  if (diff >= -8) return 'rotacion';
  return age <= 21 ? 'promesa' : 'rotacion';
}

function salaryAt(overall: number, budgetM: number): number {
  const raw = Math.pow(1.12, overall - 45) * 12_000 * (0.6 + Math.min(1000, budgetM) / 250);
  return Math.round(raw / 1000) * 1000;
}

const inRange = (v: number, c?: Comparison) => !c || ((c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max));

export interface OfferRequest {
  kind?: Offer['kind'];
  clubPrestige?: Comparison;
  sameCountry?: boolean;
  /** Número máximo de ofertas de traspaso/cesión. */
  max?: number;
}

/** Clubes relacionados (primer equipo y filial) que no pueden ficharse entre sí. */
function related(world: WorldData, a: ClubId, b: ClubId): boolean {
  const ca = world.clubById.get(a);
  const cb = world.clubById.get(b);
  return a === b || ca?.parentClubId === b || cb?.parentClubId === a || (Boolean(ca?.parentClubId) && ca?.parentClubId === cb?.parentClubId);
}

/**
 * Genera ofertas según la media, la edad, la reputación, los contactos del agente y el presupuesto de cada club.
 */
export function generateOffers(game: GameState, world: WorldData, rng: Rng, req: OfferRequest = {}): Offer[] {
  const p = game.player;
  const contract = p.contract;
  if (!contract) return [];
  const season = game.calendar.season;
  const phase = game.calendar.phase;
  const age = ageInSeason(p.identity.birthDate, season);
  const ovr = overallFor(p.attributes, p.positions.main);
  const currentId = contract.loanFrom ?? contract.clubId;
  const currentCountry = world.clubById.get(currentId)?.country;
  const currentLevel = teamLevel(game.world.clubs[contract.clubId]?.prestige ?? 40);
  const offers: Offer[] = [];
  const id = (kind: string, club: string) => `${season}-${phase}-${kind}-${club}`;

  // Renovación: último año de contrato (no en cesión).
  if ((!req.kind || req.kind === 'renewal') && !contract.loanFrom && contract.role !== 'cantera' && contract.endSeason - season <= 1) {
    const dyn = game.world.clubs[currentId];
    offers.push({
      id: id('renewal', currentId),
      kind: 'renewal',
      clubId: currentId,
      fee: 0,
      salary: Math.max(contract.salary, Math.round(salaryAt(ovr, dyn?.budgetM ?? 10) * rng.float(1, 1.2) / 1000) * 1000),
      years: age <= 28 ? rng.int(3, 4) : rng.int(1, 2),
      role: roleAt(ovr, currentLevel, age + 1),
      season,
      phase,
    });
  }
  if (req.kind === 'renewal') return offers;
  if (contract.role === 'cantera' && !req.kind) return offers;

  // Recién llegado: no hay traspasos ni cesiones hasta cumplir una temporada (salvo que pida salir).
  const lastMove = game.career.spells.filter((sp) => sp.type !== 'academy').at(-1);
  const settled = !lastMove || season - lastMove.fromSeason >= 1 || (phase === 'seasonEnd' && lastMove.fromSeason <= season);
  if (!settled && !game.flags['transferRequest']) return offers;

  const foreignAppeal = 0.12 + p.reputation.world / 120 + (p.agent?.connections ?? 20) / 250;
  const requested = Boolean(game.flags['transferRequest']);
  const candidates: { club: Club; weight: number }[] = [];
  for (const club of world.clubById.values()) {
    if (related(world, club.id, currentId) || club.parentClubId) continue;
    const dyn = game.world.clubs[club.id];
    if (!dyn) continue;
    if (!inRange(dyn.prestige, req.clubPrestige)) continue;
    if (req.sameCountry && club.country !== currentCountry) continue;
    const level = teamLevel(dyn.prestige);
    // Le quieren si sería al menos rotación y el club puede pagarlo.
    if (ovr < level - 7 || ovr > level + 9) continue;
    if (p.marketValue > dyn.budgetM * 1_000_000 * 0.45) continue;
    const country = club.country === currentCountry ? 1 : foreignAppeal;
    candidates.push({ club, weight: Math.pow(dyn.prestige, 1.6) * country });
  }
  // Con muchas ligas en el juego, el extranjero en conjunto pesaría demasiado: su peso total se reparte como si
  // hubiera tres países extranjeros (lo que mejor equilibra ofertas nacionales e internacionales).
  const foreignCountries = new Set(candidates.filter((c) => c.club.country !== currentCountry).map((c) => c.club.country)).size;
  const foreignScale = Math.min(1, 3 / Math.max(1, foreignCountries));
  for (const c of candidates) if (c.club.country !== currentCountry) c.weight *= foreignScale;

  // Traspasos: más ofertas con buena reputación o si pidió salir.
  const wantsTransfer = !req.kind || req.kind === 'transfer';
  const expected = (p.reputation.national / 40 + (requested ? 1.2 : 0) + (ovr > currentLevel + 4 ? 1 : 0)) * (age > 33 ? 0.3 : 1);
  const nTransfers = Math.min(req.max ?? 3, wantsTransfer ? Math.floor(expected + rng.float(0, 1.2)) : 0);
  const pool = [...candidates];
  for (let i = 0; i < nTransfers && pool.length; i++) {
    const pick = rng.weighted(pool, (c) => c.weight);
    pool.splice(pool.indexOf(pick), 1);
    const dyn = game.world.clubs[pick.club.id]!;
    const yearsLeft = Math.max(0, contract.endSeason - season);
    const fee = Math.round((p.marketValue * rng.float(0.85, 1.3) * (yearsLeft === 0 ? 0.25 : 1)) / 100_000) * 100_000;
    offers.push({
      id: id('transfer', pick.club.id),
      kind: 'transfer',
      clubId: pick.club.id,
      fee: Math.max(0, fee),
      salary: Math.round(salaryAt(ovr, dyn.budgetM) * rng.float(1.05, 1.4) / 1000) * 1000,
      years: age <= 23 ? rng.int(4, 5) : age <= 29 ? rng.int(3, 4) : rng.int(1, 2),
      role: roleAt(ovr, teamLevel(dyn.prestige), age),
      season,
      phase,
    });
  }

  // Cesiones: jóvenes con pocos minutos.
  const wantsLoan = (!req.kind && age <= 23 && (contract.role === 'promesa' || contract.role === 'rotacion')) || req.kind === 'loan';
  if (wantsLoan && !contract.loanFrom) {
    const loanPool = candidates.filter((c) => {
      const lvl = teamLevel(game.world.clubs[c.club.id]!.prestige);
      return lvl <= currentLevel && ovr >= lvl - 4;
    });
    const n = Math.min(req.max ?? 2, loanPool.length, 1 + (rng.chance(0.5) ? 1 : 0));
    for (let i = 0; i < n; i++) {
      const pick = rng.weighted(loanPool, (c) => c.weight);
      loanPool.splice(loanPool.indexOf(pick), 1);
      const dyn = game.world.clubs[pick.club.id]!;
      offers.push({
        id: id('loan', pick.club.id),
        kind: 'loan',
        clubId: pick.club.id,
        fee: 0,
        salary: contract.salary,
        years: 1,
        role: roleAt(ovr, teamLevel(dyn.prestige), age),
        season,
        phase,
      });
    }
  }
  return offers;
}

/**
 * Acepta una oferta: cambia el contrato y el historial de clubes.
 * En el mercado de invierno el cambio es inmediato; al final de temporada, desde la siguiente.
 */
export function acceptOffer(game: GameState, offer: Offer, world: WorldData): void {
  const p = game.player;
  const contract = p.contract!;
  const season = game.calendar.season;
  const from = game.calendar.phase === 'seasonEnd' ? season + 1 : season;
  const leavingId = contract.loanFrom ?? contract.clubId;

  if (offer.kind === 'renewal') {
    p.contract = { ...contract, startSeason: from, endSeason: season + offer.years, salary: offer.salary, role: offer.role };
    p.relations.board = Math.min(100, p.relations.board + 10);
    p.relations.fans = Math.min(100, p.relations.fans + 5);
    return;
  }

  const closeOpen = (reason: 'transfer' | 'loanEnd') => {
    for (const s of game.career.spells) {
      if (s.toSeason === undefined && (s.clubId === contract.clubId || s.clubId === leavingId)) {
        s.toSeason = game.calendar.phase === 'seasonEnd' ? season : season;
        s.endReason = reason;
        if (reason === 'transfer' && s.clubId === leavingId) s.feeOut = offer.fee;
      }
    }
  };

  if (offer.kind === 'transfer') {
    closeOpen('transfer');
    p.contract = {
      clubId: offer.clubId,
      startSeason: from,
      endSeason: from + offer.years - 1,
      salary: offer.salary,
      role: offer.role,
      shirtNumber: p.preferredNumber,
    };
    game.career.spells.push({ clubId: offer.clubId, type: 'permanent', fromSeason: from, feeIn: offer.fee, highlights: [] });
    game.career.records.biggestTransferFee = Math.max(game.career.records.biggestTransferFee, offer.fee);
  } else {
    p.contract = {
      clubId: offer.clubId,
      startSeason: from,
      endSeason: from,
      salary: offer.salary,
      role: offer.role,
      shirtNumber: p.preferredNumber,
      loanFrom: leavingId,
      loanReturn: { endSeason: contract.endSeason, salary: contract.salary, role: contract.role, shirtNumber: contract.shirtNumber },
    };
    game.career.spells.push({ clubId: offer.clubId, type: 'loan', fromSeason: from, highlights: [] });
  }
  // Club nuevo: relaciones desde cero (salvo familia, agente y prensa).
  p.relations.coach = 10;
  p.relations.dressingRoom = 0;
  p.relations.fans = 5;
  p.relations.board = 10;
  delete game.flags['transferRequest'];
  void world;
}

/** Al terminar una cesión, vuelve a su club con el contrato que tenía. */
export function returnFromLoan(game: GameState): boolean {
  const c = game.player.contract;
  if (!c?.loanFrom || c.endSeason > game.calendar.season) return false;
  const back = c.loanReturn;
  for (const s of game.career.spells) {
    if (s.toSeason === undefined && s.type === 'loan' && s.clubId === c.clubId) {
      s.toSeason = game.calendar.season;
      s.endReason = 'loanEnd';
    }
  }
  game.player.contract = {
    clubId: c.loanFrom,
    startSeason: game.calendar.season + 1,
    endSeason: Math.max(back?.endSeason ?? game.calendar.season + 1, game.calendar.season + 1),
    salary: back?.salary ?? c.salary,
    role: back?.role ?? c.role,
    shirtNumber: back?.shirtNumber ?? c.shirtNumber,
  };
  return true;
}

/**
 * Responde a una oferta. Aceptar un traspaso o una cesión anula el resto de ofertas;
 * rechazar una renovación molesta un poco a la directiva.
 */
export function respondToOffer(input: GameState, offerId: string, accept: boolean, world: WorldData): GameState {
  const game = structuredClone(input);
  const offer = game.offers?.find((o) => o.id === offerId);
  if (!offer) return game;
  const club = world.clubById.get(offer.clubId);
  if (accept) {
    nudgeTendency(game, 'lealtad', offer.kind === 'renewal' ? 8 : offer.kind === 'transfer' ? -6 : 0);
    acceptOffer(game, offer, world);
    if (offer.kind !== 'renewal') queueCinematic(game, { type: offer.kind === 'loan' ? 'loan' : 'transfer', importance: offer.kind === 'loan' ? 'minor' : 'major', clubId: offer.clubId, value: offer.fee });
    game.offers = offer.kind === 'renewal' ? (game.offers ?? []).filter((o) => o.id !== offerId) : [];
    const headline =
      offer.kind === 'renewal'
        ? `${game.player.identity.name} renueva con ${club?.shortName ?? ''} hasta ${game.player.contract?.endSeason ?? ''}`
        : offer.kind === 'loan'
          ? `${game.player.identity.name}, cedido a ${club?.shortName ?? ''}`
          : `${game.player.identity.name} ficha por ${club?.shortName ?? ''}`;
    game.inbox.unshift({ id: `offer-${offer.id}`, season: game.calendar.season, phase: game.calendar.phase, source: 'press', headline, tone: 'positive' });
  } else {
    game.offers = (game.offers ?? []).filter((o) => o.id !== offerId);
    const current = game.world.clubs[game.player.contract?.clubId ?? '']?.prestige ?? 0;
    if (offer.kind === 'transfer' && (game.world.clubs[offer.clubId]?.prestige ?? 0) > current) nudgeTendency(game, 'lealtad', 5);
    if (offer.kind === 'renewal') game.player.relations.board = Math.max(-100, game.player.relations.board - 5);
  }
  return game;
}
