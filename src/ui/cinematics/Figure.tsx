/**
 * Jugador de cuerpo entero visto de lado para las cinemáticas. Cada articulación es un <g> con su propio
 * `rotate`, así una pose (anim.ts) basta para animarlo. Usa la piel, el pelo y la equipación del avatar.
 */
import { useId } from 'react';
import type { AvatarConfig } from '@/engine/types/player';
import type { ClubColors } from '@/engine/types/club';
import { SKIN_TONES } from '@/data/avatar';
import { BODY, type Pose } from './anim';

export type Outfit = 'kit' | 'suit' | 'keeper' | 'staff' | 'tracksuit';

export interface FigureLook {
  skin: string;
  hair: string;
  hairStyle: string;
  facialHair: string;
}

interface FigureProps {
  pose: Pose;
  look: FigureLook;
  kit: ClubColors;
  outfit?: Outfit;
  scale?: number;
  facing?: 1 | -1;
  /** 0-1: oscurece la figura (compañeros al fondo, siluetas). */
  shade?: number;
  opacity?: number;
}

export function lookFrom(appearance: AvatarConfig): FigureLook {
  return { skin: SKIN_TONES[appearance.skinTone] ?? SKIN_TONES[3]!, hair: appearance.hairColor, hairStyle: appearance.hairStyle, facialHair: appearance.facialHair };
}

/** Aspecto genérico para compañeros, porteros y presentadores. */
export function npcLook(i: number): FigureLook {
  const skins = [SKIN_TONES[1]!, SKIN_TONES[3]!, SKIN_TONES[5]!, SKIN_TONES[2]!, SKIN_TONES[4]!];
  const hairs = ['#1d1510', '#3b2414', '#0e0e0e', '#6b4a2b', '#2a1b12'];
  const styles = ['corto', 'rapado', 'rizado', 'peinado', 'calvo'];
  return { skin: skins[i % skins.length]!, hair: hairs[i % hairs.length]!, hairStyle: styles[i % styles.length]!, facialHair: i % 3 === 0 ? 'sombra' : 'ninguno' };
}

export function darken(hex: string, amount: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  return `#${((f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0')}`;
}

function isLight(hex: string): boolean {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 170;
}

interface Palette {
  shirt: string;
  trim: string;
  sleeve: string;
  shorts: string;
  socks: string;
  boots: string;
  legSkin: boolean;
  stripes: string | null;
}

function palette(kit: ClubColors, outfit: Outfit): Palette {
  switch (outfit) {
    case 'suit':
      return { shirt: '#1b1e26', trim: '#f2f2f2', sleeve: '#1b1e26', shorts: '#16181f', socks: '#16181f', boots: '#0a0a0a', legSkin: false, stripes: null };
    case 'staff':
      return { shirt: '#20262f', trim: '#c8d0da', sleeve: '#20262f', shorts: '#20262f', socks: '#20262f', boots: '#111', legSkin: false, stripes: null };
    case 'tracksuit':
      return { shirt: kit.primary, trim: kit.secondary, sleeve: kit.primary, shorts: darken(kit.primary, 0.35), socks: darken(kit.primary, 0.35), boots: '#f1f1f1', legSkin: false, stripes: null };
    case 'keeper':
      return { shirt: '#2fd27a', trim: '#0d3b22', sleeve: '#2fd27a', shorts: '#14261c', socks: '#2fd27a', boots: '#111', legSkin: true, stripes: null };
    default: {
      const shorts = kit.pattern === 'liso' && isLight(kit.primary) ? kit.secondary : kit.pattern === 'liso' ? (isLight(kit.secondary) ? kit.secondary : darken(kit.primary, 0.3)) : '#f4f4f4';
      return { shirt: kit.primary, trim: kit.secondary, sleeve: kit.primary, shorts, socks: kit.primary, boots: '#121212', legSkin: true, stripes: kit.pattern === 'rayas' || kit.pattern === 'mitades' || kit.pattern === 'aros' || kit.pattern === 'franja' || kit.pattern === 'bandas' ? kit.secondary : null };
    }
  }
}

const TORSO = 'M-12 2 L12 2 L15 -46 Q14 -58 4 -61 L-7 -61 Q-16 -58 -15 -46 Z';

function Head({ look, uid }: { look: FigureLook; uid: string }) {
  const r = BODY.headR;
  const hy = BODY.headY;
  const skinDark = darken(look.skin, 0.15);
  const clip = `head-${uid}`;
  const hair = look.hair;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <circle cx="0" cy={hy} r={r} />
        </clipPath>
      </defs>
      {look.hairStyle === 'largo' && <path d={`M-12 ${hy - 4} Q-16 ${hy + 16} -10 ${hy + 22} L-2 ${hy + 18} L-2 ${hy} Z`} fill={hair} />}
      {look.hairStyle === 'afro' && <circle cx="-2" cy={hy - 3} r={r + 6} fill={hair} />}
      {look.hairStyle === 'moño' && <circle cx="-9" cy={hy - 13} r="5" fill={hair} />}
      <rect x="-5" y={hy + 8} width="9" height="10" fill={skinDark} />
      <circle cx="0" cy={hy} r={r} fill={look.skin} />
      {/* nariz, oreja, ojo, boca */}
      <path d={`M${r - 1} ${hy - 1} L${r + 3} ${hy + 4} L${r - 1} ${hy + 5}`} fill={look.skin} />
      <ellipse cx="-2" cy={hy + 1} rx="2.6" ry="3.6" fill={skinDark} />
      <circle cx={r - 5} cy={hy - 2} r="1.5" fill="#1a1410" />
      <path d={`M${r - 6} ${hy - 6} L${r - 2} ${hy - 6.5}`} stroke={darken(hair, 0.1)} strokeWidth="1.4" strokeLinecap="round" />
      <path d={`M${r - 7} ${hy + 8} L${r - 2} ${hy + 7.5}`} stroke="#7a3b2e" strokeWidth="1.3" strokeLinecap="round" />
      {(look.facialHair === 'barba' || look.facialHair === 'sombra' || look.facialHair === 'perilla') && (
        <path d={`M-2 ${hy + 4} Q2 ${hy + 15} ${r - 1} ${hy + 10} L${r - 2} ${hy + 6} Q4 ${hy + 9} -2 ${hy + 4} Z`} fill={hair} opacity={look.facialHair === 'sombra' ? 0.3 : 0.95} />
      )}
      {look.facialHair === 'bigote' && <path d={`M${r - 7} ${hy + 5.5} L${r} ${hy + 5}`} stroke={hair} strokeWidth="2" />}
      {/* pelo */}
      <g clipPath={`url(#${clip})`}>
        {look.hairStyle !== 'calvo' && look.hairStyle !== 'afro' && (
          <path d={`M${-r - 2} ${hy + 4} Q${-r} ${hy - r - 4} ${r - 2} ${hy - r + 2} L${r - 1} ${hy - 6} Q4 ${hy - 9} -4 ${hy - 5} Q-6 ${hy + 2} ${-r + 3} ${hy + 6} Z`} fill={hair} opacity={look.hairStyle === 'rapado' ? 0.45 : 1} />
        )}
      </g>
      {look.hairStyle === 'afro' && <path d={`M${-r - 6} ${hy + 2} Q${-r - 6} ${hy - r - 10} ${r} ${hy - r - 4} L${r - 1} ${hy - 6} Q0 ${hy - 6} ${-r + 2} ${hy + 6} Z`} fill={hair} />}
      {look.hairStyle === 'rizado' && [-9, -3, 3, 8].map((x) => <circle key={x} cx={x} cy={hy - r + 1} r="4" fill={hair} />)}
      {look.hairStyle === 'tupe' && <ellipse cx="6" cy={hy - r} rx="9" ry="4.5" fill={hair} />}
      {look.hairStyle === 'cresta' && <path d={`M-6 ${hy - r + 2} Q2 ${hy - r - 10} 8 ${hy - r + 1} Z`} fill={hair} />}
      {look.hairStyle === 'peinado' && <path d={`M-4 ${hy - r} Q8 ${hy - r - 5} ${r + 1} ${hy - 7} Q6 ${hy - r + 1} -4 ${hy - r + 3} Z`} fill={hair} />}
    </g>
  );
}

function Arm({ angle, elbow, pal, skin, back }: { angle: number; elbow: number; pal: Palette; skin: string; back: boolean }) {
  const sleeve = back ? darken(pal.sleeve, 0.25) : pal.sleeve;
  const sk = back ? darken(skin, 0.18) : skin;
  const longSleeve = pal.sleeve !== pal.shirt || pal.legSkin === false;
  return (
    <g transform={`translate(0 ${BODY.shoulderY}) rotate(${-angle})`}>
      <rect x="-5" y="-3" width="10" height={BODY.upperArm + 3} rx="5" fill={longSleeve ? sleeve : sk} />
      {!longSleeve && <rect x="-6" y="-4" width="12" height="13" rx="5" fill={sleeve} />}
      <g transform={`translate(0 ${BODY.upperArm}) rotate(${-elbow})`}>
        <rect x="-4.2" y="-2" width="8.4" height={BODY.foreArm + 1} rx="4.2" fill={longSleeve ? sleeve : sk} />
        {pal.trim && longSleeve && <rect x="-4.4" y={BODY.foreArm - 5} width="8.8" height="3" fill={back ? darken(pal.trim, 0.25) : pal.trim} />}
        <circle cx="0" cy={BODY.foreArm + 2} r="4.6" fill={sk} />
      </g>
    </g>
  );
}

function Leg({ angle, knee, pal, skin, back }: { angle: number; knee: number; pal: Palette; skin: string; back: boolean }) {
  const d = (c: string) => (back ? darken(c, 0.25) : c);
  return (
    <g transform={`rotate(${-angle})`}>
      <rect x="-6.5" y="-4" width="13" height={BODY.thigh + 5} rx="6" fill={pal.legSkin ? d(skin) : d(pal.shorts)} />
      {pal.legSkin && <rect x="-7.5" y="-6" width="15" height="21" rx="4" fill={d(pal.shorts)} />}
      <g transform={`translate(0 ${BODY.thigh}) rotate(${knee})`}>
        <rect x="-5.5" y="-3" width="11" height={BODY.shin + 2} rx="5" fill={pal.legSkin ? d(skin) : d(pal.shorts)} />
        {pal.legSkin && <rect x="-6" y="9" width="12" height={BODY.shin - 8} rx="4" fill={d(pal.socks)} />}
        <path d={`M-6 ${BODY.shin - 2} Q-6 ${BODY.shin + 6} 2 ${BODY.shin + 6} L13 ${BODY.shin + 6} Q15 ${BODY.shin + 1} 8 ${BODY.shin - 2} Z`} fill={d(pal.boots)} />
      </g>
    </g>
  );
}

export function Figure({ pose, look, kit, outfit = 'kit', scale = 1, facing = 1, shade = 0, opacity = 1 }: FigureProps) {
  const uid = useId().replace(/:/g, '');
  const pal = palette(kit, outfit);
  const skin = shade ? darken(look.skin, shade) : look.skin;
  const p = shade ? { ...pal, shirt: darken(pal.shirt, shade), sleeve: darken(pal.sleeve, shade), shorts: darken(pal.shorts, shade), socks: darken(pal.socks, shade), trim: darken(pal.trim, shade), stripes: pal.stripes ? darken(pal.stripes, shade) : null } : pal;
  const lk = shade ? { ...look, skin, hair: darken(look.hair, shade * 0.5) } : look;
  const clip = `torso-${uid}`;
  return (
    <g transform={`translate(${pose.x} ${pose.y}) scale(${facing * scale} ${scale})`} opacity={opacity}>
      {/* sombra en el suelo */}
      <g transform={`rotate(${pose.rot})`}>
        <g transform={`rotate(${pose.lean})`}>
          <Arm angle={pose.aB} elbow={pose.eB} pal={p} skin={skin} back />
        </g>
        <Leg angle={pose.lB} knee={pose.kB} pal={p} skin={skin} back />
        <g transform={`rotate(${pose.lean})`}>
          <defs>
            <clipPath id={clip}>
              <path d={TORSO} />
            </clipPath>
          </defs>
          <path d={TORSO} fill={p.shirt} />
          {p.stripes && (
            <g clipPath={`url(#${clip})`}>
              {kit.pattern === 'aros' || kit.pattern === 'franja'
                ? [-40, -22].map((y) => <rect key={y} x="-20" y={y} width="40" height="8" fill={p.stripes!} />)
                : kit.pattern === 'mitades'
                  ? <rect x="-20" y="-70" width="20" height="80" fill={p.stripes} />
                  : [-10, 2].map((x) => <rect key={x} x={x} y="-70" width="6" height="80" fill={p.stripes!} />)}
            </g>
          )}
          {outfit === 'suit' && <path d="M2 -60 L9 -60 L6 -30 Z" fill="#f2f2f2" />}
          {outfit === 'suit' && <path d="M5 -58 L7.5 -40 L5 -32 L3 -40 Z" fill="#7d1b2a" />}
          {outfit !== 'suit' && <path d="M-6 -60 Q2 -54 8 -60" fill="none" stroke={p.trim} strokeWidth="3" strokeLinecap="round" />}
          <g transform={`rotate(${pose.head} 0 ${BODY.headY + 10})`}>
            <Head look={lk} uid={uid} />
          </g>
        </g>
        {outfit !== 'suit' && outfit !== 'staff' && <rect x="-14" y="-6" width="28" height="16" rx="5" fill={p.shorts} />}
        <Leg angle={pose.lF} knee={pose.kF} pal={p} skin={skin} back={false} />
        <g transform={`rotate(${pose.lean})`}>
          <Arm angle={pose.aF} elbow={pose.eF} pal={p} skin={skin} back={false} />
        </g>
      </g>
    </g>
  );
}

/** Sombra elíptica bajo un personaje. */
export function GroundShadow({ x, y, w = 46, opacity = 0.35 }: { x: number; y: number; w?: number; opacity?: number }) {
  return <ellipse cx={x} cy={y} rx={w} ry={w * 0.16} fill="#000" opacity={opacity} />;
}
