/**
 * Pruebas de cantera según el lugar de nacimiento.
 * Los clubes cercanos (misma ciudad, misma región) son más probables y más fáciles de entrar;
 * las grandes canteras del país están al alcance solo de los más talentosos.
 */
import { Rng } from '../rng';
import type { Club } from '../types/club';
import type { CountryId } from '../types/common';
import type { WorldData } from '../data/world';

export type Proximity = 'ciudad' | 'region' | 'pais' | 'extranjero';

export interface AcademyOption {
  clubId: string;
  /** Probabilidad de superar la prueba (0-1). */
  chance: number;
  proximity: Proximity;
  /** Por qué aparece: club local, grande de la región, cantera de élite, ojeador. */
  kind: 'local' | 'regional' | 'elite' | 'ojeador';
}

export interface AcademyChoice {
  options: AcademyOption[];
  /** Club seguro si no se supera la prueba. */
  fallback: AcademyOption;
}

const PROXIMITY_BONUS: Record<Proximity, number> = { ciudad: 0.12, region: 0.06, pais: 0, extranjero: -0.1 };

/** Países cuyas canteras están al alcance de alguien nacido en `country`. */
export function academyCountries(world: WorldData, country: CountryId): CountryId[] {
  const def = world.countryById.get(country);
  const withLeagues = new Set(world.leagues.map((l) => l.country));
  if (withLeagues.has(country)) return [country];
  const neighbours = (def?.neighbours ?? []).filter((c) => withLeagues.has(c));
  if (neighbours.length) return neighbours;
  // Sin vecinos con liga: la liga más cercana de su confederación.
  if (def?.id === 'SCO' || def?.id === 'IRL' || def?.id === 'NIR' || def?.id === 'WAL') return ['ENG'];
  const PREFERRED: Partial<Record<string, CountryId[]>> = { CONMEBOL: ['ARG', 'BRA'], AFC: ['JPN', 'KOR'], CONCACAF: ['MEX', 'USA'] };
  const sameConf = (PREFERRED[def?.confederation ?? ''] ?? []).filter((c) => withLeagues.has(c));
  return sameConf.length ? sameConf : ['ESP'];
}

function proximityOf(club: Club, birth: { country: CountryId; region: string; city: string }): Proximity {
  if (club.city === birth.city && club.region === birth.region) return 'ciudad';
  if (club.region === birth.region) return 'region';
  if (club.country === birth.country) return 'pais';
  return 'extranjero';
}

/** Dificultad de entrar en la cantera (0-100). */
export function academyDifficulty(club: Club): number {
  return 0.5 * club.academy + 0.5 * club.prestige;
}

/** Probabilidad de superar la prueba según talento, dificultad y cercanía. */
export function trialChance(potential: number, club: Club, proximity: Proximity): number {
  const base = 1 / (1 + Math.exp(-(potential - academyDifficulty(club)) / 7));
  const p = base + PROXIMITY_BONUS[proximity];
  return Math.round(Math.min(0.95, Math.max(0.05, p)) * 100) / 100;
}

/**
 * Ofrece hasta 4 pruebas: club local, grande de la región, cantera de élite del país y la apuesta de un ojeador.
 * Determinista para una semilla y un lugar de nacimiento.
 */
export function academyOptions(
  world: WorldData,
  birth: { country: CountryId; region: string; city: string },
  potential: number,
  seed: string,
): AcademyChoice {
  const rng = Rng.fromSeed(seed).fork(`academy:${birth.country}:${birth.region}:${birth.city}`);
  const countries = academyCountries(world, birth.country);
  // Los filiales no tienen cantera propia: la cantera es la del primer equipo.
  const pool = [...world.clubById.values()].filter((c) => countries.includes(c.country) && !c.parentClubId);
  // Clubes de la misma región aunque estén en otro país (Gales, Andorra).
  const sameRegionAbroad = [...world.clubById.values()].filter(
    (c) => !countries.includes(c.country) && c.region === birth.region && !c.parentClubId,
  );
  const all = [...pool, ...sameRegionAbroad];
  const prox = new Map(all.map((c) => [c.id, proximityOf(c, birth)]));
  const near = all.filter((c) => prox.get(c.id) === 'ciudad' || prox.get(c.id) === 'region');

  const chosen: AcademyOption[] = [];
  const take = (club: Club | undefined, kind: AcademyOption['kind']) => {
    if (!club || chosen.some((o) => o.clubId === club.id)) return;
    const proximity = prox.get(club.id) ?? 'extranjero';
    chosen.push({ clubId: club.id, chance: trialChance(potential, club, proximity), proximity, kind });
  };

  // 1. Club local: la mejor cantera de la ciudad (o de la región).
  const city = near.filter((c) => prox.get(c.id) === 'ciudad');
  const localPool = city.length ? city : near;
  if (localPool.length) take(rng.weighted(localPool, (c) => c.academy ** 2), 'local');

  // 2. El grande de la región.
  const regional = [...near].sort((a, b) => b.prestige - a.prestige).find((c) => !chosen.some((o) => o.clubId === c.id));
  take(regional, 'regional');

  // 3. Cantera de élite del país (entre las 8 mejores).
  const elitePool = [...pool]
    .sort((a, b) => academyDifficulty(b) - academyDifficulty(a))
    .slice(0, 8)
    .filter((c) => !chosen.some((o) => o.clubId === c.id));
  if (elitePool.length) take(rng.weighted(elitePool, (c) => c.academy), 'elite');

  // 4. Un ojeador de otro club de primera o segunda división.
  // Si faltan opciones (nacidos fuera de los países con liga), más ojeadores hasta tener al menos 3.
  const tierOf = (c: Club) => world.divisionById.get(world.divisionOfClub.get(c.id) ?? '')?.tier ?? 3;
  do {
    const scoutPool = pool.filter((c) => !chosen.some((o) => o.clubId === c.id) && tierOf(c) <= 2);
    if (!scoutPool.length) break;
    take(rng.weighted(scoutPool, (c) => c.academy), 'ojeador');
  } while (chosen.length < 3);

  // Plan B seguro: el club cercano más accesible (o el más modesto del país), distinto de las pruebas.
  const notOffered = (c: Club) => !chosen.some((o) => o.clubId === c.id);
  const byEase = (list: Club[]) => [...list].sort((a, b) => academyDifficulty(a) - academyDifficulty(b));
  const easiest = byEase(near.filter(notOffered))[0] ?? byEase(pool.filter(notOffered))[0] ?? byEase(pool)[0]!;
  const fallback: AcademyOption = {
    clubId: easiest.id,
    chance: 1,
    proximity: prox.get(easiest.id) ?? 'pais',
    kind: 'local',
  };

  return { options: chosen.sort((a, b) => b.chance - a.chance), fallback };
}

/** Resultado de la prueba. Determinista: repetir la misma prueba con la misma semilla da el mismo resultado. */
export function rollTrial(seed: string, option: AcademyOption): boolean {
  if (option.chance >= 1) return true;
  return Rng.fromSeed(seed).fork(`trial:${option.clubId}`).chance(option.chance);
}
