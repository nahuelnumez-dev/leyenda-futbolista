import { ALL_ATTRIBUTES, type Attributes } from '../types/attributes';
import type { AvatarConfig, Relations, Reputation } from '../types/player';

export function createAttributes(value = 40): Attributes {
  const attrs = {} as Attributes;
  for (const id of ALL_ATTRIBUTES) attrs[id] = value;
  return attrs;
}

export function defaultAppearance(): AvatarConfig {
  return {
    skinTone: 3,
    hairStyle: 'corto',
    hairColor: '#2b1d14',
    facialHair: 'ninguno',
    height: 178,
    build: 'atletico',
    boots: '#f5c542',
    eyeColor: '#4b3621',
    accessory: 'ninguno',
  };
}

export function defaultRelations(): Relations {
  return { coach: 0, fans: 0, dressingRoom: 0, board: 0, agent: 0, family: 50, press: 0 };
}

export function defaultReputation(): Reputation {
  return { local: 5, national: 1, world: 0 };
}
