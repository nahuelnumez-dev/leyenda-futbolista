/** Paneles del hub de temporada: temporada en curso, clasificación, carrera, atributos y resumen. */
import { useState } from 'react';
import { lt, t, tDynamic } from '@/i18n';
import { ENGINE_CONTENT, WORLD } from '@/data';
import { GOALKEEPING_ATTRIBUTES, MENTAL_ATTRIBUTES, PHYSICAL_ATTRIBUTES, TECHNICAL_ATTRIBUTES, type AttributeId } from '@/engine/types/attributes';
import type { GameState, MatchLog, StandingRow } from '@/engine/types/game';
import { parseTableKey, sortTable, tableKey } from '@/engine/season/league';
import { activeTables } from '@/engine/season/advance';
import { formatSeason } from '@/engine/world/newGame';
import { Crest } from '../components/Crest';
import { Modal } from '../components/Modal';
import { awardName, competitionName } from '../competitionNames';
import { CELEBRATIONS } from '@/data/celebrations';
import { useGame } from '@/store/gameStore';

const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });

function ClubName({ id, size = 22 }: { id: string; size?: number }) {
  const club = WORLD.clubById.get(id);
  if (!club) return <span>{id}</span>;
  return (
    <span className="club-inline">
      <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={size} />
      <span className="club-inline-name">{club.shortName}</span>
    </span>
  );
}

function calendarOf(clubId: string | undefined) {
  const country = clubId ? WORLD.clubById.get(clubId)?.country : undefined;
  return WORLD.leagues.find((l) => l.country === country)?.calendar ?? 'europeo';
}

/* ── Temporada ─────────────────────────────────────────── */

function totals(ms: MatchLog[]) {
  const played = ms.filter((m) => m.minutes > 0);
  const rated = played.filter((m) => m.rating !== null);
  return {
    apps: played.length,
    starts: played.filter((m) => m.started).length,
    minutes: played.reduce((s, m) => s + m.minutes, 0),
    goals: played.reduce((s, m) => s + m.goals, 0),
    assists: played.reduce((s, m) => s + m.assists, 0),
    rating: rated.length ? (rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length).toFixed(2) : '–',
  };
}

function StatLine({ label, ms }: { label: string; ms: MatchLog[] }) {
  const s = totals(ms);
  return (
    <div className="stat-line">
      <span className="stat-line-label">{label}</span>
      {(['apps', 'starts', 'minutes', 'goals', 'assists', 'rating'] as const).map((k) => (
        <span key={k} className="stat-cell">
          <strong>{s[k]}</strong>
          <span>{tDynamic(`hub.stats.${k}`)}</span>
        </span>
      ))}
    </div>
  );
}

function Meter({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'var(--pitch)' : value >= 45 ? 'var(--accent)' : 'var(--danger)';
  return (
    <div className="status-meter">
      <span className="small muted">{label}</span>
      <span className="meter" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <span style={{ width: `${value}%`, background: color }} />
      </span>
      <strong className="small">{value}</strong>
    </div>
  );
}

export function SeasonPanel({ game }: { game: GameState }) {
  const p = game.player;
  const matches = game.current?.matches ?? [];
  const first = matches.filter((m) => m.competition !== 'youth');
  const youth = matches.filter((m) => m.competition === 'youth');
  const recent = first.slice(-8).reverse();
  const contract = p.contract;

  return (
    <div className="stack">
      <div className="card stack">
        <div className="status-grid">
          <Meter value={p.status.form} label={t('hub.form')} />
          <Meter value={p.status.morale} label={t('hub.morale')} />
          <div className="small">
            <span className="muted">{t('hub.value')}: </span>
            <strong>{money.format(p.marketValue)}</strong>
          </div>
          {contract && (
            <div className="small">
              <span className="muted">{t('hub.role')}: </span>
              <strong>{tDynamic(`hub.roles.${contract.role}`)}</strong>
              <span className="muted">
                {' '}
                · {money.format(contract.salary)}/año · {t('hub.contractUntil', { season: formatSeason(contract.endSeason, calendarOf(contract.clubId)) })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card stack">
        {matches.length === 0 ? (
          <p className="muted">{t('hub.noMatches')}</p>
        ) : (
          <>
            {first.length > 0 && <StatLine label={t('hub.firstTeam')} ms={first} />}
            {youth.length > 0 && <StatLine label={t('hub.youth')} ms={youth} />}
          </>
        )}
      </div>

      {recent.length > 0 && (
        <div className="card stack">
          <h3>{t('hub.lastMatches')}</h3>
          <ul className="match-list">
            {recent.map((m) => {
              const res = m.gf > m.ga ? 'w' : m.gf < m.ga ? 'l' : 'd';
              return (
                <li key={`${m.competition}-${m.md}-${m.round ?? ""}`} className="match-row">
                  <span className={`result-dot result-${res}`} aria-hidden="true" />
                  <span className="small faint" title={competitionName(m.competition)}>{m.round ? m.round.split(' ')[0] : `J${m.md}`}</span>
                  <span className="match-opp">
                    {m.home ? '' : '@ '}
                    {m.opponentId ? <ClubName id={m.opponentId} /> : <span>{m.opponentName}</span>}
                    {m.round && <span className="faint small"> · {competitionName(m.competition)}</span>}
                  </span>
                  <strong className="match-score">
                    {m.gf}-{m.ga}
                  </strong>
                  <span className="small match-player">
                    {m.minutes > 0 ? (
                      <>
                        {t('hub.minutesShort', { n: m.minutes })} · <strong>{m.rating?.toFixed(1)}</strong>
                        {m.goals > 0 && ` · ⚽${m.goals > 1 ? `×${m.goals}` : ''}`}
                        {m.assists > 0 && ` · 🅰${m.assists > 1 ? `×${m.assists}` : ''}`}
                      </>
                    ) : (
                      <span className="faint">{t('hub.didNotPlay')}</span>
                    )}
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

/* ── Clasificación ─────────────────────────────────────── */

export function TablePanel({ game }: { game: GameState }) {
  const myClub = game.player.contract?.clubId;
  const myDyn = myClub ? game.world.clubs[myClub] : undefined;
  const myKey = myDyn ? tableKey(myDyn.divisionId, myDyn.groupId) : undefined;
  const country = myClub ? WORLD.clubById.get(myClub)?.country : undefined;
  const tables = [...activeTables(game.world.clubs).keys()].filter((k) => WORLD.divisionById.get(parseTableKey(k).divisionId)?.country === country);
  tables.sort((a, b) => (WORLD.divisionById.get(parseTableKey(a).divisionId)?.tier ?? 0) - (WORLD.divisionById.get(parseTableKey(b).divisionId)?.tier ?? 0) || a.localeCompare(b));
  const [key, setKey] = useState(myKey ?? tables[0] ?? '');
  const { divisionId } = parseTableKey(key);
  const division = WORLD.divisionById.get(divisionId);
  const ids = activeTables(game.world.clubs).get(key) ?? [];
  const stored = game.world.standings[key];
  const rows: StandingRow[] = stored ? sortTable(stored) : ids.map((clubId) => ({ clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
  const n = rows.length;
  const promo = division?.promotion;
  const releg = division?.relegation?.direct ?? 0;
  const zone = (i: number) => {
    if (promo && i < promo.direct) return 'zone-up';
    if (promo?.playoff && i + 1 >= promo.playoff[0] && i + 1 <= promo.playoff[1]) return 'zone-playoff';
    if (releg && i >= n - releg) return 'zone-down';
    return '';
  };
  const label = (k: string) => {
    const { divisionId: d, groupId: g } = parseTableKey(k);
    const div = WORLD.divisionById.get(d);
    const group = div?.groups?.find((x) => x.id === g);
    return group ? `${div?.name} · ${group.name}` : (div?.name ?? k);
  };

  return (
    <div className="card stack">
      <div className="segmented" role="group" aria-label={t('hub.tabs.table')}>
        {tables.map((k) => (
          <button key={k} type="button" aria-pressed={k === key} onClick={() => setKey(k)}>
            {label(k)}
          </button>
        ))}
      </div>
      {!stored && <p className="small muted">{t('hub.table.notStarted')}</p>}
      <div className="table-wrap">
        <table className="standings">
          <caption className="sr-only">{label(key)}</caption>
          <thead>
            <tr>
              <th scope="col">{t('hub.table.pos')}</th>
              <th scope="col" className="left">
                {t('hub.table.club')}
              </th>
              {(['p', 'w', 'd', 'l', 'gd', 'pts'] as const).map((c) => (
                <th key={c} scope="col">
                  {tDynamic(`hub.table.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.clubId} className={`${zone(i)}${r.clubId === myClub ? ' is-mine' : ''}`}>
                <td>{i + 1}</td>
                <td className="left">
                  <ClubName id={r.clubId} size={20} />
                </td>
                <td>{r.played}</td>
                <td>{r.won}</td>
                <td>{r.drawn}</td>
                <td>{r.lost}</td>
                <td>{r.goalsFor - r.goalsAgainst > 0 ? `+${r.goalsFor - r.goalsAgainst}` : r.goalsFor - r.goalsAgainst}</td>
                <td>
                  <strong>{r.points}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row small muted" style={{ gap: 12 }}>
        {promo && <span className="legend legend-up">{t('hub.table.promotion')}</span>}
        {promo?.playoff && <span className="legend legend-playoff">{t('hub.table.playoff')}</span>}
        {releg > 0 && <span className="legend legend-down">{t('hub.table.relegation')}</span>}
      </div>
    </div>
  );
}

/* ── Carrera ───────────────────────────────────────────── */

export function CareerPanel({ game }: { game: GameState }) {
  const seasons = game.career.seasons;
  if (!seasons.length) return <p className="card muted">{t('hub.career.empty')}</p>;
  return (
    <div className="card table-wrap">
      <table className="standings">
        <thead>
          <tr>
            {(['season', 'age', 'club', 'apps', 'goals', 'assists', 'rating', 'ovr'] as const).map((c) => (
              <th key={c} scope="col" className={c === 'club' ? 'left' : ''}>
                {tDynamic(`hub.career.${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...seasons].reverse().map((s) => {
            const lg = s.stats.filter((c) => c.competitionId !== 'youth');
            const apps = lg.reduce((a, c) => a + c.apps, 0);
            const youth = s.stats.find((c) => c.competitionId === 'youth');
            const rating = apps ? (lg.reduce((a, c) => a + c.ratingSum, 0) / apps).toFixed(2) : '–';
            return (
              <tr key={s.season}>
                <td>{formatSeason(s.season, calendarOf(s.clubId ?? undefined))}</td>
                <td>{s.age}</td>
                <td className="left">
                  {s.clubId && <ClubName id={s.clubId} size={18} />}
                  {youth && apps === 0 && <span className="faint small"> ({t('hub.youth')})</span>}
                </td>
                <td>{apps || (youth ? <span className="faint">{youth.apps}</span> : 0)}</td>
                <td>{lg.reduce((a, c) => a + c.goals, 0)}</td>
                <td>{lg.reduce((a, c) => a + c.assists, 0)}</td>
                <td>{rating}</td>
                <td>
                  <strong>{s.overallEnd}</strong>
                  <span className={s.overallEnd >= s.overallStart ? 'delta-up' : 'delta-down'}>
                    {' '}
                    {s.overallEnd - s.overallStart >= 0 ? '+' : ''}
                    {s.overallEnd - s.overallStart}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Atributos ─────────────────────────────────────────── */

const GROUPS: { key: string; ids: readonly AttributeId[] }[] = [
  { key: 'technical', ids: TECHNICAL_ATTRIBUTES },
  { key: 'physical', ids: PHYSICAL_ATTRIBUTES },
  { key: 'mental', ids: MENTAL_ATTRIBUTES },
  { key: 'goalkeeping', ids: GOALKEEPING_ATTRIBUTES },
];

export function AttributesPanel({ game }: { game: GameState }) {
  const growth = game.lastSummary?.growth ?? {};
  return (
    <div className="card stack">
      {Object.keys(growth).length > 0 && <p className="small muted">{t('hub.growth')}</p>}
      <div className="attr-groups">
        {GROUPS.map((g) => (
          <div key={g.key} className="stack" style={{ gap: 4 }}>
            <h3 className="slot-label">{tDynamic(`attrGroup.${g.key}`)}</h3>
            {g.ids.map((id) => {
              const d = growth[id];
              return (
                <div className="attr-row" key={id}>
                  <span>{tDynamic(`attr.${id}`)}</span>
                  <span>
                    {d ? <span className={d > 0 ? 'delta-up' : 'delta-down'}>{d > 0 ? `+${d}` : d} </span> : null}
                    <strong>{game.player.attributes[id]}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Resumen de fin de temporada ───────────────────────── */

export function SummaryModal({ game, open, onClose }: { game: GameState; open: boolean; onClose: () => void }) {
  const s = game.lastSummary;
  if (!s) return null;
  const club = s.clubId ? WORLD.clubById.get(s.clubId) : undefined;
  const entries = Object.entries(s.growth) as [AttributeId, number][];
  const ups = entries.filter(([, d]) => d > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const downs = entries.filter(([, d]) => d < 0).sort((a, b) => a[1] - b[1]).slice(0, 5);
  const label = formatSeason(s.season, calendarOf(s.clubId ?? undefined));
  return (
    <Modal
      open={open}
      title={t('hub.summary.title', { season: label })}
      onClose={onClose}
      actions={
        <button className="btn btn-primary" onClick={onClose}>
          {t('hub.summary.close')}
        </button>
      }
    >
      <div className="stack">
        {club && s.position && (
          <div className="row" style={{ gap: 10 }}>
            <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={44} />
            <span>{t('hub.summary.position', { club: club.shortName, pos: s.position, size: s.tableSize ?? 0 })}</span>
          </div>
        )}
        {s.champion && <p className="trial-ok">🏆 {t('hub.summary.champion')}</p>}
        {s.promoted && <p className="trial-ok">⬆ {t('hub.summary.promoted')}</p>}
        {s.relegated && <p className="trial-ko">⬇ {t('hub.summary.relegated')}</p>}
        {s.firstTeamPromotion && club && <p className="trial-ok">{t('hub.summary.firstTeam', { club: club.shortName })}</p>}
        {(s.trophies ?? []).filter((x) => x !== s.divisionId).map((x) => (
          <p key={x} className="trial-ok">
            🏆 {t('hub.summary.trophy', { name: competitionName(x) })}
          </p>
        ))}
        {s.cupRound && s.cupRound !== 'Campeón' && <p className="small">{t('hub.summary.cup', { round: s.cupRound })}</p>}
        {s.continental && s.continental.round !== 'Campeón' && (
          <p className="small">{t('hub.summary.continental', { name: competitionName(s.continental.competitionId), round: s.continental.round })}</p>
        )}
        {s.national && s.national.caps > 0 && <p className="small">{t('hub.summary.national', { caps: s.national.caps, goals: s.national.goals })}</p>}
        {s.national?.tournament && (
          <p className="small">
            {t('hub.summary.tournament', { name: competitionName(s.national.tournament.competitionId), result: s.national.tournament.result })}
            {!s.national.tournament.played && t('hub.summary.notCalled')}
          </p>
        )}
        {(s.awards ?? []).map((a) => (
          <p key={a.awardId + (a.scope ?? '')} className={a.rank === 1 ? 'trial-ok' : 'small'}>
            {a.rank === 1 ? '🏅 ' : ''}
            {awardName(a.awardId, a.scope)}: {a.rank === 1 ? t('palmares.winner') : `${a.rank}.º`}
          </p>
        ))}
        <p>
          <strong>{t('hub.summary.overall', { from: s.overallStart, to: s.overallEnd })}</strong>
        </p>
        {s.roleAfter && <p className="small">{t('hub.summary.role', { role: tDynamic(`hub.roles.${s.roleAfter}`) })}</p>}
        {ups.length > 0 && (
          <div>
            <h3 className="slot-label">{t('hub.summary.topGrowth')}</h3>
            <p className="small">{ups.map(([id, d]) => `${tDynamic(`attr.${id}`)} +${d}`).join(' · ')}</p>
          </div>
        )}
        {downs.length > 0 && (
          <div>
            <h3 className="slot-label">{t('hub.summary.decline')}</h3>
            <p className="small">{downs.map(([id, d]) => `${tDynamic(`attr.${id}`)} ${d}`).join(' · ')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}


/* ── Ofertas ───────────────────────────────────────────── */

export function OffersPanel({ game, onRespond }: { game: GameState; onRespond: (id: string, accept: boolean) => void }) {
  const offers = game.offers ?? [];
  if (!offers.length) return null;
  const cal = calendarOf(game.player.contract?.clubId);
  return (
    <div className="card stack offers-card">
      <h3>{t('offers.title')}</h3>
      <p className="small muted">{t('offers.hint')}</p>
      <ul className="offer-list">
        {offers.map((o) => {
          const club = WORLD.clubById.get(o.clubId);
          const division = WORLD.divisionById.get(game.world.clubs[o.clubId]?.divisionId ?? '');
          return (
            <li key={o.id} className="offer-row">
              {club && <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={48} />}
              <div className="offer-info">
                <strong>
                  {tDynamic(`offers.kind.${o.kind}`)} · {club?.shortName}
                </strong>
                <span className="small muted">
                  {division?.name} · {club?.city}
                </span>
                <span className="small">
                  {o.fee > 0 && <>{t('offers.fee', { fee: money.format(o.fee) })} · </>}
                  {t('offers.salary', { salary: money.format(o.salary) })} ·{' '}
                  {o.kind === 'loan' ? t('offers.loanSeason') : t('offers.until', { season: formatSeason(game.calendar.season + o.years - (game.calendar.phase === 'seasonEnd' ? 0 : 1), cal) })} ·{' '}
                  {t('offers.role', { role: tDynamic(`hub.roles.${o.role}`) })}
                </span>
              </div>
              <div className="offer-actions">
                <button className="btn btn-primary" onClick={() => onRespond(o.id, true)}>
                  {t('offers.accept')}
                </button>
                <button className="btn btn-ghost" onClick={() => onRespond(o.id, false)}>
                  {t('offers.reject')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Noticias ──────────────────────────────────────────── */

export function NewsPanel({ game }: { game: GameState }) {
  const items = game.inbox.slice(0, 6);
  if (!items.length) return null;
  return (
    <div className="card stack">
      <h3>{t('news.title')}</h3>
      <ul className="news-list">
        {items.map((n) => (
          <li key={n.id} className={`news-item news-${n.tone}`}>
            {n.headline}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Personalidad ──────────────────────────────────────── */

const SOURCE_ICON: Record<string, string> = { fans: '📣', press: '🎙️', social: '📱', coach: '📋', teammate: '👟', board: '🏛️', family: '🏠', agent: '💼', system: 'ℹ️' };
const compact = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 });

/** Barra centrada en 0 para valores de -100 a 100. */
function Diverging({ value, label, left, right }: { value: number; label: string; left?: string; right?: string }) {
  const v = Math.max(-100, Math.min(100, value));
  const width = Math.abs(v) / 2;
  return (
    <div className="diverging">
      <div className="diverging-head small">
        {left && right ? (
          <>
            <span className={v < 0 ? '' : 'muted'}>{left}</span>
            <strong>{v > 0 ? '+' : ''}{v}</strong>
            <span className={v > 0 ? '' : 'muted'}>{right}</span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <span />
            <strong>{v > 0 ? '+' : ''}{v}</strong>
          </>
        )}
      </div>
      <div className="diverging-bar" role="meter" aria-valuenow={v} aria-valuemin={-100} aria-valuemax={100} aria-label={label}>
        <span className="diverging-mid" />
        <span className={`diverging-fill ${v >= 0 ? 'pos' : 'neg'}`} style={v >= 0 ? { left: '50%', width: `${width}%` } : { right: '50%', width: `${width}%` }} />
      </div>
    </div>
  );
}

function CelebrationPicker({ game }: { game: GameState }) {
  const choose = useGame((s) => s.chooseCelebration);
  const { unlocked, selected } = game.player.celebrations;
  return (
    <div className="card stack">
      <h3>{t('personality.celebration')}</h3>
      <p className="small muted">{t('personality.celebrationHint')}</p>
      <div className="celebration-grid">
        {CELEBRATIONS.map((c) => {
          const open = unlocked.includes(c.id);
          return (
            <button key={c.id} type="button" className="celebration-card" aria-pressed={selected === c.id} disabled={!open} onClick={() => choose(c.id)}>
              <span className="celebration-symbol" aria-hidden="true">
                {open ? c.symbol : '🔒'}
              </span>
              <strong>{c.name}</strong>
              <span className="small muted">{open ? c.description : c.unlock}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PersonalityPanel({ game }: { game: GameState }) {
  const p = game.player;
  const recent = game.inbox.filter((n) => n.source !== 'system').slice(0, 8);
  return (
    <div className="stack">
      <div className="card stack">
        <h3>{t('personality.traits')}</h3>
        {p.traits.length === 0 && <p className="small muted">{t('personality.noTraits')}</p>}
        <ul className="trait-list">
          {p.traits.map((tr) => {
            const def = ENGINE_CONTENT.traits.find((d) => d.id === tr.id);
            if (!def) return null;
            return (
              <li key={tr.id} className="trait-item">
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <strong>{lt(def.name)}</strong>
                  <span className="trait-dots" aria-label={t('personality.intensity', { n: tr.intensity })}>
                    {[1, 2, 3].map((i) => (
                      <span key={i} className={i <= tr.intensity ? 'on' : ''} />
                    ))}
                  </span>
                </div>
                <span className="small muted">{lt(def.description)}</span>
                {game.flags[`traitFromTendency:${tr.id}`] && <span className="small faint">{t('personality.fromTendency')}</span>}
              </li>
            );
          })}
        </ul>
      </div>

      <CelebrationPicker game={game} />

      <div className="card stack">
        <h3>{t('personality.tendencies')}</h3>
        <p className="small muted">{t('personality.tendenciesHint')}</p>
        <div className="diverging-grid">
          {ENGINE_CONTENT.tendencies.map((td) => (
            <Diverging key={td.id} value={p.tendencies[td.id] ?? 0} label={lt(td.name)} left={lt(td.opposite)} right={lt(td.name)} />
          ))}
        </div>
      </div>

      <div className="card stack">
        <h3>{t('personality.relations')}</h3>
        <div className="diverging-grid">
          {(Object.keys(p.relations) as (keyof typeof p.relations)[]).map((k) => (
            <Diverging key={k} value={p.relations[k]} label={tDynamic(`effects.relation.${k}`)} />
          ))}
        </div>
      </div>

      <div className="card stack">
        <h3>{t('personality.social')}</h3>
        <div className="row" style={{ gap: 24 }}>
          <div className="stat-cell">
            <strong>{compact.format(game.social.followers)}</strong>
            <span>{t('personality.followers')}</span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Diverging value={game.social.sentiment} label={t('personality.sentiment')} />
          </div>
        </div>
        {recent.length > 0 && (
          <ul className="news-list">
            {recent.map((n) => (
              <li key={n.id} className={`news-item news-${n.tone}`}>
                <span aria-hidden="true">{SOURCE_ICON[n.source] ?? '•'} </span>
                {n.headline}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
