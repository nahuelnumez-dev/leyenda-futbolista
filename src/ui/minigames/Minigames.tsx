/**
 * Versión alternativa: minijuegos de fútbol que sustituyen a las decisiones.
 * Cada intento es un componente que se monta de nuevo (key = intento) y avisa con `onResult`.
 * Las secuencias salen de una semilla de la situación, así que son reproducibles.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { t, tDynamic } from '@/i18n';
import { Rng } from '@/engine/rng';
import { simulateMinigame, tierFor, type MinigameId, type MinigameSpec } from '@/engine/minigames/minigames';

export const MINIGAME_ICON: Record<MinigameId, string> = {
  penalty: '🥅', save: '🧤', dribble: '⚡', tackle: '🛡️', pass: '🎯', tactics: '📋', keepy: '⚽',
};

type ResultFn = (ok: boolean, label: string) => void;
interface AttemptProps {
  spec: MinigameSpec;
  rng: Rng;
  round: number;
  onResult: ResultFn;
}

/** Reloj de la animación: segundos desde que se montó el intento (se detiene con `running = false`). */
function useClock(running: boolean): number {
  const [time, setTime] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      setTime((now - start.current) / 1000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  return time;
}

/** Teclas del intento (Espacio/Enter, flechas, números). */
function useKeys(handler: (key: string) => void, active: boolean) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if ([' ', 'Enter', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        e.preventDefault();
        ref.current(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

/** Resuelve el intento una sola vez, tras una pequeña pausa para ver la jugada. */
function useFinish(onResult: ResultFn) {
  const done = useRef(false);
  const [shown, setShown] = useState<{ ok: boolean; label: string } | null>(null);
  const finish = useCallback(
    (ok: boolean, label: string, delay = 650) => {
      if (done.current) return;
      done.current = true;
      setShown({ ok, label });
      window.setTimeout(() => onResult(ok, label), delay);
    },
    [onResult],
  );
  return { finish, shown, done: shown !== null };
}

function Flash({ shown }: { shown: { ok: boolean; label: string } | null }) {
  if (!shown) return null;
  return <div className={`mg-flash ${shown.ok ? 'is-ok' : 'is-ko'}`} role="status">{shown.label}</div>;
}

/* ───────────────────────────── Tiro a puerta ───────────────────────────── */

function PenaltyAttempt({ spec, rng, onResult }: AttemptProps) {
  const d = spec.difficulty;
  const params = useRef({
    aimSpeed: 1.6 + d * 2.2,
    keeperSpeed: 1.0 + d * 1.8,
    p1: rng.float(0, Math.PI * 2),
    p2: rng.float(0, Math.PI * 2),
    p3: rng.float(0, Math.PI * 2),
    reach: 0.08 + d * 0.12,
  }).current;
  const { finish, shown, done } = useFinish(onResult);
  const [shot, setShot] = useState<{ x: number; y: number; kx: number; at: number } | null>(null);
  const time = useClock(true);
  const at = shot ? shot.at : time;
  const aimX = 0.5 + 0.56 * Math.sin(params.aimSpeed * at + params.p1);
  const aimY = 0.5 + 0.36 * Math.sin(params.aimSpeed * 1.37 * at + params.p2);
  const keeperX = 0.5 + 0.32 * Math.sin(params.keeperSpeed * at + params.p3);

  const shoot = () => {
    if (shot || done) return;
    setShot({ x: aimX, y: aimY, kx: keeperX, at: time });
    const out = aimX < 0.02 || aimX > 0.98;
    const saved = !out && Math.abs(keeperX - aimX) < params.reach;
    finish(!out && !saved, out ? t('minigames.penalty.out') : saved ? t('minigames.penalty.saved') : t('minigames.penalty.ok'), 900);
  };
  useKeys((k) => (k === ' ' || k === 'Enter') && shoot(), !done);
  useEffect(() => {
    if (!shot && time > 6) shoot();
  });

  // Coordenadas SVG: portería de x 30 a 290, y 30 a 160.
  const gx = (v: number) => 30 + v * 260;
  const gy = (v: number) => 34 + v * 120;
  const flight = shot ? Math.min(1, (time - shot.at) / 0.35) : 0;
  const keeperDive = shot ? shot.kx + Math.sign(shot.x - shot.kx) * Math.min(Math.abs(shot.x - shot.kx), params.reach) * flight : keeperX;
  const ballX = shot ? 160 + (gx(shot.x) - 160) * flight : 160;
  const ballY = shot ? 205 + (gy(shot.y) - 205) * flight : 205;

  return (
    <div className="mg-stage" onPointerDown={shoot} role="button" tabIndex={0} aria-label={t('minigames.penalty.hint')}>
      <svg viewBox="0 0 320 220" className="mg-svg" aria-hidden="true">
        <rect x="0" y="0" width="320" height="220" className="mg-grass" />
        <path d="M0 170 H320" className="mg-line" />
        <path d="M70 170 V200 H250 V170" className="mg-line" fill="none" />
        <g className="mg-net">
          {Array.from({ length: 13 }, (_, i) => <path key={`v${i}`} d={`M${30 + i * 21.6} 30 V160`} />)}
          {Array.from({ length: 6 }, (_, i) => <path key={`h${i}`} d={`M30 ${30 + i * 26} H290`} />)}
        </g>
        <path d="M30 160 V30 H290 V160" className="mg-post" fill="none" />
        {/* Portero */}
        <g transform={`translate(${gx(keeperDive)} 118)`} className="mg-keeper">
          <rect x={-params.reach * 260} y="18" width={params.reach * 520} height="4" rx="2" className="mg-reach" />
          <circle cx="0" cy="-14" r="9" />
          <rect x="-11" y="-5" width="22" height="30" rx="6" />
          <rect x="-26" y="-4" width="15" height="7" rx="3" />
          <rect x="11" y="-4" width="15" height="7" rx="3" />
        </g>
        {/* Mira */}
        {!shot && (
          <g transform={`translate(${gx(aimX)} ${gy(aimY)})`} className={aimX < 0.02 || aimX > 0.98 ? 'mg-aim is-out' : 'mg-aim'}>
            <circle r="11" fill="none" />
            <path d="M-16 0 H-6 M6 0 H16 M0 -16 V-6 M0 6 V16" />
          </g>
        )}
        <circle cx={ballX} cy={ballY} r={9 - flight * 3} className="mg-ball" />
      </svg>
      <Flash shown={shown} />
      {!shot && <p className="mg-tap-hint">{t('minigames.penalty.hint')}</p>}
    </div>
  );
}

/* ───────────────────────────── Parada ───────────────────────────── */

function SaveAttempt({ spec, rng, onResult }: AttemptProps) {
  const d = spec.difficulty;
  const params = useRef({
    target: rng.int(0, 5),
    wait: rng.float(0.5, 1.3),
    hint: 0.85 - d * 0.55,
    window: 0.95 - d * 0.45,
  }).current;
  const { finish, shown, done } = useFinish(onResult);
  const [picked, setPicked] = useState<number | null>(null);
  const time = useClock(!done);
  const hinting = time >= params.wait && time < params.wait + params.hint;
  const open = time >= params.wait;
  const deadline = params.wait + params.hint + params.window;

  const pick = (zone: number) => {
    if (done || !open) return;
    setPicked(zone);
    finish(zone === params.target, zone === params.target ? t('minigames.save.ok') : t('minigames.save.ko'));
  };
  useKeys((k) => {
    const n = Number(k);
    if (n >= 1 && n <= 6) pick(n - 1);
  }, !done);
  useEffect(() => {
    if (!done && time > deadline) finish(false, t('minigames.save.ko'));
  });

  return (
    <div className="mg-stage">
      <div className="mg-goal-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <button
            key={i}
            className={`mg-zone${hinting && i === params.target ? ' is-hint' : ''}${picked === i ? ' is-picked' : ''}${done && i === params.target ? ' is-target' : ''}`}
            onPointerDown={() => pick(i)}
            aria-label={`Zona ${i + 1}`}
          >
            <span className="faint small">{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="mg-shooter" aria-hidden="true">
        <span className={open ? 'mg-shooter-run is-open' : 'mg-shooter-run'}>🏃</span>
        <span className="mg-ball-dot" />
      </div>
      <p className="mg-tap-hint">{open ? t('minigames.save.now') : t('minigames.save.wait')}</p>
      {open && !done && <div className="mg-timer"><span style={{ width: `${Math.max(0, 100 - ((time - params.wait) / (deadline - params.wait)) * 100)}%` }} /></div>}
      <Flash shown={shown} />
    </div>
  );
}

/* ───────────────────────────── Carriles: regate y corte ───────────────────────────── */

function LanesAttempt({ spec, rng, onResult, mode }: AttemptProps & { mode: 'dribble' | 'tackle' }) {
  const d = spec.difficulty;
  const params = useRef(
    mode === 'dribble'
      ? (() => {
          const first = rng.int(0, 2);
          const second = d > 0.45 && rng.chance(d - 0.2) ? (first + rng.int(1, 2)) % 3 : -1;
          return { speed: 0.42 + d * 0.6, blocked: [first, second].filter((x) => x >= 0), from: 0, to: 0, switchAt: 2 };
        })()
      : (() => {
          const from = rng.int(0, 2);
          const to = rng.chance(0.75) ? (from + rng.int(1, 2)) % 3 : from;
          return { speed: 0.38 + d * 0.5, blocked: [] as number[], from, to, switchAt: 0.3 + d * 0.32 + rng.float(0, 0.08) };
        })(),
  ).current;
  const { finish, shown, done } = useFinish(onResult);
  const [lane, setLane] = useState(1);
  const time = useClock(!done);
  const y = -0.1 + time * params.speed; // 0 arriba, 0.82 = fila del jugador
  const PLAYER_Y = 0.82;
  const attackerLane = y < params.switchAt ? params.from : params.to;
  const attackerX = y < params.switchAt ? params.from : params.from + (params.to - params.from) * Math.min(1, (y - params.switchAt) / 0.1);

  const move = (dir: -1 | 1) => !done && setLane((l) => Math.max(0, Math.min(2, l + dir)));
  useKeys((k) => (k === 'ArrowLeft' ? move(-1) : k === 'ArrowRight' ? move(1) : undefined), !done);
  useEffect(() => {
    if (done || y < PLAYER_Y) return;
    if (mode === 'dribble') {
      const hit = params.blocked.includes(lane);
      finish(!hit, hit ? t('minigames.dribble.ko') : t('minigames.dribble.ok'));
    } else {
      const ok = lane === attackerLane;
      finish(ok, ok ? t('minigames.tackle.ok') : t('minigames.tackle.ko'));
    }
  });

  const laneX = (l: number) => `${(l + 0.5) * 33.333}%`;
  return (
    <div className="mg-stage mg-lanes">
      <div className="mg-lane-bg" aria-hidden="true">
        <span /><span /><span />
      </div>
      {mode === 'dribble'
        ? params.blocked.map((l) => (
            <span key={l} className="mg-token mg-defender" style={{ left: laneX(l), top: `${y * 100}%` }} aria-hidden="true">🛡️</span>
          ))
        : (
            <span className="mg-token mg-attacker" style={{ left: laneX(attackerX), top: `${Math.min(y, PLAYER_Y) * 100}%` }} aria-hidden="true">
              🏃<span className="mg-ball-dot" />
            </span>
          )}
      <span className={`mg-token mg-me ${mode === 'dribble' ? 'has-ball' : ''}`} style={{ left: laneX(lane), top: `${PLAYER_Y * 100}%` }} aria-label="Tú">
        {mode === 'dribble' ? '🏃' : '🧍'}
        {mode === 'dribble' && <span className="mg-ball-dot" />}
      </span>
      <button className="mg-side mg-side-left" onPointerDown={() => move(-1)} aria-label="Izquierda">◀</button>
      <button className="mg-side mg-side-right" onPointerDown={() => move(1)} aria-label="Derecha">▶</button>
      <Flash shown={shown} />
    </div>
  );
}

/* ───────────────────────────── Pase al hueco ───────────────────────────── */

function PassAttempt({ spec, rng, round, onResult }: AttemptProps) {
  const d = spec.difficulty;
  const params = useRef({
    speed: 0.55 + d * 0.8 + round * 0.06,
    width: Math.max(0.06, 0.24 - d * 0.15 - round * 0.012),
    center: rng.float(0.2, 0.8),
    phase: rng.float(0, 1),
  }).current;
  const { finish, shown, done } = useFinish(onResult);
  const [stop, setStop] = useState<number | null>(null);
  const time = useClock(!done);
  const tri = (v: number) => 1 - Math.abs(((v % 2) + 2) % 2 - 1);
  const needle = stop ?? tri(params.phase + time * params.speed);
  const lo = params.center - params.width / 2;
  const hi = params.center + params.width / 2;

  const pass = () => {
    if (done) return;
    setStop(needle);
    const ok = needle >= lo && needle <= hi;
    finish(ok, ok ? t('minigames.pass.ok') : t('minigames.pass.ko'));
  };
  useKeys((k) => (k === ' ' || k === 'Enter') && pass(), !done);
  useEffect(() => {
    if (!done && time > 7) finish(false, t('minigames.pass.ko'));
  });

  return (
    <div className="mg-stage mg-pass" onPointerDown={pass} role="button" tabIndex={0} aria-label={t('minigames.pass.hint')}>
      <div className="mg-pass-pitch" aria-hidden="true">
        <span className="mg-token" style={{ left: '12%', top: '60%' }}>🏃<span className="mg-ball-dot" /></span>
        <span className="mg-token" style={{ left: `${12 + params.center * 76}%`, top: '24%' }}>🙋</span>
        <span className="mg-token mg-rival" style={{ left: `${12 + Math.max(0, lo - 0.12) * 76}%`, top: '40%' }}>🛡️</span>
        <span className="mg-token mg-rival" style={{ left: `${12 + Math.min(1, hi + 0.12) * 76}%`, top: '40%' }}>🛡️</span>
      </div>
      <div className="mg-bar">
        <span className="mg-bar-zone" style={{ left: `${lo * 100}%`, width: `${params.width * 100}%` }} />
        <span className="mg-bar-needle" style={{ left: `${needle * 100}%` }} />
      </div>
      <p className="mg-tap-hint">{t('minigames.pass.hint')}</p>
      <Flash shown={shown} />
    </div>
  );
}

/* ───────────────────────────── Pizarra táctica ───────────────────────────── */

function TacticsAttempt({ spec, rng, round, onResult }: AttemptProps) {
  const d = spec.difficulty;
  const params = useRef(
    (() => {
      const length = 3 + round + (d > 0.6 ? 1 : 0);
      const seq: number[] = [];
      while (seq.length < length) {
        const n = rng.int(0, 8);
        if (n !== seq.at(-1)) seq.push(n);
      }
      return { seq, show: 0.7 - d * 0.32, gap: 0.16 };
    })(),
  ).current;
  const { finish, shown, done } = useFinish(onResult);
  const [input, setInput] = useState<number[]>([]);
  const [flashCell, setFlashCell] = useState<number | null>(null);
  const time = useClock(!done);
  const step = params.show + params.gap;
  const lead = 0.6;
  const watching = time < lead + params.seq.length * step;
  const idx = Math.floor((time - lead) / step);
  const lit = watching && time >= lead && (time - lead) % step < params.show ? params.seq[idx] : undefined;

  const tap = (cell: number) => {
    if (done || watching) return;
    setFlashCell(cell);
    window.setTimeout(() => setFlashCell((c) => (c === cell ? null : c)), 180);
    const next = [...input, cell];
    setInput(next);
    if (params.seq[next.length - 1] !== cell) finish(false, t('minigames.tactics.ko'), 800);
    else if (next.length === params.seq.length) finish(true, t('minigames.tactics.ok'));
  };
  useKeys((k) => {
    const n = Number(k);
    if (n >= 1 && n <= 9) tap(n - 1);
  }, !done);

  return (
    <div className="mg-stage mg-tactics">
      <div className="mg-board">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            className={`mg-cell${lit === i ? ' is-lit' : ''}${flashCell === i ? ' is-tap' : ''}`}
            onPointerDown={() => tap(i)}
            disabled={watching}
            aria-label={`Zona ${i + 1}`}
          />
        ))}
      </div>
      <p className="mg-tap-hint">
        {watching ? t('minigames.tactics.watch') : `${t('minigames.tactics.repeat')} ${input.length}/${params.seq.length}`}
      </p>
      <Flash shown={shown} />
    </div>
  );
}

/* ───────────────────────────── Toques ───────────────────────────── */

function KeepyAttempt({ spec, rng, onResult }: AttemptProps) {
  const d = spec.difficulty;
  const params = useRef({
    gravity: 0.9 + d * 1.2,
    start: rng.float(0.85, 1),
    delay: rng.float(0.15, 0.55),
    zone: Math.max(0.12, 0.32 - d * 0.14),
    drift: rng.float(-0.12, 0.12),
  }).current;
  const { finish, shown, done } = useFinish(onResult);
  const [frozen, setFrozen] = useState<number | null>(null);
  const time = useClock(!done);
  const fall = Math.max(0, time - params.delay);
  const live = Math.max(0, params.start - 0.5 * params.gravity * fall * fall);
  const h = frozen ?? live;

  const touch = () => {
    if (done) return;
    setFrozen(live);
    if (live > params.zone) finish(false, t('minigames.keepy.early'), 550);
    else finish(true, t('minigames.keepy.ok'), 450);
  };
  useKeys((k) => (k === ' ' || k === 'Enter') && touch(), !done);
  useEffect(() => {
    if (!done && live <= 0) {
      setFrozen(0);
      finish(false, t('minigames.keepy.late'), 550);
    }
  });

  return (
    <div className="mg-stage mg-keepy" onPointerDown={touch} role="button" tabIndex={0} aria-label={t('minigames.keepy.hint')}>
      <div className="mg-keepy-zone" style={{ height: `${params.zone * 80}%` }} aria-hidden="true" />
      <span className="mg-keepy-ball" style={{ bottom: `${8 + h * 80}%`, left: `${50 + params.drift * (1 - h) * 40}%` }} aria-hidden="true">⚽</span>
      <span className="mg-keepy-foot" aria-hidden="true">🦶</span>
      <p className="mg-tap-hint">{t('minigames.keepy.hint')}</p>
      <Flash shown={shown} />
    </div>
  );
}

/* ───────────────────────────── Contenedor ───────────────────────────── */

function Attempt(props: AttemptProps): ReactNode {
  switch (props.spec.id) {
    case 'penalty': return <PenaltyAttempt {...props} />;
    case 'save': return <SaveAttempt {...props} />;
    case 'dribble': return <LanesAttempt {...props} mode="dribble" />;
    case 'tackle': return <LanesAttempt {...props} mode="tackle" />;
    case 'pass': return <PassAttempt {...props} />;
    case 'tactics': return <TacticsAttempt {...props} />;
    case 'keepy': return <KeepyAttempt {...props} />;
  }
}

function difficultyLabel(d: number): string {
  return tDynamic(`minigames.level.${d < 0.35 ? 'easy' : d < 0.6 ? 'normal' : d < 0.8 ? 'hard' : 'extreme'}`);
}

export function Pips({ results, rounds, needed }: { results: boolean[]; rounds: number; needed: number }) {
  return (
    <ol className="mg-pips" aria-label={t('minigames.score', { ok: results.filter(Boolean).length, total: rounds })}>
      {Array.from({ length: rounds }, (_, i) => (
        <li key={i} className={i < results.length ? (results[i] ? 'is-ok' : 'is-ko') : i < needed ? 'is-need' : ''}>
          {i < results.length ? (results[i] ? '✓' : '✗') : ''}
        </li>
      ))}
    </ol>
  );
}

/**
 * Minijuego completo: presentación, intentos y resumen. Al terminar llama a `onDone` con los aciertos.
 */
export function MinigamePlayer({ spec, stakes, onDone }: { spec: MinigameSpec; stakes: string; onDone: (successes: number) => void }) {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [results, setResults] = useState<boolean[]>([]);
  const ok = results.filter(Boolean).length;

  const onResult = useCallback(
    (success: boolean) => {
      setResults((r) => {
        const next = [...r, success];
        if (next.length >= spec.rounds) setPhase('done');
        return next;
      });
    },
    [spec.rounds],
  );

  const simulate = () => {
    const { successes } = simulateMinigame(spec, Rng.fromSeed(`${spec.seed}:auto`), 0.45);
    setResults(Array.from({ length: spec.rounds }, (_, i) => i < successes));
    setPhase('done');
  };

  const name = tDynamic(`minigames.${spec.id}.name`);
  const tier = tierFor(spec, ok);

  return (
    <div className={`mg mg-game-${spec.id}`}>
      <div className="mg-head">
        <span className="mg-icon" aria-hidden="true">{MINIGAME_ICON[spec.id]}</span>
        <div>
          <strong className="mg-name">{name}</strong>
          <span className="faint small">
            {t('minigames.difficulty')}: {difficultyLabel(spec.difficulty)} · {t('minigames.goal', { needed: spec.needed, total: spec.rounds })}
          </span>
        </div>
      </div>

      {phase === 'intro' && (
        <>
          <p className="mg-how">{tDynamic(`minigames.${spec.id}.how`)}</p>
          <p className="faint small">{stakes}</p>
          <div className="modal-actions">
            <button className="btn btn-ghost small" onClick={simulate} title={t('minigames.autoHint')}>
              {t('minigames.auto')}
            </button>
            <button className="btn btn-primary" autoFocus onClick={() => setPhase('playing')}>
              {t('minigames.start')}
            </button>
          </div>
        </>
      )}

      {phase === 'playing' && results.length < spec.rounds && (
        <>
          <div className="mg-status">
            <span className="small">{t('minigames.attempt', { n: results.length + 1, total: spec.rounds })}</span>
            <Pips results={results} rounds={spec.rounds} needed={spec.needed} />
          </div>
          <Attempt key={results.length} spec={spec} rng={Rng.fromSeed(`${spec.seed}:${results.length}`)} round={results.length} onResult={onResult} />
        </>
      )}

      {phase === 'done' && (
        <div className="mg-done">
          <Pips results={results} rounds={spec.rounds} needed={spec.needed} />
          <p className={`mg-verdict ${ok >= spec.needed ? 'trial-ok' : 'trial-ko'}`}>
            {tDynamic(`minigames.tier.${tier}`)} · {t('minigames.score', { ok, total: spec.rounds })}
          </p>
          <div className="modal-actions">
            <button className="btn btn-primary" autoFocus onClick={() => onDone(ok)}>
              {t('minigames.resolve')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
