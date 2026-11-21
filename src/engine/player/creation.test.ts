import { describe, expect, it } from 'vitest';
import { WORLD } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { STARTING_TRAIT_COUNT, TRAITS } from '@/data/traits';
import { defaultAppearance } from './defaults';
import { generateStartingAttributes, rollPotential, shownPotentialRange, validateCharacter, type CharacterInput } from './create';
import { academyCountries, academyOptions, rollTrial, trialChance } from './academy';
import { overallFor } from './overall';
import { createNewGame } from '../world/newGame';

const content = { styles: PLAY_STYLES, traits: TRAITS };

const base: CharacterInput = {
  name: 'Iker Larrañaga',
  birthDay: 14,
  birthMonth: 3,
  birthPlace: { country: 'ESP', region: 'País Vasco', city: 'Bilbao' },
  nationalities: ['ESP'],
  foot: 'derecho',
  appearance: defaultAppearance(),
  mainPosition: 'DC',
  secondaryPositions: ['EI'],
  style: 'goleador-nato',
  traits: ['trabajador', 'sangre-fria'],
  preferredNumber: 9,
};

describe('creación del personaje', () => {
  it('el talento depende solo de la semilla y está en rango', () => {
    expect(rollPotential('s1')).toBe(rollPotential('s1'));
    for (let i = 0; i < 200; i++) {
      const p = rollPotential(`seed-${i}`);
      expect(p).toBeGreaterThanOrEqual(72);
      expect(p).toBeLessThanOrEqual(98);
    }
  });

  it('el rango visible contiene el potencial real', () => {
    for (let i = 0; i < 100; i++) {
      const p = rollPotential(`r-${i}`);
      const [lo, hi] = shownPotentialRange(p, `r-${i}`);
      expect(lo).toBeLessThanOrEqual(p);
      expect(hi).toBeGreaterThanOrEqual(p);
    }
  });

  it('la media inicial es la de un juvenil (30-58)', () => {
    for (let i = 0; i < 50; i++) {
      const seed = `m-${i}`;
      const attrs = generateStartingAttributes(base, rollPotential(seed), seed, content);
      const ovr = overallFor(attrs, 'DC');
      expect(ovr).toBeGreaterThanOrEqual(30);
      expect(ovr).toBeLessThanOrEqual(58);
    }
  });

  it('el estilo y la posición marcan los atributos', () => {
    const seed = 'estilo';
    const p = rollPotential(seed);
    const striker = generateStartingAttributes(base, p, seed, content);
    const keeper = generateStartingAttributes({ ...base, mainPosition: 'POR', secondaryPositions: [], style: 'portero-clasico' }, p, seed, content);
    expect(striker.finishing).toBeGreaterThan(keeper.finishing);
    expect(keeper.reflexes).toBeGreaterThan(striker.reflexes);
    const tank = generateStartingAttributes({ ...base, style: 'nueve-tanque', appearance: { ...base.appearance, height: 192 } }, p, seed, content);
    expect(tank.heading).toBeGreaterThan(striker.heading);
  });

  it('valida las elecciones', () => {
    expect(validateCharacter(base, content, STARTING_TRAIT_COUNT)).toEqual([]);
    expect(validateCharacter({ ...base, traits: ['profesional', 'fiestero'] }, content, STARTING_TRAIT_COUNT)).toContain('creation.errors.opposites');
    expect(validateCharacter({ ...base, style: 'portero-clasico' }, content, STARTING_TRAIT_COUNT)).toContain('creation.errors.style');
    expect(validateCharacter({ ...base, traits: ['inventado', 'lider'] }, content, STARTING_TRAIT_COUNT)).toContain('creation.errors.traits');
    expect(validateCharacter({ ...base, birthMonth: 2, birthDay: 30 }, content, STARTING_TRAIT_COUNT)).toContain('creation.errors.birthDate');
    expect(validateCharacter({ ...base, mainPosition: 'POR', style: 'portero-clasico', secondaryPositions: ['DFC'] }, content, STARTING_TRAIT_COUNT)).toContain(
      'creation.errors.keeperMix',
    );
  });
});

describe('pruebas de cantera', () => {
  it('ofrece clubes cercanos al lugar de nacimiento', () => {
    const { options, fallback } = academyOptions(WORLD, base.birthPlace, 75, 'cantera');
    expect(options.length).toBeGreaterThanOrEqual(3);
    const ids = options.map((o) => o.clubId);
    expect(ids.some((id) => WORLD.clubById.get(id)?.region === 'País Vasco')).toBe(true);
    expect(fallback.chance).toBe(1);
    expect(ids).not.toContain(fallback.clubId);
    // Los filiales no aparecen: la cantera es la del primer equipo.
    expect(ids.some((id) => WORLD.clubById.get(id)?.parentClubId)).toBe(false);
  });

  it('es determinista y depende del lugar', () => {
    const a = academyOptions(WORLD, base.birthPlace, 75, 'x');
    expect(academyOptions(WORLD, base.birthPlace, 75, 'x')).toEqual(a);
    const rosario = academyOptions(WORLD, { country: 'ARG', region: 'Santa Fe', city: 'Rosario' }, 75, 'x');
    expect(rosario.options.every((o) => o.clubId.startsWith('arg.'))).toBe(true);
    expect(rosario.options.some((o) => o.clubId === 'arg.newells' || o.clubId === 'arg.rosario-central')).toBe(true);
  });

  it('las grandes canteras son difíciles y las cercanas más fáciles', () => {
    const barca = WORLD.clubById.get('esp.barcelona')!;
    expect(trialChance(70, barca, 'pais')).toBeLessThan(0.15);
    expect(trialChance(92, barca, 'ciudad')).toBeGreaterThan(trialChance(92, barca, 'pais'));
    const small = WORLD.clubById.get('esp.arenas')!;
    expect(trialChance(70, small, 'ciudad')).toBeGreaterThan(0.85);
  });

  it('los nacidos en países sin liga prueban en los vecinos', () => {
    expect(academyCountries(WORLD, 'BOL')).toEqual(['ARG', 'BRA', 'PAR', 'PER', 'CHI']);
    expect(academyOptions(WORLD, { country: 'BOL', region: 'Bolivia', city: 'La Paz' }, 80, 'u').options.length).toBeGreaterThanOrEqual(3);
    expect(academyCountries(WORLD, 'PAR')).toEqual(['PAR']);
    expect(academyCountries(WORLD, 'URU')).toEqual(['URU']);
    expect(academyCountries(WORLD, 'AUT')).toEqual(['GER', 'ITA']);
    expect(academyCountries(WORLD, 'MEX')).toEqual(['MEX']);
    expect(academyCountries(WORLD, 'CAN')).toEqual(['ESP']);
    expect(academyCountries(WORLD, 'SCO')).toEqual(['SCO']);
    expect(academyCountries(WORLD, 'NIR')).toEqual(['ENG']);
    const gales = academyOptions(WORLD, { country: 'WAL', region: 'Gales', city: 'Cardiff' }, 75, 'w');
    expect(gales.options.some((o) => o.clubId === 'eng.cardiff' || o.clubId === 'eng.swansea' || o.clubId === 'eng.wrexham')).toBe(true);
  });

  it('el resultado de la prueba es reproducible', () => {
    const { options } = academyOptions(WORLD, base.birthPlace, 75, 'trial');
    const opt = options[0]!;
    expect(rollTrial('trial', opt)).toBe(rollTrial('trial', opt));
  });
});

describe('partida nueva con personaje', () => {
  it('guarda las elecciones y el club de cantera', () => {
    const game = createNewGame({
      seed: 'completa',
      createdAt: '2026-11-19T10:00:00.000Z',
      name: base.name,
      character: base,
      content,
      academy: { clubId: 'esp.athletic', budgetM: 140, trial: { clubId: 'esp.athletic', passed: true } },
    });
    expect(game.player.identity.birthDate).toBe('2011-03-14');
    expect(game.player.positions).toEqual({ main: 'DC', secondary: ['EI'] });
    expect(game.player.traits.map((t) => t.id)).toEqual(['trabajador', 'sangre-fria']);
    expect(game.player.contract?.clubId).toBe('esp.athletic');
    expect(game.player.contract?.role).toBe('cantera');
    expect(game.career.spells[0]?.type).toBe('academy');
    expect(game.flags['academyTrialPassed']).toBe(true);
  });
});

describe('equilibrio de rasgos', () => {
  it('todos se pueden elegir al empezar y su bonus de crecimiento es parecido', () => {
    for (const tr of TRAITS) {
      expect(tr.selectableAtStart, tr.id).toBe(true);
      // Un +1 % general equivale aproximadamente a +10 % en un atributo (unos 10 atributos cuentan para la media).
      const budget = Object.entries(tr.growth ?? {}).reduce((s, [id, m]) => s + ((m ?? 1) - 1) * (id === 'all' ? 10 : 1), 0);
      expect(budget, tr.id).toBeGreaterThanOrEqual(0.3);
      expect(budget, tr.id).toBeLessThanOrEqual(0.42);
      expect(Object.keys(tr.passive ?? {}).length, tr.id).toBeGreaterThan(0);
    }
  });
});
