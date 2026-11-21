import { describe, expect, it } from 'vitest';
import { ENGINE_CONTENT } from '@/data';
import { SPECIALTIES } from '@/data/specialties';
import { PLAY_STYLES } from '@/data/playStyles';
import { TRAITS } from '@/data/traits';
import { ALL_ATTRIBUTES } from '../types/attributes';
import type { Player } from '../types/player';
import { createNewGame } from '../world/newGame';
import { defaultAppearance } from './defaults';
import { matchModifiers, requirements, specialtyApplies, specialtyLevel, updateSpecialties, withSpecialtyFocus } from './specialties';
import { advancePhase } from '../season/advance';
import { chooseOption } from '../events/engine';
import type { GameState } from '../types/game';

function game(main: 'DC' | 'POR' = 'DC', style = 'goleador-nato', traits = ['trabajador', 'creativo']): GameState {
  return createNewGame({
    seed: 'espec', createdAt: '2026-11-21T10:00:00.000Z', name: 'Leo Prueba',
    character: {
      name: 'Leo Prueba', birthDay: 1, birthMonth: 1, birthPlace: { country: 'ESP', region: 'Andalucía', city: 'Sevilla' },
      nationalities: ['ESP'], foot: 'derecho', appearance: defaultAppearance(), mainPosition: main, secondaryPositions: [],
      style, traits, preferredNumber: 9,
    },
    content: { styles: PLAY_STYLES, traits: TRAITS }, academy: { clubId: 'esp.betis', budgetM: 150 },
  });
}

const withAttrs = (p: Player, v: number): Player => ({ ...p, attributes: Object.fromEntries(ALL_ATTRIBUTES.map((a) => [a, v])) as Player['attributes'] });

describe('especialidades: datos', () => {
  it('ids únicos y referencias válidas', () => {
    expect(new Set(SPECIALTIES.map((s) => s.id)).size).toBe(SPECIALTIES.length);
    expect(SPECIALTIES.length).toBeGreaterThanOrEqual(30);
    for (const s of SPECIALTIES) {
      for (const a of Object.keys(s.requires)) expect(ALL_ATTRIBUTES as readonly string[], `${s.id}: ${a}`).toContain(a);
      for (const st of s.styles ?? []) expect(PLAY_STYLES.some((x) => x.id === st), `${s.id}: estilo ${st}`).toBe(true);
      for (const tr of s.traits ?? []) expect(TRAITS.some((x) => x.id === tr), `${s.id}: rasgo ${tr}`).toBe(true);
      // El nivel élite es alcanzable (≤ 99) sin rebajas.
      expect(Math.max(...Object.values(s.requires)) + (s.eliteBonus ?? 14)).toBeLessThanOrEqual(99);
    }
    expect(SPECIALTIES.filter((s) => s.signature).length).toBeGreaterThanOrEqual(6);
    expect(SPECIALTIES.filter((s) => s.keeper).length).toBeGreaterThanOrEqual(4);
  });
});

describe('especialidades: reglas', () => {
  it('se ganan con los atributos, suben a élite y se pierden con margen', () => {
    const def = SPECIALTIES.find((s) => s.id === 'tiro-colocado')!;
    const base = game('DC', 'delantero-movil', ['trabajador', 'leal']).player;
    expect(specialtyLevel(def, withAttrs(base, 60))).toBe(0);
    expect(specialtyLevel(def, withAttrs(base, 78))).toBe(1);
    expect(specialtyLevel(def, withAttrs(base, 92))).toBe(2);
    // Con nivel 1, bajar 2 puntos por debajo del umbral no la quita; bajar 4, sí.
    const need = Math.max(...requirements(def, base, 1).map(([, v]) => v));
    expect(specialtyLevel(def, withAttrs(base, need - 2), 1)).toBe(1);
    expect(specialtyLevel(def, withAttrs(base, need - 4), 1)).toBe(0);
  });

  it('el estilo de juego y los rasgos afines rebajan el umbral', () => {
    const def = SPECIALTIES.find((s) => s.id === 'tiro-colocado')!;
    const plain = game('DC', 'delantero-movil', ['trabajador', 'leal']).player;
    const afin = game('DC', 'goleador-nato', ['sangre-fria', 'leal']).player;
    const a = requirements(def, plain, 1)[0]![1];
    const b = requirements(def, afin, 1)[0]![1];
    expect(a - b).toBe(7);
  });

  it('las de portero solo para porteros y al revés', () => {
    const gk = game('POR', 'portero-clasico').player;
    const dc = game('DC').player;
    expect(specialtyApplies(SPECIALTIES.find((s) => s.id === 'reflejos-felinos')!, gk)).toBe(true);
    expect(specialtyApplies(SPECIALTIES.find((s) => s.id === 'reflejos-felinos')!, dc)).toBe(false);
    expect(specialtyApplies(SPECIALTIES.find((s) => s.id === 'ruleta')!, gk)).toBe(false);
  });

  it('las conseguidas dan bonus en el partido y el foco se guarda', () => {
    const g = game();
    const p = withAttrs(g.player, 90);
    const changes = updateSpecialties(p, SPECIALTIES, 2030);
    expect(changes.length).toBeGreaterThan(5);
    const mods = matchModifiers(p, SPECIALTIES);
    expect(mods.goals).toBeGreaterThan(0);
    expect(mods.dribbles).toBeGreaterThan(0);
    expect(withSpecialtyFocus(g, 'ruleta', SPECIALTIES).player.specialtyFocus).toBe('ruleta');
    expect(withSpecialtyFocus(g, 'reflejos-felinos', SPECIALTIES).player.specialtyFocus).toBeUndefined();
  });
});

describe('especialidades: en una carrera', () => {
  it('un jugador consigue especialidades acordes a su posición con los años', () => {
    let g = withSpecialtyFocus(game(), 'tiro-colocado', SPECIALTIES);
    for (let i = 0; i < 10 * 5; i++) {
      while (g.activeEvent) {
        const ev = ENGINE_CONTENT.events.find((e) => e.id === g.activeEvent!.eventId)!;
        g = chooseOption(g, ev.options[0]!.id, ENGINE_CONTENT);
      }
      g = advancePhase(g, ENGINE_CONTENT);
    }
    const ids = (g.player.specialties ?? []).map((s) => s.id);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(SPECIALTIES.find((s) => s.id === id)!.keeper).toBe(false);
  });
});
