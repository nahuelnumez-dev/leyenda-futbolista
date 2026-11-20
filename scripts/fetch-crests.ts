/**
 * Descarga los escudos reales de los clubes desde Wikipedia/Wikimedia.
 *
 *   npm run crests                      # todos los que falten
 *   npm run crests -- --country=esp     # solo un país
 *   npm run crests -- --force           # vuelve a descargar aunque ya existan
 *   npm run crests -- --dry-run         # busca las imágenes pero no descarga nada
 *   npm run crests -- --limit=10
 *
 * Para cada club prueba, en orden: `crest.wiki` del JSON, el nombre oficial en la Wikipedia inglesa,
 * el nombre en la Wikipedia del idioma del país y, por último, una búsqueda.
 * Pide la imagen principal del artículo (pageimages, licencia "any") como miniatura de 250 px,
 * consultando 50 artículos por petición para no saturar la API.
 * Resultado:
 *   public/crests/<pais>/<slug>.<ext>   imágenes
 *   src/data/crests-manifest.json       clubId → ruta (el juego solo usa los escudos listados aquí)
 *   scripts/crests-report.json          qué artículo e imagen se usó para cada club y cuáles faltan
 *
 * Los escudos son marcas registradas de cada club: solo para uso personal.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEAGUES_DIR = join(ROOT, 'src', 'data', 'leagues');
const PUBLIC_DIR = join(ROOT, 'public');
const MANIFEST = join(ROOT, 'src', 'data', 'crests-manifest.json');
const REPORT = join(ROOT, 'scripts', 'crests-report.json');
const USER_AGENT = 'LeyendaFutbolistaCrests/0.1 (juego personal sin fines comerciales)';
const DELAY_MS = 300;
/** Wikimedia sirve sin límites los tamaños de miniatura estándar (120, 250, 330, 500...). */
const THUMB = 250;

interface ClubLite {
  id: string;
  name: string;
  shortName: string;
  crest?: { wiki?: string; file?: string };
}

const LANG_BY_COUNTRY: Record<string, string> = { ESP: 'es', ARG: 'es', BRA: 'pt', ENG: 'en', POR: 'pt', ITA: 'it', GER: 'de', FRA: 'fr', NED: 'nl', URU: 'es', COL: 'es', CHI: 'es', JPN: 'ja', KOR: 'ko', KSA: 'ar', TUR: 'tr', BEL: 'nl', SCO: 'en', ECU: 'es', PAR: 'es', PER: 'es', MEX: 'es', USA: 'en', QAT: 'ar', UAE: 'ar' };
/** Imágenes que no son escudos (fotos de estadios...). Clubes como el Stade Rennais llevan «Stade» en el nombre. */
const NOT_A_CREST = /(stadium|estadio|est[aá]dio|stade(?![ _](de[ _]reims|rennais|lavallois|brestois|malherbe|briochin))|panorama|aerial|\.jpe?g$)/i;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  }),
) as Record<string, string>;
const onlyCountry = args.country?.toUpperCase();
const force = args.force === 'true';
const dryRun = args['dry-run'] === 'true';
const limit = args.limit ? Number(args.limit) : Infinity;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(lang: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} en ${url}`);
  }
  throw new Error(`Sin respuesta de ${lang}.wikipedia.org`);
}

interface Found {
  source: string;
  image: string;
  url: string;
}

interface Pending {
  club: ClubLite;
  country: string;
  candidates: [lang: string, title: string][];
  found?: Found;
}

/** Imagen principal de varios artículos (50 por petición), siguiendo normalizaciones y redirecciones. */
async function imagesFor(lang: string, titles: string[]): Promise<Map<string, Found>> {
  const out = new Map<string, Found>();
  for (let i = 0; i < titles.length; i += 50) {
    const chunk = titles.slice(i, i + 50);
    const data = await api(lang, {
      action: 'query',
      redirects: '1',
      prop: 'pageimages',
      piprop: 'thumbnail|name',
      pithumbsize: String(THUMB),
      pilicense: 'any',
      pilimit: '50',
      titles: chunk.join('|'),
    });
    const q = data?.query ?? {};
    const step = new Map<string, string>();
    for (const n of q.normalized ?? []) step.set(n.from, n.to);
    for (const r of q.redirects ?? []) step.set(r.from, r.to);
    const pages = new Map<string, any>((q.pages ?? []).map((p: any) => [p.title, p]));
    for (const title of chunk) {
      let final = title;
      for (let hops = 0; hops < 4 && step.has(final); hops++) final = step.get(final)!;
      const page = pages.get(final);
      if (!page || page.missing || !page.thumbnail?.source || !page.pageimage) continue;
      if (NOT_A_CREST.test(page.pageimage)) continue;
      out.set(title, { source: `${lang}:${page.title}`, image: page.pageimage, url: page.thumbnail.source });
    }
    await sleep(DELAY_MS);
  }
  return out;
}

async function searchTitle(lang: string, query: string): Promise<string | null> {
  const data = await api(lang, { action: 'query', list: 'search', srsearch: query, srlimit: '1', srnamespace: '0' });
  return data?.query?.search?.[0]?.title ?? null;
}

function candidatesFor(club: ClubLite, country: string): [string, string][] {
  const out: [string, string][] = [];
  if (club.crest?.wiki) {
    const [lang, ...rest] = club.crest.wiki.split(':');
    out.push([lang!, rest.join(':')]);
  }
  out.push(['en', club.name]);
  const local = LANG_BY_COUNTRY[country];
  if (local && local !== 'en') out.push([local, club.name]);
  return out;
}

const GENERIC = new Set(['club', 'athletic', 'atletico', 'real', 'deportivo', 'sporting', 'united', 'city', 'town', 'fc', 'cf', 'racing', 'union', 'esporte', 'clube', 'futebol', 'futbol', 'de', 'del', 'la', 'el']);

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Palabra más distintiva del nombre corto ("Leganés" → "leganes"; "Athletic" → ninguna). */
function distinctiveWord(shortName: string): string | null {
  const words = normalize(shortName).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !GENERIC.has(w));
  return words.sort((a, b) => b.length - a.length)[0] ?? null;
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status === 429 || res.status >= 500) {
      await sleep(4000 * (attempt + 1));
      continue;
    }
    throw new Error(`HTTP ${res.status} al descargar`);
  }
  throw new Error('demasiadas peticiones (429)');
}

function sortKeys(o: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const manifest: Record<string, string> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf-8')) : {};
  const report: { ok: { id: string; source: string; image: string; file: string; bytes: number }[]; missing: string[] } = { ok: [], missing: [] };

  // 1. Clubes pendientes
  const pending: Pending[] = [];
  for (const f of readdirSync(LEAGUES_DIR).filter((x) => x.endsWith('.json'))) {
    const league = JSON.parse(readFileSync(join(LEAGUES_DIR, f), 'utf-8')) as { country: string; divisions: { clubs: ClubLite[] }[] };
    if (onlyCountry && league.country !== onlyCountry) continue;
    for (const club of league.divisions.flatMap((d) => d.clubs)) {
      const existing = manifest[club.id];
      if (!force && existing && existsSync(join(PUBLIC_DIR, existing))) continue;
      if (pending.length >= limit) break;
      pending.push({ club, country: league.country, candidates: candidatesFor(club, league.country) });
    }
  }
  console.log(`${pending.length} clubes sin escudo. Buscando imágenes...`);

  // 2. Por lotes: el 1.er candidato de cada club, luego el 2.º para los que falten, etc.
  for (let k = 0; k < 3; k++) {
    const byLang = new Map<string, Pending[]>();
    for (const p of pending) {
      const cand = p.candidates[k];
      if (p.found || !cand) continue;
      byLang.set(cand[0], [...(byLang.get(cand[0]) ?? []), p]);
    }
    for (const [lang, list] of byLang) {
      try {
        const found = await imagesFor(lang, [...new Set(list.map((p) => p.candidates[k]![1]))]);
        for (const p of list) p.found = found.get(p.candidates[k]![1]);
      } catch (err) {
        // Una Wikipedia que no responde no debe frenar al resto de idiomas.
        console.log(`· ${lang}.wikipedia.org no responde (${(err as Error).message}); se sigue con los demás.`);
      }
    }
  }

  let searchBlocked = false;
  // 3. Búsqueda para los que quedan: solo si el título contiene una palabra distintiva del club
  //    (evita confundir "Athletic" con Oldham Athletic o "Racing" con otro Racing).
  for (const p of pending.filter((x) => !x.found)) {
    if (searchBlocked) break;
    const key = distinctiveWord(p.club.shortName);
    if (!key) continue;
    try {
      const title = await searchTitle('en', `${p.club.name} football club`);
      await sleep(DELAY_MS * 3);
      if (title && normalize(title).includes(key)) p.found = (await imagesFor('en', [title])).get(title);
    } catch (err) {
      console.log(`· búsqueda de ${p.club.id} fallida (${(err as Error).message}); se omiten las demás búsquedas.`);
      searchBlocked = true;
    }
  }

  // 4. Descarga
  let totalBytes = 0;
  let done = 0;
  for (const p of pending) {
    const { club, found } = p;
    if (!found) {
      report.missing.push(club.id);
      console.log(`✗ ${club.id}: sin imagen`);
      continue;
    }
    const ext = (found.url.match(/\.(png|svg|gif|webp|jpe?g)(?:$|\?)/i)?.[1] ?? 'png').toLowerCase();
    const countryDir = p.country.toLowerCase();
    const rel = `crests/${countryDir}/${club.id.split('.')[1]}.${ext}`;
    if (dryRun) {
      console.log(`· ${club.id} → ${found.source} (${found.image})`);
      report.ok.push({ id: club.id, source: found.source, image: found.image, file: rel, bytes: 0 });
      continue;
    }
    try {
      const buf = await download(found.url);
      mkdirSync(join(PUBLIC_DIR, 'crests', countryDir), { recursive: true });
      writeFileSync(join(PUBLIC_DIR, rel), buf);
      manifest[club.id] = rel;
      totalBytes += buf.length;
      report.ok.push({ id: club.id, source: found.source, image: found.image, file: rel, bytes: buf.length });
      console.log(`✓ ${club.id} → ${found.source} (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      report.missing.push(club.id);
      console.log(`✗ ${club.id}: ${(err as Error).message}`);
    }
    if (++done % 20 === 0) writeFileSync(MANIFEST, JSON.stringify(sortKeys(manifest), null, 2) + '\n');
    await sleep(DELAY_MS);
  }

  if (!dryRun) writeFileSync(MANIFEST, JSON.stringify(sortKeys(manifest), null, 2) + '\n');
  // El informe acumula ejecuciones anteriores: solo se sustituyen los clubes procesados ahora.
  const processedIds = new Set(pending.map((p) => p.club.id));
  const previous = existsSync(REPORT) ? (JSON.parse(readFileSync(REPORT, 'utf-8')) as typeof report) : { ok: [], missing: [] };
  const merged = {
    ok: [...previous.ok.filter((x) => !processedIds.has(x.id)), ...report.ok],
    missing: [...previous.missing.filter((id) => !processedIds.has(id) && !manifest[id]), ...report.missing],
  };
  if (!dryRun) writeFileSync(REPORT, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\nEscudos: ${report.ok.length} encontrados, ${report.missing.length} sin imagen, ${(totalBytes / 1024 / 1024).toFixed(1)} MB descargados.`);
  console.log(`Informe: ${REPORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
