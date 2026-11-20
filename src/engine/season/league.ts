/**
 * Calendario (todos contra todos), simulación de partidos (Poisson) y clasificaciones.
 */
import type { Rng } from '../rng';
import type { ClubId, DivisionId } from '../types/common';
import type { StandingRow } from '../types/game';

/** Clave de una tabla: división o división#grupo. */
export function tableKey(divisionId: DivisionId, groupId?: string): string {
  return groupId ? `${divisionId}#${groupId}` : divisionId;
}

export function parseTableKey(key: string): { divisionId: DivisionId; groupId?: string } {
  const [divisionId, groupId] = key.split('#') as [string, string | undefined];
  return groupId ? { divisionId, groupId } : { divisionId };
}

export type Fixture = [home: ClubId, away: ClubId];

/**
 * Jornadas de una liga por el método del círculo. Con `rounds = 2`, la segunda vuelta invierte los campos.
 * Si hay un número impar de equipos, uno descansa cada jornada.
 */
export function roundRobin(clubIds: ClubId[], rounds: 1 | 2): Fixture[][] {
  const teams: (ClubId | null)[] = [...clubIds];
  if (teams.length % 2 === 1) teams.push(null);
  const n = teams.length;
  const first: Fixture[][] = [];
  for (let r = 0; r < n - 1; r++) {
    const day: Fixture[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i];
      const b = teams[n - 1 - i];
      if (a && b) day.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    first.push(day);
    // Rotación: el primero queda fijo.
    teams.splice(1, 0, teams.pop()!);
  }
  if (rounds === 1) return first;
  return [...first, ...first.map((day) => day.map(([h, a]) => [a, h] as Fixture))];
}

/** Nivel medio esperado de los titulares de un club según su prestigio (≈58 a 89). */
export function teamLevel(prestige: number): number {
  return 44 + prestige * 0.45;
}

const BASE_GOALS = 1.32;
const HOME_ADVANTAGE = 1.15;

/** Goles esperados de un equipo frente a otro (fuerza = nivel de equipo). */
export function expectedGoals(attack: number, defence: number, home: boolean): number {
  return BASE_GOALS * Math.exp((attack - defence) / 22) * (home ? HOME_ADVANTAGE : 1 / HOME_ADVANTAGE);
}

export function simulateScore(rng: Rng, homeLevel: number, awayLevel: number): [number, number] {
  const hg = rng.poisson(Math.min(5, expectedGoals(homeLevel, awayLevel, true)));
  const ag = rng.poisson(Math.min(5, expectedGoals(awayLevel, homeLevel, false)));
  return [hg, ag];
}

export function emptyRow(clubId: ClubId): StandingRow {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

export function applyResult(table: Map<ClubId, StandingRow>, home: ClubId, away: ClubId, hg: number, ag: number): void {
  const h = table.get(home);
  const a = table.get(away);
  if (!h || !a) return;
  h.played++;
  a.played++;
  h.goalsFor += hg;
  h.goalsAgainst += ag;
  a.goalsFor += ag;
  a.goalsAgainst += hg;
  if (hg > ag) {
    h.won++;
    h.points += 3;
    a.lost++;
  } else if (hg < ag) {
    a.won++;
    a.points += 3;
    h.lost++;
  } else {
    h.drawn++;
    a.drawn++;
    h.points++;
    a.points++;
  }
}

/** Orden: puntos, diferencia de goles, goles a favor, id (estable). */
export function sortTable(rows: StandingRow[]): StandingRow[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.clubId.localeCompare(b.clubId),
  );
}
