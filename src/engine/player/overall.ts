/**
 * Valoración global (media) según la posición: media ponderada de los atributos relevantes.
 * Los pesos se pueden ajustar sin tocar el resto del motor.
 */
import type { AttributeId, Attributes, Position } from '../types/attributes';

type Weights = Partial<Record<AttributeId, number>>;

export const OVERALL_WEIGHTS: Record<Position, Weights> = {
  POR: { diving: 3, reflexes: 3, gkPositioning: 3, kicking: 1, rushingOut: 2, composure: 1, concentration: 1, jumping: 0.5 },
  DFC: { positioning: 3, strength: 2, heading: 2, jumping: 1.5, aggression: 1, concentration: 2, composure: 1, pace: 1, shortPassing: 1 },
  LD: { pace: 2, acceleration: 1.5, stamina: 2, crossing: 2, positioning: 2, shortPassing: 1, dribbling: 1, concentration: 1 },
  LI: { pace: 2, acceleration: 1.5, stamina: 2, crossing: 2, positioning: 2, shortPassing: 1, dribbling: 1, concentration: 1 },
  MCD: { positioning: 2.5, shortPassing: 2, longPassing: 1.5, strength: 1.5, stamina: 1.5, aggression: 1, concentration: 1.5, vision: 1 },
  MC: { shortPassing: 2.5, longPassing: 1.5, vision: 2, ballControl: 2, stamina: 1.5, teamwork: 1, composure: 1, dribbling: 1 },
  MCO: { vision: 2.5, shortPassing: 2, dribbling: 2, ballControl: 2, shooting: 1.5, composure: 1, agility: 1 },
  MD: { pace: 1.5, crossing: 2, dribbling: 2, shortPassing: 1.5, stamina: 1.5, vision: 1, ballControl: 1.5 },
  MI: { pace: 1.5, crossing: 2, dribbling: 2, shortPassing: 1.5, stamina: 1.5, vision: 1, ballControl: 1.5 },
  ED: { pace: 2, acceleration: 2, dribbling: 2.5, crossing: 1.5, finishing: 1.5, ballControl: 1.5, agility: 1 },
  EI: { pace: 2, acceleration: 2, dribbling: 2.5, crossing: 1.5, finishing: 1.5, ballControl: 1.5, agility: 1 },
  DC: { finishing: 3, shooting: 2, positioning: 2, heading: 1.5, composure: 1.5, ballControl: 1, pace: 1, strength: 1 },
};

export function overallFor(attributes: Attributes, position: Position): number {
  const weights = OVERALL_WEIGHTS[position];
  let sum = 0;
  let total = 0;
  for (const [id, w] of Object.entries(weights) as [AttributeId, number][]) {
    sum += attributes[id] * w;
    total += w;
  }
  return total > 0 ? Math.round(sum / total) : 0;
}
