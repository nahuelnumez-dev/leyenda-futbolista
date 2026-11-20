/**
 * Avatar SVG por capas: pelo trasero → camiseta → cuello → cabeza → cara → vello → pelo delantero → complemento.
 * La camiseta usa los colores y el patrón del club.
 */
import { useId } from 'react';
import type { AvatarConfig } from '@/engine/types/player';
import type { ClubColors } from '@/engine/types/club';
import { SKIN_TONES } from '@/data/avatar';

interface AvatarProps {
  config: AvatarConfig;
  kit?: ClubColors;
  size?: number;
  /** Texto para lectores de pantalla. */
  label?: string;
}

const DEFAULT_KIT: ClubColors = { primary: '#2a3748', secondary: '#9fb0c3', pattern: 'liso' };

/** Oscurece un color hex (0-1). */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const SHOULDER: Record<AvatarConfig['build'], number> = { delgado: 68, atletico: 78, robusto: 88 };

/** Casquete base que cubre la parte alta de la cabeza. */
const CAP = 'M62 94 Q58 48 100 42 Q142 48 138 94 Q134 68 100 63 Q66 68 62 94 Z';

function BackHair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'afro':
      return <circle cx="100" cy="76" r="58" fill={color} />;
    case 'largo':
      return <path d="M58 70 Q56 40 100 36 Q144 40 142 70 L146 150 Q128 158 118 140 L82 140 Q72 158 54 150 Z" fill={color} />;
    case 'moño':
      return <circle cx="100" cy="36" r="13" fill={color} />;
    default:
      return null;
  }
}

function FrontHair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'calvo':
      return null;
    case 'rapado':
      return <path d={CAP} fill={color} opacity={0.45} />;
    case 'corto':
      return <path d={CAP} fill={color} />;
    case 'peinado':
      return (
        <g fill={color}>
          <path d={CAP} />
          <path d="M66 82 Q70 50 104 46 Q136 50 138 80 Q124 60 94 62 Q78 66 66 82 Z" />
          <path d="M76 66 Q96 56 122 60 Q104 64 88 74 Z" fill={shade(color, -0.15)} opacity={0.5} />
        </g>
      );
    case 'tupe':
      return (
        <g fill={color}>
          <path d={CAP} />
          <ellipse cx="98" cy="48" rx="30" ry="13" />
        </g>
      );
    case 'rizado':
      return (
        <g fill={color}>
          <path d={CAP} />
          {[
            [66, 74], [72, 60], [82, 50], [94, 45], [106, 45], [118, 50], [128, 60], [134, 74],
            [78, 64], [90, 56], [102, 54], [114, 56], [124, 64],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="8" />
          ))}
        </g>
      );
    case 'afro':
      return (
        <g fill={color}>
          <path d="M60 92 Q52 40 100 30 Q148 40 140 92 Q132 64 100 60 Q68 64 60 92 Z" />
        </g>
      );
    case 'largo':
      return (
        <g fill={color}>
          <path d={CAP} />
          <path d="M62 94 Q60 70 74 62 Q70 80 72 110 L64 112 Z" />
          <path d="M138 94 Q140 70 126 62 Q130 80 128 110 L136 112 Z" />
        </g>
      );
    case 'moño':
      return <path d={CAP} fill={color} />;
    case 'cresta':
      return (
        <g fill={color}>
          <path d={CAP} opacity={0.3} />
          <path d="M90 66 Q88 40 100 28 Q112 40 110 66 Q100 60 90 66 Z" />
        </g>
      );
    default:
      return <path d={CAP} fill={color} />;
  }
}

function FacialHair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'bigote':
      return <path d="M86 116 Q100 108 114 116 Q100 120 86 116 Z" fill={color} />;
    case 'perilla':
      return <path d="M92 127 Q100 140 108 127 Q100 132 92 127 Z" fill={color} />;
    case 'sombra':
      return <path d="M64 100 Q66 134 100 140 Q134 134 136 100 L130 100 Q128 126 100 132 Q72 126 70 100 Z" fill={color} opacity={0.3} />;
    case 'barba':
      return (
        <g fill={color}>
          <path d="M64 98 Q64 138 100 142 Q136 138 136 98 L130 98 Q128 128 100 132 Q72 128 70 98 Z" />
          <path d="M84 117 Q100 108 116 117 Q100 121 84 117 Z" />
          <path d="M90 126 Q100 142 110 126 Q100 131 90 126 Z" />
        </g>
      );
    default:
      return null;
  }
}

function KitPattern({ kit, clip }: { kit: ClubColors; clip: string }) {
  const s = kit.secondary;
  return (
    <g clipPath={`url(#${clip})`}>
      {kit.pattern === 'rayas' && [40, 64, 88, 112, 136, 160].map((x) => <rect key={x} x={x - 5} y="140" width="11" height="80" fill={s} />)}
      {kit.pattern === 'aros' && [162, 184, 206].map((y) => <rect key={y} x="0" y={y} width="200" height="10" fill={s} />)}
      {kit.pattern === 'mitades' && <rect x="100" y="140" width="100" height="80" fill={s} />}
      {kit.pattern === 'franja' && <rect x="0" y="176" width="200" height="16" fill={s} />}
      {kit.pattern === 'bandas' && <polygon points="40,150 58,146 168,220 146,220" fill={s} />}
      {kit.pattern === 'cuadros' &&
        [0, 1, 2, 3].flatMap((row) =>
          [0, 1, 2, 3, 4, 5, 6].map((col) =>
            (row + col) % 2 === 0 ? <rect key={`${row}-${col}`} x={col * 30} y={150 + row * 20} width="30" height="20" fill={s} /> : null,
          ),
        )}
    </g>
  );
}

export function Avatar({ config, kit = DEFAULT_KIT, size = 160, label }: AvatarProps) {
  const uid = useId().replace(/:/g, '');
  const skin = SKIN_TONES[config.skinTone] ?? SKIN_TONES[3];
  const skinShadow = shade(skin, 0.14);
  const hair = config.hairColor;
  const w = SHOULDER[config.build];
  const shirt = `M${100 - w} 220 L${100 - w} 182 Q${100 - w} 158 ${128 - w} 152 L86 146 Q100 160 114 146 L${w + 72} 152 Q${100 + w} 158 ${100 + w} 182 L${100 + w} 220 Z`;
  const shirtClip = `shirt-${uid}`;
  const headClip = `head-${uid}`;
  const eye = config.eyeColor ?? '#4b3621';
  const brow = shade(hair, 0.1);

  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" role="img" aria-label={label}>
      <defs>
        <clipPath id={shirtClip}>
          <path d={shirt} />
        </clipPath>
        <clipPath id={headClip}>
          <ellipse cx="100" cy="92" rx="37" ry="46" />
        </clipPath>
      </defs>

      <BackHair style={config.hairStyle} color={hair} />

      {/* Camiseta */}
      <path d={shirt} fill={kit.primary} />
      <KitPattern kit={kit} clip={shirtClip} />
      <path d={shirt} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="2" />
      <path d="M84 146 Q100 168 116 146" fill="none" stroke={kit.secondary} strokeWidth="5" strokeLinecap="round" />

      {/* Cuello */}
      <path d="M84 122 L84 148 Q100 162 116 148 L116 122 Z" fill={skinShadow} />

      {/* Orejas y cabeza */}
      <ellipse cx="63" cy="96" rx="7" ry="11" fill={skinShadow} />
      <ellipse cx="137" cy="96" rx="7" ry="11" fill={skinShadow} />
      <ellipse cx="100" cy="92" rx="37" ry="46" fill={skin} />
      <ellipse cx="100" cy="128" rx="22" ry="8" fill={skinShadow} opacity={0.35} clipPath={`url(#${headClip})`} />

      {/* Cara */}
      <path d="M77 82 Q85 77 93 80" fill="none" stroke={brow} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M107 80 Q115 77 123 82" fill="none" stroke={brow} strokeWidth="3.2" strokeLinecap="round" />
      {[85, 115].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="92" rx="6.5" ry="4.2" fill="#fff" />
          <circle cx={x} cy="92" r="3.2" fill={eye} />
          <circle cx={x} cy="92" r="1.5" fill="#0b0b0b" />
          <circle cx={x + 1.2} cy="90.8" r="0.8" fill="#fff" />
        </g>
      ))}
      <path d="M100 95 Q95 107 99 110 Q102 111 105 109" fill="none" stroke={shade(skin, 0.28)} strokeWidth="2" strokeLinecap="round" />
      <path d="M89 120 Q100 127 111 120" fill="none" stroke="#7a3b2e" strokeWidth="2.6" strokeLinecap="round" />

      <FacialHair style={config.facialHair} color={hair} />
      <FrontHair style={config.hairStyle} color={hair} />

      {/* Complemento */}
      {config.accessory === 'cinta' && <rect x="60" y="66" width="80" height="8" rx="3" fill={kit.secondary} clipPath={`url(#${headClip})`} />}
      {config.accessory === 'diadema' && <path d="M66 74 Q100 50 134 74" fill="none" stroke="#e8e8e8" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}
