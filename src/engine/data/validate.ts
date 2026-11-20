/**
 * Validador de los datos del juego. Detecta errores de estructura y de coherencia
 * (ids repetidos, rivales inexistentes, ascensos y descensos descuadrados...).
 * Se ejecuta con `npm run validate:data` (y dentro de `npm test`).
 */
import type { ClubSource, CountryLeagueFile, DivisionGroup, PromotionRule } from '../types/club';
import { competitionSchema, countrySchema, leagueFileSchema } from './schema';
import type { RawGameData } from './world';

export interface ValidationReport {
  /** Rompen el juego: el test falla. */
  errors: string[];
  /** Raro pero jugable (p. ej. ciudad que no está en la lista de su región). */
  warnings: string[];
  /** Datos marcados `needsReview`, para listarlos en DECISIONES.md. */
  review: string[];
  stats: { countries: number; divisions: number; clubs: number };
}

function zodIssues(prefix: string, result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): string[] {
  if (result.success || !result.error) return [];
  return result.error.issues.slice(0, 10).map((i) => `${prefix}: ${i.path.map(String).join('.')} → ${i.message}`);
}

/** Plazas que suben desde una división (por grupo × nº de grupos). */
function promotedCount(rule: PromotionRule | undefined, groups: DivisionGroup[] | undefined): number {
  if (!rule) return 0;
  const perGroup = rule.direct + (rule.playoffSpots ?? 0);
  return perGroup * Math.max(1, groups?.length ?? 1);
}

export function validateGameData(raw: RawGameData): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const review: string[] = [];

  // Países
  const countryIds = new Set<string>();
  for (const c of raw.countries) {
    errors.push(...zodIssues(`país ${c.id ?? '?'}`, countrySchema.safeParse(c)));
    if (countryIds.has(c.id)) errors.push(`país repetido: ${c.id}`);
    countryIds.add(c.id);
  }
  for (const c of raw.countries) {
    for (const n of c.neighbours) if (!countryIds.has(n)) warnings.push(`${c.id}: vecino ${n} no está en countries.json`);
  }

  // Competiciones
  const competitionIds = new Set<string>();
  for (const comp of raw.competitions) {
    errors.push(...zodIssues(`competición ${comp.id ?? '?'}`, competitionSchema.safeParse(comp)));
    if (competitionIds.has(comp.id)) errors.push(`competición repetida: ${comp.id}`);
    competitionIds.add(comp.id);
  }

  // Ligas
  const clubIds = new Set<string>();
  const divisionIds = new Set<string>();
  const allClubs: { club: ClubSource; divisionId: string; country: string }[] = [];
  const leagueCountries = new Set<string>();

  for (const league of raw.leagues as CountryLeagueFile<ClubSource>[]) {
    const where = `liga ${league.country}`;
    const parsed = leagueFileSchema.safeParse(league);
    errors.push(...zodIssues(where, parsed));
    if (!parsed.success) continue;

    if (leagueCountries.has(league.country)) errors.push(`${where}: archivo de liga repetido`);
    leagueCountries.add(league.country);

    const country = raw.countries.find((c) => c.id === league.country);
    if (!country) errors.push(`${where}: el país no está en countries.json`);
    else if (!country.hasLeagues) errors.push(`${where}: el país tiene hasLeagues=false`);
    const prefix = `${league.country.toLowerCase()}.`;
    const regionNames = new Map((country?.regions ?? []).map((r) => [r.name, r]));
    if (league.needsReview) review.push(`${league.country}: archivo marcado para revisión`);

    for (const cup of league.cups ?? []) if (!competitionIds.has(cup)) errors.push(`${where}: copa ${cup} no está en competitions.json`);
    const topSize = league.divisions.find((d) => d.tier === 1)?.clubs.length ?? 0;
    for (const slot of league.continental ?? []) {
      const comp = raw.competitions.find((c) => c.id === slot.competitionId);
      if (!comp) errors.push(`${where}: competición continental ${slot.competitionId} no está en competitions.json`);
      else if (comp.type !== 'continental') errors.push(`${where}: ${slot.competitionId} no es una competición continental`);
      else if (country && comp.confederation !== country.confederation) errors.push(`${where}: ${slot.competitionId} es de otra confederación`);
      if (slot.from > slot.to || slot.to > topSize) errors.push(`${where}: plazas ${slot.from}-${slot.to} de ${slot.competitionId} fuera de rango`);
    }

    // Escalones 1..n sin huecos
    const tiers = league.divisions.map((d) => d.tier).sort();
    tiers.forEach((t, i) => {
      if (t !== i + 1) errors.push(`${where}: las divisiones deben tener tiers 1..${tiers.length} sin repetir (hay ${tiers.join(',')})`);
    });

    const abbrs = new Map<string, string>();
    for (const div of league.divisions) {
      const dw = `${div.id}`;
      if (!div.id.startsWith(prefix)) errors.push(`${dw}: el id de división debe empezar por "${prefix}"`);
      if (divisionIds.has(div.id)) errors.push(`${dw}: id de división repetido`);
      divisionIds.add(div.id);
      if (div.needsReview) review.push(`${dw} (${div.name}): composición por revisar`);

      const inDiv = new Set(div.clubs.map((c) => c.id));
      for (const club of div.clubs) {
        const cw = `${club.id}`;
        if (!club.id.startsWith(prefix)) errors.push(`${cw}: el id debe empezar por "${prefix}"`);
        if (clubIds.has(club.id)) errors.push(`${cw}: id de club repetido`);
        clubIds.add(club.id);
        const prevAbbr = abbrs.get(club.abbr);
        if (prevAbbr) errors.push(`${cw}: abreviatura ${club.abbr} repetida con ${prevAbbr}`);
        abbrs.set(club.abbr, club.id);

        const region = regionNames.get(club.region);
        if (!region) errors.push(`${cw}: región "${club.region}" no existe en ${league.country}`);
        else if (!region.cities.includes(club.city)) warnings.push(`${cw}: la ciudad "${club.city}" no está en la lista de ${club.region}`);
        if (club.needsReview) review.push(`${cw} (${club.shortName}): datos del club por revisar`);
        allClubs.push({ club, divisionId: div.id, country: league.country });
      }

      // Grupos: cada club en exactamente un grupo
      if (div.groups) {
        const seen = new Map<string, string>();
        for (const g of div.groups) {
          for (const id of g.clubIds) {
            if (!inDiv.has(id)) errors.push(`${dw}/${g.id}: ${id} no pertenece a la división`);
            if (seen.has(id)) errors.push(`${dw}: ${id} está en los grupos ${seen.get(id)} y ${g.id}`);
            seen.set(id, g.id);
          }
        }
        for (const id of inDiv) if (!seen.has(id)) errors.push(`${dw}: ${id} no está en ningún grupo`);
      }

      const groupSize = div.groups ? Math.min(...div.groups.map((g) => g.clubIds.length)) : div.clubs.length;
      const { promotion, relegation } = div;
      if (promotion && promotion.direct + (promotion.playoff ? promotion.playoff[1] - promotion.playoff[0] + 1 : 0) >= groupSize) {
        errors.push(`${dw}: las plazas de ascenso superan el tamaño del grupo`);
      }
      if (relegation && relegation.direct >= groupSize) errors.push(`${dw}: demasiados descensos`);
    }

    // Ascensos y descensos cuadrados entre divisiones consecutivas
    const byTier = [...league.divisions].sort((a, b) => a.tier - b.tier);
    for (let i = 0; i < byTier.length - 1; i++) {
      const upper = byTier[i]!;
      const lower = byTier[i + 1]!;
      const down = (upper.relegation?.direct ?? 0) * Math.max(1, upper.groups?.length ?? 1);
      const up = promotedCount(lower.promotion, lower.groups);
      if (down !== up) errors.push(`${league.country}: bajan ${down} de ${upper.id} pero suben ${up} de ${lower.id}`);
    }
    const lowest = byTier[byTier.length - 1];
    if (lowest && (lowest.relegation?.direct ?? 0) > 0) errors.push(`${lowest.id}: la división más baja del juego no puede tener descensos`);
    const top = byTier[0];
    if (top?.promotion) errors.push(`${top.id}: la primera división no puede tener ascensos`);
  }

  for (const c of raw.countries) if (c.hasLeagues && !leagueCountries.has(c.id)) errors.push(`país ${c.id}: hasLeagues=true pero no hay archivo de liga`);

  // Referencias entre clubes
  const clubById = new Map(allClubs.map((x) => [x.club.id, x]));
  for (const { club, divisionId } of allClubs) {
    for (const r of club.rivals ?? []) {
      if (r.clubId === club.id) errors.push(`${club.id}: es rival de sí mismo`);
      else if (!clubById.has(r.clubId)) errors.push(`${club.id}: rival ${r.clubId} no existe`);
    }
    const ids = (club.rivals ?? []).map((r) => r.clubId);
    if (new Set(ids).size !== ids.length) errors.push(`${club.id}: rival repetido`);
    if (club.parentClubId) {
      const parent = clubById.get(club.parentClubId);
      if (!parent) errors.push(`${club.id}: primer equipo ${club.parentClubId} no existe`);
      else if (parent.divisionId === divisionId) errors.push(`${club.id}: el filial no puede estar en la misma división que ${parent.club.id}`);
    }
  }

  // Escudos
  for (const id of Object.keys(raw.crests ?? {})) if (!clubById.has(id)) warnings.push(`escudo de ${id}: el club no existe`);

  return {
    errors,
    warnings,
    review,
    stats: { countries: raw.countries.length, divisions: divisionIds.size, clubs: clubIds.size },
  };
}
