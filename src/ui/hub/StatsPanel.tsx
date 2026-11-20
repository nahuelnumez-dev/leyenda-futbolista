/** Pestaña Estadísticas: cifras de carrera, evolución, goles, valor, perfil de atributos y clubes. */
import { t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import type { GameState } from '@/engine/types/game';
import { overallFor } from '@/engine/player/overall';
import { formatSeason } from '@/engine/world/newGame';
import { bestSeason, byClub, careerTotals, currentTotals, radarAxes, radarProfile, ratingTimeline, seasonSeries } from '@/engine/stats/stats';
import { ChartFrame, ColumnChart, LineChart, RadarChart, StatTile } from '../charts/Charts';
import { Crest } from '../components/Crest';

const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });
const shortSeason = (s: number) => `${String(s).slice(2)}`;

export function StatsPanel({ game }: { game: GameState }) {
  const p = game.player;
  const seasons = game.career.seasons;
  const totals = careerTotals(seasons);
  const now = currentTotals(game.current?.matches ?? []);
  const series = seasonSeries(seasons);
  const bestGoals = bestSeason(seasons, 'goals');
  const bestRating = bestSeason(seasons, 'rating');
  const ovrNow = overallFor(p.attributes, p.positions.main);
  const axes = radarAxes(p.positions.main);
  const start = game.career.startAttributes;
  const cal = (clubId?: string | null) => WORLD.leagues.find((l) => l.country === WORLD.clubById.get(clubId ?? '')?.country)?.calendar ?? 'europeo';
  const timeline = ratingTimeline(game);
  const clubs = byClub(seasons);

  // Evolución de la media: el inicio de carrera más una media por temporada cerrada.
  const startOvr = start ? overallFor(start, p.positions.main) : seasons[0]?.overallStart;
  const ovrPoints = [
    ...(startOvr !== undefined ? [{ x: t('stats.start'), y: startOvr, detail: t('stats.age', { age: seasons[0]?.age ?? 15 }) }] : []),
    ...series.map((s) => ({ x: shortSeason(s.season), y: s.overall, detail: t('stats.age', { age: s.age + 1 }) })),
  ];

  return (
    <div className="stack">
      <div className="card stack">
        <h3>{t('stats.careerTitle')}</h3>
        <div className="stat-tiles">
          <StatTile label={t('stats.apps')} value={totals.apps} hint={now.apps ? t('stats.thisSeason', { n: now.apps }) : undefined} />
          <StatTile label={t('stats.goals')} value={totals.goals} hint={now.goals ? t('stats.thisSeason', { n: now.goals }) : undefined} />
          <StatTile label={t('stats.assists')} value={totals.assists} hint={now.assists ? t('stats.thisSeason', { n: now.assists }) : undefined} />
          <StatTile label={t('stats.rating')} value={totals.rating ? totals.rating.toFixed(2) : '–'} />
          <StatTile label={t('stats.peakOverall')} value={Math.max(game.career.records.peakOverall, ovrNow)} />
          <StatTile label={t('stats.peakValue')} value={money.format(Math.max(game.career.records.peakMarketValue, p.marketValue))} />
          <StatTile label={t('stats.biggestFee')} value={game.career.records.biggestTransferFee ? money.format(game.career.records.biggestTransferFee) : '–'} />
          <StatTile label={t('stats.hatTricks')} value={game.career.records.hatTricks} />
        </div>
        {(bestGoals || bestRating) && (
          <p className="small muted">
            {bestGoals && bestGoals.goals > 0 && t('stats.bestGoals', { n: bestGoals.goals, season: formatSeason(bestGoals.season, cal(seasons.find((x) => x.season === bestGoals.season)?.clubId)) })}
            {bestGoals && bestGoals.goals > 0 && bestRating && ' · '}
            {bestRating && t('stats.bestRating', { r: bestRating.rating.toFixed(2), season: formatSeason(bestRating.season, cal(seasons.find((x) => x.season === bestRating.season)?.clubId)) })}
          </p>
        )}
      </div>

      {timeline.length > 0 && (
        <ChartFrame
          title={t('stats.ratingsTitle')}
          subtitle={t('stats.ratingsSub', { avg: now.rating.toFixed(2) })}
          table={{ head: [t('stats.matchday'), t('stats.rating'), t('stats.goals'), t('stats.assists')], rows: timeline.map((m) => [m.md, m.rating.toFixed(1), m.goals, m.assists]) }}
        >
          <LineChart
            label={t('stats.ratingsTitle')}
            points={timeline.map((m) => ({
              x: `J${m.md}`,
              y: m.rating,
              detail: [WORLD.clubById.get(m.opponentId ?? '')?.shortName, m.goals ? `⚽ ${m.goals}` : '', m.assists ? `🅰 ${m.assists}` : ''].filter(Boolean).join(' · '),
            }))}
            yMin={4}
            yMax={10}
            format={(v) => v.toFixed(1)}
          />
        </ChartFrame>
      )}

      {seasons.length === 0 ? (
        <p className="card muted">{t('stats.firstSeason')}</p>
      ) : (
        <div className="viz-grid-2">
          <ChartFrame
            title={t('stats.overallTitle')}
            subtitle={t('stats.overallSub', { min: p.potential.shownRange[0], max: p.potential.shownRange[1] })}
            table={{ head: [t('stats.season'), t('stats.overall')], rows: ovrPoints.map((o) => [o.x, o.y]) }}
          >
            <LineChart label={t('stats.overallTitle')} points={ovrPoints} format={(v) => String(Math.round(v))} />
          </ChartFrame>

          <ChartFrame
            title={t('stats.goalsTitle')}
            legend={[
              { label: t('stats.goals'), series: 1 },
              { label: t('stats.assists'), series: 2 },
            ]}
            table={{ head: [t('stats.season'), t('stats.apps'), t('stats.goals'), t('stats.assists')], rows: series.map((s, i) => [formatSeason(s.season, cal(seasons[i]?.clubId)), s.apps, s.goals, s.assists]) }}
          >
            <ColumnChart
              label={t('stats.goalsTitle')}
              categories={series.map((s) => shortSeason(s.season))}
              series={[
                { label: t('stats.goals'), values: series.map((s) => s.goals) },
                { label: t('stats.assists'), values: series.map((s) => s.assists) },
              ]}
            />
          </ChartFrame>

          <ChartFrame title={t('stats.valueTitle')} table={{ head: [t('stats.season'), t('stats.value')], rows: series.map((s, i) => [formatSeason(s.season, cal(seasons[i]?.clubId)), money.format(s.value)]) }}>
            <LineChart label={t('stats.valueTitle')} points={series.map((s) => ({ x: shortSeason(s.season), y: s.value }))} yMin={0} format={(v) => money.format(v)} />
          </ChartFrame>

          {start && (
            <ChartFrame
              title={t('stats.profileTitle')}
              legend={[
                { label: t('stats.now'), series: 1 },
                { label: t('stats.careerStart'), series: 2 },
              ]}
              table={{
                head: [t('stats.axis'), t('stats.now'), t('stats.careerStart')],
                rows: axes.map((a, i) => [tDynamic(`stats.radar.${a.id}`), radarProfile(p.attributes, axes)[i]!, radarProfile(start, axes)[i]!]),
              }}
            >
              <RadarChart
                label={t('stats.profileTitle')}
                axes={axes.map((a) => tDynamic(`stats.radar.${a.id}`))}
                series={[
                  { label: t('stats.now'), values: radarProfile(p.attributes, axes) },
                  { label: t('stats.careerStart'), values: radarProfile(start, axes) },
                ]}
              />
            </ChartFrame>
          )}
        </div>
      )}

      {clubs.length > 0 && (
        <div className="card table-wrap">
          <h3>{t('stats.byClub')}</h3>
          <table className="standings">
            <thead>
              <tr>
                <th scope="col" className="left">
                  {t('hub.career.club')}
                </th>
                <th scope="col">{t('stats.seasons')}</th>
                <th scope="col">{t('hub.career.apps')}</th>
                <th scope="col">{t('hub.career.goals')}</th>
                <th scope="col">{t('hub.career.assists')}</th>
                <th scope="col">{t('hub.career.rating')}</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((c) => {
                const club = WORLD.clubById.get(c.clubId);
                return (
                  <tr key={`${c.clubId}-${c.from}`}>
                    <td className="left">
                      <span className="club-inline">
                        {club && <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={20} />}
                        <span className="club-inline-name">{club?.shortName}</span>
                      </span>
                      <span className="faint small">
                        {' '}
                        {formatSeason(c.from, cal(c.clubId))}
                        {c.to !== c.from && ` – ${formatSeason(c.to, cal(c.clubId))}`}
                      </span>
                    </td>
                    <td>{c.seasons}</td>
                    <td>{c.totals.apps}</td>
                    <td>{c.totals.goals}</td>
                    <td>{c.totals.assists}</td>
                    <td>{c.totals.rating ? c.totals.rating.toFixed(2) : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
