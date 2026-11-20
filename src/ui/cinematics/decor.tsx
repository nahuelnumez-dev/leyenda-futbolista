/**
 * Decorados de las cinemáticas (SVG, viewBox 800×450): estadio, público, portería, balón, trofeos y efectos.
 * Los elementos estáticos están memorizados; lo que se mueve recibe el reloj `t` en segundos.
 */
import { memo, useId, useMemo, type ReactElement } from 'react';
import type { Club, ClubColors } from '@/engine/types/club';
import { darken } from './Figure';
import { kf, seeded } from './anim';

const BASE = import.meta.env.BASE_URL;

/* ── Estadio ───────────────────────────────────────────── */

/** Tribunas con público (patrón de puntos de colores) y focos. `mood` ajusta la luz. */
export const Stadium = memo(function Stadium({ colors, mood = 'night', horizon = 252, seed = 7 }: { colors: string[]; mood?: 'night' | 'day' | 'sunset' | 'gloomy'; horizon?: number; seed?: number }) {
  const uid = useId().replace(/:/g, '');
  const dots = useMemo(() => {
    const r = seeded(seed);
    const palette = [...colors, '#e8e2d6', '#2b2f36', '#c9a27e', '#1d2430', ...colors];
    return Array.from({ length: 70 }, () => ({ x: r() * 80, y: r() * 44, c: palette[Math.floor(r() * palette.length)]!, rr: 2.2 + r() * 1.3 }));
  }, [colors, seed]);
  const sky =
    mood === 'sunset' ? ['#2a1846', '#c8553d', '#f2a65a'] : mood === 'day' ? ['#4b86c5', '#9cc6ec', '#d8ecf9'] : mood === 'gloomy' ? ['#1a2027', '#2c343d', '#3a434d'] : ['#04070d', '#0c1626', '#1a2a40'];
  const standShade = mood === 'day' ? 0.15 : mood === 'sunset' ? 0.35 : mood === 'gloomy' ? 0.55 : 0.4;
  return (
    <g>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <pattern id={`crowd-${uid}`} width="80" height="44" patternUnits="userSpaceOnUse">
          <rect width="80" height="44" fill={darken('#1c232d', mood === 'day' ? -0.3 : 0)} />
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.rr} fill={d.c} />
          ))}
        </pattern>
        <linearGradient id={`standfade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity={standShade + 0.3} />
          <stop offset="1" stopColor="#000" stopOpacity={standShade * 0.4} />
        </linearGradient>
        <radialGradient id={`flood-${uid}`}>
          <stop offset="0" stopColor="#fffbe6" stopOpacity="0.95" />
          <stop offset="0.3" stopColor="#fff3c4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="-300" y="-100" width="1400" height={horizon + 120} fill={`url(#sky-${uid})`} />
      {/* tribuna superior e inferior */}
      <path d={`M-300 ${horizon - 175} L1100 ${horizon - 175} L1100 ${horizon - 92} L-300 ${horizon - 92} Z`} fill={`url(#crowd-${uid})`} />
      <rect x="-300" y={horizon - 92} width="1400" height="8" fill="#0f141b" />
      <path d={`M-300 ${horizon - 84} L1100 ${horizon - 84} L1100 ${horizon - 16} L-300 ${horizon - 16} Z`} fill={`url(#crowd-${uid})`} />
      <rect x="-300" y={horizon - 175} width="1400" height="160" fill={`url(#standfade-${uid})`} />
      <path d={`M-300 ${horizon - 175} L1100 ${horizon - 175} L1100 ${horizon - 190} Q400 ${horizon - 214} -300 ${horizon - 190} Z`} fill="#0b0f14" />
      {/* vallas publicitarias */}
      <rect x="-300" y={horizon - 16} width="1400" height="16" fill={darken(colors[0] ?? '#223', 0.25)} />
      {Array.from({ length: 14 }, (_, i) => (
        <text key={i} x={-260 + i * 100} y={horizon - 4} fontSize="9" fontWeight="700" fill="rgba(255,255,255,0.75)" fontFamily="system-ui, sans-serif" letterSpacing="2">
          LEYENDA
        </text>
      ))}
      {/* focos */}
      {mood !== 'day' &&
        [-60, 860].map((x) => (
          <g key={x}>
            <rect x={x - 3} y={horizon - 250} width="6" height="140" fill="#0a0d12" />
            <rect x={x - 26} y={horizon - 262} width="52" height="18" rx="3" fill="#20262f" />
            {[-18, -6, 6, 18].map((dx) => (
              <circle key={dx} cx={x + dx} cy={horizon - 253} r="4" fill="#fffbe6" />
            ))}
            <circle cx={x} cy={horizon - 253} r="120" fill={`url(#flood-${uid})`} />
          </g>
        ))}
    </g>
  );
});

/** Césped con franjas y líneas. */
export const Pitch = memo(function Pitch({ horizon = 252, mood = 'night' }: { horizon?: number; mood?: 'night' | 'day' | 'sunset' | 'gloomy' }) {
  const base = mood === 'gloomy' ? '#2c4a33' : mood === 'sunset' ? '#3f6a2c' : '#2e7d3a';
  const bands = [0, 18, 40, 68, 102, 142, 190, 250];
  return (
    <g>
      <rect x="-300" y={horizon} width="1400" height={500} fill={base} />
      {bands.slice(0, -1).map((b, i) => (i % 2 === 0 ? <rect key={b} x="-300" y={horizon + b} width="1400" height={bands[i + 1]! - b} fill={darken(base, -0.1)} /> : null))}
      <rect x="-300" y={horizon + 5} width="1400" height="2" fill="rgba(255,255,255,0.7)" />
    </g>
  );
});

/** Capa de público que salta (para animar sin redibujar el patrón). */
export function CrowdPulse({ t, start, color = '#fff' }: { t: number; start: number; color?: string }) {
  if (t < start) return null;
  const k = Math.max(0, 1 - (t - start) / 3);
  return <rect x="-300" y="60" width="1400" height="175" fill={color} opacity={0.08 * k * (0.6 + 0.4 * Math.sin((t - start) * 18))} />;
}

/* ── Portería y balón ──────────────────────────────────── */

/** Portería vista de frente (postes delanteros y red al fondo). `hit` = punto de impacto; `ripple` 0-1. */
export function Goal({ ripple = 0, hit }: { ripple?: number; hit?: { x: number; y: number } }) {
  const L = 600;
  const R = 782;
  const T = 226;
  const B = 340;
  const bl = 616;
  const br = 766;
  const bt = 240;
  const bb = 330;
  const wob = (x: number, y: number) => {
    if (!hit || ripple <= 0) return 0;
    const d = Math.hypot(x - hit.x, y - hit.y);
    return Math.max(0, 1 - d / 70) * Math.sin(ripple * 18 - d / 8) * 6 * (1 - ripple);
  };
  const vLines = Array.from({ length: 16 }, (_, i) => bl + ((br - bl) * i) / 15);
  const hLines = Array.from({ length: 9 }, (_, i) => bt + ((bb - bt) * i) / 8);
  return (
    <g>
      <path d={`M${L} ${T} L${bl} ${bt} L${bl} ${bb} L${L} ${B} Z M${R} ${T} L${br} ${bt} L${br} ${bb} L${R} ${B} Z`} fill="rgba(255,255,255,0.06)" />
      <rect x={bl} y={bt} width={br - bl} height={bb - bt} fill="rgba(255,255,255,0.05)" />
      <g stroke="rgba(255,255,255,0.45)" strokeWidth="0.8" fill="none">
        {vLines.map((x) => (
          <path key={x} d={hLines.map((y, j) => `${j === 0 ? 'M' : 'L'}${x + wob(x, y)} ${y + wob(x, y) * 0.6}`).join(' ')} />
        ))}
        {hLines.map((y) => (
          <path key={y} d={vLines.map((x, j) => `${j === 0 ? 'M' : 'L'}${x + wob(x, y)} ${y + wob(x, y) * 0.6}`).join(' ')} />
        ))}
        <path d={`M${L} ${T} L${bl} ${bt} M${R} ${T} L${br} ${bt} M${L} ${B} L${bl} ${bb} M${R} ${B} L${br} ${bb}`} />
      </g>
      <path d={`M${L} ${B} L${L} ${T} L${R} ${T} L${R} ${B}`} fill="none" stroke="#f4f4f4" strokeWidth="6" strokeLinejoin="round" />
      <path d={`M${L + 2} ${B} L${L + 2} ${T + 2} L${R - 2} ${T + 2}`} fill="none" stroke="#bcbcbc" strokeWidth="1.5" />
    </g>
  );
}

export function Ball({ x, y, r = 9, spin = 0, opacity = 1 }: { x: number; y: number; r?: number; spin?: number; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${spin})`} opacity={opacity}>
      <circle r={r} fill="#f7f7f7" stroke="#cfcfcf" strokeWidth={r * 0.08} />
      <polygon points={pent(0, 0, r * 0.38)} fill="#1b1b1b" />
      {[0, 72, 144, 216, 288].map((a) => {
        const rr = (a * Math.PI) / 180;
        return <polygon key={a} points={pent(Math.cos(rr) * r * 0.82, Math.sin(rr) * r * 0.82, r * 0.22)} fill="#1b1b1b" />;
      })}
      <circle r={r} fill="url(#ballshade)" />
    </g>
  );
}

function pent(cx: number, cy: number, r: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`;
  }).join(' ');
}

/** Definiciones compartidas (sombreado del balón, oro, viñeta). Se incluye una vez por escena. */
export function SharedDefs() {
  return (
    <defs>
      <radialGradient id="ballshade" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0.5" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.35" />
      </radialGradient>
      <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#8a6410" />
        <stop offset="0.35" stopColor="#ffe9a3" />
        <stop offset="0.55" stopColor="#f5c542" />
        <stop offset="1" stopColor="#7a560c" />
      </linearGradient>
      <linearGradient id="silver" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#6b7480" />
        <stop offset="0.4" stopColor="#f4f7fa" />
        <stop offset="1" stopColor="#5c6570" />
      </linearGradient>
      <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.75" />
      </radialGradient>
      <linearGradient id="spot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff8dc" stopOpacity="0.55" />
        <stop offset="1" stopColor="#fff8dc" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/* ── Trofeos ───────────────────────────────────────────── */

export type TrophyKind = 'cup' | 'bigEars' | 'world' | 'goldenBall' | 'goldenBoot' | 'star' | 'medal';

/** Trofeo centrado en (x, y) = punto por el que se sujeta (base). `s` = escala. */
export function Trophy({ kind, x, y, s = 1, rotate = 0 }: { kind: TrophyKind; x: number; y: number; s?: number; rotate?: number }) {
  const g = 'url(#gold)';
  let body: ReactElement;
  switch (kind) {
    case 'bigEars':
      body = (
        <g>
          <path d="M-20 -78 H20 V-58 C20 -38 10 -28 0 -26 C-10 -28 -20 -38 -20 -58 Z" fill="url(#silver)" />
          <path d="M-20 -74 C-44 -78 -44 -40 -16 -40" fill="none" stroke="url(#silver)" strokeWidth="5" />
          <path d="M20 -74 C44 -78 44 -40 16 -40" fill="none" stroke="url(#silver)" strokeWidth="5" />
          <rect x="-4" y="-26" width="8" height="12" fill="url(#silver)" />
          <path d="M-14 -14 H14 L18 0 H-18 Z" fill="url(#silver)" />
        </g>
      );
      break;
    case 'world':
      body = (
        <g>
          <circle cx="0" cy="-62" r="15" fill={g} />
          <path d="M-8 -50 C-14 -36 -10 -24 -6 -16 L6 -16 C10 -24 14 -36 8 -50 Z" fill={g} />
          <path d="M-10 -16 H10 L13 -4 H-13 Z" fill="#1f6b3a" />
          <rect x="-14" y="-4" width="28" height="4" fill={g} />
        </g>
      );
      break;
    case 'goldenBall':
      body = (
        <g>
          <circle cx="0" cy="-26" r="22" fill={g} />
          <polygon points={pent(0, -26, 8)} fill="#7a560c" opacity="0.55" />
          {[0, 72, 144, 216, 288].map((a) => {
            const rr = (a * Math.PI) / 180;
            return <polygon key={a} points={pent(Math.cos(rr) * 17, -26 + Math.sin(rr) * 17, 5)} fill="#7a560c" opacity="0.45" />;
          })}
          <ellipse cx="-7" cy="-34" rx="6" ry="4" fill="#fff8d6" opacity="0.6" />
          <rect x="-10" y="-4" width="20" height="4" rx="1" fill="#2a2a2a" />
        </g>
      );
      break;
    case 'goldenBoot':
      body = (
        <g>
          <path d="M-10 -48 L4 -48 L6 -18 Q22 -16 26 -8 Q26 0 18 0 L-12 0 Z" fill={g} />
          <path d="M-12 -2 L22 -2" stroke="#7a560c" strokeWidth="2" />
          {[-6, 2, 10, 18].map((xx) => (
            <rect key={xx} x={xx} y="0" width="3" height="4" fill="#7a560c" />
          ))}
        </g>
      );
      break;
    case 'star':
      body = (
        <g>
          <polygon points="0,-62 7,-46 24,-45 11,-34 15,-17 0,-26 -15,-17 -11,-34 -24,-45 -7,-46" fill={g} />
          <rect x="-3" y="-18" width="6" height="12" fill={g} />
          <path d="M-14 -6 H14 L16 0 H-16 Z" fill="#2a2a2a" />
        </g>
      );
      break;
    case 'medal':
      body = (
        <g>
          <path d="M-8 -50 L-2 -26 M8 -50 L2 -26" stroke="#c8102e" strokeWidth="5" />
          <circle cx="0" cy="-18" r="12" fill={g} />
        </g>
      );
      break;
    default:
      body = (
        <g>
          <path d="M-22 -70 H22 V-52 C22 -34 12 -24 0 -22 C-12 -24 -22 -34 -22 -52 Z" fill={g} />
          <path d="M-22 -64 C-36 -64 -36 -44 -18 -40" fill="none" stroke={g} strokeWidth="4.5" />
          <path d="M22 -64 C36 -64 36 -44 18 -40" fill="none" stroke={g} strokeWidth="4.5" />
          <rect x="-4" y="-22" width="8" height="10" fill={g} />
          <path d="M-14 -12 H14 L17 0 H-17 Z" fill={g} />
          <ellipse cx="-9" cy="-60" rx="4" ry="8" fill="#fff8d6" opacity="0.45" />
        </g>
      );
  }
  return <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}>{body}</g>;
}

/* ── Efectos ───────────────────────────────────────────── */

export function Confetti({ t, start = 0, count = 60, colors = ['#f5c542', '#ffffff', '#2fd27a', '#3987e5', '#d95926'], seed = 3, speed = 1 }: { t: number; start?: number; count?: number; colors?: string[]; seed?: number; speed?: number }) {
  const pieces = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({ x: -50 + r() * 900, delay: r() * 2.2, fall: (90 + r() * 80) * speed, sway: 10 + r() * 22, w: 4 + r() * 5, c: colors[i % colors.length]!, spin: 200 + r() * 400, phase: r() * 6 }));
  }, [count, colors, seed, speed]);
  if (t < start) return null;
  const e = t - start;
  return (
    <g>
      {pieces.map((p, i) => {
        const tt = e - p.delay;
        if (tt < 0) return null;
        const y = -20 + tt * p.fall;
        if (y > 470) return null;
        const x = p.x + Math.sin(tt * 2.4 + p.phase) * p.sway;
        const flip = Math.abs(Math.cos(tt * 5 + p.phase));
        return <rect key={i} x={-p.w / 2} y={-p.w} width={p.w} height={p.w * 1.8 * flip + 0.6} fill={p.c} transform={`translate(${x} ${y}) rotate(${tt * p.spin})`} />;
      })}
    </g>
  );
}

export function Fireworks({ t, start = 0, seed = 11, bursts = 5, colors = ['#f5c542', '#ffffff', '#ff6b6b', '#6bd3ff'] }: { t: number; start?: number; seed?: number; bursts?: number; colors?: string[] }) {
  const list = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: bursts }, (_, i) => ({ x: 80 + r() * 640, y: 40 + r() * 110, at: i * 0.55 + r() * 0.3, c: colors[i % colors.length]! }));
  }, [seed, bursts, colors]);
  if (t < start) return null;
  return (
    <g>
      {list.map((b, i) => {
        const e = (t - start - b.at) % 2.8;
        if (e < 0 || t - start < b.at) return null;
        const k = e / 1.4;
        if (k > 1) return null;
        return (
          <g key={i} opacity={1 - k}>
            {Array.from({ length: 16 }, (_, j) => {
              const a = (j / 16) * Math.PI * 2;
              const d = 8 + k * 60;
              return <circle key={j} cx={b.x + Math.cos(a) * d} cy={b.y + Math.sin(a) * d + k * k * 18} r={2.2 - k} fill={b.c} />;
            })}
            <circle cx={b.x} cy={b.y} r={14 * (1 - k)} fill="#fff" opacity={0.5 * (1 - k)} />
          </g>
        );
      })}
    </g>
  );
}

/** Flashes de cámaras de fotos en una zona. */
export function Flashes({ t, start = 0, area, count = 14, seed = 5, rate = 1 }: { t: number; start?: number; area: [number, number, number, number]; count?: number; seed?: number; rate?: number }) {
  const list = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: area[0] + r() * (area[2] - area[0]), y: area[1] + r() * (area[3] - area[1]), period: (0.9 + r() * 1.8) / rate, off: r() * 3 }));
  }, [area, count, seed, rate]);
  if (t < start) return null;
  return (
    <g>
      {list.map((f, i) => {
        const e = ((t - start + f.off) % f.period) / f.period;
        if (e > 0.12) return null;
        const k = 1 - e / 0.12;
        return (
          <g key={i} opacity={k}>
            <circle cx={f.x} cy={f.y} r={14 * k + 2} fill="#fff" opacity="0.35" />
            <circle cx={f.x} cy={f.y} r="3" fill="#fff" />
          </g>
        );
      })}
    </g>
  );
}

export function Rain({ t, count = 90, seed = 2 }: { t: number; count?: number; seed?: number }) {
  const drops = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: -100 + r() * 1000, off: r(), speed: 700 + r() * 300 }));
  }, [count, seed]);
  return (
    <g stroke="rgba(190,205,225,0.45)" strokeWidth="1.2">
      {drops.map((d, i) => {
        const y = ((t * d.speed + d.off * 600) % 600) - 80;
        return <line key={i} x1={d.x} y1={y} x2={d.x - 4} y2={y + 16} />;
      })}
    </g>
  );
}

/** Cono de luz desde arriba hacia (x, groundY). */
export function Spotlight({ x, groundY, width = 120, opacity = 1, from = -60 }: { x: number; groundY: number; width?: number; opacity?: number; from?: number }) {
  return (
    <g opacity={opacity} style={{ mixBlendMode: 'screen' }}>
      <path d={`M${x - 14} ${from} L${x + 14} ${from} L${x + width / 2} ${groundY} L${x - width / 2} ${groundY} Z`} fill="url(#spot)" />
      <ellipse cx={x} cy={groundY} rx={width / 2} ry={width / 9} fill="#fff8dc" opacity="0.18" />
    </g>
  );
}

/** Partículas doradas que flotan. */
export function Sparkles({ t, count = 26, seed = 9, area = [0, 0, 800, 450] as [number, number, number, number] }: { t: number; count?: number; seed?: number; area?: [number, number, number, number] }) {
  const list = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: area[0] + r() * (area[2] - area[0]), y: area[1] + r() * (area[3] - area[1]), p: r() * 6, s: 0.6 + r() * 1.6 }));
  }, [count, seed, area]);
  return (
    <g>
      {list.map((s, i) => {
        const k = 0.5 + 0.5 * Math.sin(t * 2.2 * s.s + s.p);
        return <circle key={i} cx={s.x + Math.sin(t * 0.6 + s.p) * 6} cy={s.y - ((t * 12 * s.s) % 40)} r={1.4 * s.s * k} fill="#ffe9a3" opacity={k} />;
      })}
    </g>
  );
}

/** Escudo dentro de un SVG (archivo real o escudo genérico dibujado). */
export function CrestMark({ club, x, y, size }: { club?: Club; x: number; y: number; size: number }) {
  if (!club) return null;
  if (club.crest?.file) return <image href={`${BASE}${club.crest.file}`} x={x - size / 2} y={y - size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" />;
  const s = size / 100;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>
      <path d="M50 4 L92 16 V52 C92 76 72 92 50 98 C28 92 8 76 8 52 V16 Z" fill={club.colors.primary} stroke={club.colors.secondary} strokeWidth="6" />
      <text x="50" y="62" textAnchor="middle" fontSize="28" fontWeight="800" fill={club.colors.secondary} fontFamily="system-ui, sans-serif">
        {club.abbr}
      </text>
    </g>
  );
}

/** Bandera de selección ondeando (franjas con los colores de la equipación). */
export function WavingFlag({ t, x, y, w, h, colors }: { t: number; x: number; y: number; w: number; h: number; colors: [string, string] }) {
  const n = 12;
  const pts = (row: number) => Array.from({ length: n + 1 }, (_, i) => [x + (w * i) / n, y + row + Math.sin(t * 3 + i * 0.7) * 5 * (i / n)] as const);
  const top = pts(0);
  const bottom = pts(h);
  const mid = pts(h / 3);
  const mid2 = pts((2 * h) / 3);
  const band = (a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]) => `M${a.map((p) => p.join(' ')).join(' L')} L${[...b].reverse().map((p) => p.join(' ')).join(' L')} Z`;
  return (
    <g>
      <path d={band(top, mid)} fill={colors[0]} />
      <path d={band(mid, mid2)} fill={colors[1]} />
      <path d={band(mid2, bottom)} fill={colors[0]} />
    </g>
  );
}

/** Colores de equipación de algunas selecciones (el resto se deriva del nombre). */
const NATIONAL_KITS: Record<string, ClubColors> = {
  ARG: { primary: '#75AADB', secondary: '#FFFFFF', pattern: 'rayas' },
  BRA: { primary: '#FFDC02', secondary: '#00843D', pattern: 'liso' },
  ESP: { primary: '#C60B1E', secondary: '#FFC400', pattern: 'liso' },
  ENG: { primary: '#FFFFFF', secondary: '#0A2240', pattern: 'liso' },
  FRA: { primary: '#0A2240', secondary: '#FFFFFF', pattern: 'liso' },
  GER: { primary: '#FFFFFF', secondary: '#111111', pattern: 'liso' },
  ITA: { primary: '#0066CC', secondary: '#FFFFFF', pattern: 'liso' },
  POR: { primary: '#C8102E', secondary: '#00843D', pattern: 'liso' },
  NED: { primary: '#F36C21', secondary: '#FFFFFF', pattern: 'liso' },
  BEL: { primary: '#C8102E', secondary: '#111111', pattern: 'liso' },
  CRO: { primary: '#FFFFFF', secondary: '#C8102E', pattern: 'cuadros' },
  URU: { primary: '#7EB6E6', secondary: '#111111', pattern: 'liso' },
  COL: { primary: '#FCD116', secondary: '#003893', pattern: 'liso' },
  CHI: { primary: '#D52B1E', secondary: '#0039A6', pattern: 'liso' },
  MEX: { primary: '#006847', secondary: '#FFFFFF', pattern: 'liso' },
  USA: { primary: '#FFFFFF', secondary: '#0A2240', pattern: 'liso' },
  JPN: { primary: '#0A2B6B', secondary: '#FFFFFF', pattern: 'liso' },
  KOR: { primary: '#C8102E', secondary: '#111111', pattern: 'liso' },
  KSA: { primary: '#FFFFFF', secondary: '#006C35', pattern: 'liso' },
  SCO: { primary: '#1C2A5C', secondary: '#FFFFFF', pattern: 'liso' },
  WAL: { primary: '#C8102E', secondary: '#FFFFFF', pattern: 'liso' },
  IRL: { primary: '#169B62', secondary: '#FFFFFF', pattern: 'liso' },
  TUR: { primary: '#E30A17', secondary: '#FFFFFF', pattern: 'liso' },
  ECU: { primary: '#FFDD00', secondary: '#034EA2', pattern: 'liso' },
  PAR: { primary: '#D52B1E', secondary: '#FFFFFF', pattern: 'rayas' },
  PER: { primary: '#FFFFFF', secondary: '#D91023', pattern: 'bandas' },
  MAR: { primary: '#C1272D', secondary: '#006233', pattern: 'liso' },
  SEN: { primary: '#FFFFFF', secondary: '#00853F', pattern: 'liso' },
};

export function nationalKit(country?: string): ClubColors {
  if (country && NATIONAL_KITS[country]) return NATIONAL_KITS[country];
  let h = 0;
  for (const ch of country ?? 'XXX') h = (h * 31 + ch.charCodeAt(0)) % 360;
  return { primary: `hsl(${h} 65% 42%)`, secondary: '#FFFFFF', pattern: 'liso' };
}

/** Trofeo apropiado para una competición o premio. */
export function trophyFor(competitionId?: string, awardId?: string): TrophyKind {
  if (awardId === 'balon-de-oro') return 'goldenBall';
  if (awardId === 'top-scorer') return 'goldenBoot';
  if (awardId) return 'star';
  if (competitionId?.includes('world-cup')) return 'world';
  if (competitionId === 'uefa.champions') return 'bigEars';
  return 'cup';
}

export const fadeIn = (t: number, at: number, dur = 0.5) => kf(t, [[at, 0], [at + dur, 1]]);
