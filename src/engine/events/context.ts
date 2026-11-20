/**
 * Contexto de los eventos: etapa de la carrera, variables de plantilla ({club}, {entrenador}...)
 * y nombres ficticios deterministas.
 */
import { Rng } from '../rng';
import type { WorldData } from '../data/world';
import type { CareerStage, ClubId, CountryId, SeasonYear } from '../types/common';
import type { GameState } from '../types/game';
import { ageInSeason } from '../world/newGame';

export interface NamePool {
  first: string[];
  last: string[];
}

export interface EventContent {
  world: WorldData;
  names: Record<string, NamePool>;
}

/** Nombres en el idioma del país (si no hay lista para ese idioma, en español). */
export function namePoolFor(names: Record<string, NamePool>, world: WorldData, country: CountryId | undefined): NamePool {
  const lang = country ? world.countryById.get(country)?.language : undefined;
  return (lang ? names[lang] : undefined) ?? names.es!;
}

/** Nombre ficticio estable para un rol (entrenador, agente...) en un club y temporada. */
export function personName(content: EventContent, seed: string, role: string, clubId: ClubId | undefined, season: SeasonYear): string {
  const country = clubId ? content.world.clubById.get(clubId)?.country : undefined;
  const pool = namePoolFor(content.names, content.world, country);
  const rng = Rng.fromSeed(`${seed}:${role}:${clubId ?? ''}:${role === 'coach' ? season : ''}`);
  return `${rng.pick(pool.first)} ${rng.pick(pool.last)}`;
}

export function playerAge(game: GameState): number {
  return ageInSeason(game.player.identity.birthDate, game.calendar.season);
}

/** Etapa de la carrera según la edad y el rol. */
export function careerStage(game: GameState): CareerStage {
  const age = playerAge(game);
  const role = game.player.contract?.role;
  if (game.retired) return 'retirement';
  if (role === 'cantera') return 'academy';
  if (age <= 21) return 'breakthrough';
  if (age <= 26) return 'establishment';
  if (age <= 30) return 'prime';
  return 'veteran';
}

/** Rival principal del club (mayor intensidad). */
export function mainRival(content: EventContent, clubId: ClubId | undefined): ClubId | undefined {
  const club = clubId ? content.world.clubById.get(clubId) : undefined;
  return club?.rivals.slice().sort((a, b) => b.intensity - a.intensity)[0]?.clubId;
}

/** Variables disponibles en los textos de los eventos. */
export function templateVars(game: GameState, content: EventContent): Record<string, string> {
  const p = game.player;
  const clubId = p.contract?.clubId;
  const club = clubId ? content.world.clubById.get(clubId) : undefined;
  const dyn = clubId ? game.world.clubs[clubId] : undefined;
  const division = dyn ? content.world.divisionById.get(dyn.divisionId) : undefined;
  const rivalId = mainRival(content, clubId);
  const rival = rivalId ? content.world.clubById.get(rivalId) : undefined;
  const season = game.calendar.season;
  const country = content.world.countryById.get(p.identity.nationalities[0] ?? '');
  return {
    nombre: p.identity.name.split(' ')[0] ?? p.identity.name,
    nombreCompleto: p.identity.name,
    apodo: p.identity.nickname ?? p.identity.name.split(' ')[0] ?? '',
    club: club?.shortName ?? 'tu club',
    clubCompleto: club?.name ?? 'tu club',
    ciudad: club?.city ?? p.identity.birthPlace.city,
    estadio: club?.stadium.name ?? 'el estadio',
    division: division?.name ?? 'la liga',
    rival: rival?.shortName ?? 'el eterno rival',
    entrenador: personName(content, game.seed, 'coach', clubId, season),
    companero: personName(content, game.seed, `mate-${season % 3}`, clubId, season),
    capitan: personName(content, game.seed, 'captain', clubId, season),
    agente: personName(content, game.seed, 'agent', undefined, 0),
    periodista: personName(content, game.seed, 'press', undefined, 0),
    ciudadNatal: p.identity.birthPlace.city,
    pais: country?.name.es ?? '',
    temporada: String(season),
  };
}

/** Sustituye {variables} en un texto. Las desconocidas se dejan tal cual. */
export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

/** Variables que se pueden usar en los textos (para validar los datos). */
export const TEMPLATE_VARS = [
  'nombre', 'nombreCompleto', 'apodo', 'club', 'clubCompleto', 'ciudad', 'estadio', 'division', 'rival',
  'entrenador', 'companero', 'capitan', 'agente', 'periodista', 'ciudadNatal', 'pais', 'temporada',
] as const;
