import type { CalendarType, ClubId, CompetitionId, CountryId, DivisionId } from './common';

/** Patrón de la primera equipación (se usa en el escudo genérico, la camiseta y las cinemáticas). */
export type KitPattern = 'liso' | 'rayas' | 'bandas' | 'mitades' | 'franja' | 'cuadros' | 'aros';
export const KIT_PATTERNS: readonly KitPattern[] = ['liso', 'rayas', 'bandas', 'mitades', 'franja', 'cuadros', 'aros'];

export type ClubStyle = 'posesion' | 'presion' | 'contraataque' | 'directo' | 'defensivo';
export const CLUB_STYLES: readonly ClubStyle[] = ['posesion', 'presion', 'contraataque', 'directo', 'defensivo'];

export interface ClubColors {
  /** Hex, p. ej. '#FFFFFF'. */
  primary: string;
  secondary: string;
  pattern: KitPattern;
}

export interface Crest {
  /** Ruta dentro de /public, p. ej. 'crests/esp/real-madrid.png'. */
  file?: string;
  /** Artículo de Wikipedia del que el script de escudos saca la imagen: 'es:Real Madrid Club de Fútbol'. */
  wiki?: string;
}

export interface Rivalry {
  clubId: ClubId;
  type: 'derbi' | 'clasico';
  /** 1 = rivalidad regional, 3 = de las más grandes del mundo. */
  intensity: 1 | 2 | 3;
  name?: string;
}

/** Club ya normalizado (lo que usa el motor). */
export interface Club {
  id: ClubId;
  country: CountryId;
  /** Nombre oficial completo. */
  name: string;
  /** Nombre corto habitual ("Real Madrid", "Boca Juniors"). */
  shortName: string;
  /** Abreviatura de 3-4 letras para tablas ("RMA", "BOC"). */
  abbr: string;
  city: string;
  /** Debe coincidir con una región del país en countries.json. */
  region: string;
  coords?: [lat: number, lon: number];
  stadium: { name: string; capacity: number };
  colors: ClubColors;
  crest?: Crest;
  /** 1-100: peso histórico y actual. */
  prestige: number;
  /** Presupuesto aproximado en millones de euros. */
  budgetM: number;
  /** 1-100: calidad de la cantera. */
  academy: number;
  style: ClubStyle;
  /** Simétricas tras la normalización (si A es rival de B, B lo es de A). */
  rivals: Rivalry[];
  /** Filial: id del primer equipo. No pueden coincidir en la misma división. */
  parentClubId?: ClubId;
  /** Datos del club (estadio, aforo, colores) de los que no hay certeza. */
  needsReview?: boolean;
}

/** Club tal y como se escribe en /src/data/leagues/<pais>.json (el país y la simetría de rivales los pone el cargador). */
export type ClubSource = Omit<Club, 'country' | 'rivals'> & { rivals?: Rivalry[] };

export interface PromotionRule {
  /** Plazas de ascenso directo (por grupo si la división tiene grupos). */
  direct: number;
  /** Puestos que juegan playoff de ascenso (p. ej. [3, 6]). */
  playoff?: [from: number, to: number];
  /** Cuántos suben por playoff (por grupo). */
  playoffSpots?: number;
}

export interface RelegationRule {
  /** Descensos directos (por grupo). 0 en la división más baja del juego. */
  direct: number;
  playoff?: [from: number, to: number];
}

export interface DivisionGroup {
  id: string;
  name: string;
  clubIds: ClubId[];
}

export interface Division<C = Club> {
  id: DivisionId;
  name: string;
  tier: 1 | 2 | 3;
  /** Solo en divisiones con grupos (Primera Federación...). */
  groups?: DivisionGroup[];
  promotion?: PromotionRule;
  relegation?: RelegationRule;
  /** Vueltas: 2 = ida y vuelta, 1 = todos contra todos a una vuelta. */
  format?: { rounds: 1 | 2 };
  /** Composición dudosa: se lista en DECISIONES.md. */
  needsReview?: boolean;
  clubs: C[];
}

/** Plazas para una competición continental según la posición final en primera división. */
export interface ContinentalSlot {
  competitionId: CompetitionId;
  from: number;
  to: number;
}

/** Archivo /src/data/leagues/<pais>.json */
export interface CountryLeagueFile<C = ClubSource> {
  country: CountryId;
  needsReview: boolean;
  /** Temporada a la que corresponde la composición de las divisiones. */
  dataSeason: string;
  calendar: CalendarType;
  divisions: Division<C>[];
  /** La primera copa de tipo 'copa' es la que se simula. */
  cups?: CompetitionId[];
  continental?: ContinentalSlot[];
  notes?: string;
}

/** Datos del club que cambian durante la partida. */
export interface ClubDynamic {
  divisionId: DivisionId;
  groupId?: string;
  prestige: number;
  budgetM: number;
}
