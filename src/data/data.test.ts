/** Validación de los datos reales del juego. `npm run validate:data` ejecuta solo este archivo. */
import { describe, expect, it } from 'vitest';
import { RAW_DATA, WORLD } from './index';
import { validateGameData } from '@/engine/data/validate';
import { clubsInRegion } from '@/engine/data/world';

const report = validateGameData(RAW_DATA);

describe('datos del juego', () => {
  it('no tienen errores', () => {
    if (report.errors.length) console.error(report.errors.join('\n'));
    expect(report.errors).toEqual([]);
  });

  it('informa de avisos y datos por revisar', () => {
    console.info(
      `Datos: ${report.stats.countries} países, ${report.stats.divisions} divisiones, ${report.stats.clubs} clubes. ` +
        `${report.warnings.length} avisos, ${report.review.length} elementos por revisar.`,
    );
    if (report.warnings.length) console.warn(report.warnings.join('\n'));
    expect(report.stats.clubs).toBeGreaterThan(250);
  });

  it('las divisiones tienen el número de equipos esperado', () => {
    const size = (id: string) => WORLD.divisionById.get(id)?.clubs.length;
    expect(size('esp.laliga')).toBe(20);
    expect(size('esp.segunda')).toBe(22);
    expect(size('esp.primera-federacion')).toBe(40);
    expect(size('eng.premier-league')).toBe(20);
    expect(size('eng.championship')).toBe(24);
    expect(size('eng.league-one')).toBe(24);
    expect(size('arg.liga-profesional')).toBe(30);
    expect(size('bra.serie-a')).toBe(20);
    expect(size('bra.serie-b')).toBe(20);
    expect(size('bra.serie-c')).toBe(20);
  });

  it('las rivalidades son simétricas tras normalizar', () => {
    const boca = WORLD.clubById.get('arg.boca');
    const river = WORLD.clubById.get('arg.river');
    expect(boca?.rivals.some((r) => r.clubId === 'arg.river')).toBe(true);
    expect(river?.rivals.some((r) => r.clubId === 'arg.boca' && r.name === 'Superclásico')).toBe(true);
  });

  it('cada club conoce su país y su división', () => {
    expect(WORLD.clubById.get('eng.wrexham')?.country).toBe('ENG');
    expect(WORLD.divisionOfClub.get('esp.real-madrid-castilla')).toBe('esp.primera-federacion');
  });

  it('se pueden buscar clubes por región', () => {
    const vascos = clubsInRegion(WORLD, 'ESP', 'País Vasco').map((c) => c.id);
    expect(vascos[0]).toBe('esp.athletic');
    expect(vascos).toContain('esp.arenas');
  });
});

describe('validador', () => {
  it('detecta errores de coherencia', () => {
    const broken = structuredClone(RAW_DATA);
    const laliga = broken.leagues[0]!.divisions[0]!;
    laliga.clubs[0]!.rivals = [{ clubId: 'esp.no-existe', type: 'derbi', intensity: 1 }];
    laliga.clubs[1]!.id = laliga.clubs[2]!.id;
    laliga.clubs[3]!.region = 'Atlántida';
    laliga.relegation = { direct: 2 };
    const { errors } = validateGameData(broken);
    expect(errors.some((e) => e.includes('esp.no-existe'))).toBe(true);
    expect(errors.some((e) => e.includes('repetido'))).toBe(true);
    expect(errors.some((e) => e.includes('Atlántida'))).toBe(true);
    expect(errors.some((e) => e.includes('bajan 2'))).toBe(true);
  });
});

describe('escudos', () => {
  it('los filiales sin escudo propio usan el del primer equipo', () => {
    const castilla = WORLD.clubById.get('esp.real-madrid-castilla');
    const madrid = WORLD.clubById.get('esp.real-madrid');
    if (madrid?.crest?.file) expect(castilla?.crest?.file).toBe(madrid.crest.file);
  });

  it('el manifiesto apunta a archivos que existen', async () => {
    const { existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const publicDir = join(process.cwd(), 'public');
    const missing = Object.values(RAW_DATA.crests ?? {}).filter((f) => !existsSync(join(publicDir, f)));
    expect(missing).toEqual([]);
  });
});
