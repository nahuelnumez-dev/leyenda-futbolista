/** Nombres legibles de competiciones, selecciones y premios para la interfaz. */
import { lt } from '@/i18n';
import { WORLD } from '@/data';
import { AWARDS, NATIONAL_TEAMS } from '@/data/international';

export function nationalTeamName(id: string | undefined): string {
  if (!id) return '';
  return lt(NATIONAL_TEAMS.find((n) => n.id === id)?.name ?? WORLD.countryById.get(id)?.name ?? { es: id });
}

const CATEGORY: Record<string, string> = { sub17: 'Sub-17', sub20: 'Sub-20', sub21: 'Sub-21' };

/** Nombre de una competición: liga, copa, continental, torneo de selecciones, filial o selección. */
export function competitionName(id: string): string {
  if (id === 'youth') return 'Filial / juveniles';
  if (id.startsWith('nt.')) {
    const [, country, cat] = id.split('.');
    return `${nationalTeamName(country)}${cat ? ` ${CATEGORY[cat] ?? cat}` : ''}`;
  }
  const division = WORLD.divisionById.get(id);
  if (division) return division.name;
  const comp = WORLD.competitions.find((c) => c.id === id);
  return comp ? lt(comp.name) : id;
}

export function awardName(id: string, scope?: string): string {
  const base = lt(AWARDS.find((a) => a.id === id)?.name ?? { es: id });
  return scope ? `${base} (${competitionName(scope)})` : base;
}

/** Icono para cada tipo de título. */
export function trophyIcon(id: string): string {
  if (id.includes('world-cup')) return '🌍';
  if (id.includes('euro') || id.includes('copa-america')) return '🏅';
  if (id.startsWith('uefa.') || id.startsWith('conmebol.') || id.startsWith('afc.') || id.startsWith('concacaf.')) return '⭐';
  if (WORLD.divisionById.has(id)) return '🏆';
  return '🥇';
}
