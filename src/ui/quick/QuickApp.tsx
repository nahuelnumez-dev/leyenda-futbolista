/**
 * Modo rápido: interfaz mínima. Una pantalla para crear al jugador y otra con la carrera:
 * botón de siguiente temporada, lista de temporadas y la ficha de la temporada elegida.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { t, tDynamic } from '@/i18n';
import { WORLD, ENGINE_CONTENT } from '@/data';
import { POSITIONS, type Position } from '@/engine/types/attributes';
import type { GameState } from '@/engine/types/game';
import type { QuickSeason } from '@/engine/quick/quick';
import { overallFor } from '@/engine/player/overall';
import { ageInSeason, formatSeason } from '@/engine/world/newGame';
import { careerCard, legacyScore } from '@/engine/legacy/legacy';
import { useQuick } from '@/store/quickStore';
import { Crest } from '../components/Crest';
import { awardName, competitionName, nationalTeamName, trophyIcon } from '../competitionNames';

const money = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 });
const RANDOM = '';

function seasonLabel(season: number, clubId?: string): string {
  const country = clubId ? WORLD.clubById.get(clubId)?.country : undefined;
  return formatSeason(season, WORLD.leagues.find((l) => l.country === country)?.calendar ?? 'europeo');
}

function ClubCrest({ id, size = 28 }: { id: string; size?: number }) {
  const c = WORLD.clubById.get(id);
  if (!c) return null;
  return <Crest name={c.name} shortName={c.shortName} abbr={c.abbr} colors={c.colors} {...(c.crest ? { crest: c.crest } : {})} size={size} />;
}

const clubName = (id: string) => WORLD.clubById.get(id)?.shortName ?? id;
const fmtRating = (r: number) => (r ? r.toFixed(2) : '–');

/* ───────────────────────── Inicio ───────────────────────── */

const COUNTRIES = [...new Set(WORLD.leagues.map((l) => l.country))]
  .map((id) => ({ id, name: WORLD.countryById.get(id)?.name.es ?? id }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'));

function clubsOf(country: string) {
  return [...WORLD.clubById.values()].filter((c) => c.country === country && !c.parentClubId).sort((a, b) => b.prestige - a.prestige);
}

function StartScreen() {
  const { start, resume, hasSave, hall } = useQuick();
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('DC');
  const [country, setCountry] = useState('ESP');
  const [clubId, setClubId] = useState(RANDOM);
  const clubs = useMemo(() => clubsOf(country), [country]);
  const canResume = useMemo(() => hasSave(), [hasSave]);

  const begin = () => {
    const pool = clubs.slice(0, Math.max(8, Math.ceil(clubs.length / 2)));
    const chosen = clubId || pool[Math.floor(Math.random() * pool.length)]!.id;
    start({ name: name.trim() || 'Jugador', position, clubId: chosen });
  };

  return (
    <div className="q-wrap q-start">
      <header className="q-brand">
        <h1>Leyenda <span>Rápida</span></h1>
        <p>Una carrera entera en un par de minutos. Sin decisiones: tú pulsas y ves cómo pasan las temporadas.</p>
      </header>

      {canResume && (
        <button className="q-btn q-btn-ghost q-full" onClick={() => resume()}>
          Continuar la carrera guardada
        </button>
      )}

      <section className="q-card q-form">
        <label className="q-field">
          <span>Nombre</span>
          <input value={name} maxLength={28} placeholder="Tu jugador" onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="q-field">
          <span>Posición</span>
          <div className="q-chips" role="radiogroup" aria-label="Posición">
            {POSITIONS.map((p) => (
              <button key={p} role="radio" aria-checked={p === position} title={tDynamic(`pos.${p}`)} className={p === position ? 'is-on' : ''} onClick={() => setPosition(p)}>
                {p}
              </button>
            ))}
          </div>
          <small>{tDynamic(`pos.${position}`)}</small>
        </div>
        <label className="q-field">
          <span>País</span>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setClubId(RANDOM); }}>
            {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="q-field">
          <span>Cantera</span>
          <select value={clubId} onChange={(e) => setClubId(e.target.value)}>
            <option value={RANDOM}>Al azar</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </select>
        </label>
        <button className="q-btn q-btn-primary q-full" onClick={begin}>Empezar carrera</button>
      </section>

      {hall.length > 0 && (
        <section className="q-card">
          <h2 className="q-h2">Carreras anteriores</h2>
          <ol className="q-hall">
            {[...hall].sort((a, b) => b.legacyScore - a.legacyScore).slice(0, 6).map((h) => (
              <li key={h.gameId + h.finishedAt}>
                <span className="q-hall-name">{h.name} <small>{h.position}</small></span>
                <span className="q-muted">{h.seasons} temp. · {h.goals} goles · {h.trophies} títulos</span>
                <strong>{tDynamic(`careerEnd.rank.${h.legacy}`)}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/* ───────────────────────── Carrera ───────────────────────── */

function Totals({ game }: { game: GameState }) {
  const log = game.quickLog ?? [];
  const items: [string, string | number][] = [
    ['Temporadas', log.length],
    ['Partidos', log.reduce((s, x) => s + x.apps, 0)],
    game.player.positions.main === 'POR' ? ['Porterías a 0', log.reduce((s, x) => s + x.cleanSheets, 0)] : ['Goles', log.reduce((s, x) => s + x.goals, 0)],
    ['Asistencias', log.reduce((s, x) => s + x.assists, 0)],
    ['Títulos', game.career.trophies.length],
    ['Internacional', game.career.nationalTeam.caps],
  ];
  return (
    <dl className="q-totals">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SeasonRow({ s, gk, selected, onSelect }: { s: QuickSeason; gk: boolean; selected: boolean; onSelect: () => void }) {
  const delta = s.overallEnd - s.overallStart;
  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0, backgroundColor: 'rgba(245,197,66,0.25)' }}
      animate={{ opacity: 1, backgroundColor: 'rgba(0,0,0,0)' }}
      transition={{ duration: 0.6 }}
      className={selected ? 'is-sel' : ''}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      aria-selected={selected}
    >
      <td className="q-season">{seasonLabel(s.season, s.clubId)}</td>
      <td className="q-club">
        <ClubCrest id={s.clubId} size={20} />
        <span>{clubName(s.clubId)}{s.onLoan ? ' (c)' : s.role === 'cantera' ? ' (cant.)' : ''}</span>
      </td>
      <td className="q-num q-hide-sm">{s.age}</td>
      <td className="q-num">
        {s.overallEnd}
        {delta !== 0 && <small className={delta > 0 ? 'q-up' : 'q-down'}>{delta > 0 ? `+${delta}` : delta}</small>}
      </td>
      <td className="q-num">{s.apps}</td>
      <td className="q-num">{gk ? s.cleanSheets : s.goals}</td>
      <td className="q-num q-hide-sm">{s.assists}</td>
      <td className="q-num q-hide-sm">{fmtRating(s.rating)}</td>
      <td className="q-num">{s.position ? `${s.position}º` : '–'}</td>
      <td className="q-trophies">{s.trophies.map((id, i) => <span key={i} title={competitionName(id)}>{trophyIcon(id)}</span>)}</td>
    </motion.tr>
  );
}

function LeagueTable({ s }: { s: QuickSeason }) {
  const [all, setAll] = useState(false);
  if (!s.table.length) return null;
  const idx = s.table.findIndex((r) => r.clubId === s.clubId);
  const rows = all ? s.table.map((r, i) => [r, i] as const) : s.table.map((r, i) => [r, i] as const).filter(([, i]) => i < 3 || Math.abs(i - idx) <= 2 || i >= s.table.length - 2);
  return (
    <div className="q-block">
      <h3 className="q-h3">{s.divisionId ? competitionName(s.divisionId) : 'Liga'}</h3>
      <table className="q-league">
        <thead>
          <tr><th>#</th><th className="q-left">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th className="q-hide-sm">GF:GC</th><th>Pts</th></tr>
        </thead>
        <tbody>
          {rows.map(([r, i], k) => (
            <tr key={r.clubId} className={`${r.clubId === s.clubId ? 'is-me' : ''}${k > 0 && rows[k - 1]![1] !== i - 1 ? ' q-gap' : ''}`}>
              <td>{i + 1}</td>
              <td className="q-left q-club"><ClubCrest id={r.clubId} size={16} /><span>{clubName(r.clubId)}</span></td>
              <td>{r.played}</td><td>{r.won}</td><td>{r.drawn}</td><td>{r.lost}</td>
              <td className="q-hide-sm">{r.goalsFor}:{r.goalsAgainst}</td>
              <td><strong>{r.points}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
      {s.table.length > rows.length || all ? (
        <button className="q-link" onClick={() => setAll((v) => !v)}>{all ? 'Ver resumen' : `Ver la tabla completa (${s.table.length})`}</button>
      ) : null}
    </div>
  );
}

function SeasonDetail({ s, gk }: { s: QuickSeason; gk: boolean }) {
  const club = WORLD.clubById.get(s.clubId);
  const me = s.table.find((r) => r.clubId === s.clubId);
  const badges: string[] = [];
  if (s.champion) badges.push('🏆 Campeón de liga');
  if (s.promoted) badges.push('⬆️ Ascenso');
  if (s.relegated) badges.push('⬇️ Descenso');
  if (s.cupRound) badges.push(s.cupRound === 'Campeón' ? '🥇 Campeón de copa' : `Copa: ${s.cupRound}`);
  if (s.continental) badges.push(`${competitionName(s.continental.competitionId)}: ${s.continental.round}`);
  const tiles: [string, string | number][] = [
    ['Partidos', s.apps],
    gk ? ['Porterías a 0', s.cleanSheets] : ['Goles', s.goals],
    ['Asistencias', s.assists],
    ['Nota', fmtRating(s.rating)],
    ['Media', `${s.overallStart} → ${s.overallEnd}`],
    ['Valor', `${money.format(s.marketValue)} €`],
  ];
  return (
    <motion.section key={s.season} className="q-card q-detail" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <header className="q-detail-head">
        <ClubCrest id={s.clubId} size={52} />
        <div>
          <p className="q-kicker">Temporada {seasonLabel(s.season, s.clubId)} · {s.age} años</p>
          <h2>{club?.name ?? s.clubId}{s.onLoan ? ' (cedido)' : s.role === 'cantera' ? ' (cantera)' : ''}</h2>
          <p className="q-muted">
            {tDynamic(`hub.roles.${s.role}`)} · dorsal {s.shirtNumber} · entrenador: {s.coach}
            {me && <> · {me.won}G {me.drawn}E {me.lost}P · {me.points} pts</>}
          </p>
        </div>
      </header>

      {badges.length > 0 && <ul className="q-badges">{badges.map((b) => <li key={b}>{b}</li>)}</ul>}

      <dl className="q-tiles">
        {tiles.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {s.competitions.length > 1 && (
        <div className="q-block">
          <h3 className="q-h3">Por competición</h3>
          <table className="q-comp">
            <thead><tr><th className="q-left">Competición</th><th>PJ</th><th>{gk ? 'GC' : 'G'}</th><th>A</th><th>Nota</th></tr></thead>
            <tbody>
              {s.competitions.filter((c) => c.apps > 0).map((c) => (
                <tr key={c.competitionId}><td className="q-left">{competitionName(c.competitionId)}</td><td>{c.apps}</td><td>{c.goals}</td><td>{c.assists}</td><td>{fmtRating(c.rating)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeagueTable s={s} />

      {(s.trophies.length > 0 || s.awards.length > 0 || s.national.caps > 0 || s.moves.length > 0) && (
        <div className="q-block q-notes">
          {s.trophies.map((id, i) => <p key={`t${i}`}>{trophyIcon(id)} {competitionName(id)}</p>)}
          {s.awards.map((a, i) => <p key={`a${i}`}>{a.rank === 1 ? '🏅' : `${a.rank}º`} {awardName(a.awardId, a.scope)}</p>)}
          {s.national.caps > 0 && (
            <p>🌍 Selección: {s.national.caps} partidos, {s.national.goals} goles{s.national.tournament ? ` · ${competitionName(s.national.tournament.competitionId)}: ${s.national.tournament.result}` : ''}</p>
          )}
          {s.moves.map((m, i) => (
            <p key={`m${i}`}>✈️ {m.kind === 'loan' ? 'Cedido al' : 'Fichado por el'} {clubName(m.clubId)}{m.fee ? ` por ${money.format(m.fee)} €` : ''}</p>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function CareerScreen({ game }: { game: GameState }) {
  const { next, runToEnd, stop, running, abandon } = useQuick();
  const log = game.quickLog ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const gk = game.player.positions.main === 'POR';
  const p = game.player;
  const ovr = overallFor(p.attributes, p.positions.main);
  const age = ageInSeason(p.identity.birthDate, game.calendar.season);
  const clubId = p.contract?.clubId ?? log.at(-1)?.clubId ?? '';
  const current = selected !== null ? log.find((s) => s.season === selected) : log.at(-1);
  const legacy = game.retired ? legacyScore(game, ENGINE_CONTENT) : null;
  const card = game.retired ? careerCard(game, ENGINE_CONTENT) : null;

  // Al jugar una temporada nueva, se muestra esa.
  useEffect(() => setSelected(null), [log.length]);
  // Atajo: Espacio o → juegan la siguiente temporada.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TR' || tag === 'BUTTON') return;
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next]);

  return (
    <div className="q-wrap">
      <header className="q-top">
        <div className="q-player">
          {clubId && <ClubCrest id={clubId} size={44} />}
          <div>
            <h1>{p.identity.name}</h1>
            <p className="q-muted">
              {tDynamic(`pos.${p.positions.main}`)} · {game.retired ? `retirado a los ${card?.retiredAge}` : `${age} años`} · {nationalTeamName(p.nationalTeam.chosen ?? p.identity.nationalities[0])}
              {!game.retired && clubId && <> · {clubName(clubId)}</>}
            </p>
          </div>
        </div>
        <div className="q-ovr" title="Media actual"><span>{ovr}</span><small>MED</small></div>
      </header>

      {game.retired && legacy ? (
        <section className="q-card q-retired">
          <p className="q-kicker">Fin de la carrera</p>
          <h2>{tDynamic(`careerEnd.rank.${legacy.rank}`)}</h2>
          <p className="q-muted">{t('careerEnd.legacy')}: {legacy.score} puntos · pico de media {card?.peakOverall} · {card?.clubs.length} clubes{card?.ballonDors ? ` · ${card.ballonDors} Balón de Oro` : ''}</p>
          <button className="q-btn q-btn-primary" onClick={abandon}>Nueva carrera</button>
        </section>
      ) : (
        <div className="q-actions">
          <button className="q-btn q-btn-primary q-next" onClick={next} disabled={running}>
            {log.length === 0 ? 'Jugar la primera temporada' : 'Siguiente temporada'} <span aria-hidden="true">→</span>
          </button>
          {running ? (
            <button className="q-btn q-btn-ghost" onClick={stop}>Pausa</button>
          ) : (
            <button className="q-btn q-btn-ghost" onClick={runToEnd}>Hasta la retirada ⏩</button>
          )}
        </div>
      )}

      <Totals game={game} />

      {log.length === 0 ? (
        <p className="q-empty">Tienes 15 años y empiezas en la cantera del {clubName(clubId)}. Pulsa el botón para jugar tu primera temporada.</p>
      ) : (
        <div className="q-grid">
          <section className="q-card q-list">
            <table className="q-seasons">
              <thead>
                <tr>
                  <th className="q-left">Temp.</th><th className="q-left">Club</th><th className="q-hide-sm">Edad</th><th>MED</th><th>PJ</th><th>{gk ? 'P0' : 'G'}</th>
                  <th className="q-hide-sm">A</th><th className="q-hide-sm">Nota</th><th>Liga</th><th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {[...log].reverse().map((s) => (
                    <SeasonRow key={s.season} s={s} gk={gk} selected={current?.season === s.season} onSelect={() => setSelected(s.season)} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </section>
          {current && <SeasonDetail s={current} gk={gk} />}
        </div>
      )}

      {!game.retired && (
        <footer className="q-foot">
          <button className="q-link" onClick={() => window.confirm('¿Abandonar esta carrera y empezar otra?') && abandon()}>Abandonar y empezar otra</button>
        </footer>
      )}
    </div>
  );
}

export function QuickApp() {
  const game = useQuick((s) => s.game);
  return game ? <CareerScreen game={game} /> : <StartScreen />;
}
