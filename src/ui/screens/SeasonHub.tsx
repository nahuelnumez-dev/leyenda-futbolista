import { useState } from 'react';
import { lt, t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { TRAITS } from '@/data/traits';
import { Avatar } from '../avatar/Avatar';
import { Crest } from '../components/Crest';
import { SEASON_PHASES } from '@/engine/types/common';
import { AttributesPanel, CareerPanel, NewsPanel, OffersPanel, PersonalityPanel, SeasonPanel, SummaryModal, TablePanel } from '../hub/panels';
import { EventModal } from '../hub/EventModal';
import { StatsPanel } from '../hub/StatsPanel';
import { NationalChoiceModal, PalmaresPanel } from '../hub/PalmaresPanel';
import { CinematicPlayer, visibleCinematic } from '../cinematics/CinematicPlayer';
import { AchievementsPanel } from '../hub/AchievementsPanel';
import { SpecialtiesPanel } from '../hub/SpecialtiesPanel';
import { MIN_RETIRE_AGE } from '@/engine/legacy/legacy';
import { overallFor } from '@/engine/player/overall';
import { ageInSeason, formatSeason } from '@/engine/world/newGame';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import type { SlotId } from '@/persistence/slots';
import { ConfirmDialog, Modal } from '../components/Modal';
import { downloadText } from '../download';
import { errorMessage } from '../errors';

const MANUAL_SLOTS: SlotId[] = ['1', '2', '3'];
const TABS = ['season', 'table', 'stats', 'career', 'palmares', 'achievements', 'attributes', 'specialties', 'personality', 'game'] as const;
type Tab = (typeof TABS)[number];

/** Pantalla central de la temporada (provisional hasta la Fase 4). */
export function SeasonHub() {
  const game = useGame((s) => s.game);
  const slots = useGame((s) => s.slots);
  const saveTo = useGame((s) => s.saveTo);
  const exportCurrent = useGame((s) => s.exportCurrent);
  const closeGame = useGame((s) => s.closeGame);
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const [saving, setSaving] = useState(false);
  const [overwrite, setOverwrite] = useState<SlotId | null>(null);
  const [activeTab, setTab] = useState<Tab>('season');
  const [showSummary, setShowSummary] = useState(false);
  const [busy, setBusy] = useState(false);
  const advance = useGame((s) => s.advance);
  const respondOffer = useGame((s) => s.respondOffer);
  const setSpecialtyFocus = useGame((s) => s.setSpecialtyFocus);
  const chooseCountry = useGame((s) => s.chooseCountry);
  const cinematicsSetting = useUi((s) => s.settings.cinematics);
  const retire = useGame((s) => s.retire);
  const [confirmRetire, setConfirmRetire] = useState(false);

  if (!game) {
    return (
      <div className="screen">
        <button className="btn" onClick={() => goTo('mainMenu')}>
          {t('hub.mainMenu')}
        </button>
      </div>
    );
  }

  const p = game.player;
  const ovr = overallFor(p.attributes, p.positions.main);
  const age = ageInSeason(p.identity.birthDate, game.calendar.season);
  const club = p.contract ? WORLD.clubById.get(p.contract.clubId) : undefined;
  const division = club ? WORLD.divisionById.get(game.world.clubs[club.id]?.divisionId ?? WORLD.divisionOfClub.get(club.id) ?? '') : undefined;
  const calendar = club ? WORLD.leagues.find((l) => l.country === club.country)?.calendar : undefined;
  const style = PLAY_STYLES.find((s) => s.id === p.style);
  const seasonLabel = formatSeason(game.calendar.season, calendar);
  const playingCinematic = visibleCinematic(game, cinematicsSetting) !== null;

  const onAdvance = () => {
    setBusy(true);
    try {
      const next = advance();
      if (next?.calendar.phase === 'seasonEnd') setShowSummary(true);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const doSave = (slot: SlotId) => {
    try {
      saveTo(slot);
      toast(t('load.saved', { slot: t('load.slot', { n: slot }) }), 'success');
      setSaving(false);
      setOverwrite(null);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  // Pide confirmación solo si la ranura contiene OTRA carrera.
  const onSave = (slot: SlotId) => {
    const meta = slots[slot];
    if (meta && meta.gameId !== game.id) setOverwrite(slot);
    else doSave(slot);
  };

  const onExport = () => {
    const out = exportCurrent();
    if (out) downloadText(out.fileName, out.json);
  };

  return (
    <div className="screen stack" style={{ gap: 20 }}>
      <section className="hub-hero">
        <Avatar config={p.appearance} kit={club?.colors} size={120} label={p.identity.name} />
        <div className="ovr-badge" aria-label={`${t('hub.overall')} ${ovr}`}>
          <strong>{ovr}</strong>
          <span>{p.positions.main}</span>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <span className="slot-label">{t('hub.title', { season: seasonLabel })}</span>
          <h2>
            {p.identity.name}
            {p.identity.nickname && <span className="muted"> «{p.identity.nickname}»</span>}
          </h2>
          <div className="row small muted" style={{ marginTop: 6 }}>
            <span>{t('hub.age', { age })}</span>
            <span>·</span>
            <span>{tDynamic(`pos.${p.positions.main}`)}</span>
            <span>·</span>
            <span>
              {t('hub.potential')}: {p.potential.shownRange[0]}–{p.potential.shownRange[1]}
            </span>
            {game.options.ironMan && <span className="badge badge-danger">{t('hub.ironMan')}</span>}
          </div>
          <div className="row" style={{ marginTop: 10, gap: 10 }}>
            {club ? (
              <>
                <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={36} />
                <span>
                  <strong>{club.shortName}</strong>
                  <br />
                  <span className="small muted">
                    {division?.name} · {t('hub.academyRole', { role: tDynamic(`hub.roles.${p.contract?.role ?? 'cantera'}`), n: p.contract?.shirtNumber ?? p.preferredNumber })}
                    {p.contract?.loanFrom && <> · {t('hub.onLoan', { club: WORLD.clubById.get(p.contract.loanFrom)?.shortName ?? '' })}</>}
                  </span>
                </span>
              </>
            ) : (
              <span className="muted small">{t('hub.noClub')}</span>
            )}
          </div>
          <div className="row small" style={{ marginTop: 8, gap: 6 }}>
            {style && <span className="badge badge-accent">{lt(style.name)}</span>}
            {p.traits.map((tr) => {
              const def = TRAITS.find((d) => d.id === tr.id);
              return def ? (
                <span key={tr.id} className="badge" title={lt(def.description)}>
                  {lt(def.name)}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </section>

      {game.retired && (
        <section className="card retired-banner">
          <div>
            <strong>{t('hub.retired')}</strong>
            <p className="small muted">{t('hub.retiredHint')}</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => goTo('careerEnd')}>
            {t('hub.viewSummary')} →
          </button>
        </section>
      )}

      {!game.retired && (
      <section className="card phase-bar">
        <ol className="phase-steps" aria-label={t('hub.title', { season: seasonLabel })}>
          {SEASON_PHASES.map((ph) => (
            <li key={ph} className={ph === game.calendar.phase ? 'is-current' : SEASON_PHASES.indexOf(ph) < SEASON_PHASES.indexOf(game.calendar.phase) ? 'is-done' : ''}>
              {tDynamic(`hub.phases.${ph}`)}
            </li>
          ))}
        </ol>
        <p className="small muted">{tDynamic(`hub.phaseHints.${game.calendar.phase}`, { club: club?.shortName ?? '' })}</p>
        {(game.activeEvent || game.pendingNationalChoice?.length) && <p className="small warn-text">{t('hub.pendingDecision')}</p>}
        <button className="btn btn-primary btn-lg" onClick={onAdvance} disabled={busy || game.activeEvent !== null || Boolean(game.pendingNationalChoice?.length)}>
          {tDynamic(`hub.actions.${game.calendar.phase}`, { season: formatSeason(game.calendar.season + 1, calendar) })} →
        </button>
        {game.calendar.phase === 'seasonEnd' && age >= MIN_RETIRE_AGE && (
          <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirmRetire(true)}>
            {t('hub.retire')}
          </button>
        )}
      </section>
      )}

      <div className="segmented hub-tabs" role="tablist" aria-label={t('hub.tabs.season')}>
        {TABS.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} aria-pressed={activeTab === tab} onClick={() => setTab(tab)}>
            {tDynamic(`hub.tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'season' && (
          <div className="stack">
            <OffersPanel game={game} onRespond={respondOffer} />
            <SeasonPanel game={game} />
            <NewsPanel game={game} />
          </div>
        )}
        {activeTab === 'table' && <TablePanel key={game.calendar.season} game={game} />}
        {activeTab === 'stats' && <StatsPanel game={game} />}
        {activeTab === 'career' && <CareerPanel game={game} />}
        {activeTab === 'palmares' && <PalmaresPanel game={game} />}
        {activeTab === 'achievements' && <AchievementsPanel game={game} />}
        {activeTab === 'attributes' && <AttributesPanel game={game} />}
        {activeTab === 'specialties' && <SpecialtiesPanel game={game} onFocus={setSpecialtyFocus} />}
        {activeTab === 'personality' && <PersonalityPanel game={game} />}
        {activeTab === 'game' && (
          <div className="card stack">
            <p className="faint small">{t('hub.seed', { seed: game.seed })}</p>
            <div className="row">
              {!game.options.ironMan && (
                <button className="btn btn-primary" onClick={() => setSaving(true)}>
                  {t('hub.saveTo')}
                </button>
              )}
              <button className="btn" onClick={onExport}>
                {t('hub.exportJson')}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  closeGame();
                  goTo('mainMenu');
                }}
              >
                {t('hub.mainMenu')}
              </button>
            </div>
          </div>
        )}
      </div>

      <SummaryModal game={game} open={showSummary && !playingCinematic} onClose={() => setShowSummary(false)} />
      {!showSummary && !playingCinematic && <EventModal game={game} />}
      {!showSummary && !playingCinematic && <NationalChoiceModal game={game} onChoose={chooseCountry} />}
      <CinematicPlayer game={game} />
      <ConfirmDialog
        open={confirmRetire}
        title={t('hub.retire')}
        message={t('hub.confirmRetire')}
        confirmLabel={t('hub.retire')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          setConfirmRetire(false);
          retire();
        }}
        onCancel={() => setConfirmRetire(false)}
      />

      <ConfirmDialog
        open={overwrite !== null}
        title={t('hub.saveTo')}
        message={t('load.confirmOverwrite', { name: overwrite ? (slots[overwrite]?.playerName ?? '') : '' })}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => overwrite && doSave(overwrite)}
        onCancel={() => setOverwrite(null)}
      />

      <Modal open={saving && overwrite === null} title={t('hub.saveTo')} onClose={() => setSaving(false)}>
        <div className="stack">
          {MANUAL_SLOTS.map((slot) => {
            const meta = slots[slot];
            return (
              <button key={slot} className="btn" style={{ justifyContent: 'space-between' }} onClick={() => onSave(slot)}>
                <span>{t('load.slot', { n: slot })}</span>
                <span className="faint small">{meta ? `${meta.playerName} · ${meta.seasonLabel}` : t('common.empty')}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
