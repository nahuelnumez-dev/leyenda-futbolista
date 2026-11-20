/** Garantiza que el motor sigue siendo lógica pura: no puede importar UI, store, persistencia ni React. */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ENGINE_DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const FORBIDDEN = [/from ['"]react/, /from ['"]@\/(ui|store|persistence)/, /from ['"]\.\.\/\.\.\/(ui|store|persistence)/, /\blocalStorage\b/, /\bdocument\./, /Math\.random/];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [full] : [];
  });
}

describe('arquitectura del motor', () => {
  it('src/engine no depende de la interfaz ni de APIs del navegador', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(decodeURIComponent(ENGINE_DIR))) {
      const code = readFileSync(file, 'utf-8');
      for (const rule of FORBIDDEN) if (rule.test(code)) offenders.push(`${file}: ${rule}`);
    }
    expect(offenders).toEqual([]);
  });
});
