/**
 * Escenas de las cinemáticas. Cada una dibuja un SVG 800×450 a partir del reloj `t` (segundos):
 * el gol se ve desde el disparo hasta la celebración, el título con la copa levantada, el premio en la gala, etc.
 */
import type { ReactElement, ReactNode } from 'react';
import type { Club, ClubColors } from '@/engine/types/club';
import type { CinematicData, CinematicType } from '@/engine/cinematics/cinematics';
import type { CelebrationDef } from '@/data/celebrations';
import { ACHIEVEMENTS } from '@/data/achievements';
import { HIP_HEIGHT, STAND, easeIn, easeInOut, easeOut, easeOutBack, handPosition, footPosition, kf, lerp, poseAt, runPose, seg, walkPose, type Pose } from './anim';
import { Figure, GroundShadow, darken, npcLook, type FigureLook } from './Figure';
import { Ball, Confetti, CrestMark, CrowdPulse, Fireworks, Flashes, Goal, Pitch, Rain, Sparkles, Spotlight, Stadium, Trophy, WavingFlag, fadeIn, nationalKit, trophyFor } from './decor';

export interface SceneProps {
  t: number;
  data: CinematicData;
  look: FigureLook;
  kit: ClubColors;
  club?: Club;
  celebration: CelebrationDef;
  shirtNumber: number;
  playerName: string;
}

export interface SceneDef {
  /** Duración total en segundos. */
  duration: number;
  /** Momento en que aparece el texto. */
  textAt: number;
  /** Fotograma que se muestra con «reducir movimiento». */
  still: number;
  /** Dónde va el texto: arriba (la acción está en el césped) o abajo (algo se levanta por encima de la cabeza). */
  textPos?: 'top' | 'bottom';
  render: (p: SceneProps) => ReactElement;
}

const hipY = (ground: number, scale = 1) => ground - HIP_HEIGHT * scale;
const teamColors = (kit: ClubColors) => [kit.primary, kit.secondary, kit.primary];

/** Cámara: centra `cx, cy` y aplica zoom `z`, con temblor opcional. */
function Camera({ cx, cy = 250, z = 1, shake = 0, t, children }: { cx: number; cy?: number; z?: number; shake?: number; t: number; children: ReactNode }) {
  const sx = shake ? Math.sin(t * 90) * shake : 0;
  const sy = shake ? Math.cos(t * 77) * shake : 0;
  return <g transform={`translate(${400 + sx} ${225 + sy}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;
}

/* ── Gol ───────────────────────────────────────────────── */

const SHOT = 1.95;
const IMPACT = 2.75;
const GROUND = 405;
const HERO_S = 1.1;

/** Poses de celebración según la elegida por el jugador (desde que empieza a celebrar). */
function celebrationPose(id: string, motion: CelebrationDef['motion'], e: number, x0: number): Pose {
  const base: Pose = { ...STAND, x: x0, y: hipY(GROUND, HERO_S) };
  const bob = Math.sin(e * 6);
  switch (id) {
    case 'rodillas': {
      if (e < 0.6) return { ...base, ...runPose(e * 13), x: x0 + e * 130, y: base.y + (runPose(e * 13).y ?? 0) };
      const slide = seg(e, 0.6, 1.5, easeOut);
      return { ...base, x: x0 + 78 + slide * 120, y: base.y + 37 * HERO_S * Math.min(1, (e - 0.6) * 5), lean: -26, head: -28, lF: 2, kF: 92, lB: -2, kB: 92, aF: 150 + bob * 6, eF: 8, aB: 140 - bob * 6, eB: 8 };
    }
    case 'voltereta': {
      if (e < 0.7) return { ...base, ...runPose(e * 13), x: x0 + e * 120, y: base.y + (runPose(e * 13).y ?? 0) };
      const k = ((e - 0.7) % 2.2) / 0.9;
      const xx = x0 + 84;
      if (k > 1) return { ...base, x: xx, aF: 170, eF: 6, aB: 160, eB: 6, head: -12 };
      return { ...base, x: xx, y: base.y - Math.sin(Math.PI * k) * 80, rot: -360 * easeInOut(k), lF: 70 * Math.sin(Math.PI * k), kF: 100 * Math.sin(Math.PI * k), lB: 70 * Math.sin(Math.PI * k), kB: 100 * Math.sin(Math.PI * k), aF: 120, aB: 120 };
    }
    case 'avion': {
      return { ...base, ...runPose(e * 11, 0.8), x: x0 + Math.min(e, 3) * 70, y: base.y + (runPose(e * 11, 0.8).y ?? 0), rot: Math.sin(e * 3) * 12, aF: 88, eF: 2, aB: -88, eB: 2, lean: 14 };
    }
    case 'corazon':
      return { ...base, x: x0 + 20, aF: 118, eF: 72, aB: 112, eB: 72, head: -6, y: base.y - Math.abs(bob) * 3 };
    case 'silencio':
      return { ...base, x: x0 + 20, aF: 132, eF: 152, aB: -10, eB: 20, head: -4, lean: -2 };
    case 'escudo':
      return { ...base, x: x0 + 20, aF: 110, eF: 140, aB: 10, eB: 30, head: 16, lean: 6 };
    case 'chupete':
      return { ...base, x: x0 + 20, aF: 138, eF: 156, aB: 25, eB: 40, rot: Math.sin(e * 4) * 5 };
    case 'cielo':
      return { ...base, x: x0 + 20, aF: 165, eF: 2, aB: 160, eB: 2, head: -30, lean: -8, y: base.y - Math.max(0, Math.sin(e * 2.5)) * 6 };
    case 'baile':
      return { ...base, x: x0 + 30 + Math.sin(e * 6) * 10, lF: 20 * Math.sin(e * 6), kF: 30 * Math.max(0, Math.sin(e * 6)), lB: -20 * Math.sin(e * 6), kB: 30 * Math.max(0, -Math.sin(e * 6)), aF: 90 + 70 * Math.sin(e * 6), eF: 60, aB: 90 - 70 * Math.sin(e * 6), eB: 60, rot: Math.sin(e * 6) * 6, y: base.y - Math.abs(Math.sin(e * 12)) * 5 };
    default: {
      // Puño al aire: saltos con el puño arriba.
      if (motion === 'quieto') return { ...base, x: x0 + 20, aF: 120, eF: 70, aB: 112, eB: 70 };
      const k = (e % 1.1) / 1.1;
      const air = Math.max(0, Math.sin(Math.PI * Math.min(1, k / 0.6)));
      return { ...base, x: x0 + 20, y: base.y - air * 48, aF: 172, eF: 4, aB: 30 + air * 30, eB: 40, lF: 30 * air, kF: 60 * air, lB: -10 * air, kB: 70 * air, head: -10 };
    }
  }
}

function GoalScene({ t, kit, look, celebration, club }: SceneProps): ReactElement {
  const s = HERO_S;
  const hy = hipY(GROUND, s);
  // Carrera, preparación, golpeo y caída.
  let hero: Pose;
  const runEnd = 1.55;
  const xRunEnd = 300;
  if (t < runEnd) {
    const r = runPose(t * 11);
    hero = { ...STAND, ...r, x: lerp(70, xRunEnd, t / runEnd), y: hy + (r.y ?? 0) };
  } else if (t < 2.95) {
    hero = poseAt(t, [
      [runEnd, { x: xRunEnd, y: hy, lean: 12, lF: -20, kF: 40, lB: 30, kB: 20, aF: 30, eF: 60, aB: -30, eB: 60 }],
      [1.82, { x: xRunEnd + 18, y: hy + 3, lean: -6, lF: -58, kF: 100, lB: 8, kB: 16, aF: 70, eF: 20, aB: -60, eB: 30, head: 8 }],
      [SHOT, { x: xRunEnd + 24, y: hy + 1, lean: 2, lF: 78, kF: 6, lB: 6, kB: 14, aF: -30, eF: 20, aB: 70, eB: 20, head: 10 }],
      [2.3, { x: xRunEnd + 34, y: hy - 4, lean: -4, lF: 100, kF: 18, lB: 0, kB: 10, aF: -40, eF: 30, aB: 80, eB: 20, head: -4 }],
      [2.95, { x: xRunEnd + 40, y: hy, lean: 2, head: -6 }],
    ], STAND);
  } else {
    hero = celebrationPose(celebration.id, celebration.motion, t - 2.95, xRunEnd + 40);
  }

  // Balón: conducido, golpeado, en la red.
  const foot = footPosition(hero, s);
  let ball = { x: 0, y: 0, r: 9, spin: 0 };
  const target = { x: 630, y: 250 };
  const start = { x: xRunEnd + 62, y: GROUND - 9 };
  if (t < SHOT) {
    const lead = t < runEnd ? 30 + Math.abs(Math.sin(t * 5.5)) * 12 : lerp(42, 0, seg(t, runEnd, SHOT));
    ball = { x: t < runEnd ? hero.x + lead : lerp(hero.x + 42, start.x, seg(t, runEnd, SHOT)), y: GROUND - 9 - Math.abs(Math.sin(t * 5.5)) * (t < runEnd ? 5 : 0), r: 9, spin: t * 400 };
  } else if (t < IMPACT) {
    const u = seg(t, SHOT, IMPACT);
    const ue = easeOut(u);
    ball = { x: lerp(start.x, target.x, ue), y: lerp(start.y, target.y, ue) - Math.sin(Math.PI * u) * 46, r: lerp(9, 6, u), spin: t * 1600 };
  } else {
    const u = seg(t, IMPACT, IMPACT + 0.5, easeOut);
    ball = { x: target.x - 6 * u, y: target.y + 4 * u + seg(t, IMPACT + 0.5, IMPACT + 1.4, easeIn) * 82, r: 5.5, spin: 0 };
  }
  void foot;

  // Portero: espera y se lanza tarde.
  const kS = 0.78;
  const kHy = hipY(338, kS);
  const keeper = poseAt(t, [
    [0, { x: 690, y: kHy + 6, lean: 14, lF: 22, kF: 38, lB: 18, kB: 38, aF: 40, eF: 40, aB: 36, eB: 40, head: -6 }],
    [2.25, { x: 688, y: kHy + 8, lean: 18, lF: 30, kF: 50, lB: 26, kB: 50, aF: 50, eF: 40, aB: 46, eB: 40, head: -6 }],
    [2.95, { x: 672, y: kHy - 30, rot: 58, lean: 8, lF: -10, kF: 10, lB: 20, kB: 30, aF: 165, eF: 10, aB: 155, eB: 14, head: -10 }],
    [3.4, { x: 650, y: kHy + 22, rot: 88, lean: 0, lF: 10, kF: 30, lB: 30, kB: 40, aF: 160, eF: 10, aB: 150, eB: 10, head: 0 }],
    [8, { x: 650, y: kHy + 22, rot: 88, lean: 0, lF: 10, kF: 30, lB: 30, kB: 40, aF: 150, eF: 30, aB: 140, eB: 30, head: 4 }],
  ]);

  // Compañeros que llegan a celebrar.
  const mates = [0, 1].map((i) => {
    const arrive = 3.6 + i * 0.35;
    const xEnd = hero.x - 70 - i * 46;
    if (t < arrive) return null;
    const e = t - arrive;
    const running = e < 0.9;
    const r = runPose(e * 12);
    const pose: Pose = running
      ? { ...STAND, ...r, x: lerp(-40, xEnd, e / 0.9), y: hy + (r.y ?? 0) }
      : { ...STAND, x: xEnd, y: hy - Math.max(0, Math.sin((e - 0.9) * 6 + i)) * 26, aF: 160, eF: 10, aB: 150, eB: 10, head: -12 };
    return <Figure key={i} pose={pose} look={npcLook(i + 1)} kit={kit} scale={s * 0.96} shade={0.25} />;
  });

  const cx = kf(t, [[0, 260], [1.3, 330], [1.9, 420], [2.5, 560], [3.1, 470], [4, 400]]);
  const z = kf(t, [[0, 1.06], [1.8, 1.14], [2.6, 1.22], [3.3, 1.04], [5, 1.04]]);
  const shake = t > IMPACT && t < IMPACT + 0.35 ? 3 : 0;
  const flash = t > IMPACT ? Math.max(0, 0.55 - (t - IMPACT) * 1.4) : 0;
  const trail = t > SHOT && t < IMPACT;

  return (
    <g>
      <Camera cx={cx} z={z} shake={shake} t={t}>
        <Stadium colors={teamColors(kit)} />
        <CrowdPulse t={t} start={IMPACT} color={kit.primary} />
        <Pitch />
        {/* área */}
        <path d="M520 262 L800 262 M540 262 L470 395 L-100 395" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
        <Goal ripple={t > IMPACT ? seg(t, IMPACT, IMPACT + 1.1) : 0} hit={target} />
        <GroundShadow x={keeper.x} y={338} w={26} />
        <Figure pose={keeper} look={npcLook(3)} kit={kit} outfit="keeper" scale={kS} facing={-1} />
        {trail &&
          [0.06, 0.12, 0.18, 0.24].map((d, i) => {
            const u = seg(t - d, SHOT, IMPACT);
            const ue = easeOut(u);
            return <circle key={i} cx={lerp(start.x, target.x, ue)} cy={lerp(start.y, target.y, ue) - Math.sin(Math.PI * u) * 46} r={lerp(8, 5, u)} fill="#fff" opacity={0.25 - i * 0.05} />;
          })}
        <GroundShadow x={hero.x} y={GROUND} />
        {mates}
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        <Ball x={ball.x} y={ball.y} r={ball.r} spin={ball.spin} />
        <Flashes t={t} start={IMPACT} area={[-200, 70, 1000, 230]} count={22} />
      </Camera>
      <Confetti t={t} start={IMPACT + 0.2} count={50} colors={[kit.primary, kit.secondary, '#ffffff']} />
      {club && t > IMPACT + 0.3 && <g opacity={fadeIn(t, IMPACT + 0.3)}><CrestMark club={club} x={744} y={54} size={60} /></g>}
      <rect x="-50" y="-50" width="900" height="550" fill="#fff" opacity={flash} />
    </g>
  );
}

/* ── Debut ─────────────────────────────────────────────── */

function DebutScene({ t, kit, look, data, club }: SceneProps): ReactElement {
  const national = data.type === 'nationalDebut';
  const s = 1.05;
  const hy = hipY(GROUND, s);
  const stop = 3.0;
  const walkX = (offset: number) => lerp(60 - offset, 420 - offset, seg(t, 0.2, stop, (u) => u));
  const walking = t < stop;
  const mates = [1, 2, 3].map((i) => {
    const x = walkX(i * 78);
    const p: Pose = walking ? { ...STAND, ...walkPose(t * 7 + i), x, y: hy + (walkPose(t * 7 + i).y ?? 0) } : national ? { ...STAND, x, y: hy, aF: 48, eF: 125, head: -6 } : { ...STAND, x, y: hy };
    return <Figure key={i} pose={p} look={npcLook(i)} kit={kit} scale={s * 0.97} shade={0.3 + i * 0.06} />;
  });
  const after = t - stop;
  const hero: Pose = walking
    ? { ...STAND, ...walkPose(t * 7), x: walkX(0), y: hy + (walkPose(t * 7).y ?? 0) }
    : national
      ? { ...STAND, x: walkX(0), y: hy, aF: 48, eF: 125, head: -8 }
      : { ...STAND, x: walkX(0), y: hy, aF: 168 + Math.sin(after * 14) * 6, eF: 30 + Math.sin(after * 14) * 22, aB: 162 - Math.sin(after * 14) * 6, eB: 30 - Math.sin(after * 14) * 22, head: -14 };
  return (
    <g>
      <Camera cx={kf(t, [[0, 260], [3, 360], [6, 380]])} z={kf(t, [[0, 1.0], [3, 1.08], [7, 1.12]])} t={t}>
        <Stadium colors={national ? [kit.primary, kit.secondary] : teamColors(kit)} />
        <Pitch />
        {/* túnel */}
        <path d="M-10 252 L-10 190 Q30 168 70 190 L70 252 Z" fill="#06080b" />
        <ellipse cx="30" cy="235" rx="34" ry="20" fill="#ffe9b0" opacity={0.15 + 0.1 * Math.sin(t * 3)} />
        {national && <WavingFlag t={t} x={180} y={110} w={150} h={70} colors={[kit.primary, kit.secondary]} />}
        {national && <WavingFlag t={t + 1} x={520} y={96} w={140} h={66} colors={[kit.primary, kit.secondary]} />}
        <Spotlight x={hero.x} groundY={GROUND} width={150} opacity={0.7} />
        {mates.reverse()}
        <GroundShadow x={hero.x} y={GROUND} />
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        <Flashes t={t} start={0.5} area={[-200, 70, 1000, 230]} count={26} rate={1.3} />
      </Camera>
      {club && !national && <g opacity={fadeIn(t, 2)}><CrestMark club={club} x={744} y={54} size={60} /></g>}
      <Confetti t={t} start={3.1} count={24} colors={[kit.primary, kit.secondary, '#ffffff']} />
    </g>
  );
}

/* ── Título ────────────────────────────────────────────── */

function TrophyScene({ t, kit, look, data }: SceneProps): ReactElement {
  const s = 1.05;
  const ground = 392;
  const hy = hipY(ground, s);
  const kind = trophyFor(data.competitionId);
  const lift = seg(t, 1.6, 2.4, easeOutBack);
  const pump = t > 2.6 ? Math.sin((t - 2.6) * 5) : 0;
  const hero: Pose =
    t < 1.0
      ? { ...STAND, ...walkPose(t * 7), x: lerp(300, 400, t), y: hy + (walkPose(t * 7).y ?? 0) }
      : t < 1.6
        ? poseAt(t, [[1.0, { x: 400, y: hy }], [1.6, { x: 400, y: hy + 4, lean: 12, aF: 70, eF: 30, aB: 64, eB: 30, head: 10 }]])
        : { ...STAND, x: 400, y: hy - (t > 2.6 ? Math.max(0, pump) * 6 : 0), lean: lerp(12, -6, lift), head: lerp(10, -22, lift), aF: lerp(70, 172 + pump * 4, lift), eF: lerp(30, 8, lift), aB: lerp(64, 166 + pump * 4, lift), eB: lerp(30, 8, lift) };
  const hands = handPosition(hero, 'front', s);
  const hands2 = handPosition(hero, 'back', s);
  const cup = t < 1.6 ? { x: 452, y: ground - 58, s: 0.9 } : { x: (hands.x + hands2.x) / 2, y: (hands.y + hands2.y) / 2 + 4, s: 0.9 };
  const mates = [0, 1, 2, 3].map((i) => {
    const x = 400 + (i < 2 ? -80 - i * 62 : 80 + (i - 2) * 62);
    const jump = t > 2.4 ? Math.max(0, Math.sin((t - 2.4) * 6 + i * 1.3)) * 30 : 0;
    const p: Pose = { ...STAND, x, y: hipY(ground - 12, s * 0.92) - jump, aF: t > 2.4 ? 165 : 20, eF: 10, aB: t > 2.4 ? 155 : -10, eB: 10, head: -10 };
    return <Figure key={i} pose={p} look={npcLook(i)} kit={kit} scale={s * 0.92} facing={i < 2 ? 1 : -1} shade={0.35} />;
  });
  return (
    <g>
      <Camera cx={400} cy={kf(t, [[0, 250], [2.4, 236]])} z={kf(t, [[0, 0.98], [2.4, 1.04], [8, 1.08]])} t={t}>
        <Stadium colors={teamColors(kit)} />
        <Pitch />
        {[160, 400, 640].map((x, i) => <Spotlight key={x} x={x + Math.sin(t * 0.8 + i) * 40} groundY={ground} width={170} opacity={t > 2.2 ? 0.8 : 0.35} />)}
        {/* podio */}
        <path d="M150 392 L650 392 L640 420 L160 420 Z" fill="#11161d" />
        <rect x="150" y="386" width="500" height="8" fill="url(#gold)" />
        <text x="400" y="413" textAnchor="middle" fontSize="16" fontWeight="800" fill="#f5c542" letterSpacing="6" fontFamily="system-ui, sans-serif">
          CAMPEONES
        </text>
        {t < 1.6 && <rect x="434" y={ground - 58} width="36" height="58" fill="#1d232c" />}
        {mates}
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        <Trophy kind={kind} x={cup.x} y={cup.y} s={cup.s * (kind === 'world' ? 1 : 0.95)} />
        {t > 2.4 && <Sparkles t={t} area={[cup.x - 60, cup.y - 120, cup.x + 60, cup.y]} count={14} />}
      </Camera>
      <Fireworks t={t} start={2.3} bursts={7} />
      <Confetti t={t} start={2.35} count={90} colors={['#f5c542', '#ffffff', kit.primary, kit.secondary]} />
    </g>
  );
}

/* ── Ascenso ───────────────────────────────────────────── */

function PromotionScene({ t, kit, look, club }: SceneProps): ReactElement {
  const s = 1.05;
  const hy = hipY(GROUND, s);
  const jump = (ph: number) => Math.max(0, Math.sin(t * 5.5 + ph)) * 34;
  const hero: Pose = { ...STAND, x: 400, y: hy - jump(0), aF: 168, eF: 8, aB: 160, eB: 8, head: -14, lF: jump(0) * 0.6, kF: jump(0) * 1.4, lB: -jump(0) * 0.3, kB: jump(0) * 1.6 };
  const a = handPosition(hero, 'front', s);
  const b = handPosition(hero, 'back', s);
  return (
    <g>
      <Camera cx={400} z={kf(t, [[0, 1.0], [6, 1.1]])} t={t}>
        <Stadium colors={teamColors(kit)} />
        <Pitch />
        {[-1, 1, -2, 2].map((k, i) => (
          <Figure key={k} pose={{ ...STAND, x: 400 + k * 70, y: hipY(GROUND - 8, s * 0.93) - jump(i + 1), aF: 165, eF: 10, aB: 150, eB: 10, head: -12 }} look={npcLook(i)} kit={kit} scale={s * 0.93} facing={k < 0 ? 1 : -1} shade={0.3} />
        ))}
        <GroundShadow x={400} y={GROUND} />
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        {/* bufanda */}
        <path d={`M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 18} ${b.x} ${b.y}`} stroke={kit.primary} strokeWidth="8" fill="none" />
        <path d={`M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 18} ${b.x} ${b.y}`} stroke={kit.secondary} strokeWidth="3" strokeDasharray="6 6" fill="none" />
        <Flashes t={t} area={[-200, 70, 1000, 230]} count={24} />
      </Camera>
      <Confetti t={t} start={0.2} count={80} colors={[kit.primary, kit.secondary, '#ffffff']} />
      {club && <g opacity={fadeIn(t, 0.6)}><CrestMark club={club} x={744} y={54} size={60} /></g>}
    </g>
  );
}

/* ── Premio individual (gala) ──────────────────────────── */

function AwardScene({ t, look, kit, data }: SceneProps): ReactElement {
  const kind = trophyFor(undefined, data.awardId);
  const s = 1.1;
  const ground = 380;
  const hy = hipY(ground, s);
  const handOver = seg(t, 1.9, 2.5, easeInOut);
  const raise = seg(t, 2.7, 3.3, easeOutBack);
  const hero: Pose =
    t < 1.9
      ? { ...STAND, ...walkPose(t * 6.5), x: lerp(150, 410, seg(t, 0, 1.8)), y: hy + (walkPose(t * 6.5).y ?? 0) }
      : t < 2.7
        ? poseAt(t, [[1.9, { x: 410, y: hy }], [2.5, { x: 414, y: hy, aF: 72, eF: 28, aB: 10, eB: 30, head: 4 }]])
        : { ...STAND, x: 414, y: hy, lean: lerp(2, -6, raise), head: lerp(4, -20, raise), aF: lerp(72, 168, raise), eF: lerp(28, 10, raise), aB: lerp(10, 160, raise), eB: lerp(30, 10, raise) };
  const presenter: Pose =
    t < 2.5
      ? poseAt(t, [[0, { x: 520, y: hy, aF: 40, eF: 70 }], [1.9, { x: 520, y: hy, aF: 40, eF: 70 }], [2.5, { x: 506, y: hy, aF: 76, eF: 20, lean: 6 }]])
      : { ...STAND, x: 520, y: hy, aF: 70 + Math.sin(t * 12) * 12, eF: 90, aB: 70 - Math.sin(t * 12) * 12, eB: 90 };
  const pHand = handPosition({ ...presenter }, 'front', s, -1);
  const hHand = handPosition(hero, 'front', s);
  const hBack = handPosition(hero, 'back', s);
  const obj = t < 1.9 ? pHand : t < 2.7 ? { x: lerp(pHand.x, hHand.x, handOver), y: lerp(pHand.y, hHand.y, handOver) } : { x: (hHand.x + hBack.x) / 2, y: (hHand.y + hBack.y) / 2 };
  const objScale = kind === 'goldenBall' ? 0.8 : 0.75;
  return (
    <g>
      <rect x="-300" y="-100" width="1400" height="700" fill="#07040f" />
      <Camera cx={kf(t, [[0, 330], [2.4, 440], [3.4, 420]])} cy={kf(t, [[0, 225], [3.3, 205]])} z={kf(t, [[0, 1.0], [2.6, 1.14], [8, 1.2]])} t={t}>
        {/* pantalla gigante */}
        <rect x="160" y="20" width="480" height="250" rx="6" fill="#120a26" stroke="#2c1c55" strokeWidth="3" />
        <rect x="170" y="30" width="460" height="230" fill="url(#gold)" opacity={0.12 + 0.05 * Math.sin(t * 2)} />
        <Trophy kind={kind} x={400} y={210} s={2.2} />
        {/* telones */}
        {[-1, 1].map((side) => (
          <g key={side}>
            {Array.from({ length: 6 }, (_, i) => (
              <rect key={i} x={side < 0 ? -300 + i * 52 : 820 + i * 52 - 180} y="-60" width="52" height="520" fill={i % 2 ? '#5a0f1c' : '#73162a'} />
            ))}
          </g>
        ))}
        {/* escenario */}
        <rect x="-300" y={ground} width="1400" height="200" fill="#0d0a18" />
        <rect x="-300" y={ground} width="1400" height="3" fill="#3b2a7a" />
        <Spotlight x={hero.x} groundY={ground} width={140} opacity={0.9} from={-80} />
        <Spotlight x={presenter.x} groundY={ground} width={110} opacity={0.45} from={-80} />
        <GroundShadow x={hero.x} y={ground} />
        <Figure pose={presenter} look={npcLook(2)} kit={kit} outfit="suit" scale={s} facing={-1} />
        <Figure pose={hero} look={look} kit={kit} outfit="suit" scale={s} />
        <Trophy kind={kind} x={obj.x} y={obj.y + (kind === 'goldenBall' ? 4 : 2)} s={objScale} />
        {t > 2.7 && <Sparkles t={t} area={[obj.x - 70, obj.y - 120, obj.x + 70, obj.y + 10]} count={18} />}
        {/* público */}
        {Array.from({ length: 24 }, (_, i) => (
          <circle key={i} cx={-120 + i * 46} cy={448 + (i % 2) * 6} r="20" fill="#05030b" />
        ))}
        <Flashes t={t} start={2.6} area={[-150, 420, 950, 450]} count={24} rate={1.6} />
      </Camera>
      <Sparkles t={t} count={30} />
    </g>
  );
}

/* ── Fichaje (presentación) ────────────────────────────── */

function TransferScene({ t, look, kit, club, shirtNumber, playerName, data }: SceneProps): ReactElement {
  const s = 1.15;
  const ground = 430;
  const hy = hipY(ground, s);
  const up = seg(t, 0.8, 1.4, easeOutBack);
  const hero: Pose = { ...STAND, x: 380, y: hy, aF: lerp(20, 92, up), eF: lerp(40, 22, up), aB: lerp(14, 86, up), eB: lerp(40, 22, up), head: lerp(6, -4, up) };
  const h = handPosition(hero, 'front', s);
  const surname = playerName.split(' ').slice(-1)[0]!.toUpperCase();
  return (
    <g>
      <Camera cx={400} z={kf(t, [[0, 1.0], [7, 1.1]])} t={t}>
        {/* photocall */}
        <rect x="-300" y="-100" width="1400" height="700" fill={darken(kit.primary, 0.55)} />
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 9 }, (_, col) => (
            <g key={`${row}-${col}`} opacity="0.55">
              <CrestMark club={club} x={-60 + col * 120 + (row % 2) * 60} y={20 + row * 70} size={42} />
            </g>
          )),
        )}
        <rect x="-300" y="-100" width="1400" height="700" fill="url(#vignette)" />
        {/* jugador con la camiseta */}
        <Figure pose={hero} look={look} kit={kit} outfit="suit" scale={s} />
        <g transform={`translate(${h.x - 6} ${h.y - 8 - (1 - up) * 30})`}>
          <path d="M-44 0 L-24 -12 L24 -12 L44 0 L36 18 L26 12 L26 70 L-26 70 L-26 12 L-36 18 Z" fill={kit.primary} stroke={darken(kit.primary, 0.3)} strokeWidth="1.5" />
          {kit.pattern === 'rayas' && [-16, 0, 16].map((x) => <rect key={x} x={x - 4} y="-10" width="8" height="80" fill={kit.secondary} opacity="0.9" />)}
          <text x="0" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill={kit.secondary} fontFamily="system-ui, sans-serif" letterSpacing="1">
            {surname.slice(0, 12)}
          </text>
          <text x="0" y="56" textAnchor="middle" fontSize="34" fontWeight="800" fill={kit.secondary} stroke={darken(kit.primary, 0.4)} strokeWidth="0.8" fontFamily="system-ui, sans-serif">
            {shirtNumber}
          </text>
        </g>
        {/* mesa */}
        <rect x="160" y="372" width="480" height="80" fill="#14181f" />
        <rect x="160" y="368" width="480" height="6" fill={kit.primary} />
        {[300, 500].map((x) => (
          <g key={x}>
            <rect x={x - 2} y="330" width="4" height="40" fill="#2a2f38" />
            <ellipse cx={x} cy="328" rx="7" ry="9" fill="#111" />
          </g>
        ))}
        {data.type === 'loan' && (
          <g transform="translate(560 120) rotate(-12)" opacity={fadeIn(t, 1.4)}>
            <rect x="-70" y="-22" width="140" height="44" rx="6" fill="none" stroke="#f5c542" strokeWidth="4" />
            <text x="0" y="9" textAnchor="middle" fontSize="24" fontWeight="800" fill="#f5c542" fontFamily="system-ui, sans-serif" letterSpacing="4">
              CEDIDO
            </text>
          </g>
        )}
      </Camera>
      <Flashes t={t} start={0.6} area={[0, 60, 800, 440]} count={40} rate={2.2} />
    </g>
  );
}

/* ── Descenso ──────────────────────────────────────────── */

function RelegationScene({ t, look, kit }: SceneProps): ReactElement {
  const s = 1.1;
  const sitY = GROUND - 30 * s;
  const cover = seg(t, 1.6, 2.4);
  const hero: Pose = { ...STAND, x: 400, y: sitY, lean: lerp(20, 32, cover), head: lerp(20, 34, cover), lF: 82, kF: 96, lB: 74, kB: 100, aF: lerp(64, 128, cover), eF: lerp(40, 132, cover), aB: lerp(58, 120, cover), eB: lerp(40, 130, cover) };
  const mateIn = seg(t, 2.6, 4.2, easeOut);
  const mate: Pose = t < 4.2 ? { ...STAND, ...walkPose(t * 6), x: lerp(700, 470, mateIn), y: hipY(GROUND, s) + (walkPose(t * 6).y ?? 0) } : { ...STAND, x: 470, y: hipY(GROUND, s), lean: 14, aF: 60, eF: 10, head: 18 };
  return (
    <g style={{ filter: 'saturate(0.35) brightness(0.85)' }}>
      <Camera cx={420} z={kf(t, [[0, 1.0], [6, 1.12]])} t={t}>
        <Stadium colors={['#2b3440', '#3a434d']} mood="gloomy" />
        <Pitch mood="gloomy" />
        <GroundShadow x={400} y={GROUND} w={50} />
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        <Figure pose={mate} look={npcLook(2)} kit={kit} scale={s} facing={-1} shade={0.2} />
      </Camera>
      <Rain t={t} />
    </g>
  );
}

/* ── Lesión ────────────────────────────────────────────── */

function InjuryScene({ t, look, kit }: SceneProps): ReactElement {
  const s = 1.1;
  const writhe = Math.sin(t * 5) * 4;
  const hero: Pose = { ...STAND, x: 420, y: GROUND - 14, rot: -84 + writhe, lean: 0, head: -10, lF: 70, kF: 110, lB: 10, kB: 10, aF: 60, eF: 70, aB: 40, eB: 60 };
  const run = seg(t, 0.6, 1.9);
  const physio: Pose = t < 1.9 ? { ...STAND, ...runPose(t * 11, 0.8), x: lerp(820, 500, run), y: hipY(GROUND, s) + (runPose(t * 11, 0.8).y ?? 0) } : { ...STAND, x: 496, y: GROUND - 40 * s, lean: 30, lF: 90, kF: 100, lB: -10, kB: 90, aF: 70, eF: 30, aB: 50, eB: 40, head: 20 };
  const stretcher = seg(t, 3.0, 4.6, easeOut);
  return (
    <g style={{ filter: 'saturate(0.6)' }}>
      <Camera cx={430} z={kf(t, [[0, 1.0], [6, 1.15]])} t={t}>
        <Stadium colors={teamColors(kit)} />
        <Pitch />
        <GroundShadow x={420} y={GROUND} w={70} />
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        <Figure pose={physio} look={npcLook(4)} kit={kit} outfit="staff" scale={s} facing={-1} />
        {t > 1.9 && <rect x="530" y={GROUND - 22} width="26" height="18" rx="3" fill="#c8102e" />}
        {t > 1.9 && <path d={`M${543} ${GROUND - 18} v10 M${538} ${GROUND - 13} h10`} stroke="#fff" strokeWidth="3" />}
        {t > 3 && (
          <g transform={`translate(${lerp(-240, 200, stretcher)} 0)`}>
            {[0, 150].map((dx, i) => (
              <Figure key={i} pose={{ ...STAND, ...walkPose(t * 6 + i), x: dx, y: hipY(GROUND, s) + (walkPose(t * 6 + i).y ?? 0), aF: 30, eF: 20 }} look={npcLook(i + 2)} kit={kit} outfit="staff" scale={s} shade={0.15} />
            ))}
            <rect x="10" y={GROUND - 64} width="132" height="8" rx="3" fill="#e8e8e8" />
          </g>
        )}
      </Camera>
    </g>
  );
}

/* ── Logro ─────────────────────────────────────────────── */

const TIER_COLORS: Record<string, [string, string]> = { bronze: ['#7a4a1c', '#e0a36a'], silver: ['#5c6570', '#f4f7fa'], gold: ['#8a6410', '#ffe9a3'], legend: ['#3b1a7a', '#d6b8ff'] };

function AchievementScene({ t, data }: SceneProps): ReactElement {
  const tier = ACHIEVEMENTS.find((a) => a.id === data.template)?.tier ?? 'gold';
  const [dark, light] = TIER_COLORS[tier] ?? TIER_COLORS.gold!;
  const pop = seg(t, 0.2, 0.9, easeOutBack);
  const shine = ((t - 0.8) % 2.4) / 1.2;
  return (
    <g>
      <defs>
        <radialGradient id="medal-fill" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <clipPath id="medal-clip">
          <circle cx="400" cy="200" r="78" />
        </clipPath>
      </defs>
      <rect x="-50" y="-50" width="900" height="550" fill="#07090f" />
      <g transform={`rotate(${t * 18} 400 200)`} opacity="0.35">
        {Array.from({ length: 18 }, (_, i) => (
          <path key={i} d="M400 200 L388 -200 L412 -200 Z" fill={light} transform={`rotate(${i * 20} 400 200)`} />
        ))}
      </g>
      <g transform={`translate(400 200) scale(${pop}) translate(-400 -200)`}>
        <path d="M360 60 L384 140 L416 140 L440 60 Z" fill="#c8102e" />
        <path d="M384 60 L398 140 L402 140 L416 60 Z" fill="#fff" opacity="0.6" />
        <circle cx="400" cy="200" r="86" fill={dark} />
        <circle cx="400" cy="200" r="78" fill="url(#medal-fill)" />
        <polygon points="400,152 414,186 450,188 422,210 432,246 400,226 368,246 378,210 350,188 386,186" fill={dark} opacity="0.75" />
        <g clipPath="url(#medal-clip)">
          {shine >= 0 && shine <= 1 && <rect x={300 + shine * 220} y="100" width="26" height="220" fill="#fff" opacity="0.45" transform="rotate(20 400 200)" />}
        </g>
      </g>
      <Sparkles t={t} count={34} area={[220, 60, 580, 340]} />
      <Confetti t={t} start={0.5} count={36} colors={[light, '#ffffff', dark]} />
    </g>
  );
}

/* ── Retirada ──────────────────────────────────────────── */

function RetirementScene({ t, look, kit, playerName }: SceneProps): ReactElement {
  const s = 1.05;
  const hy = hipY(GROUND, s);
  let hero: Pose;
  let facing: 1 | -1 = 1;
  if (t < 2.8) hero = { ...STAND, ...walkPose(t * 5), x: lerp(300, 470, t / 2.8), y: hy + (walkPose(t * 5).y ?? 0), head: 4 };
  else if (t < 6.2) {
    facing = -1;
    const w = Math.sin((t - 2.8) * 9);
    hero = { ...STAND, x: 470, y: hy, aF: 168, eF: 24 + w * 22, aB: 10, eB: 20, head: -10 };
  } else hero = { ...STAND, ...walkPose(t * 5), x: lerp(470, 700, seg(t, 6.2, 9)), y: hy + (walkPose(t * 5).y ?? 0) };
  const fade = 1 - seg(t, 7.8, 9);
  return (
    <g>
      <Camera cx={kf(t, [[0, 360], [3, 450], [9, 520]])} z={kf(t, [[0, 1.0], [5, 1.1]])} t={t}>
        <Stadium colors={['#f5e6c8', '#1c232d', teamColors(kit)[0]!]} mood="sunset" />
        {/* luces de móviles */}
        {Array.from({ length: 60 }, (_, i) => {
          const x = -200 + ((i * 97) % 1200);
          const y = 90 + ((i * 53) % 140);
          const k = 0.5 + 0.5 * Math.sin(t * 2 + i);
          return <circle key={i} cx={x} cy={y} r={1.6 + k} fill="#fffbe6" opacity={0.5 + 0.5 * k} />;
        })}
        <text x="400" y="118" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff" opacity="0.9" letterSpacing="4" fontFamily="system-ui, sans-serif">
          GRACIAS {playerName.split(' ').slice(-1)[0]!.toUpperCase()}
        </text>
        <Pitch mood="sunset" />
        <path d="M690 252 L690 196 Q730 176 770 196 L770 252 Z" fill="#06080b" />
        <GroundShadow x={hero.x} y={GROUND} />
        <Figure pose={hero} look={look} kit={kit} scale={s} facing={facing} opacity={fade} />
      </Camera>
      <Confetti t={t} start={2.8} count={40} speed={0.45} colors={['#ffffff', '#f5e6c8', kit.primary]} />
    </g>
  );
}

/* ── Genérica ──────────────────────────────────────────── */

function HeroScene({ t, look, kit, club }: SceneProps): ReactElement {
  const s = 1.2;
  const hero: Pose = { ...STAND, x: 400, y: hipY(GROUND, s), aF: 72, eF: 118, aB: 66, eB: 118, head: -6, lean: -2 };
  const sweep = ((t * 0.6) % 1.4) - 0.2;
  return (
    <g>
      <Camera cx={400} z={kf(t, [[0, 1.0], [6, 1.1]])} t={t}>
        <Stadium colors={teamColors(kit)} />
        <Pitch />
        <Spotlight x={400} groundY={GROUND} width={170} />
        <GroundShadow x={400} y={GROUND} />
        <Figure pose={hero} look={look} kit={kit} scale={s} />
        {club && <CrestMark club={club} x={560} y={300} size={80} />}
        <rect x={sweep * 1000 - 100} y="-50" width="60" height="550" fill="#fff" opacity="0.06" transform="rotate(14 400 225)" />
      </Camera>
    </g>
  );
}

/* ── Catálogo ──────────────────────────────────────────── */

export const SCENES: Record<CinematicType, SceneDef> = {
  firstGoal: { duration: 8.2, textAt: 3.0, still: 5.2, render: GoalScene },
  hatTrick: { duration: 8.2, textAt: 3.0, still: 5.2, render: GoalScene },
  debut: { duration: 7.2, textAt: 2.4, still: 4.5, render: DebutScene },
  nationalDebut: { duration: 7.2, textAt: 2.4, still: 4.5, render: DebutScene },
  trophy: { duration: 8.4, textAt: 2.5, still: 4.2, textPos: 'bottom', render: TrophyScene },
  tournament: { duration: 8.4, textAt: 2.5, still: 4.2, textPos: 'bottom', render: TrophyScene },
  promotion: { duration: 6.5, textAt: 0.9, still: 2.2, textPos: 'bottom', render: PromotionScene },
  award: { duration: 8.4, textAt: 2.9, still: 4.4, textPos: 'bottom', render: AwardScene },
  transfer: { duration: 6.8, textAt: 1.5, still: 3, textPos: 'bottom', render: TransferScene },
  loan: { duration: 6.0, textAt: 1.5, still: 3, textPos: 'bottom', render: TransferScene },
  relegation: { duration: 6.5, textAt: 1.0, still: 3.2, render: RelegationScene },
  injury: { duration: 6.5, textAt: 1.2, still: 2.6, render: InjuryScene },
  achievement: { duration: 5.2, textAt: 0.9, still: 2, textPos: 'bottom', render: AchievementScene },
  retirement: { duration: 9.0, textAt: 2.2, still: 4, render: RetirementScene },
  custom: { duration: 5.0, textAt: 0.6, still: 2, render: HeroScene },
};

/** Equipación de la escena: la del club o la de la selección en los momentos internacionales. */
export function sceneKit(type: CinematicType, data: CinematicData, clubKit: ClubColors | undefined): ClubColors {
  if (type === 'nationalDebut' || type === 'tournament') return nationalKit(data.country);
  return clubKit ?? { primary: '#2a3748', secondary: '#9fb0c3', pattern: 'liso' };
}
