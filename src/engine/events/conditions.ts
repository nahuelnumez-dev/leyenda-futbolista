/** Evaluación de requisitos (`Condition`) de eventos y opciones. */
import type { Rng } from '../rng';
import { POSITION_GROUP } from '../types/attributes';
import type { Comparison, Condition } from '../types/events';
import type { GameState } from '../types/game';
import { overallFor } from '../player/overall';
import type { EventContent } from './context';
import { mainRival, playerAge } from './context';
import type { CareerMetric, TrophyKind } from '../types/events';

/** Valor de una métrica de carrera (solo partidos de club salvo internacionalidades). */
export function careerMetric(game: GameState, stat: CareerMetric): number {
  const club = game.career.seasons.flatMap((s) => s.stats.filter((c) => c.competitionId !== 'youth'));
  const current = (game.current?.matches ?? []).filter((m) => m.competition !== 'youth' && m.minutes > 0);
  switch (stat) {
    case 'goals':
      return club.reduce((a, c) => a + c.goals, 0);
    case 'assists':
      return club.reduce((a, c) => a + c.assists, 0);
    case 'apps':
      return club.reduce((a, c) => a + c.apps, 0) + (game.calendar.phase === 'seasonEnd' ? 0 : current.length);
    case 'seasons':
      return game.career.seasons.length;
    case 'clubs':
      return new Set(game.career.spells.filter((s) => s.type !== 'academy').map((s) => s.clubId)).size || (game.player.contract ? 1 : 0);
    case 'loans':
      return game.career.spells.filter((s) => s.type === 'loan').length;
    case 'caps':
      return game.career.nationalTeam.caps;
    case 'ntGoals':
      return game.career.nationalTeam.goals;
    case 'hatTricks':
      return game.career.records.hatTricks;
    case 'trophies':
      return game.career.trophies.length;
    case 'peakOverall':
      return game.career.records.peakOverall;
    case 'peakValue':
      return game.career.records.peakMarketValue;
    case 'biggestFee':
      return game.career.records.biggestTransferFee;
    case 'followers':
      return game.social.followers;
    case 'promotions':
      return Number(game.flags['promotions'] ?? 0);
  }
}

/** Tipo de un título según su competición. */
export function trophyKind(competitionId: string, content: EventContent, national: boolean): Exclude<TrophyKind, 'any' | 'topLeague'> {
  if (national) return 'national';
  if (content.world.divisionById.has(competitionId)) return 'league';
  if (competitionId.startsWith('uefa.') || competitionId.startsWith('conmebol.') || competitionId.startsWith('afc.') || competitionId.startsWith('concacaf.')) return 'continental';
  return 'cup';
}

const inRange = (v: number, c: Comparison) => (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max);

/**
 * ¿Se cumple la condición? `rng` solo se usa en `chance`; sin él, `chance` cuenta como cumplida
 * (útil para saber si una opción está disponible sin tirar dados).
 */
export function check(cond: Condition, game: GameState, content: EventContent, rng?: Rng): boolean {
  const p = game.player;
  const clubId = p.contract?.clubId;
  const dyn = clubId ? game.world.clubs[clubId] : undefined;
  switch (cond.type) {
    case 'age':
      return inRange(playerAge(game), cond);
    case 'overall':
      return inRange(overallFor(p.attributes, p.positions.main), cond);
    case 'attribute':
      return inRange(p.attributes[cond.id], cond);
    case 'reputation':
      return inRange(p.reputation[cond.scope], cond);
    case 'relation':
      return inRange(p.relations[cond.who], cond);
    case 'tendency':
      return inRange(p.tendencies[cond.id] ?? 0, cond);
    case 'money':
      return inRange(p.money, cond);
    case 'morale':
      return inRange(p.status.morale, cond);
    case 'seasonStat': {
      const ms = (game.current?.matches ?? []).filter((m) => m.competition !== 'youth' && m.minutes > 0);
      const rated = ms.filter((m) => m.rating !== null);
      const value =
        cond.stat === 'goals' ? ms.reduce((s, m) => s + m.goals, 0)
        : cond.stat === 'assists' ? ms.reduce((s, m) => s + m.assists, 0)
        : cond.stat === 'apps' ? ms.length
        : rated.length ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length : 0;
      return inRange(value, cond);
    }
    case 'followers':
      return inRange(game.social.followers, cond);
    case 'careerStat':
      return inRange(careerMetric(game, cond.stat), cond);
    case 'trophyCount': {
      const n = game.career.trophies.filter((tr) => {
        if (cond.competitions && !cond.competitions.some((c) => tr.competitionId.startsWith(c))) return false;
        const kind = trophyKind(tr.competitionId, content, Boolean(tr.nationalTeam));
        if (!cond.kind || cond.kind === 'any') return true;
        if (cond.kind === 'topLeague') return kind === 'league' && content.world.divisionById.get(tr.competitionId)?.tier === 1;
        return kind === cond.kind;
      }).length;
      return inRange(n, cond);
    }
    case 'awardCount': {
      const n = game.career.awards.filter((a) => a.awardId === cond.awardId && a.rank <= (cond.maxRank ?? 1)).length;
      return inRange(n, cond);
    }
    case 'sentiment':
      return inRange(game.social.sentiment, cond);
    case 'form':
      return inRange(p.status.form, cond);
    case 'clubPrestige':
      return inRange(dyn?.prestige ?? 0, cond);
    case 'divisionTier':
      return inRange(dyn ? (content.world.divisionById.get(dyn.divisionId)?.tier ?? 9) : 9, cond);
    case 'seasonsAtClub': {
      const spell = game.career.spells.findLast((s) => s.clubId === clubId && s.toSeason === undefined);
      return inRange(spell ? game.calendar.season - spell.fromSeason : 0, cond);
    }
    case 'trait': {
      const t = p.traits.find((x) => x.id === cond.id);
      return Boolean(t && t.intensity >= (cond.minIntensity ?? 1));
    }
    case 'notTrait':
      return !p.traits.some((x) => x.id === cond.id);
    case 'flag': {
      const v = game.flags[cond.id];
      return cond.value === undefined ? v !== undefined && v !== false && v !== 0 : v === cond.value;
    }
    case 'notFlag': {
      const v = game.flags[cond.id];
      return v === undefined || v === false || v === 0;
    }
    case 'eventSeen':
      return game.eventLog.some((e) => e.eventId === cond.id);
    case 'eventNotSeen':
      return !game.eventLog.some((e) => e.eventId === cond.id);
    case 'position':
      return cond.in.includes(p.positions.main);
    case 'positionGroup':
      return cond.in.includes(POSITION_GROUP[p.positions.main]);
    case 'style':
      return cond.in.includes(p.style);
    case 'country':
      return p.identity.nationalities.some((n) => cond.in.includes(n));
    case 'clubCountry':
      return Boolean(clubId && cond.in.includes(content.world.clubById.get(clubId)?.country ?? ''));
    case 'club':
      return Boolean(clubId && cond.in.includes(clubId));
    case 'injured':
      return Boolean(p.status.injury) === cond.value;
    case 'onLoan':
      return Boolean(p.contract?.loanFrom) === cond.value;
    case 'hasAgent':
      return Boolean(p.agent) === cond.value;
    case 'internationalCaps':
      return inRange(game.career.nationalTeam.caps, cond);
    case 'derbyUpcoming':
      return Boolean(mainRival(content, clubId));
    case 'chance':
      return rng ? rng.chance(cond.p) : true;
    case 'any':
      return cond.of.some((c) => check(c, game, content, rng));
    case 'not':
      return !check(cond.condition, game, content, rng);
  }
}

export function checkAll(conds: Condition[] | undefined, game: GameState, content: EventContent, rng?: Rng): boolean {
  return (conds ?? []).every((c) => check(c, game, content, rng));
}
