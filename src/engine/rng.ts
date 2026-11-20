/**
 * Generador pseudoaleatorio con semilla (sfc32) totalmente serializable.
 * Todo el azar del motor pasa por aquí: misma semilla + mismas decisiones = misma carrera.
 */

/** Estado interno del generador: 4 enteros de 32 bits. Se guarda en la partida. */
export type RngState = [number, number, number, number];

/** Hash de string a 4 semillas de 32 bits (cyrb128). */
export function hashSeed(seed: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  private constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  /** Crea un generador a partir de una semilla legible. */
  static fromSeed(seed: string): Rng {
    const rng = new Rng(hashSeed(seed));
    // Descarta las primeras salidas para mezclar bien el estado inicial.
    for (let i = 0; i < 15; i++) rng.next();
    return rng;
  }

  /** Reanuda un generador desde un estado guardado. */
  static fromState(state: RngState): Rng {
    return new Rng([state[0] >>> 0, state[1] >>> 0, state[2] >>> 0, state[3] >>> 0]);
  }

  getState(): RngState {
    return [this.a >>> 0, this.b >>> 0, this.c >>> 0, this.d >>> 0];
  }

  /** Flotante en [0, 1). */
  next(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Flotante en [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Entero en [min, max], ambos incluidos. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** true con probabilidad p (0-1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: lista vacía');
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Elige un elemento según su peso. Pesos <= 0 nunca salen. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    let total = 0;
    for (const item of items) total += Math.max(0, weight(item));
    if (total <= 0) throw new Error('Rng.weighted: todos los pesos son 0');
    let r = this.next() * total;
    for (const item of items) {
      const w = Math.max(0, weight(item));
      if (r < w) return item;
      r -= w;
    }
    return items[items.length - 1] as T;
  }

  /** Normal (Box-Muller). */
  normal(mean = 0, sd = 1): number {
    const u = 1 - this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Poisson (Knuth), útil para goles. */
  poisson(lambda: number): number {
    if (lambda <= 0) return 0;
    const l = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > l);
    return k - 1;
  }

  /** Copia barajada (Fisher-Yates); no modifica el original. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }

  /**
   * Generador hijo independiente para un subsistema (p. ej. 'liga-esp-2027').
   * No consume números del padre: dos forks con la misma etiqueta dan la misma secuencia.
   */
  fork(label: string): Rng {
    const [a, b, c, d] = this.getState();
    return Rng.fromSeed(`${a}:${b}:${c}:${d}:${label}`);
  }
}

/** Ejecuta `fn` con un generador creado desde `state` y devuelve el resultado y el nuevo estado. */
export function withRng<T>(state: RngState, fn: (rng: Rng) => T): { result: T; state: RngState } {
  const rng = Rng.fromState(state);
  const result = fn(rng);
  return { result, state: rng.getState() };
}
