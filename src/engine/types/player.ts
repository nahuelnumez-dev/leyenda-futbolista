import type { Attributes, Position } from './attributes';
import type { CelebrationId, ClubId, CountryId, Foot, PlayStyleId, SeasonYear, TendencyId, TraitId } from './common';

export interface AvatarConfig {
  /** Índice en la paleta de tonos de piel (src/data/avatar.ts). */
  skinTone: number;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  /** Altura en cm. */
  height: number;
  build: 'delgado' | 'atletico' | 'robusto';
  boots: string;
  eyeColor?: string;
  /** Complemento: cinta, diadema... ('ninguno' por defecto). */
  accessory?: string;
}

export interface PlayerIdentity {
  name: string;
  nickname?: string;
  /** ISO 'YYYY-MM-DD'. */
  birthDate: string;
  birthPlace: { country: CountryId; region: string; city: string };
  /** Primera = principal. Máximo 2. */
  nationalities: CountryId[];
  foot: Foot;
}

export interface PlayerTrait {
  id: TraitId;
  intensity: 1 | 2 | 3;
}

export interface Injury {
  type: string;
  /** 1 leve, 2 media, 3 grave. */
  severity: 1 | 2 | 3;
  weeksOut: number;
  season: SeasonYear;
}

export interface PlayerStatus {
  /** 0-100 */
  morale: number;
  /** 0-100 */
  form: number;
  /** 0-100 */
  fitness: number;
  injury?: Injury;
  /** Propensión acumulada a lesiones (0-100). */
  injuryProneness: number;
}

export interface Reputation {
  local: number;
  national: number;
  world: number;
}

/** -100 (odio) a 100 (devoción). */
export interface Relations {
  coach: number;
  fans: number;
  dressingRoom: number;
  board: number;
  agent: number;
  family: number;
  press: number;
}

export type SquadRole = 'cantera' | 'promesa' | 'rotacion' | 'titular' | 'estrella';

export interface Contract {
  clubId: ClubId;
  startSeason: SeasonYear;
  /** Última temporada incluida. */
  endSeason: SeasonYear;
  /** Salario anual en euros. */
  salary: number;
  role: SquadRole;
  shirtNumber: number;
  releaseClause?: number;
  /** Si está cedido, club propietario. */
  loanFrom?: ClubId;
  /** Contrato con el club propietario al que vuelve tras la cesión. */
  loanReturn?: { endSeason: SeasonYear; salary: number; role: SquadRole; shirtNumber: number };
}

export interface Agent {
  id: string;
  name: string;
  /** 1-100: capacidad de conseguir ofertas. */
  quality: number;
  /** % de comisión. */
  commission: number;
  /** 1-100: contactos internacionales. */
  connections: number;
}

export interface Player {
  identity: PlayerIdentity;
  appearance: AvatarConfig;
  positions: { main: Position; secondary: Position[] };
  style: PlayStyleId;
  preferredNumber: number;
  attributes: Attributes;
  potential: {
    /** Techo real (oculto al jugador). */
    hidden: number;
    /** Rango estimado visible; se estrecha con la edad. */
    shownRange: [number, number];
  };
  traits: PlayerTrait[];
  tendencies: Partial<Record<TendencyId, number>>;
  status: PlayerStatus;
  reputation: Reputation;
  marketValue: number;
  money: number;
  relations: Relations;
  contract: Contract | null;
  agent: Agent | null;
  nationalTeam: { eligible: CountryId[]; chosen?: CountryId };
  celebrations: { unlocked: CelebrationId[]; selected?: CelebrationId };
  /** Especialidades conseguidas (las partidas anteriores a la v1.4 no lo tienen). */
  specialties?: PlayerSpecialty[];
  /** Especialidad que entrena: sus atributos crecen más rápido. */
  specialtyFocus?: string;
}

export interface PlayerSpecialty {
  id: string;
  /** 1 = conseguida; 2 = élite. */
  level: 1 | 2;
  /** Temporada en que la consiguió (o subió de nivel). */
  season: number;
}
