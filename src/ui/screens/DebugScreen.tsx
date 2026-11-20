import { useState } from 'react';
import { t } from '@/i18n';
import { Rng } from '@/engine/rng';
import type { ClubColors } from '@/engine/types/club';
import { useUi } from '@/store/uiStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { GenericCrest } from '../components/Crest';
import { Cinematic } from '../cinematics/Cinematic';
import { CELEBRATIONS } from '@/data/celebrations';
import { defaultAppearance } from '@/engine/player/defaults';
import type { CinematicData, CinematicType } from '@/engine/cinematics/cinematics';

/** Ejemplos para previsualizar cada cinemática. */
const CINE_SAMPLES: { label: string; data: CinematicData }[] = [
  { label: 'Primer gol', data: { type: 'firstGoal', importance: 'major', season: 2027, clubId: 'esp.betis', celebration: 'puno' } },
  { label: 'Hat-trick', data: { type: 'hatTrick', importance: 'major', season: 2027, clubId: 'arg.boca', value: 3, celebration: 'rodillas' } },
  { label: 'Debut', data: { type: 'debut', importance: 'major', season: 2027, clubId: 'eng.liverpool' } },
  { label: 'Debut con la selección', data: { type: 'nationalDebut', importance: 'major', season: 2028, country: 'ARG' } },
  { label: 'Título', data: { type: 'trophy', importance: 'major', season: 2029, clubId: 'ita.inter', competitionId: 'uefa.champions' } },
  { label: 'Mundial', data: { type: 'tournament', importance: 'major', season: 2030, competitionId: 'fifa.world-cup', country: 'ESP' } },
  { label: 'Ascenso', data: { type: 'promotion', importance: 'major', season: 2027, clubId: 'esp.racing' } },
  { label: 'Balón de Oro', data: { type: 'award', importance: 'major', season: 2031, awardId: 'balon-de-oro', clubId: 'esp.real-madrid' } },
  { label: 'Bota de oro de la liga', data: { type: 'award', importance: 'minor', season: 2031, awardId: 'top-scorer', competitionId: 'ger.bundesliga', clubId: 'ger.bayern' } },
  { label: 'Fichaje', data: { type: 'transfer', importance: 'major', season: 2028, clubId: 'esp.barcelona', value: 85_000_000 } },
  { label: 'Cesión', data: { type: 'loan', importance: 'minor', season: 2027, clubId: 'por.benfica' } },
  { label: 'Descenso', data: { type: 'relegation', importance: 'minor', season: 2029, clubId: 'eng.reading' } },
  { label: 'Lesión grave', data: { type: 'injury', importance: 'minor', season: 2029, clubId: 'bra.santos', value: 20 } },
  { label: 'Logro', data: { type: 'achievement', importance: 'major', season: 2030, template: 'balon-de-oro' } },
  { label: 'Retirada', data: { type: 'retirement', importance: 'major', season: 2045, clubId: 'arg.newells', value: 21 } },
];

/** Muestras de colores reales de primera equipación para probar el escudo genérico. */
const SAMPLES: { name: string; shortName: string; colors: ClubColors }[] = [
  { name: 'Real Madrid', shortName: 'RMA', colors: { primary: '#FFFFFF', secondary: '#1A2A6C', pattern: 'liso' } },
  { name: 'FC Barcelona', shortName: 'FCB', colors: { primary: '#A50044', secondary: '#004D98', pattern: 'rayas' } },
  { name: 'Club Atlético River Plate', shortName: 'CARP', colors: { primary: '#FFFFFF', secondary: '#E30613', pattern: 'bandas' } },
  { name: 'Club Atlético Boca Juniors', shortName: 'CABJ', colors: { primary: '#0A2F6B', secondary: '#F7C600', pattern: 'franja' } },
  { name: 'Blackburn Rovers', shortName: 'BRFC', colors: { primary: '#0067B1', secondary: '#FFFFFF', pattern: 'mitades' } },
  { name: 'Celtic FC', shortName: 'CEL', colors: { primary: '#018749', secondary: '#FFFFFF', pattern: 'aros' } },
  { name: 'HNK Hajduk Split', shortName: 'HAJ', colors: { primary: '#FFFFFF', secondary: '#1B4E9B', pattern: 'liso' } },
  { name: 'Croacia (cuadros)', shortName: 'CRO', colors: { primary: '#FFFFFF', secondary: '#D40000', pattern: 'cuadros' } },
];

export function DebugScreen() {
  const goTo = useUi((s) => s.goTo);
  const [seed, setSeed] = useState('gol-00001');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [cine, setCine] = useState<CinematicData | null>(null);
  const [celebration, setCelebration] = useState('puno');
  const [freeze, setFreeze] = useState('');
  const reduceMotion = useUi((s) => s.settings.reduceMotion);

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <ScreenHeader title={t('debug.title')} onBack={() => goTo('mainMenu')} />

      <section className="card">
        <h2>{t('debug.crests')}</h2>
        <div className="crest-grid">
          {SAMPLES.map((s) => (
            <figure key={s.name}>
              <GenericCrest name={s.name} shortName={s.shortName} colors={s.colors} size={64} />
              <figcaption>{s.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2>Probar cinemáticas</h2>
        <label className="row small">
          Celebración de los goles:
          <select className="select" style={{ maxWidth: 220 }} value={celebration} onChange={(e) => setCelebration(e.target.value)}>
            {CELEBRATIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.symbol} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="row small">
          Congelar en el segundo (vacío = reproducir):
          <input className="input" style={{ maxWidth: 90 }} inputMode="decimal" value={freeze} onChange={(e) => setFreeze(e.target.value)} aria-label="Congelar en el segundo" />
        </label>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {CINE_SAMPLES.map((c) => (
            <button key={c.label} className="btn" onClick={() => setCine(c.data.type === 'firstGoal' || c.data.type === 'hatTrick' ? { ...c.data, celebration } : c.data)}>
              {c.label}
            </button>
          ))}
        </div>
      </section>
      {cine && (
        <Cinematic
          key={JSON.stringify(cine)}
          type={cine.type as CinematicType}
          data={cine}
          appearance={defaultAppearance()}
          playerName="Lucas Ferreyra"
          shirtNumber={10}
          reduceMotion={reduceMotion}
          onDone={() => setCine(null)}
          {...(freeze.trim() !== '' && !Number.isNaN(Number(freeze)) ? { freezeAt: Number(freeze) } : {})}
        />
      )}

      <section className="card stack">
        <h2>{t('debug.rng')}</h2>
        <div className="row">
          <input className="input" style={{ maxWidth: 240 }} value={seed} onChange={(e) => setSeed(e.target.value)} aria-label="Semilla" />
          <button
            className="btn"
            onClick={() => {
              const rng = Rng.fromSeed(seed);
              setNumbers(Array.from({ length: 10 }, () => rng.int(1, 100)));
            }}
          >
            {t('debug.rngRun')}
          </button>
        </div>
        {numbers.length > 0 && <code>{numbers.join(' · ')}</code>}
      </section>
    </div>
  );
}
