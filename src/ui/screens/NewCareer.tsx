import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { lt, t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { STARTING_TRAIT_COUNT, TRAITS } from '@/data/traits';
import { TENDENCIES } from '@/data/tendencies';
import { defaultAppearance } from '@/engine/player/defaults';
import { previewOverall, rollPotential, shownPotentialRange, validateCharacter, type CharacterInput } from '@/engine/player/create';
import { academyCountries, academyOptions, rollTrial, type AcademyOption } from '@/engine/player/academy';
import { DEFAULT_START_SEASON, START_AGE, formatSeason } from '@/engine/world/newGame';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { randomSeed } from '@/store/seed';
import { ScreenHeader } from '../components/ScreenHeader';
import { Crest } from '../components/Crest';
import { Avatar } from '../avatar/Avatar';
import { errorMessage } from '../errors';
import { LookStep, OriginStep, PositionStep, StyleStep, TraitsStep } from '../creation/steps';

const CONTENT = { styles: PLAY_STYLES, traits: TRAITS };
const STEPS = ['origin', 'look', 'position', 'style', 'traits', 'academy'] as const;
type StepId = (typeof STEPS)[number];

interface TrialResult {
  option: AcademyOption;
  passed: boolean;
  /** Club donde empieza finalmente. */
  clubId: string;
}

function initialDraft(): CharacterInput {
  const country = WORLD.countryById.get('ESP');
  const region = country?.regions.find((r) => r.name === 'Comunidad de Madrid') ?? country?.regions[0];
  return {
    name: '',
    birthDay: 1 + Math.floor(Math.random() * 28),
    birthMonth: 1 + Math.floor(Math.random() * 12),
    birthPlace: { country: 'ESP', region: region?.name ?? '', city: region?.cities[0] ?? '' },
    nationalities: ['ESP'],
    foot: 'derecho',
    appearance: defaultAppearance(),
    mainPosition: 'DC',
    secondaryPositions: [],
    style: 'goleador-nato',
    traits: [],
    preferredNumber: 9,
  };
}

/** Errores (claves i18n) que impiden avanzar desde cada paso. */
function stepErrors(step: StepId, draft: CharacterInput, trial: TrialResult | null): string[] {
  const all = validateCharacter(draft, CONTENT, STARTING_TRAIT_COUNT);
  const byStep: Record<StepId, string[]> = {
    origin: ['creation.errors.name', 'creation.errors.nationality', 'creation.errors.birthDate'],
    look: [],
    position: ['creation.errors.positions', 'creation.errors.keeperMix', 'creation.errors.number'],
    style: ['creation.errors.style'],
    traits: ['creation.errors.traits', 'creation.errors.opposites'],
    academy: [],
  };
  const errs = all.filter((e) => byStep[step].includes(e));
  if (step === 'academy') return [...all, ...(trial ? [] : ['creation.errors.trial'])];
  return errs;
}

function AcademyStep({
  draft,
  seed,
  trial,
  onTrial,
}: {
  draft: CharacterInput;
  seed: string;
  trial: TrialResult | null;
  onTrial: (r: TrialResult) => void;
}) {
  const reduceMotion = useUi((s) => s.settings.reduceMotion);
  const [rolling, setRolling] = useState<string | null>(null);
  const potential = rollPotential(seed);
  const choice = useMemo(() => academyOptions(WORLD, draft.birthPlace, potential, seed), [draft.birthPlace, potential, seed]);
  const fallbackClub = WORLD.clubById.get(choice.fallback.clubId)!;

  const attempt = (option: AcademyOption) => {
    if (trial || rolling) return;
    const passed = rollTrial(seed, option);
    const finish = () => {
      setRolling(null);
      onTrial({ option, passed, clubId: passed ? option.clubId : choice.fallback.clubId });
    };
    if (reduceMotion) finish();
    else {
      setRolling(option.clubId);
      setTimeout(finish, 1600);
    }
  };

  if (trial) {
    const club = WORLD.clubById.get(trial.clubId)!;
    const tried = WORLD.clubById.get(trial.option.clubId)!;
    return (
      <motion.div className="trial-result card stack" initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} role="status">
        <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={96} />
        <p className={trial.passed ? 'trial-ok' : 'trial-ko'}>
          {trial.passed ? t('creation.trialPassed', { club: club.shortName }) : t('creation.trialFailed', { club: tried.shortName, fallback: club.shortName })}
        </p>
        <span className="small muted">
          {club.city} · {WORLD.divisionById.get(WORLD.divisionOfClub.get(club.id) ?? '')?.name}
        </span>
      </motion.div>
    );
  }

  return (
    <div className="stack">
      <p className="muted small">{t('creation.academyIntro', { club: fallbackClub.shortName })}</p>
      <ul className="academy-list">
        {choice.options.map((o) => {
          const club = WORLD.clubById.get(o.clubId)!;
          const division = WORLD.divisionById.get(WORLD.divisionOfClub.get(club.id) ?? '');
          const pct = Math.round(o.chance * 100);
          return (
            <li key={o.clubId} className="academy-card">
              <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={56} />
              <div className="academy-info">
                <strong>{club.shortName}</strong>
                <span className="small muted">
                  {tDynamic(`creation.kinds.${o.kind}`)} · {tDynamic(`creation.proximity.${o.proximity}`)}
                </span>
                <span className="small faint">
                  {division?.name} · {club.city}
                </span>
                <div className="chance" aria-label={`${t('creation.chance')}: ${pct}%`}>
                  <span className="meter">
                    <span style={{ width: `${pct}%`, background: pct >= 60 ? 'var(--pitch)' : pct >= 30 ? 'var(--accent)' : 'var(--danger)' }} />
                  </span>
                  <strong>{pct}%</strong>
                </div>
              </div>
              <button type="button" className="btn btn-primary" disabled={rolling !== null} onClick={() => attempt(o)}>
                {rolling === o.clubId ? t('creation.trialRolling') : t('creation.tryOut')}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function NewCareer() {
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const ironManDefault = useUi((s) => s.settings.ironManDefault);
  const startNewGame = useGame((s) => s.startNewGame);

  const [draft, setDraft] = useState<CharacterInput>(initialDraft);
  const [generatedSeed] = useState(randomSeed);
  const [seedInput, setSeedInput] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [trial, setTrial] = useState<TrialResult | null>(null);
  const [ironMan, setIronMan] = useState(ironManDefault);
  const [showErrors, setShowErrors] = useState(false);

  const seed = seedInput.trim() || generatedSeed;
  const step = STEPS[stepIndex]!;
  const update = (patch: Partial<CharacterInput>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setShowErrors(false);
  };
  const errors = stepErrors(step, draft, trial);
  const potential = rollPotential(seed);
  const [scoutMin, scoutMax] = shownPotentialRange(potential, seed);
  const overall = stepIndex >= 2 ? previewOverall(draft, seed, CONTENT) : null;
  const club = trial ? WORLD.clubById.get(trial.clubId) : undefined;
  const style = PLAY_STYLES.find((s) => s.id === draft.style);
  const birthYear = DEFAULT_START_SEASON - START_AGE - (draft.birthMonth > 7 || (draft.birthMonth === 7 && draft.birthDay > 1) ? 1 : 0);
  // La temporada se muestra con el calendario de la liga donde jugará (o la del país de nacimiento).
  const leagueCountry = club?.country ?? academyCountries(WORLD, draft.birthPlace.country)[0];
  const seasonLabel = formatSeason(DEFAULT_START_SEASON, WORLD.leagues.find((l) => l.country === leagueCountry)?.calendar);
  const errorText = (key: string) => tDynamic(key, { n: STARTING_TRAIT_COUNT });

  const next = () => {
    if (errors.length) {
      setShowErrors(true);
      return;
    }
    setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const back = () => (stepIndex === 0 ? goTo('mainMenu') : setStepIndex((i) => i - 1));

  const start = () => {
    if (errors.length || !trial) {
      setShowErrors(true);
      return;
    }
    try {
      startNewGame({
        seed,
        customSeed: Boolean(seedInput.trim()),
        name: draft.name,
        character: { ...draft, name: draft.name.trim(), ...(draft.nickname?.trim() ? { nickname: draft.nickname.trim() } : {}) },
        content: { ...CONTENT, tendencies: TENDENCIES },
        academy: { clubId: trial.clubId, budgetM: club?.budgetM ?? 0, prestige: club?.prestige ?? 40, trial: { clubId: trial.option.clubId, passed: trial.passed } },
        ironMan,
      });
      toast(t('hub.autosaved'), 'success');
      goTo('hub');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="screen">
      <ScreenHeader title={t('creation.title')} onBack={back} />

      <ol className="stepper" aria-label={t('creation.step', { n: stepIndex + 1, total: STEPS.length })}>
        {STEPS.map((s, i) => (
          <li key={s} className={i === stepIndex ? 'is-current' : i < stepIndex ? 'is-done' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
            <span className="stepper-n">{i + 1}</span>
            <span className="stepper-label">{tDynamic(`creation.steps.${s}`)}</span>
          </li>
        ))}
      </ol>

      <div className="creation-layout">
        <aside className="creation-preview card" aria-label={t('creation.summary')}>
          <Avatar config={draft.appearance} kit={club?.colors} size={150} label={draft.name || t('creation.title')} />
          <div className="stack" style={{ gap: 4, alignItems: 'center', textAlign: 'center' }}>
            <strong className="preview-name">{draft.name.trim() || '—'}</strong>
            {draft.nickname?.trim() && <span className="muted small">«{draft.nickname.trim()}»</span>}
            <span className="small muted">
              {draft.birthPlace.city}, {lt(WORLD.countryById.get(draft.birthPlace.country)?.name ?? { es: '' })}
            </span>
            <span className="small faint">
              {t('creation.bornIn', { date: `${draft.birthDay} de ${tDynamic(`months.${draft.birthMonth}`)} de ${birthYear}`, age: START_AGE, season: seasonLabel })}
            </span>
            {stepIndex >= 2 && (
              <span className="small">
                <span className="badge badge-accent">{draft.mainPosition}</span> {style ? lt(style.name) : ''} · #{draft.preferredNumber}
              </span>
            )}
            {draft.traits.length > 0 && <span className="small muted">{draft.traits.map((id) => lt(TRAITS.find((x) => x.id === id)!.name)).join(' · ')}</span>}
            {overall !== null && (
              <div className="ovr-badge" style={{ width: 72, height: 72, marginTop: 6 }}>
                <span>{t('creation.startingOverall')}</span>
                <strong>{overall}</strong>
              </div>
            )}
            {club && (
              <span className="row small" style={{ gap: 6, justifyContent: 'center' }}>
                <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={24} /> {club.shortName}
              </span>
            )}
          </div>
        </aside>

        <section className="card stack creation-step">
          <h2>{tDynamic(`creation.steps.${step}`)}</h2>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              {step === 'origin' && <OriginStep draft={draft} update={update} seed={seedInput} setSeed={setSeedInput} locked={trial !== null} />}
              {step === 'look' && <LookStep draft={draft} update={update} />}
              {step === 'position' && <PositionStep draft={draft} update={update} />}
              {step === 'style' && <StyleStep draft={draft} update={update} />}
              {step === 'traits' && <TraitsStep draft={draft} update={update} />}
              {step === 'academy' && <AcademyStep draft={draft} seed={seed} trial={trial} onTrial={setTrial} />}
            </motion.div>
          </AnimatePresence>

          {step === 'academy' && trial && (
            <div className="stack">
              <p className="small muted">{t('creation.scouts', { min: scoutMin, max: scoutMax })}</p>
              <label className="row" style={{ gap: 10 }}>
                <input type="checkbox" checked={ironMan} onChange={(e) => setIronMan(e.target.checked)} aria-label={t('creation.ironMan')} />
                <span>
                  <strong>{t('creation.ironMan')}</strong>
                  <br />
                  <span className="small muted">{t('creation.ironManHint')}</span>
                </span>
              </label>
            </div>
          )}

          {showErrors && errors.length > 0 && (
            <ul className="error-list" role="alert">
              {errors.map((e) => (
                <li key={e}>{errorText(e)}</li>
              ))}
            </ul>
          )}

          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn" onClick={back}>
              {t('creation.back')}
            </button>
            {step === 'academy' ? (
              <button type="button" className="btn btn-primary" onClick={start} disabled={!trial}>
                {t('creation.start')}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={next}>
                {t('creation.next')}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
