/**
 * Selecciones, torneos internacionales y rivales continentales.
 *
 * La fuerza usa la misma escala que el nivel de los clubes (≈ 44 + prestigio × 0,45): una selección de
 * 88 equivale a un grande de Europa. Los rivales continentales de ligas que todavía no están en el juego
 * se describen de forma genérica («el campeón de Turquía») para no inventar clubes.
 */
import type { AwardDef, GenericOpponent, InternationalContent, NationalTeamDef, TournamentDef } from '@/engine/competitions/types';

const nt = (id: string, name: string, confederation: NationalTeamDef['confederation'], strength: number): NationalTeamDef => ({ id, name: { es: name }, confederation, strength });

export const NATIONAL_TEAMS: NationalTeamDef[] = [
  nt('ARG', 'Argentina', 'CONMEBOL', 88),
  nt('BRA', 'Brasil', 'CONMEBOL', 87),
  nt('URU', 'Uruguay', 'CONMEBOL', 82),
  nt('COL', 'Colombia', 'CONMEBOL', 81),
  nt('ECU', 'Ecuador', 'CONMEBOL', 78),
  nt('PAR', 'Paraguay', 'CONMEBOL', 76),
  nt('CHI', 'Chile', 'CONMEBOL', 74),
  nt('PER', 'Perú', 'CONMEBOL', 73),
  nt('VEN', 'Venezuela', 'CONMEBOL', 73),
  nt('BOL', 'Bolivia', 'CONMEBOL', 70),
  nt('FRA', 'Francia', 'UEFA', 88),
  nt('ESP', 'España', 'UEFA', 88),
  nt('ENG', 'Inglaterra', 'UEFA', 87),
  nt('POR', 'Portugal', 'UEFA', 86),
  nt('GER', 'Alemania', 'UEFA', 85),
  nt('ITA', 'Italia', 'UEFA', 84),
  nt('NED', 'Países Bajos', 'UEFA', 84),
  nt('BEL', 'Bélgica', 'UEFA', 83),
  nt('CRO', 'Croacia', 'UEFA', 82),
  nt('SUI', 'Suiza', 'UEFA', 79),
  nt('DEN', 'Dinamarca', 'UEFA', 79),
  nt('AUT', 'Austria', 'UEFA', 79),
  nt('NOR', 'Noruega', 'UEFA', 79),
  nt('TUR', 'Turquía', 'UEFA', 78),
  nt('POL', 'Polonia', 'UEFA', 77),
  nt('SRB', 'Serbia', 'UEFA', 77),
  nt('SWE', 'Suecia', 'UEFA', 77),
  nt('UKR', 'Ucrania', 'UEFA', 77),
  nt('HUN', 'Hungría', 'UEFA', 76),
  nt('CZE', 'Chequia', 'UEFA', 76),
  nt('SCO', 'Escocia', 'UEFA', 75),
  nt('WAL', 'Gales', 'UEFA', 74),
  nt('GRE', 'Grecia', 'UEFA', 74),
  nt('IRL', 'Irlanda', 'UEFA', 73),
  nt('NIR', 'Irlanda del Norte', 'UEFA', 71),
  nt('AND', 'Andorra', 'UEFA', 52),
  nt('USA', 'Estados Unidos', 'CONCACAF', 78),
  nt('MEX', 'México', 'CONCACAF', 78),
  nt('CAN', 'Canadá', 'CONCACAF', 76),
  nt('CRC', 'Costa Rica', 'CONCACAF', 72),
  nt('PAN', 'Panamá', 'CONCACAF', 72),
  nt('MAR', 'Marruecos', 'CAF', 81),
  nt('SEN', 'Senegal', 'CAF', 78),
  nt('NGA', 'Nigeria', 'CAF', 77),
  nt('CIV', 'Costa de Marfil', 'CAF', 76),
  nt('EGY', 'Egipto', 'CAF', 75),
  nt('ALG', 'Argelia', 'CAF', 75),
  nt('CMR', 'Camerún', 'CAF', 74),
  nt('GHA', 'Ghana', 'CAF', 74),
  nt('JPN', 'Japón', 'AFC', 79),
  nt('KOR', 'Corea del Sur', 'AFC', 77),
  nt('IRN', 'Irán', 'AFC', 76),
  nt('AUS', 'Australia', 'AFC', 75),
  nt('KSA', 'Arabia Saudí', 'AFC', 72),
  nt('QAT', 'Catar', 'AFC', 70),
  nt('UAE', 'Emiratos Árabes Unidos', 'AFC', 68),
  nt('NZL', 'Nueva Zelanda', 'OFC', 66),
];

export const TOURNAMENTS: TournamentDef[] = [
  { id: 'fifa.world-cup', firstYear: 2030, every: 4, confederations: [], teams: 32, slots: { UEFA: 13, CONMEBOL: 6, CONCACAF: 4, CAF: 5, AFC: 4 } },
  { id: 'uefa.euro', firstYear: 2028, every: 4, confederations: ['UEFA'], teams: 16 },
  { id: 'conmebol.copa-america', firstYear: 2028, every: 4, confederations: ['CONMEBOL', 'CONCACAF', 'AFC'], teams: 16 },
];

/** Rivales continentales de ligas aún no incluidas (descripción genérica, sin inventar clubes). */
export const UEFA_OPPONENTS: GenericOpponent[] = [
  { label: 'el campeón de Austria', strength: 75 },
  { label: 'el campeón de Grecia', strength: 74 },
  { label: 'el campeón de Ucrania', strength: 73 },
  { label: 'el campeón de Chequia', strength: 73 },
  { label: 'el campeón de Croacia', strength: 73 },
  { label: 'el subcampeón de Grecia', strength: 72 },
  { label: 'el campeón de Serbia', strength: 72 },
  { label: 'el campeón de Suiza', strength: 72 },
  { label: 'el campeón de Dinamarca', strength: 72 },
  { label: 'el subcampeón de Austria', strength: 71 },
  { label: 'el campeón de Noruega', strength: 71 },
  { label: 'el campeón de Polonia', strength: 70 },
  { label: 'el campeón de Suecia', strength: 69 },
  { label: 'el campeón de Hungría', strength: 68 },
];

export const CONMEBOL_OPPONENTS: GenericOpponent[] = [
  { label: 'el campeón de Bolivia', strength: 67 },
  { label: 'el campeón de Venezuela', strength: 66 },
  { label: 'el subcampeón de Bolivia', strength: 64 },
  { label: 'el subcampeón de Venezuela', strength: 63 },
];

export const AFC_OPPONENTS: GenericOpponent[] = [
  { label: 'el campeón de Irán', strength: 70 },
  { label: 'el campeón de China', strength: 68 },
  { label: 'el subcampeón de Irán', strength: 67 },
  { label: 'el campeón de Australia', strength: 67 },
  { label: 'el subcampeón de China', strength: 65 },
  { label: 'el campeón de Tailandia', strength: 65 },
  { label: 'el campeón de Uzbekistán', strength: 65 },
  { label: 'el campeón de Malasia', strength: 62 },
];

export const CONCACAF_OPPONENTS: GenericOpponent[] = [
  { label: 'el campeón de Costa Rica', strength: 66 },
  { label: 'el subcampeón de Costa Rica', strength: 63 },
  { label: 'el campeón de Honduras', strength: 62 },
  { label: 'el campeón de Panamá', strength: 60 },
  { label: 'el campeón de Guatemala', strength: 60 },
  { label: 'el campeón de Canadá', strength: 58 },
  { label: 'el campeón de Jamaica', strength: 55 },
];

/** Premios individuales. */
export const AWARDS: AwardDef[] = [
  { id: 'balon-de-oro', name: { es: 'Balón de Oro' } },
  { id: 'golden-boy', name: { es: 'Mejor jugador joven del mundo' } },
  { id: 'top-scorer', name: { es: 'Máximo goleador de la liga' } },
  { id: 'best-player', name: { es: 'Mejor jugador de la liga' } },
  { id: 'best-young', name: { es: 'Mejor jugador joven de la liga' } },
];

export const INTERNATIONAL: InternationalContent = { nationalTeams: NATIONAL_TEAMS, tournaments: TOURNAMENTS, uefaOpponents: UEFA_OPPONENTS, conmebolOpponents: CONMEBOL_OPPONENTS, afcOpponents: AFC_OPPONENTS, concacafOpponents: CONCACAF_OPPONENTS };
