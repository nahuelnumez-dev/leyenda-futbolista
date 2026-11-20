/** Posiciones y atributos del jugador. Los nombres visibles están en i18n (attr.* y pos.*). */

export const POSITIONS = ['POR', 'DFC', 'LD', 'LI', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'ED', 'EI', 'DC'] as const;
export type Position = (typeof POSITIONS)[number];

export type PositionGroup = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';

export const POSITION_GROUP: Record<Position, PositionGroup> = {
  POR: 'goalkeeper',
  DFC: 'defender',
  LD: 'defender',
  LI: 'defender',
  MCD: 'midfielder',
  MC: 'midfielder',
  MCO: 'midfielder',
  MD: 'midfielder',
  MI: 'midfielder',
  ED: 'forward',
  EI: 'forward',
  DC: 'forward',
};

export const TECHNICAL_ATTRIBUTES = [
  'dribbling',
  'shortPassing',
  'longPassing',
  'shooting',
  'finishing',
  'heading',
  'ballControl',
  'crossing',
  'freeKicks',
  'penalties',
] as const;

export const PHYSICAL_ATTRIBUTES = ['pace', 'acceleration', 'stamina', 'strength', 'jumping', 'agility'] as const;

export const MENTAL_ATTRIBUTES = [
  'vision',
  'positioning',
  'composure',
  'leadership',
  'teamwork',
  'aggression',
  'concentration',
] as const;

export const GOALKEEPING_ATTRIBUTES = ['diving', 'reflexes', 'gkPositioning', 'kicking', 'rushingOut'] as const;

export const ALL_ATTRIBUTES = [
  ...TECHNICAL_ATTRIBUTES,
  ...PHYSICAL_ATTRIBUTES,
  ...MENTAL_ATTRIBUTES,
  ...GOALKEEPING_ATTRIBUTES,
] as const;

export type AttributeId = (typeof ALL_ATTRIBUTES)[number];
export type Attributes = Record<AttributeId, number>;

/** Rango de todos los atributos y de la media. */
export const ATTRIBUTE_MIN = 1;
export const ATTRIBUTE_MAX = 99;
