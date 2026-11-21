import { describe, expect, it } from 'vitest';
import { createNewGame, ageInSeason, formatSeason, START_AGE } from '../world/newGame';
import { deserializeGame, serializeGame, SaveError, SAVE_FORMAT } from './serialize';
import { migrateGame } from './migrations';
import { createMemoryStorage } from '@/persistence/storage';
import {
  deleteSlot,
  exportFileName,
  exportCode,
  exportGame,
  importGame,
  latestSlot,
  listSlots,
  loadFromSlot,
  saveToSlot,
} from '@/persistence/slots';
import { addToHallOfFame, loadHallOfFame, type HallOfFameEntry } from '@/persistence/hallOfFame';

const newGame = (seed = 'test-seed', name = 'Lucas Ferreyra') =>
  createNewGame({ seed, name, createdAt: '2026-11-19T10:00:00.000Z' });

describe('createNewGame', () => {
  it('es determinista con la misma semilla', () => {
    expect(newGame('abc')).toEqual(newGame('abc'));
  });

  it('cambia con otra semilla', () => {
    expect(newGame('abc').player.attributes).not.toEqual(newGame('xyz').player.attributes);
  });

  it(`el jugador empieza con ${START_AGE} años`, () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const g = newGame(seed);
      expect(ageInSeason(g.player.identity.birthDate, g.calendar.season)).toBe(START_AGE);
    }
  });

  it('formatea la temporada según el calendario', () => {
    expect(formatSeason(2026)).toBe('2026-27');
    expect(formatSeason(2099)).toBe('2099-00');
    expect(formatSeason(2026, 'anual')).toBe('2026');
  });
});

describe('serialización', () => {
  it('ida y vuelta conserva la partida', () => {
    const game = newGame();
    const env = deserializeGame(serializeGame(game, '2026-11-19T10:00:00.000Z'));
    expect(env.format).toBe(SAVE_FORMAT);
    expect(env.game).toEqual(game);
  });

  it('rechaza JSON inválido', () => {
    expect(() => deserializeGame('{no es json')).toThrowError(SaveError);
    try {
      deserializeGame('{no es json');
    } catch (e) {
      expect((e as SaveError).code).toBe('invalid-json');
    }
  });

  it('rechaza un JSON que no es una partida', () => {
    expect(() => deserializeGame(JSON.stringify({ hola: 1 }))).toThrow(/no es una partida/);
  });

  it('rechaza partidas de versiones futuras', () => {
    const raw = JSON.parse(serializeGame(newGame(), 'x'));
    raw.version = 999;
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/versión más nueva/);
  });

  it('detecta partidas dañadas', () => {
    const raw = JSON.parse(serializeGame(newGame(), 'x'));
    delete raw.game.player.identity.name;
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow(/dañada/);
  });

  it('no pierde campos desconocidos al validar', () => {
    const raw = JSON.parse(serializeGame(newGame(), 'x'));
    raw.game.player.extra = { futuro: true };
    const env = deserializeGame(JSON.stringify(raw));
    expect((env.game.player as unknown as { extra: unknown }).extra).toEqual({ futuro: true });
  });
});

describe('migraciones', () => {
  it('aplica las migraciones en orden hasta la versión objetivo', () => {
    const migrations = {
      1: (g: Record<string, unknown>) => ({ ...g, a: 1 }),
      2: (g: Record<string, unknown>) => ({ ...g, b: (g.a as number) + 1 }),
    };
    expect(migrateGame({ version: 1 }, 1, migrations, 3)).toEqual({ version: 3, a: 1, b: 2 });
  });

  it('falla si falta un paso', () => {
    expect(() => migrateGame({ version: 1 }, 1, {}, 2)).toThrow(/Falta la migración/);
  });
});

describe('ranuras', () => {
  it('guarda comprimido y carga la misma partida', () => {
    const storage = createMemoryStorage();
    const game = newGame();
    const meta = saveToSlot(storage, '1', game, '2026-11-19T10:00:00.000Z');
    expect(meta.playerName).toBe('Lucas Ferreyra');
    expect(meta.seasonLabel).toBe('2026-27');
    expect(loadFromSlot(storage, '1')).toEqual(game);
    // Comprimido: mucho más pequeño que el JSON.
    const stored = storage.dump()['leyenda:slot:1']!;
    expect(stored.length).toBeLessThan(serializeGame(game, 'x').length);
  });

  it('lista ranuras, encuentra la más reciente y borra', () => {
    const storage = createMemoryStorage();
    saveToSlot(storage, '1', newGame('a', 'Uno'), '2026-11-19T10:00:00.000Z');
    saveToSlot(storage, '3', newGame('b', 'Tres'), '2026-11-19T12:00:00.000Z');
    const slots = listSlots(storage);
    expect(slots['1']?.playerName).toBe('Uno');
    expect(slots['2']).toBeNull();
    expect(latestSlot(storage)?.playerName).toBe('Tres');
    deleteSlot(storage, '3');
    expect(listSlots(storage)['3']).toBeNull();
    expect(latestSlot(storage)?.playerName).toBe('Uno');
  });

  it('cargar una ranura vacía lanza un error claro', () => {
    expect(() => loadFromSlot(createMemoryStorage(), '2')).toThrow(/vacía/);
  });

  it('exportar e importar en JSON conserva la partida', () => {
    const game = newGame();
    const json = exportGame(game, '2026-11-19T10:00:00.000Z');
    expect(json).toContain('\n  '); // legible
    expect(importGame(json)).toEqual(game);
  });

  it('el código de partida se copia, se pega con espacios y se recupera', () => {
    const game = newGame();
    const code = exportCode(game, '2026-11-19T10:00:00.000Z');
    expect(code.startsWith('LEYENDA1:')).toBe(true);
    expect(code.length).toBeLessThan(exportGame(game, '2026-11-19T10:00:00.000Z').length);
    const pasted = `Mi partida:\n${code.slice(0, 50)}\n ${code.slice(50)}  `;
    expect(importGame(pasted)).toEqual(game);
    expect(() => importGame('LEYENDA1:basura')).toThrow();
  });

  it('nombre de archivo de exportación sin acentos ni espacios', () => {
    expect(exportFileName(newGame('x', 'Íñigo Martínez'))).toBe('leyenda-inigo-martinez-2026.json');
  });
});

describe('Salón de la Fama', () => {
  it('ordena por legado y no duplica la misma carrera', () => {
    const storage = createMemoryStorage();
    const base: HallOfFameEntry = {
      gameId: 'g1', name: 'A', nationality: 'ESP', position: 'DC', retiredSeason: 2046, retiredAge: 35,
      seasons: 20, peakOverall: 80, clubs: [], apps: 500, goals: 200, assists: 50, trophies: 5, awards: 1,
      legacy: 'Ídolo', legacyScore: 50, finishedAt: 'x',
    };
    addToHallOfFame(storage, base);
    addToHallOfFame(storage, { ...base, gameId: 'g2', name: 'B', legacyScore: 90 });
    addToHallOfFame(storage, { ...base, legacyScore: 60 });
    const list = loadHallOfFame(storage);
    expect(list.map((e) => e.name)).toEqual(['B', 'A']);
    expect(list[1]?.legacyScore).toBe(60);
  });
});
