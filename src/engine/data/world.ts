/**
 * Construye el mundo estático (países, ligas, clubes) a partir de los archivos de /src/data.
 * Función pura: recibe los datos crudos y devuelve estructuras indexadas y normalizadas.
 */
import type { ClubId, CountryId, DivisionId } from '../types/common';
import type { Club, ClubSource, CountryLeagueFile, Division, Rivalry } from '../types/club';
import type { CompetitionDef, CountryDef } from '../types/definitions';

export interface RawGameData {
  countries: CountryDef[];
  competitions: CompetitionDef[];
  leagues: CountryLeagueFile<ClubSource>[];
  /** clubId → ruta del escudo descargado (lo genera scripts/fetch-crests.ts). */
  crests?: Record<ClubId, string>;
}

export interface DivisionInfo extends Division<Club> {
  country: CountryId;
}

export interface WorldData {
  countries: CountryDef[];
  competitions: CompetitionDef[];
  leagues: CountryLeagueFile<Club>[];
  countryById: Map<CountryId, CountryDef>;
  clubById: Map<ClubId, Club>;
  divisionById: Map<DivisionId, DivisionInfo>;
  /** División inicial de cada club. */
  divisionOfClub: Map<ClubId, DivisionId>;
}

/** Añade la rivalidad inversa si falta (A rival de B ⇒ B rival de A). */
function symmetricRivals(clubs: ClubSource[]): Map<ClubId, Rivalry[]> {
  const out = new Map<ClubId, Rivalry[]>();
  for (const c of clubs) out.set(c.id, [...(c.rivals ?? [])]);
  for (const c of clubs) {
    for (const r of c.rivals ?? []) {
      const back = out.get(r.clubId);
      if (back && !back.some((b) => b.clubId === c.id)) {
        back.push({ clubId: c.id, type: r.type, intensity: r.intensity, ...(r.name ? { name: r.name } : {}) });
      }
    }
  }
  return out;
}

export function buildWorldData(raw: RawGameData): WorldData {
  const allSources = raw.leagues.flatMap((l) => l.divisions.flatMap((d) => d.clubs));
  const rivals = symmetricRivals(allSources);
  const crests = raw.crests ?? {};

  const clubById = new Map<ClubId, Club>();
  const divisionById = new Map<DivisionId, DivisionInfo>();
  const divisionOfClub = new Map<ClubId, DivisionId>();

  const leagues: CountryLeagueFile<Club>[] = raw.leagues.map((league) => ({
    ...league,
    divisions: league.divisions.map((div) => {
      const clubs = div.clubs.map((src): Club => {
        // Los filiales sin escudo propio usan el del primer equipo.
        const file = src.crest?.file ?? crests[src.id] ?? (src.parentClubId ? crests[src.parentClubId] : undefined);
        const club: Club = {
          ...src,
          country: league.country,
          rivals: rivals.get(src.id) ?? [],
          ...(file || src.crest?.wiki ? { crest: { ...src.crest, ...(file ? { file } : {}) } } : {}),
        };
        clubById.set(club.id, club);
        divisionOfClub.set(club.id, div.id);
        return club;
      });
      const info: DivisionInfo = { ...div, clubs, country: league.country };
      divisionById.set(div.id, info);
      return info;
    }),
  }));

  return {
    countries: raw.countries,
    competitions: raw.competitions,
    leagues,
    countryById: new Map(raw.countries.map((c) => [c.id, c])),
    clubById,
    divisionById,
    divisionOfClub,
  };
}

/** Clubes de un país ordenados por división y prestigio. */
export function clubsOfCountry(world: WorldData, country: CountryId): Club[] {
  const league = world.leagues.find((l) => l.country === country);
  if (!league) return [];
  return [...league.divisions].sort((a, b) => a.tier - b.tier).flatMap((d) => [...d.clubs].sort((a, b) => b.prestige - a.prestige));
}

/** Clubes de una región (base de la lógica de cantera cercana de la Fase 3). */
export function clubsInRegion(world: WorldData, country: CountryId, region: string): Club[] {
  return clubsOfCountry(world, country).filter((c) => c.region === region);
}
