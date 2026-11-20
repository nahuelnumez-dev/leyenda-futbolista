/**
 * Cierre de temporada del mundo: ascensos, descensos, playoffs, reparto en grupos y prestigio dinámico.
 */
import type { Rng } from '../rng';
import type { ClubDynamic, DivisionGroup } from '../types/club';
import type { ClubId, SeasonYear } from '../types/common';
import type { LeagueHistoryEntry, StandingRow } from '../types/game';
import type { DivisionInfo, WorldData } from '../data/world';
import { sortTable, tableKey } from './league';

export interface SeasonMoves {
  promoted: Set<ClubId>;
  relegated: Set<ClubId>;
  champions: Set<ClubId>;
  history: LeagueHistoryEntry[];
}

/** Ganadores de un playoff: eliminatoria simulada, favorece al de más prestigio pero no siempre gana. */
function playoffWinners(rng: Rng, candidates: ClubId[], spots: number, clubs: Record<ClubId, ClubDynamic>): ClubId[] {
  const pool = [...candidates];
  const winners: ClubId[] = [];
  for (let i = 0; i < spots && pool.length; i++) {
    const w = rng.weighted(pool, (id) => Math.pow(clubs[id]?.prestige ?? 30, 2));
    winners.push(w);
    pool.splice(pool.indexOf(w), 1);
  }
  return winners;
}

/** Tablas finales de una división (una por grupo o una sola). */
function finalTables(div: DivisionInfo, standings: Record<string, StandingRow[]>, clubs: Record<ClubId, ClubDynamic>): { key: string; groupId?: string; rows: StandingRow[] }[] {
  const groupIds = [...new Set(Object.entries(clubs).filter(([, d]) => d.divisionId === div.id).map(([, d]) => d.groupId))];
  return groupIds.map((g) => {
    const key = tableKey(div.id, g);
    return { key, ...(g ? { groupId: g } : {}), rows: sortTable(standings[key] ?? []) };
  });
}

/**
 * Aplica ascensos y descensos de todos los países. Devuelve los cambios y modifica `clubs` (copia).
 * Reglas: la división más baja no desciende; los filiales no pueden subir a la división de su primer equipo
 * (sube el siguiente clasificado) y bajan si su primer equipo desciende a su división.
 */
export function applyPromotions(
  rng: Rng,
  world: WorldData,
  clubsIn: Record<ClubId, ClubDynamic>,
  standings: Record<string, StandingRow[]>,
  season: SeasonYear,
): { clubs: Record<ClubId, ClubDynamic>; moves: SeasonMoves } {
  const clubs: Record<ClubId, ClubDynamic> = structuredClone(clubsIn);
  const moves: SeasonMoves = { promoted: new Set(), relegated: new Set(), champions: new Set(), history: [] };

  for (const league of world.leagues) {
    const divisions = (league.divisions as DivisionInfo[]).slice().sort((a, b) => a.tier - b.tier);
    const tables = new Map(divisions.map((d) => [d.id, finalTables(d, standings, clubs)]));
    const down = new Map<string, ClubId[]>(); // divisionId → clubes que bajan desde ella
    const up = new Map<string, ClubId[]>(); // divisionId → clubes que suben desde ella

    // 1. Descensos (por grupo)
    for (const div of divisions) {
      const n = div.relegation?.direct ?? 0;
      const list: ClubId[] = [];
      for (const t of tables.get(div.id) ?? []) list.push(...t.rows.slice(t.rows.length - n).map((r) => r.clubId));
      down.set(div.id, list);
    }

    // Tier del primer equipo la temporada que viene (para la regla de filiales).
    const nextTierOf = (id: ClubId): number | undefined => {
      const d = clubs[id];
      if (!d) return undefined;
      const tier = world.divisionById.get(d.divisionId)?.tier ?? 9;
      if (down.get(d.divisionId)?.includes(id)) return tier + 1;
      if (up.get(d.divisionId)?.includes(id)) return tier - 1;
      return tier;
    };

    // 2. Ascensos (de arriba abajo para conocer el destino de los primeros equipos)
    for (const div of divisions) {
      const rule = div.promotion;
      if (!rule || div.tier === 1) continue;
      const targetTier = div.tier - 1;
      const list: ClubId[] = [];
      for (const t of tables.get(div.id) ?? []) {
        const eligible = t.rows.filter((r) => {
          const parent = world.clubById.get(r.clubId)?.parentClubId;
          return !parent || (nextTierOf(parent) ?? 9) < targetTier;
        });
        const direct = eligible.slice(0, rule.direct).map((r) => r.clubId);
        let fromPlayoff: ClubId[] = [];
        if (rule.playoff && rule.playoffSpots) {
          const [from, to] = rule.playoff;
          const cands = eligible.slice(rule.direct).slice(0, to - from + 1).map((r) => r.clubId);
          fromPlayoff = playoffWinners(rng.fork(`playoff:${season}:${t.key}`), cands, rule.playoffSpots, clubs);
        }
        list.push(...direct, ...fromPlayoff);
      }
      up.set(div.id, list);
    }

    // 3. Filiales que se encuentran con su primer equipo recién descendido: bajan ellos y se salva el mejor descendido.
    for (const div of divisions) {
      const comingDown = divisions.find((d) => d.tier === div.tier - 1);
      if (!comingDown) continue;
      const arriving = down.get(comingDown.id) ?? [];
      const staying = Object.entries(clubs)
        .filter(([id, d]) => d.divisionId === div.id && !(up.get(div.id) ?? []).includes(id) && !(down.get(div.id) ?? []).includes(id))
        .map(([id]) => id);
      for (const bTeam of staying) {
        const parent = world.clubById.get(bTeam)?.parentClubId;
        if (!parent || !arriving.includes(parent)) continue;
        const relegatedHere = down.get(div.id) ?? [];
        if (!relegatedHere.length) continue; // división más baja: no hay a quién salvar
        const rows = (tables.get(div.id) ?? []).flatMap((t) => t.rows).map((r) => r.clubId);
        const best = relegatedHere.slice().sort((a, b) => rows.indexOf(a) - rows.indexOf(b))[0]!;
        down.set(div.id, [...relegatedHere.filter((id) => id !== best), bTeam]);
      }
    }

    // 4. Movimientos y reparto en grupos
    for (const div of divisions) {
      const lower = divisions.find((d) => d.tier === div.tier + 1);
      const upper = divisions.find((d) => d.tier === div.tier - 1);
      for (const id of down.get(div.id) ?? []) {
        if (!lower) continue;
        clubs[id] = { ...clubs[id]!, divisionId: lower.id };
        delete clubs[id]!.groupId;
        moves.relegated.add(id);
      }
      for (const id of up.get(div.id) ?? []) {
        if (!upper) continue;
        clubs[id] = { ...clubs[id]!, divisionId: upper.id };
        delete clubs[id]!.groupId;
        moves.promoted.add(id);
      }
    }
    for (const div of divisions) if (div.groups) assignGroups(div, div.groups, clubs, world);

    // 5. Campeones e historial
    for (const div of divisions) {
      for (const t of tables.get(div.id) ?? []) {
        const champ = t.rows[0]?.clubId;
        if (!champ) continue;
        moves.champions.add(champ);
        moves.history.push({
          season,
          divisionId: t.key,
          championId: champ,
          promoted: (up.get(div.id) ?? []).filter((id) => t.rows.some((r) => r.clubId === id)),
          relegated: (down.get(div.id) ?? []).filter((id) => t.rows.some((r) => r.clubId === id)),
        });
      }
    }
  }
  return { clubs, moves };
}

/** Reparte en grupos a los clubes sin grupo, buscando el grupo con hueco y más clubes de su región. */
function assignGroups(div: DivisionInfo, groups: DivisionGroup[], clubs: Record<ClubId, ClubDynamic>, world: WorldData): void {
  const members = Object.entries(clubs).filter(([, d]) => d.divisionId === div.id);
  const total = members.length;
  const capacity = Math.ceil(total / groups.length);
  const count = new Map(groups.map((g) => [g.id, members.filter(([, d]) => d.groupId === g.id).length]));
  const unassigned = members.filter(([, d]) => !d.groupId).map(([id]) => id);
  for (const id of unassigned) {
    const region = world.clubById.get(id)?.region;
    const options = groups.filter((g) => (count.get(g.id) ?? 0) < capacity);
    const score = (g: DivisionGroup) =>
      members.filter(([other, d]) => d.groupId === g.id && world.clubById.get(other)?.region === region).length;
    const best = (options.length ? options : groups).slice().sort((a, b) => score(b) - score(a) || (count.get(a.id) ?? 0) - (count.get(b.id) ?? 0))[0]!;
    clubs[id] = { ...clubs[id]!, groupId: best.id };
    count.set(best.id, (count.get(best.id) ?? 0) + 1);
  }
}

/**
 * Prestigio dinámico: sube si el club queda por encima de lo esperado, baja si queda por debajo,
 * y cambia con el ascenso o descenso. Vuelve poco a poco a su prestigio histórico.
 */
export function updatePrestige(
  world: WorldData,
  clubs: Record<ClubId, ClubDynamic>,
  standings: Record<string, StandingRow[]>,
  moves: SeasonMoves,
): Record<ClubId, ClubDynamic> {
  const out = structuredClone(clubs);
  for (const rows of Object.values(standings)) {
    const sorted = sortTable(rows);
    const byPrestige = [...sorted].sort((a, b) => (clubs[b.clubId]?.prestige ?? 0) - (clubs[a.clubId]?.prestige ?? 0));
    const n = sorted.length;
    sorted.forEach((row, i) => {
      const d = out[row.clubId];
      const base = world.clubById.get(row.clubId);
      if (!d || !base) return;
      const expected = byPrestige.findIndex((r) => r.clubId === row.clubId);
      let delta = ((expected - i) / Math.max(1, n - 1)) * 4;
      if (moves.promoted.has(row.clubId)) delta += 3;
      if (moves.relegated.has(row.clubId)) delta -= 3;
      if (moves.champions.has(row.clubId)) delta += 1.5;
      const prestige = d.prestige + delta + (base.prestige - d.prestige) * 0.1;
      d.prestige = Math.round(Math.min(99, Math.max(5, prestige)) * 10) / 10;
      let budget = d.budgetM;
      if (moves.promoted.has(row.clubId)) budget *= 1.25;
      if (moves.relegated.has(row.clubId)) budget *= 0.8;
      budget += (base.budgetM - budget) * 0.1;
      d.budgetM = Math.round(Math.max(0.3, budget) * 10) / 10;
    });
  }
  return out;
}
