/**
 * Resumen final de la carrera: historia narrada, cifras, clubes, títulos, decisiones clave, logros y legado.
 * Se puede descargar como imagen (PNG) o guardar como PDF (impresión del navegador).
 */
import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { lt, t, tDynamic } from '@/i18n';
import { ENGINE_CONTENT, WORLD } from '@/data';
import { ACHIEVEMENTS } from '@/data/achievements';
import type { GameState } from '@/engine/types/game';
import { careerCard, legacyScore } from '@/engine/legacy/legacy';
import { byClub } from '@/engine/stats/stats';
import { formatSeason } from '@/engine/world/newGame';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Avatar } from '../avatar/Avatar';
import { Crest } from '../components/Crest';
import { StatTile } from '../charts/Charts';
import { competitionName, nationalTeamName, trophyIcon } from '../competitionNames';
import { errorMessage } from '../errors';

function calendarOf(clubId?: string) {
  const country = clubId ? WORLD.clubById.get(clubId)?.country : undefined;
  return WORLD.leagues.find((l) => l.country === country)?.calendar ?? 'europeo';
}

/** Relato de la carrera a partir de los datos (sin textos inventados). */
function narrative(game: GameState): string[] {
  const p = game.player;
  const card = careerCard(game, ENGINE_CONTENT);
  const name = p.identity.nickname ? `${p.identity.name}, «${p.identity.nickname}»,` : p.identity.name;
  const academy = game.career.spells.find((s) => s.type === 'academy');
  const firstClub = WORLD.clubById.get(academy?.clubId ?? card.clubs[0] ?? '')?.shortName ?? '';
  const lastClub = WORLD.clubById.get(game.player.contract?.loanFrom ?? game.player.contract?.clubId ?? game.career.spells.at(-1)?.clubId ?? '')?.shortName ?? '';
  // Primera temporada con minutos en el primer equipo.
  const debut = game.career.seasons.find((s) => s.stats.some((c) => c.competitionId !== 'youth' && c.apps > 0))?.season;
  const out: string[] = [];
  out.push(
    t('careerEnd.story.origin', { nombre: name, ciudad: p.identity.birthPlace.city, club: firstClub }) +
      (typeof debut === 'number' ? ' ' + t('careerEnd.story.debut', { year: debut }) : ''),
  );
  out.push(
    t('careerEnd.story.numbers', { seasons: card.seasons, clubs: card.clubs.length, apps: card.apps, goals: card.goals, assists: card.assists }),
  );
  const tops = game.career.trophies.filter((tr) => tr.competitionId.includes('world-cup') || tr.competitionId === 'uefa.champions' || tr.competitionId === 'conmebol.libertadores' || tr.competitionId === 'afc.champions-elite' || tr.competitionId === 'concacaf.champions-cup' || WORLD.divisionById.get(tr.competitionId)?.tier === 1);
  if (game.career.trophies.length) {
    const names = [...new Set(tops.map((tr) => competitionName(tr.competitionId)))].slice(0, 3).join(', ');
    const list = names || competitionName(game.career.trophies[0]!.competitionId);
    out.push(game.career.trophies.length === 1 ? t('careerEnd.story.trophyOne', { names: list }) : t('careerEnd.story.trophies', { n: game.career.trophies.length, names: list }));
  } else {
    out.push(t('careerEnd.story.noTrophies'));
  }
  if (card.caps > 0) out.push(t('careerEnd.story.national', { country: nationalTeamName(game.career.nationalTeam.country), caps: card.caps, goals: game.career.nationalTeam.goals }));
  if (card.ballonDors > 0) out.push(t('careerEnd.story.ballonDor', { n: card.ballonDors }));
  out.push(t('careerEnd.story.end', { age: card.retiredAge, club: lastClub }));
  return out;
}

export function CareerEnd() {
  const game = useGame((s) => s.game);
  const closeGame = useGame((s) => s.closeGame);
  const goTo = useUi((s) => s.goTo);
  const toast = useUi((s) => s.toast);
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

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
  const card = careerCard(game, ENGINE_CONTENT);
  const legacy = legacyScore(game, ENGINE_CONTENT);
  const lastClub = WORLD.clubById.get(p.contract?.loanFrom ?? p.contract?.clubId ?? game.career.spells.at(-1)?.clubId ?? '');
  const first = game.calendar.startSeason;
  const clubs = byClub(game.career.seasons);
  const keyDecisions = game.eventLog
    .filter((e) => e.key)
    .map((e) => {
      const ev = ENGINE_CONTENT.events.find((x) => x.id === e.eventId);
      const opt = ev?.options.find((o) => o.id === e.optionId);
      return ev && opt ? { season: e.season, title: ev.title.es.replace(/\{\w+\}/g, '').trim(), option: opt.text.es.replace(/\{(\w+)\}/g, '…') } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .slice(-8);
  const achieved = ACHIEVEMENTS.filter((a) => game.achievements[a.id]?.unlocked);
  const trophyGroups = new Map<string, number>();
  for (const tr of game.career.trophies) trophyGroups.set(tr.competitionId, (trophyGroups.get(tr.competitionId) ?? 0) + 1);

  const exportImage = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const url = await toPng(ref.current, { backgroundColor: '#0b0f14', pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = url;
      a.download = `leyenda-${p.identity.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.click();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen stack" style={{ gap: 16 }}>
      <div className="row no-print" style={{ justifyContent: 'space-between' }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            closeGame();
            goTo('mainMenu');
          }}
        >
          ← {t('hub.mainMenu')}
        </button>
        <div className="row">
          <button className="btn" onClick={() => void exportImage()} disabled={busy}>
            {t('careerEnd.exportImage')}
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            {t('careerEnd.exportPdf')}
          </button>
        </div>
      </div>

      <div id="career-summary" ref={ref} className="career-summary stack">
        <header className="career-hero">
          <Avatar config={p.appearance} kit={lastClub?.colors} size={150} label={p.identity.name} />
          <div className="stack" style={{ gap: 4 }}>
            <span className="slot-label">{tDynamic(`careerEnd.rank.${legacy.rank}`)}</span>
            <h1 className="career-name">{p.identity.name}</h1>
            {p.identity.nickname && <span className="muted">«{p.identity.nickname}»</span>}
            <span className="muted">
              {nationalTeamName(card.nationality)} · {tDynamic(`pos.${p.positions.main}`)} · {first}–{calendarOf(p.contract?.clubId) === 'anual' ? game.calendar.season : game.calendar.season + 1}
            </span>
            <span className="legacy-score">
              {t('careerEnd.legacy')}: <strong>{legacy.score}</strong>
            </span>
          </div>
        </header>

        <section className="card stack">
          {narrative(game).map((line, i) => (
            <p key={i} className="story-line">
              {line}
            </p>
          ))}
        </section>

        <section className="card">
          <div className="stat-tiles">
            <StatTile label={t('careerEnd.seasons')} value={card.seasons} />
            <StatTile label={t('stats.apps')} value={card.apps} />
            <StatTile label={t('stats.goals')} value={card.goals} />
            <StatTile label={t('stats.assists')} value={card.assists} />
            <StatTile label={t('careerEnd.trophies')} value={card.trophies} />
            <StatTile label={t('palmares.caps')} value={card.caps} />
            <StatTile label={t('stats.peakOverall')} value={card.peakOverall} />
            <StatTile label={t('careerEnd.ballonDors')} value={card.ballonDors} />
          </div>
        </section>

        <section className="card stack">
          <h3>{t('careerEnd.clubs')}</h3>
          <ul className="club-timeline">
            {clubs.map((c) => {
              const club = WORLD.clubById.get(c.clubId);
              return (
                <li key={`${c.clubId}-${c.from}`}>
                  {club && <Crest name={club.name} abbr={club.abbr} colors={club.colors} crest={club.crest} size={36} />}
                  <div>
                    <strong>{club?.shortName}</strong>
                    <span className="small muted">
                      {' '}
                      {formatSeason(c.from, calendarOf(c.clubId))}
                      {c.to !== c.from ? ` – ${formatSeason(c.to, calendarOf(c.clubId))}` : ''}
                    </span>
                    <div className="small faint">{t('careerEnd.clubLine', { apps: c.totals.apps, goals: c.totals.goals, assists: c.totals.assists })}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {trophyGroups.size > 0 && (
          <section className="card stack">
            <h3>{t('careerEnd.trophies')}</h3>
            <div className="trophy-chips">
              {[...trophyGroups.entries()].map(([id, n]) => (
                <span key={id} className="badge badge-accent">
                  {trophyIcon(id)} {n > 1 ? `${n}× ` : ''}
                  {competitionName(id)}
                </span>
              ))}
            </div>
          </section>
        )}

        {keyDecisions.length > 0 && (
          <section className="card stack">
            <h3>{t('careerEnd.decisions')}</h3>
            <ul className="news-list">
              {keyDecisions.map((d, i) => (
                <li key={i} className="news-item">
                  <span className="faint">{d.season}</span> · <strong>{d.title}</strong>: {d.option}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card stack">
          <h3>{t('careerEnd.achievements', { n: achieved.length, total: ACHIEVEMENTS.length })}</h3>
          <div className="trophy-chips">
            {achieved.map((a) => (
              <span key={a.id} className={`badge tier-${a.tier}`}>
                {lt(a.name)}
              </span>
            ))}
          </div>
        </section>

        <section className="card stack">
          <h3>{t('careerEnd.legacyBreakdown')}</h3>
          <div className="legacy-parts">
            {legacy.parts.map((part) => (
              <div key={part.key} className="legacy-part">
                <span className="small muted">{tDynamic(`careerEnd.parts.${part.key}`)}</span>
                <span className="meter">
                  <span style={{ width: `${Math.min(100, (part.points / Math.max(1, legacy.score)) * 100)}%` }} />
                </span>
                <strong className="small">{part.points}</strong>
              </div>
            ))}
          </div>
        </section>
        <p className="faint small" style={{ textAlign: 'center' }}>
          {t('careerEnd.footer')}
        </p>
      </div>
    </div>
  );
}
