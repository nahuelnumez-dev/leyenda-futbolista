/** Aplicación de efectos (`Effect`) sobre una copia de la partida. */
import type { Rng } from '../rng';
import {
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN,
  GOALKEEPING_ATTRIBUTES,
  MENTAL_ATTRIBUTES,
  PHYSICAL_ATTRIBUTES,
  TECHNICAL_ATTRIBUTES,
  type AttributeId,
} from '../types/attributes';
import type { Effect } from '../types/events';
import type { EventOutcome, GameState, ScheduledEvent } from '../types/game';
import { generateOffers } from '../market/offers';
import type { EventContent } from './context';
import { fill } from './context';
import { nudgeTendency } from '../personality/personality';
import { queueCinematic } from '../cinematics/cinematics';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const GROUPS: Record<'technical' | 'physical' | 'mental' | 'goalkeeping', readonly AttributeId[]> = {
  technical: TECHNICAL_ATTRIBUTES,
  physical: PHYSICAL_ATTRIBUTES,
  mental: MENTAL_ATTRIBUTES,
  goalkeeping: GOALKEEPING_ATTRIBUTES,
};

/** Tipos de lesión según gravedad (para el texto). */
export const INJURY_TYPES: Record<1 | 2 | 3, string[]> = {
  1: ['Sobrecarga muscular', 'Esguince leve de tobillo', 'Contusión en la rodilla'],
  2: ['Rotura fibrilar', 'Esguince de rodilla', 'Lesión en el isquiotibial'],
  3: ['Rotura del ligamento cruzado', 'Fractura del quinto metatarsiano', 'Rotura del tendón de Aquiles'],
};

export function applyEffects(game: GameState, effects: Effect[], content: EventContent, rng: Rng, vars: Record<string, string>, out: EventOutcome['changes']): void {
  for (const e of effects) applyEffect(game, e, content, rng, vars, out);
}

export function applyEffect(game: GameState, e: Effect, content: EventContent, rng: Rng, vars: Record<string, string>, out: EventOutcome['changes']): void {
  const p = game.player;
  switch (e.type) {
    case 'attribute':
      p.attributes[e.id] = clamp(p.attributes[e.id] + e.delta, ATTRIBUTE_MIN, ATTRIBUTE_MAX);
      out.push({ key: `attr.${e.id}`, value: e.delta });
      break;
    case 'attributeGroup':
      for (const id of GROUPS[e.group]) p.attributes[id] = clamp(p.attributes[id] + e.delta, ATTRIBUTE_MIN, ATTRIBUTE_MAX);
      out.push({ key: `attrGroup.${e.group}`, value: e.delta });
      break;
    case 'potential':
      p.potential.hidden = clamp(p.potential.hidden + e.delta, 40, 99);
      out.push({ key: 'effects.potential', value: e.delta });
      break;
    case 'relation':
      p.relations[e.who] = clamp(p.relations[e.who] + e.delta, -100, 100);
      out.push({ key: `effects.relation.${e.who}`, value: e.delta });
      break;
    case 'reputation':
      p.reputation[e.scope] = clamp(p.reputation[e.scope] + e.delta, 0, 100);
      out.push({ key: `effects.reputation.${e.scope}`, value: e.delta });
      break;
    case 'morale':
    case 'form':
    case 'fitness':
      p.status[e.type] = clamp(p.status[e.type] + e.delta, 0, 100);
      out.push({ key: `effects.${e.type}`, value: e.delta });
      break;
    case 'money':
      p.money += e.amount;
      out.push({ key: 'effects.money', value: e.amount });
      break;
    case 'followers': {
      const delta = e.percent ? Math.round((game.social.followers * e.delta) / 100) : e.delta;
      game.social.followers = Math.max(0, game.social.followers + delta);
      out.push({ key: 'effects.followers', value: delta });
      break;
    }
    case 'trait': {
      const existing = p.traits.find((t) => t.id === e.id);
      if (e.op === 'add' && !existing) {
        p.traits.push({ id: e.id, intensity: 1 });
        out.push({ key: 'effects.traitAdd', value: e.id });
      } else if (e.op === 'remove' && existing) {
        p.traits = p.traits.filter((t) => t.id !== e.id);
        out.push({ key: 'effects.traitRemove', value: e.id });
      } else if (e.op === 'intensify' && existing && existing.intensity < 3) {
        existing.intensity = (existing.intensity + 1) as 2 | 3;
        out.push({ key: 'effects.traitUp', value: e.id });
      } else if (e.op === 'weaken' && existing) {
        if (existing.intensity === 1) p.traits = p.traits.filter((t) => t.id !== e.id);
        else existing.intensity = (existing.intensity - 1) as 1 | 2;
        out.push({ key: 'effects.traitDown', value: e.id });
      }
      break;
    }
    case 'tendency':
      p.tendencies[e.id] = clamp((p.tendencies[e.id] ?? 0) + e.delta, -100, 100);
      break;
    case 'flag':
      game.flags[e.id] = e.value;
      break;
    case 'incrementFlag':
      game.flags[e.id] = Number(game.flags[e.id] ?? 0) + (e.by ?? 1);
      break;
    case 'injury': {
      const type = rng.pick(INJURY_TYPES[e.severity]);
      const weeks = Math.max(1, Math.round(e.weeks * rng.float(0.8, 1.25)));
      p.status.injury = { type, severity: e.severity, weeksOut: weeks, season: game.calendar.season };
      p.status.injuryProneness = clamp(p.status.injuryProneness + e.severity * 2, 0, 100);
      out.push({ key: 'effects.injury', value: `${type} (${weeks} sem.)` });
      break;
    }
    case 'injuryProneness':
      p.status.injuryProneness = clamp(p.status.injuryProneness + e.delta, 0, 100);
      break;
    case 'scheduleEvent': {
      const target: ScheduledEvent = { eventId: e.id, season: game.calendar.season + (e.inSeasons ?? 0), ...(e.phase ? { phase: e.phase } : {}) };
      game.scheduledEvents.push(target);
      break;
    }
    case 'transferRequest':
      game.flags['transferRequest'] = true;
      nudgeTendency(game, 'lealtad', -12);
      nudgeTendency(game, 'rebeldia', 6);
      p.relations.board = clamp(p.relations.board - 15, -100, 100);
      p.relations.fans = clamp(p.relations.fans - 10, -100, 100);
      out.push({ key: 'effects.transferRequest', value: '' });
      break;
    case 'offer': {
      const offers = generateOffers(game, content.world, rng, {
        kind: e.kind,
        ...(e.clubPrestige ? { clubPrestige: e.clubPrestige } : {}),
        ...(e.sameCountry !== undefined ? { sameCountry: e.sameCountry } : {}),
        max: 1,
      }).filter((o) => o.kind === e.kind);
      const fresh = offers.filter((o) => !(game.offers ?? []).some((x) => x.id === o.id));
      game.offers = [...(game.offers ?? []), ...fresh];
      if (fresh.length) out.push({ key: 'effects.offer', value: fresh.length });
      break;
    }
    case 'playingTime':
      p.relations.coach = clamp(p.relations.coach + e.delta * 2, -100, 100);
      out.push({ key: 'effects.playingTime', value: e.delta });
      break;
    case 'news':
      game.inbox.unshift({
        id: `n-${game.calendar.season}-${game.calendar.phase}-${game.inbox.length}`,
        season: game.calendar.season,
        phase: game.calendar.phase,
        source: 'press',
        headline: fill(e.headline.es, vars),
        tone: e.tone,
      });
      game.inbox = game.inbox.slice(0, 40);
      break;
    case 'cinematic':
      game.flags[`cinematic:${e.template}`] = true;
      queueCinematic(game, { type: 'custom', importance: 'minor', template: e.template, ...(p.contract ? { clubId: p.contract.clubId } : {}) });
      break;
    case 'unlockCelebration':
      if (!p.celebrations.unlocked.includes(e.id)) p.celebrations.unlocked.push(e.id);
      out.push({ key: 'effects.celebration', value: e.id });
      break;
    case 'retire':
      game.flags['retireRequested'] = true;
      break;
    case 'setAgent': {
      if (e.profile === 'none') {
        p.agent = null;
        out.push({ key: 'effects.agentFired', value: '' });
        break;
      }
      const top = e.profile === 'top';
      p.agent = {
        id: 'agent-' + e.profile,
        name: vars['agente'] ?? 'Tu agente',
        quality: top ? rng.int(70, 90) : rng.int(35, 55),
        commission: top ? 10 : 5,
        connections: top ? rng.int(70, 95) : rng.int(20, 40),
      };
      p.relations.agent = top ? 10 : 30;
      out.push({ key: 'effects.agentHired', value: p.agent.name });
      break;
    }
    case 'recovery': {
      const inj = p.status.injury;
      if (!inj) break;
      inj.weeksOut = Math.max(0, inj.weeksOut + e.weeks);
      if (inj.weeksOut === 0) delete p.status.injury;
      out.push({ key: 'effects.recovery', value: e.weeks });
      break;
    }
  }
}
