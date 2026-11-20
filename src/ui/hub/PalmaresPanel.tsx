/** Pestaña Palmarés: títulos, premios individuales, selección y ganadores recientes del Balón de Oro. */
import { t } from '@/i18n';
import { WORLD } from '@/data';
import type { GameState } from '@/engine/types/game';
import { formatSeason } from '@/engine/world/newGame';
import { awardName, competitionName, nationalTeamName, trophyIcon } from '../competitionNames';
import { Crest } from '../components/Crest';
import { StatTile } from '../charts/Charts';

const CATEGORY_LABEL: Record<string, string> = { sub17: 'Sub-17', sub20: 'Sub-20', sub21: 'Sub-21' };

function seasonLabel(season: number, clubId?: string): string {
  const country = clubId ? WORLD.clubById.get(clubId)?.country : undefined;
  return formatSeason(season, WORLD.leagues.find((l) => l.country === country)?.calendar ?? 'europeo');
}

export function PalmaresPanel({ game }: { game: GameState }) {
  const { trophies, awards, nationalTeam: nt } = game.career;
  // Títulos agrupados por competición
  const groups = new Map<string, typeof trophies>();
  for (const tr of trophies) groups.set(tr.competitionId, [...(groups.get(tr.competitionId) ?? []), tr]);
  const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  const bdo = awards.filter((a) => a.awardId === 'balon-de-oro').sort((a, b) => a.season - b.season);
  const otherAwards = awards.filter((a) => a.awardId !== 'balon-de-oro' && a.rank === 1);
  const winners = (game.world.awardWinners ?? []).filter((w) => w.awardId === 'balon-de-oro').slice(-8).reverse();
  const country = nt.country ?? game.player.nationalTeam.chosen;

  return (
    <div className="stack">
      <div className="card stack">
        <h3>{t('palmares.trophies', { n: trophies.length })}</h3>
        {trophies.length === 0 ? (
          <p className="small muted">{t('palmares.noTrophies')}</p>
        ) : (
          <ul className="trophy-list">
            {sortedGroups.map(([id, list]) => (
              <li key={id} className="trophy-item">
                <span className="trophy-icon" aria-hidden="true">
                  {trophyIcon(id)}
                </span>
                <div className="trophy-info">
                  <strong>
                    {list.length > 1 && <span className="trophy-count">{list.length}× </span>}
                    {competitionName(id)}
                  </strong>
                  <span className="small muted">
                    {list
                      .map((tr) => (tr.nationalTeam ? `${tr.season} (${nationalTeamName(tr.nationalTeam)})` : `${seasonLabel(tr.season, tr.clubId)} · ${WORLD.clubById.get(tr.clubId ?? '')?.shortName ?? ''}`))
                      .join(' · ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card stack">
        <h3>{t('palmares.awards')}</h3>
        {bdo.length === 0 && otherAwards.length === 0 && <p className="small muted">{t('palmares.noAwards')}</p>}
        {bdo.length > 0 && (
          <p>
            <strong>{awardName('balon-de-oro')}: </strong>
            {bdo.map((a) => (
              <span key={a.season} className={a.rank === 1 ? 'badge badge-accent' : 'badge'} style={{ marginRight: 4 }}>
                {a.season}: {a.rank === 1 ? t('palmares.winner') : `${a.rank}.º`}
              </span>
            ))}
          </p>
        )}
        {otherAwards.length > 0 && (
          <ul className="news-list">
            {otherAwards.map((a, i) => (
              <li key={i} className="news-item news-positive">
                🏅 {awardName(a.awardId, a.scope)} · {a.season}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card stack">
        <h3>{t('palmares.national', { country: country ? nationalTeamName(country) : t('palmares.noCountry') })}</h3>
        <div className="stat-tiles">
          <StatTile label={t('palmares.caps')} value={nt.caps} />
          <StatTile label={t('palmares.goals')} value={nt.goals} />
          <StatTile label={t('palmares.assists')} value={nt.assists} />
          <StatTile label={t('palmares.debut')} value={nt.debutSeason ?? '–'} />
        </div>
        {Object.keys(nt.youthCaps).length > 0 && (
          <p className="small muted">
            {t('palmares.youth')}: {Object.entries(nt.youthCaps).map(([c, n]) => `${CATEGORY_LABEL[c] ?? c} ${n}`).join(' · ')}
          </p>
        )}
        {nt.tournaments.length > 0 && (
          <ul className="news-list">
            {nt.tournaments.map((tr) => (
              <li key={`${tr.competitionId}-${tr.season}`} className={`news-item ${tr.result === 'Campeón' ? 'news-positive' : ''}`}>
                {competitionName(tr.competitionId)} {tr.season}: <strong>{tr.result}</strong>
              </li>
            ))}
          </ul>
        )}
        {game.flags['ntRetired'] && <p className="small faint">{t('palmares.retiredNt')}</p>}
      </div>

      {winners.length > 0 && (
        <div className="card stack">
          <h3>{t('palmares.recentWinners')}</h3>
          <ul className="news-list">
            {winners.map((w) => {
              const club = WORLD.clubById.get(w.clubId ?? '');
              return (
                <li key={w.season} className={`news-item ${w.isPlayer ? 'news-positive' : ''}`}>
                  <span className="club-inline">
                    <span className="faint">{w.season}</span>
                    {club && <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={18} />}
                    <strong>{w.name}</strong>
                    <span className="muted small">{club?.shortName}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Elección de selección (definitiva) cuando puede jugar con varias. */
export function NationalChoiceModal({ game, onChoose }: { game: GameState; onChoose: (country: string) => void }) {
  const options = game.pendingNationalChoice;
  if (!options?.length || game.activeEvent) return null;
  return (
    <div className="modal-backdrop event-backdrop" role="presentation">
      <div className="modal event-card" role="dialog" aria-modal="true" aria-labelledby="nt-choice-title">
        <div className="event-head">
          <span className="event-icon" aria-hidden="true">
            🏳️
          </span>
          <span className="slot-label">{t('events.category.nationalTeam')}</span>
        </div>
        <h2 id="nt-choice-title">{t('palmares.choiceTitle')}</h2>
        <p className="event-text">{t('palmares.choiceText')}</p>
        <div className="event-options">
          {options.map((c, i) => (
            <button key={c} className="btn event-option" autoFocus={i === 0} onClick={() => onChoose(c)}>
              <span className="event-option-n">{i + 1}</span>
              <span>{nationalTeamName(c)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
