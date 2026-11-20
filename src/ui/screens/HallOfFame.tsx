import { useState } from 'react';
import { t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import { clearHallOfFame, loadHallOfFame } from '@/persistence/hallOfFame';
import { getBrowserStorage } from '@/persistence/storage';
import { useUi } from '@/store/uiStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { ConfirmDialog } from '../components/Modal';
import { Crest } from '../components/Crest';
import { nationalTeamName } from '../competitionNames';

/** Ranking de carreras terminadas, ordenado por puntuación de legado. */
export function HallOfFame() {
  const goTo = useUi((s) => s.goTo);
  const [entries, setEntries] = useState(() => loadHallOfFame(getBrowserStorage()));
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <ScreenHeader title={t('hall.title')} onBack={() => goTo('mainMenu')} />
      {entries.length === 0 ? (
        <div className="card">
          <p className="muted">{t('hall.empty')}</p>
        </div>
      ) : (
        <>
          <ol className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 10 }}>
            {entries.map((e, i) => (
              <li key={e.gameId} className="card hall-entry">
                <span className="hall-rank">{i + 1}</span>
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <span className="slot-label">{tDynamic(`careerEnd.rank.${e.legacy}`)}</span>
                  <div className="slot-title">
                    {e.name}
                    {e.nickname && <span className="muted"> «{e.nickname}»</span>}
                  </div>
                  <div className="small muted">
                    {nationalTeamName(e.nationality)} · {e.position} · {t('hall.line', { seasons: e.seasons, apps: e.apps, goals: e.goals, trophies: e.trophies, peak: e.peakOverall })}
                    {(e.ballonDors ?? 0) > 0 && ` · ${t('hall.ballonDors', { n: e.ballonDors ?? 0 })}`}
                  </div>
                  <div className="row" style={{ gap: 4 }}>
                    {e.clubs.slice(0, 8).map((id) => {
                      const club = WORLD.clubById.get(id);
                      return club ? <Crest key={id} name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={24} /> : null;
                    })}
                  </div>
                </div>
                <div className="hall-score">
                  <strong>{e.legacyScore}</strong>
                  <span className="small muted">{t('careerEnd.legacy')}</span>
                </div>
              </li>
            ))}
          </ol>
          <div>
            <button className="btn btn-danger" onClick={() => setConfirm(true)}>
              {t('hall.clear')}
            </button>
          </div>
        </>
      )}
      <ConfirmDialog
        open={confirm}
        title={t('hall.clear')}
        message={t('hall.confirmClear')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          clearHallOfFame(getBrowserStorage());
          setEntries([]);
          setConfirm(false);
        }}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}
