/** Semilla aleatoria legible (fuera del motor: aquí sí se usa azar del sistema). */
const WORDS = [
  'gol', 'cantera', 'derbi', 'chilena', 'rabona', 'tiki', 'taka', 'volea', 'tacon',
  'gambeta', 'cabezazo', 'palomita', 'tunel', 'sombrero', 'remate', 'zurdazo', 'escuadra',
];

export function randomSeed(): string {
  const buf = new Uint32Array(2);
  globalThis.crypto.getRandomValues(buf);
  const word = WORDS[(buf[0] ?? 0) % WORDS.length] ?? 'gol';
  return `${word}-${((buf[1] ?? 0) % 100000).toString().padStart(5, '0')}`;
}
