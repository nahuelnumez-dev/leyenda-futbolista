import { useMemo, useState } from 'react';
import { lt, t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import type { Club } from '@/engine/types/club';
import type { DivisionInfo } from '@/engine/data/world';
import { useUi } from '@/store/uiStore';
import { ScreenHeader } from '../components/ScreenHeader';
import { Crest } from '../components/Crest';
import { Modal } from '../components/Modal';

const numberFmt = new Intl.NumberFormat('es');

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="meter" role="meter" aria-valuenow={value} aria-valuemin={1} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function ClubRow({ club, onOpen }: { club: Club; onOpen: (c: Club) => void }) {
  return (
    <li>
      <button className="club-row" onClick={() => onOpen(club)}>
        <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={40} />
        <span className="club-row-main">
          <span className="club-row-name">
            {club.shortName}
            {club.needsReview && <span className="badge badge-warn">{t('clubs.review')}</span>}
          </span>
          <span className="small muted club-row-sub">
            {club.city} · {club.stadium.name}
          </span>
        </span>
        <span className="club-row-prestige" title={t('clubs.prestige')}>
          {club.prestige}
        </span>
      </button>
    </li>
  );
}

function DivisionBlock({ division, onOpen }: { division: DivisionInfo; onOpen: (c: Club) => void }) {
  const byId = new Map(division.clubs.map((c) => [c.id, c]));
  const sorted = (clubs: Club[]) => [...clubs].sort((a, b) => b.prestige - a.prestige);
  const groups = division.groups?.map((g) => ({ ...g, clubs: g.clubIds.map((id) => byId.get(id)).filter((c): c is Club => !!c) }));
  const perGroup = (division.promotion?.direct ?? 0) + (division.promotion?.playoffSpots ?? 0);
  const groupCount = division.groups?.length ?? 1;

  return (
    <section className="card stack" aria-label={division.name}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>{division.name}</h2>
        <span className="small muted">
          {t('clubs.tier', { tier: division.tier })} · {t('clubs.clubsCount', { n: division.clubs.length })}
        </span>
      </div>
      <div className="row small muted" style={{ gap: 8 }}>
        <span className="badge">{division.format?.rounds === 1 ? t('clubs.rounds1') : t('clubs.rounds2')}</span>
        {perGroup > 0 && <span className="badge badge-pitch">{t('clubs.promotion', { n: perGroup * groupCount })}</span>}
        {(division.relegation?.direct ?? 0) > 0 && <span className="badge badge-danger">{t('clubs.relegation', { n: division.relegation!.direct * groupCount })}</span>}
        {division.needsReview && (
          <span className="badge badge-warn" title={t('clubs.reviewHint')}>
            {t('clubs.review')}
          </span>
        )}
      </div>
      {groups ? (
        groups.map((g) => (
          <div key={g.id} className="stack" style={{ gap: 6 }}>
            <h3 className="slot-label">{g.name}</h3>
            <ul className="club-list">
              {sorted(g.clubs).map((c) => (
                <ClubRow key={c.id} club={c} onOpen={onOpen} />
              ))}
            </ul>
          </div>
        ))
      ) : (
        <ul className="club-list">
          {sorted(division.clubs).map((c) => (
            <ClubRow key={c.id} club={c} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ClubDetail({ club, onOpen }: { club: Club; onOpen: (c: Club) => void }) {
  const division = WORLD.divisionById.get(WORLD.divisionOfClub.get(club.id) ?? '');
  const parent = club.parentClubId ? WORLD.clubById.get(club.parentClubId) : undefined;
  const hasRealCrest = Boolean(club.crest?.file);

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 16, alignItems: 'center' }}>
        <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={88} />
        <div className="stack" style={{ gap: 2 }}>
          <strong>{club.name}</strong>
          <span className="small muted">{division?.name}</span>
          <span className="faint small">{hasRealCrest ? t('clubs.crestReal') : t('clubs.crestGeneric')}</span>
          {parent && <span className="small">{t('clubs.parent', { club: parent.shortName })}</span>}
        </div>
      </div>

      <dl className="club-facts">
        <dt>{t('clubs.city')}</dt>
        <dd>
          {club.city} ({club.region})
        </dd>
        <dt>{t('clubs.stadium')}</dt>
        <dd>
          {club.stadium.name} · {t('clubs.capacity', { n: numberFmt.format(club.stadium.capacity) })}
        </dd>
        <dt>{t('clubs.colors')}</dt>
        <dd className="row" style={{ gap: 6 }}>
          <span className="swatch" style={{ background: club.colors.primary }} />
          <span className="swatch" style={{ background: club.colors.secondary }} />
        </dd>
        <dt>{t('clubs.style')}</dt>
        <dd>{tDynamic(`style.${club.style}`)}</dd>
        <dt>{t('clubs.budget')}</dt>
        <dd>{t('clubs.budgetValue', { m: numberFmt.format(club.budgetM) })}</dd>
        <dt>{t('clubs.prestige')}</dt>
        <dd>
          <Meter value={club.prestige} label={t('clubs.prestige')} /> {club.prestige}
        </dd>
        <dt>{t('clubs.academy')}</dt>
        <dd>
          <Meter value={club.academy} label={t('clubs.academy')} /> {club.academy}
        </dd>
      </dl>

      <div className="stack" style={{ gap: 6 }}>
        <h3 className="slot-label">{t('clubs.rivals')}</h3>
        {club.rivals.length === 0 && <span className="small muted">{t('clubs.noRivals')}</span>}
        {club.rivals.map((r) => {
          const rival = WORLD.clubById.get(r.clubId);
          if (!rival) return null;
          return (
            <button key={r.clubId} className="club-row" onClick={() => onOpen(rival)}>
              <Crest name={rival.name} abbr={rival.abbr} colors={rival.colors} crest={rival.crest} size={32} />
              <span className="club-row-main">
                <span className="club-row-name">{rival.shortName}</span>
                <span className="small muted">
                  {r.name ?? t(r.type === 'clasico' ? 'clubs.clasico' : 'clubs.derbi')} · {'★'.repeat(r.intensity)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {club.needsReview && <p className="small muted">{t('clubs.reviewHint')}</p>}
    </div>
  );
}

const CONFEDERATIONS: [string, string][] = [
  ['UEFA', 'Europa'],
  ['CONMEBOL', 'Sudamérica'],
  ['AFC', 'Asia'],
  ['CONCACAF', 'Norteamérica y Centroamérica'],
];

export function ClubsScreen() {
  const goTo = useUi((s) => s.goTo);
  const [country, setCountry] = useState(WORLD.leagues[0]?.country ?? 'ESP');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Club | null>(null);

  const league = WORLD.leagues.find((l) => l.country === country);
  const [divisionId, setDivisionId] = useState<string>('');
  const divisions = (league?.divisions ?? []) as DivisionInfo[];
  const division = divisions.find((d) => d.id === divisionId) ?? divisions[0];

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 2) return null;
    return [...WORLD.clubById.values()]
      .filter((c) => [c.name, c.shortName, c.city, c.stadium.name, c.abbr].some((f) => normalize(f).includes(q)))
      .sort((a, b) => b.prestige - a.prestige)
      .slice(0, 40);
  }, [query]);

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <ScreenHeader title={t('clubs.title')} onBack={() => goTo('mainMenu')} />

      <input
        className="input"
        type="search"
        placeholder={t('clubs.search')}
        aria-label={t('clubs.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results ? (
        <section className="card stack">
          <span className="small muted">{t('clubs.searchResults', { n: results.length })}</span>
          {results.length === 0 ? (
            <p className="muted">{t('clubs.noResults')}</p>
          ) : (
            <ul className="club-list">
              {results.map((c) => (
                <ClubRow key={c.id} club={c} onOpen={setSelected} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          <select
            className="select"
            aria-label={t('clubs.country')}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setDivisionId('');
            }}
          >
            {CONFEDERATIONS.map(([conf, label]) => {
              const leagues = WORLD.leagues.filter((l) => WORLD.countryById.get(l.country)?.confederation === conf);
              if (!leagues.length) return null;
              return (
                <optgroup key={conf} label={label}>
                  {leagues.map((l) => (
                    <option key={l.country} value={l.country}>
                      {lt(WORLD.countryById.get(l.country)?.name ?? { es: l.country })}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <div className="segmented" role="group" aria-label={t('clubs.division')}>
            {divisions.map((d) => (
              <button key={d.id} type="button" aria-pressed={d.id === division?.id} onClick={() => setDivisionId(d.id)}>
                {d.name}
              </button>
            ))}
          </div>
          {league && <p className="faint small">{t('clubs.dataSeason', { season: league.dataSeason })}</p>}
          {division && <DivisionBlock division={division} onOpen={setSelected} />}
        </>
      )}

      <Modal open={selected !== null} title={selected?.shortName ?? ''} onClose={() => setSelected(null)}>
        {selected && <ClubDetail club={selected} onOpen={setSelected} />}
      </Modal>
    </div>
  );
}
