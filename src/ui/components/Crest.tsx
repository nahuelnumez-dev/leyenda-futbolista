import { useId, useState } from 'react';
import type { ClubColors, Crest as CrestData } from '@/engine/types/club';
import { crestUrl } from './crestUrl';

interface CrestProps {
  name: string;
  shortName?: string;
  /** Abreviatura (RMA, BOC): se usa como iniciales del escudo genérico. */
  abbr?: string;
  colors: ClubColors;
  crest?: CrestData;
  size?: number;
}

/**
 * Escudo del club. Usa el archivo real de /public/crests si existe;
 * si falta o no carga, dibuja un escudo genérico con los colores y el patrón reales.
 */
export function Crest({ name, shortName, abbr, colors, crest, size = 48 }: CrestProps) {
  const [failed, setFailed] = useState(false);
  const src = crest?.file ? crestUrl(crest.file) : '';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return <GenericCrest name={name} shortName={shortName} abbr={abbr} colors={colors} size={size} />;
}

const SHIELD = 'M50 4 L92 16 V52 C92 76 72 92 50 98 C28 92 8 76 8 52 V16 Z';

function initials(name: string, shortName?: string): string {
  const base = shortName ?? name;
  const words = base.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]{2,}$/.test(w));
  if (base.length <= 4) return base.toUpperCase();
  return (words.slice(0, 3).map((w) => w[0]).join('') || base.slice(0, 3)).toUpperCase();
}

/** Luminancia relativa aproximada para elegir texto claro u oscuro. */
function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}

export function GenericCrest({ name, shortName, abbr, colors, size = 48 }: Omit<CrestProps, 'crest'>) {
  const uid = useId().replace(/:/g, '');
  const clip = `crest-clip-${uid}`;
  const { primary: p, secondary: s, pattern } = colors;
  const label = abbr ?? initials(name, shortName);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={name}>
      <defs>
        <clipPath id={clip}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={p} />
        {pattern === 'rayas' &&
          [20, 44, 68].map((x) => <rect key={x} x={x} y="0" width="12" height="100" fill={s} />)}
        {pattern === 'aros' &&
          [18, 42, 66].map((y) => <rect key={y} x="0" y={y} width="100" height="12" fill={s} />)}
        {pattern === 'mitades' && <rect x="50" y="0" width="50" height="100" fill={s} />}
        {pattern === 'franja' && <rect x="0" y="34" width="100" height="18" fill={s} />}
        {pattern === 'bandas' && <polygon points="0,18 18,0 100,82 82,100" fill={s} />}
        {pattern === 'cuadros' &&
          [0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3].map((col) =>
              (row + col) % 2 === 0 ? (
                <rect key={`${row}-${col}`} x={col * 25} y={row * 25} width="25" height="25" fill={s} />
              ) : null,
            ),
          )}
        {/* Cartela para las iniciales */}
        <rect x="0" y="62" width="100" height="40" fill={isLight(p) && pattern === 'liso' ? s : p} opacity="0.92" />
      </g>
      <path d={SHIELD} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="3" />
      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" transform="translate(50 50) scale(0.9) translate(-50 -50)" />
      <text
        x="50"
        y="84"
        textAnchor="middle"
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontWeight="700"
        fontSize={label.length > 3 ? 17 : 21}
        fill={isLight(isLight(p) && pattern === 'liso' ? s : p) ? '#111' : '#fff'}
      >
        {label}
      </text>
    </svg>
  );
}
