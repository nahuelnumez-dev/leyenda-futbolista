import { describe, expect, it } from 'vitest';
import { Rng, withRng } from './rng';

const sample = (rng: Rng, n = 20) => Array.from({ length: n }, () => rng.next());

describe('Rng', () => {
  it('la misma semilla produce la misma secuencia', () => {
    expect(sample(Rng.fromSeed('gol-12345'))).toEqual(sample(Rng.fromSeed('gol-12345')));
  });

  it('semillas distintas producen secuencias distintas', () => {
    expect(sample(Rng.fromSeed('a'))).not.toEqual(sample(Rng.fromSeed('b')));
  });

  it('reanudar desde el estado guardado continúa la misma secuencia', () => {
    const a = Rng.fromSeed('reanudar');
    sample(a, 50);
    const saved = a.getState();
    const expected = sample(a);
    const b = Rng.fromState(JSON.parse(JSON.stringify(saved)));
    expect(sample(b)).toEqual(expected);
  });

  it('next() está en [0, 1) e int() respeta los límites', () => {
    const rng = Rng.fromSeed('limites');
    for (let i = 0; i < 5000; i++) {
      const x = rng.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      const n = rng.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('int() reparte de forma aproximadamente uniforme', () => {
    const rng = Rng.fromSeed('uniforme');
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[rng.int(0, 5)]!++;
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
  });

  it('weighted() respeta los pesos y nunca elige peso 0', () => {
    const rng = Rng.fromSeed('pesos');
    const items = [
      { id: 'a', w: 1 },
      { id: 'b', w: 3 },
      { id: 'c', w: 0 },
    ];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 20000; i++) counts[rng.weighted(items, (x) => x.w).id]!++;
    expect(counts.c).toBe(0);
    expect(counts.b! / counts.a!).toBeGreaterThan(2.7);
    expect(counts.b! / counts.a!).toBeLessThan(3.3);
  });

  it('poisson() tiene la media esperada', () => {
    const rng = Rng.fromSeed('poisson');
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) sum += rng.poisson(1.4);
    expect(sum / n).toBeCloseTo(1.4, 1);
  });

  it('fork() es determinista y no consume números del padre', () => {
    const parent = Rng.fromSeed('padre');
    const before = parent.getState();
    const f1 = sample(parent.fork('liga'));
    expect(parent.getState()).toEqual(before);
    expect(sample(parent.fork('liga'))).toEqual(f1);
    expect(sample(parent.fork('copa'))).not.toEqual(f1);
  });

  it('shuffle() no modifica el original y conserva los elementos', () => {
    const rng = Rng.fromSeed('barajar');
    const base = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = rng.shuffle(base);
    expect(base).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(base);
  });

  it('withRng() devuelve el resultado y el nuevo estado', () => {
    const start = Rng.fromSeed('con-estado').getState();
    const { result, state } = withRng(start, (r) => r.int(1, 100));
    expect(result).toBeGreaterThanOrEqual(1);
    expect(state).not.toEqual(start);
  });
});
