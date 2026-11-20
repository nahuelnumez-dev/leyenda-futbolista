/**
 * Creación de una partida nueva a partir de las elecciones del asistente (CharacterInput)
 * y del club de cantera resuelto en las pruebas.
 */
import { Rng } from '../rng';
import { defaultAppearance, defaultRelations, defaultReputation } from '../player/defaults';
import {
  generateStartingAttributes,
  rollPotential,
  shownPotentialRange,
  type CharacterInput,
  type CreationContent,
} from '../player/create';
import type { ClubId, Foot, SeasonYear } from '../types/common';
import type { Position } from '../types/attributes';
import type { Contract } from '../types/player';
import type { ClubSpell } from '../types/career';
import { marketValue } from '../player/growth';
import { overallFor } from '../player/overall';
import { seedTendencies } from '../personality/personality';
import { GAME_STATE_VERSION, type GameState } from '../types/game';

export const DEFAULT_START_SEASON: SeasonYear = 2026;
/** Edad con la que empieza la carrera (cantera). */
export const START_AGE = 15;

export interface NewGameParams {
  seed: string;
  customSeed?: boolean;
  /** ISO de creación; se inyecta para que el motor sea puro y testeable. */
  createdAt: string;
  name: string;
  nickname?: string;
  nationality?: string;
  birthCountry?: string;
  birthRegion?: string;
  birthCity?: string;
  foot?: Foot;
  position?: Position;
  ironMan?: boolean;
  startSeason?: SeasonYear;
  /** Personaje completo del asistente. Si falta, se crea uno básico con los campos sueltos de arriba. */
  character?: CharacterInput;
  /** Contenido (estilos y rasgos) para aplicar sus bonus. */
  content?: CreationContent;
  /** Club donde empieza (resultado de las pruebas de cantera). */
  academy?: {
    clubId: ClubId;
    /** Presupuesto del club, para el sueldo de juvenil. */
    budgetM?: number;
    /** Prestigio del club, para el valor de mercado inicial. */
    prestige?: number;
    trial?: { clubId: ClubId; passed: boolean };
  };
}

const EMPTY_CONTENT: CreationContent = { styles: [], traits: [] };

/** Personaje básico a partir de los campos sueltos (partidas de prueba y tests). */
function basicCharacter(params: NewGameParams, rng: Rng): CharacterInput {
  const nationality = params.nationality ?? 'ESP';
  const position = params.position ?? 'DC';
  return {
    name: params.name,
    ...(params.nickname ? { nickname: params.nickname } : {}),
    birthDay: rng.int(1, 28),
    birthMonth: rng.int(1, 12),
    birthPlace: { country: params.birthCountry ?? nationality, region: params.birthRegion ?? '', city: params.birthCity ?? '' },
    nationalities: [nationality],
    foot: params.foot ?? 'derecho',
    appearance: defaultAppearance(),
    mainPosition: position,
    secondaryPositions: [],
    style: position === 'POR' ? 'portero-clasico' : 'goleador-nato',
    traits: [],
    preferredNumber: position === 'POR' ? 1 : 9,
  };
}

export function createNewGame(params: NewGameParams): GameState {
  const rng = Rng.fromSeed(params.seed);
  const startSeason = params.startSeason ?? DEFAULT_START_SEASON;
  const character = params.character ?? basicCharacter(params, rng);
  const content = params.content ?? EMPTY_CONTENT;
  const { birthMonth, birthDay } = character;
  // Se ajusta el año para que el jugador tenga START_AGE años el 1 de julio de la primera temporada.
  const birthYear = startSeason - START_AGE - (isAfterJulyFirst(birthMonth, birthDay) ? 1 : 0);

  const hiddenPotential = rollPotential(params.seed);
  const attributes = generateStartingAttributes(character, hiddenPotential, params.seed, content);

  const academy = params.academy;
  const contract: Contract | null = academy
    ? {
        clubId: academy.clubId,
        startSeason,
        endSeason: startSeason + 2,
        // Beca de juvenil: entre ~3.000 y ~35.000 € al año según el club.
        salary: Math.round((3000 + (academy.budgetM ?? 0) * 30) / 100) * 100,
        role: 'cantera',
        shirtNumber: character.preferredNumber,
      }
    : null;
  const spells: ClubSpell[] = academy ? [{ clubId: academy.clubId, type: 'academy', fromSeason: startSeason, highlights: [] }] : [];
  const flags: Record<string, number | boolean> = {};
  if (academy?.trial) {
    flags['academyTrialPassed'] = academy.trial.passed;
    flags['academyTrialClub:' + academy.trial.clubId] = true;
  }

  const game: GameState = {
    version: GAME_STATE_VERSION,
    id: `career-${Rng.fromSeed(params.seed + params.createdAt).int(0, 2 ** 31 - 1).toString(36)}`,
    createdAt: params.createdAt,
    seed: params.seed,
    rngState: [0, 0, 0, 0],
    options: { ironMan: params.ironMan ?? false, customSeed: params.customSeed ?? false },
    calendar: { startSeason, season: startSeason, phase: 'preseason', step: 0 },
    world: { clubs: {}, standings: {}, history: [], npcStars: [] },
    player: {
      identity: {
        name: character.name.trim(),
        ...(character.nickname?.trim() ? { nickname: character.nickname.trim() } : {}),
        birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
        birthPlace: { ...character.birthPlace },
        nationalities: [...character.nationalities],
        foot: character.foot,
      },
      appearance: { ...character.appearance },
      positions: { main: character.mainPosition, secondary: [...character.secondaryPositions] },
      style: character.style,
      preferredNumber: character.preferredNumber,
      attributes,
      potential: { hidden: hiddenPotential, shownRange: shownPotentialRange(hiddenPotential, params.seed) },
      traits: character.traits.map((id) => ({ id, intensity: 2 as const })),
      tendencies: {},
      status: { morale: 70, form: 60, fitness: 100, injuryProneness: 10 },
      reputation: defaultReputation(),
      marketValue: academy ? marketValue(overallFor(attributes, character.mainPosition), START_AGE, hiddenPotential, academy.prestige ?? 40) : 0,
      money: 0,
      relations: defaultRelations(),
      contract,
      agent: null,
      nationalTeam: { eligible: [...new Set([...character.nationalities, character.birthPlace.country])].filter(Boolean) },
      celebrations: { unlocked: ['puno', 'rodillas'], selected: 'puno' },
    },
    career: {
      seasons: [],
      spells,
      trophies: [],
      awards: [],
      records: { longestScoringStreak: 0, hatTricks: 0, peakOverall: 0, peakMarketValue: 0, biggestTransferFee: 0 },
      nationalTeam: { caps: 0, goals: 0, assists: 0, youthCaps: {}, tournaments: [] },
      startAttributes: { ...attributes },
    },
    flags,
    eventLog: [],
    scheduledEvents: [],
    activeEvent: null,
    inbox: [],
    social: { followers: 50, sentiment: 0 },
    achievements: {},
    retired: false,
  };

  if (content.tendencies) seedTendencies(game, content.tendencies);
  game.rngState = rng.getState();
  return game;
}

/** Edad del jugador en una temporada dada (a 1 de julio de ese año). */
export function ageInSeason(birthDate: string, season: SeasonYear): number {
  const [y, m, d] = birthDate.split('-').map(Number) as [number, number, number];
  return season - y - (isAfterJulyFirst(m, d) ? 1 : 0);
}

function isAfterJulyFirst(month: number, day: number): boolean {
  return month > 7 || (month === 7 && day > 1);
}

/** Etiqueta de temporada: '2026-27' (europeo) o '2026' (anual). */
export function formatSeason(season: SeasonYear, calendar: 'europeo' | 'anual' = 'europeo'): string {
  if (calendar === 'anual') return String(season);
  return `${season}-${String((season + 1) % 100).padStart(2, '0')}`;
}
