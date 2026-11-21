/**
 * Todos los eventos del juego. Para añadir eventos, créalos en el archivo de su categoría
 * (o en uno nuevo) y añádelos a esta lista. `npm test` comprueba ids, referencias y textos.
 */
import type { GameEvent } from '@/engine/types/events';
import { ACADEMY_EVENTS } from './academy';
import { CAREER_EVENTS } from './career';
import { OFF_FIELD_EVENTS } from './offField';
import { PERSONALITY_EVENTS } from './personality';
import { INTERNATIONAL_EVENTS } from './international';
import { MATCHDAY_EVENTS } from './matchday';
import { MARKET_EVENTS } from './market';
import { LIFE_EVENTS } from './life';
import { PITCH_EVENTS } from './pitch';
import { WORLD_EVENTS } from './world';
import { CHOICE_EVENTS } from './choices';
import { ATTACK_EVENTS } from './attack';
import { DEFENSE_EVENTS } from './defense';
import { KEEPER_EVENTS } from './keeper';
import { GAME_EVENTS } from './games';
import { LIFESTYLE_EVENTS } from './lifestyle';
import { CLUB_EVENTS } from './club';
import { MOMENT_EVENTS } from './moments';

export const EVENTS: GameEvent[] = [...ACADEMY_EVENTS, ...CAREER_EVENTS, ...OFF_FIELD_EVENTS, ...PERSONALITY_EVENTS,
  ...INTERNATIONAL_EVENTS,
  ...MATCHDAY_EVENTS,
  ...MARKET_EVENTS,
  ...LIFE_EVENTS,
  ...PITCH_EVENTS,
  ...WORLD_EVENTS,
  ...CHOICE_EVENTS,
  ...ATTACK_EVENTS,
  ...DEFENSE_EVENTS,
  ...KEEPER_EVENTS,
  ...GAME_EVENTS,
  ...LIFESTYLE_EVENTS,
  ...CLUB_EVENTS,
  ...MOMENT_EVENTS,
];
