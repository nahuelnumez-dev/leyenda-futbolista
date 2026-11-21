/**
 * Participación del jugador en un partido: convocatoria, minutos, nota, goles y asistencias.
 * Los goles del jugador salen de los goles de su equipo, así que siempre son coherentes con el marcador.
 */
import type { Rng } from '../rng';
import { POSITION_GROUP, type Attributes, type Position } from '../types/attributes';
import type { Player, SquadRole } from '../types/player';
import type { SpecialtyEffects } from '../types/definitions';
import { overallFor } from './overall';

/** Parte de los goles del equipo que marca un jugador de cada posición (jugando 90'). */
const GOAL_SHARE: Record<Position, number> = {
  DC: 0.32, ED: 0.19, EI: 0.19, MCO: 0.15, MD: 0.1, MI: 0.1, MC: 0.08, MCD: 0.04, DFC: 0.045, LD: 0.03, LI: 0.03, POR: 0,
};
const ASSIST_SHARE: Record<Position, number> = {
  MCO: 0.22, ED: 0.18, EI: 0.18, MD: 0.18, MI: 0.18, MC: 0.14, DC: 0.12, LD: 0.1, LI: 0.1, MCD: 0.06, DFC: 0.03, POR: 0.005,
};
/** Acciones por 90 minutos de un jugador medio de cada posición. */
const DRIBBLES_90: Record<Position, number> = {
  ED: 2.2, EI: 2.2, MCO: 1.8, MD: 1.5, MI: 1.5, DC: 1.2, MC: 0.9, LD: 0.7, LI: 0.7, MCD: 0.4, DFC: 0.2, POR: 0,
};
const KEY_PASSES_90: Record<Position, number> = {
  MCO: 2.2, ED: 1.6, EI: 1.6, MD: 1.5, MI: 1.5, MC: 1.4, DC: 0.9, LD: 0.9, LI: 0.9, MCD: 0.7, DFC: 0.3, POR: 0.05,
};
const TACKLES_90: Record<Position, number> = {
  MCD: 2.6, DFC: 2.0, LD: 2.0, LI: 2.0, MC: 1.6, MD: 1.0, MI: 1.0, MCO: 0.6, ED: 0.5, EI: 0.5, DC: 0.3, POR: 0,
};
/** Paradas por partido de un portero medio. */
const SAVES_90 = 2.6;
const ROLE_BIAS: Record<SquadRole, number> = { estrella: 2.2, titular: 1, rotacion: 0, promesa: -0.6, cantera: -1.2 };

export interface MatchContext {
  /** Nivel esperado de los titulares del equipo en esta competición. */
  level: number;
  teamGoals: number;
  conceded: number;
  /** Si es un partido del primer equipo para un juvenil (solo puede entrar como suplente). */
  callUp?: boolean;
  /** Bonus de las especialidades del jugador. */
  mods?: SpecialtyEffects;
}

export interface PlayerMatch {
  started: boolean;
  minutes: number;
  rating: number | null;
  goals: number;
  assists: number;
  /** Regates completados. */
  dribbles: number;
  /** Pases que acaban en remate (incluye las asistencias). */
  keyPasses: number;
  /** Entradas e intercepciones ganadas. */
  tackles: number;
  /** Paradas (solo porteros). */
  saves: number;
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function attackQuality(a: Attributes): number {
  return (a.finishing * 2 + a.shooting + a.composure + a.positioning) / 5;
}

function creativeQuality(a: Attributes): number {
  return (a.vision * 2 + a.shortPassing + a.crossing + a.dribbling) / 5;
}

export function playMatch(rng: Rng, player: Player, role: SquadRole, ctx: MatchContext): PlayerMatch {
  const pos = player.positions.main;
  const ovr = overallFor(player.attributes, pos);
  const none: PlayerMatch = { started: false, minutes: 0, rating: null, goals: 0, assists: 0, dribbles: 0, keyPasses: 0, tackles: 0, saves: 0 };
  if (player.status.injury) return none;

  const diff = ovr - ctx.level;
  const coach = player.relations.coach / 60;
  const form = (player.status.form - 60) / 60;

  let started = false;
  let minutes = 0;
  if (ctx.callUp) {
    // Juvenil convocado con el primer equipo: algún minuto como suplente.
    if (rng.chance(0.45)) minutes = rng.int(5, 25);
  } else {
    const pStart = sigmoid(diff / 3.5 + coach + form + ROLE_BIAS[role]);
    if (rng.chance(pStart)) {
      started = true;
      minutes = rng.chance(0.22) ? rng.int(60, 85) : 90;
    } else if (rng.chance(0.7 * sigmoid((diff + 6) / 4 + ROLE_BIAS[role] * 0.5))) {
      minutes = rng.int(8, 35);
    }
  }
  if (minutes === 0) return none;

  const share = minutes / 90;
  const mod = (k: keyof SpecialtyEffects) => 1 + (ctx.mods?.[k] ?? 0);
  const goalP = Math.min(0.8, mod('goals') * GOAL_SHARE[pos] * share * Math.max(0.35, Math.min(2, 1 + (attackQuality(player.attributes) - ctx.level) / 35)));
  const assistP = Math.min(0.7, mod('assists') * ASSIST_SHARE[pos] * share * Math.max(0.35, Math.min(2, 1 + (creativeQuality(player.attributes) - ctx.level) / 35)));
  let goals = 0;
  let assists = 0;
  for (let g = 0; g < ctx.teamGoals; g++) {
    if (rng.chance(goalP)) goals++;
    else if (rng.chance(assistP)) assists++;
  }

  // Acciones del partido: tasa de la posición × calidad del jugador frente al nivel del partido.
  const a = player.attributes;
  const skill = (q: number, spread = 30) => Math.max(0.4, Math.min(2, 1 + (q - ctx.level) / spread));
  const expDribbles = mod('dribbles') * DRIBBLES_90[pos] * share * skill((a.dribbling * 2 + a.agility + a.ballControl) / 4);
  const expKeyPasses = mod('keyPasses') * KEY_PASSES_90[pos] * share * skill((a.vision * 2 + a.shortPassing + a.crossing) / 4);
  const expTackles = mod('tackles') * TACKLES_90[pos] * share * skill((a.positioning + a.aggression + a.strength + a.concentration) / 4);
  const isKeeper = pos === 'POR';
  const expSaves = isKeeper ? mod('saves') * SAVES_90 * share * (1 + Math.min(2, ctx.conceded) * 0.25) * skill((a.diving + a.reflexes + a.gkPositioning) / 3, 40) : 0;
  const dribbles = rng.poisson(expDribbles);
  const keyPasses = assists + rng.poisson(expKeyPasses);
  const tackles = rng.poisson(expTackles);
  const saves = isKeeper ? rng.poisson(expSaves) : 0;
  // Solo cuenta lo que se sale de lo normal para su posición, para no inflar las notas.
  const actions = (dribbles - expDribbles) * 0.08 + (keyPasses - assists - expKeyPasses) * 0.1 + (tackles - expTackles) * 0.07 + (saves - expSaves) * 0.15;

  const result = ctx.teamGoals > ctx.conceded ? 0.3 : ctx.teamGoals < ctx.conceded ? -0.3 : 0;
  const defensive = POSITION_GROUP[pos] === 'goalkeeper' || POSITION_GROUP[pos] === 'defender';
  const cleanSheet = defensive && ctx.conceded === 0 && started ? 0.4 : 0;
  const leak = defensive ? -0.15 * ctx.conceded : 0;
  const raw = 6.4 + Math.max(-0.9, Math.min(1.2, diff / 14)) + goals * 0.7 + assists * 0.45 + result + cleanSheet + leak + actions + (ctx.mods?.rating ?? 0) + rng.normal(0, 0.5);
  const rating = Math.round(Math.min(10, Math.max(3.5, minutes < 20 ? 6 + (raw - 6.3) / 2 : raw)) * 10) / 10;
  return { started, minutes, rating, goals, assists, dribbles, keyPasses, tackles, saves };
}
