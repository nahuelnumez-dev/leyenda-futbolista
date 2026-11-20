/**
 * Gráficas SVG sin dependencias, siguiendo la guía de visualización:
 * líneas de 2 px, columnas de ≤24 px con 4 px redondeados arriba, rejilla fina y recesiva,
 * leyenda solo con dos o más series, tooltip al pasar el ratón y vista de tabla.
 * Colores de serie validados para el fondo oscuro del juego (ver charts.css).
 */
import { useId, useState, type ReactNode } from 'react';
import { t } from '@/i18n';

const W = 600;
const H = 220;
const PAD = { top: 16, right: 44, bottom: 28, left: 40 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;

/** Marcas de eje «redondas» entre min y max. */
function ticks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1000) / 1000);
  return out;
}

interface FrameProps {
  title: string;
  subtitle?: string;
  legend?: { label: string; series: 1 | 2 }[];
  table: { head: string[]; rows: (string | number)[][] };
  children: ReactNode;
}

/** Marco común: título, leyenda (≥2 series), conmutador de tabla. */
export function ChartFrame({ title, subtitle, legend, table, children }: FrameProps) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className="viz card">
      <figcaption className="viz-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="small muted">{subtitle}</p>}
        </div>
        <button type="button" className="btn btn-ghost viz-toggle" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)}>
          {asTable ? t('stats.chart') : t('stats.table')}
        </button>
      </figcaption>
      {legend && legend.length >= 2 && !asTable && (
        <ul className="viz-legend">
          {legend.map((l) => (
            <li key={l.label}>
              <span className={`viz-swatch s${l.series}`} aria-hidden="true" />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      {asTable ? (
        <div className="table-wrap">
          <table className="standings">
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  // x, y en unidades del viewBox; se colocan en % para que escalen con el SVG.
  const left = (x / W) * 100;
  return (
    <div className="viz-tooltip" style={{ left: `${left}%`, top: `${(y / H) * 100}%`, transform: `translate(${left > 70 ? '-105%' : '8%'}, -110%)` }} role="status">
      {children}
    </div>
  );
}

/* ── Línea (una serie, con banda opcional) ─────────────── */

export interface LinePoint {
  x: string;
  y: number;
  /** Banda opcional (p. ej. rango de potencial). */
  lo?: number;
  hi?: number;
  detail?: string;
}

export function LineChart({ points, format, yMin, yMax, label }: { points: LinePoint[]; format: (v: number) => string; yMin?: number; yMax?: number; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const clip = useId().replace(/:/g, '');
  if (points.length === 0) return <p className="small muted">{t('stats.noData')}</p>;
  const values = points.flatMap((p) => [p.y, p.lo ?? p.y, p.hi ?? p.y]);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values);
  const tk = ticks(min, max);
  const lo = Math.min(min, tk[0] ?? min);
  const hi = Math.max(max, tk.at(-1) ?? max);
  const x = (i: number) => PAD.left + (points.length === 1 ? IW / 2 : (i / (points.length - 1)) * IW);
  const y = (v: number) => PAD.top + IH - ((v - lo) / (hi - lo || 1)) * IH;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.y)}`).join(' ');
  const hasBand = points.some((p) => p.lo !== undefined);
  const band = hasBand
    ? `${points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.hi ?? p.y)}`).join(' ')} ${[...points].reverse().map((p, k) => `L${x(points.length - 1 - k)},${y(p.lo ?? p.y)}`).join(' ')} Z`
    : '';
  const last = points.length - 1;
  const step = Math.max(1, Math.ceil(points.length / 8));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * IW;
    setHover(Math.max(0, Math.min(last, Math.round((px / IW) * last))));
  };

  return (
    <div className="viz-plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <clipPath id={clip}>
            <rect x={PAD.left} y={PAD.top - 6} width={IW + 12} height={IH + 12} />
          </clipPath>
        </defs>
        {tk.map((v) => (
          <g key={v}>
            <line className="viz-grid" x1={PAD.left} x2={PAD.left + IW} y1={y(v)} y2={y(v)} />
            <text className="viz-tick" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
              {format(v)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % step === 0 || i === last ? (
            <text key={p.x} className="viz-tick" x={x(i)} y={H - 8} textAnchor="middle">
              {p.x}
            </text>
          ) : null,
        )}
        {hasBand && <path d={band} className="viz-band" />}
        <g clipPath={`url(#${clip})`}>
          <path d={path} className="viz-line s1" />
        </g>
        {hover !== null && <line className="viz-crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + IH} />}
        <circle className="viz-dot s1" cx={x(hover ?? last)} cy={y(points[hover ?? last]!.y)} r={4.5} />
        <text className="viz-endlabel" x={x(last) + 8} y={y(points[last]!.y) + 4}>
          {format(points[last]!.y)}
        </text>
        <rect x={PAD.left} y={PAD.top} width={IW} height={IH} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} y={y(points[hover]!.y)}>
          <strong>{points[hover]!.x}</strong>
          <span>{format(points[hover]!.y)}</span>
          {points[hover]!.detail && <span className="muted">{points[hover]!.detail}</span>}
        </Tooltip>
      )}
    </div>
  );
}

/* ── Columnas agrupadas (1-2 series) ───────────────────── */

export interface ColumnSeries {
  label: string;
  values: number[];
}

export function ColumnChart({ categories, series, label }: { categories: string[]; series: ColumnSeries[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (categories.length === 0) return <p className="small muted">{t('stats.noData')}</p>;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const tk = ticks(0, max);
  const top = Math.max(max, tk.at(-1) ?? max);
  const slot = IW / categories.length;
  const n = series.length;
  const gap = 2;
  const bar = Math.max(3, Math.min(24, (slot * 0.7 - gap * (n - 1)) / n));
  const y = (v: number) => PAD.top + IH - (v / top) * IH;
  const colPath = (cx: number, v: number) => {
    const h = Math.max(0, PAD.top + IH - y(v));
    if (h === 0) return '';
    const r = Math.min(4, h, bar / 2);
    const x0 = cx;
    const x1 = cx + bar;
    const yb = PAD.top + IH;
    const yt = yb - h;
    return `M${x0},${yb} L${x0},${yt + r} Q${x0},${yt} ${x0 + r},${yt} L${x1 - r},${yt} Q${x1},${yt} ${x1},${yt + r} L${x1},${yb} Z`;
  };
  const step = Math.max(1, Math.ceil(categories.length / 10));
  const groupX = (i: number) => PAD.left + i * slot + (slot - (bar * n + gap * (n - 1))) / 2;
  const peak = series[0]!.values.indexOf(Math.max(...series[0]!.values));

  return (
    <div className="viz-plot">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {tk.map((v) => (
          <g key={v}>
            <line className="viz-grid" x1={PAD.left} x2={PAD.left + IW} y1={y(v)} y2={y(v)} />
            <text className="viz-tick" x={PAD.left - 6} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {categories.map((c, i) => (
          <g key={c} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={IH} fill={hover === i ? 'rgba(255,255,255,0.04)' : 'transparent'} />
            {series.map((s, k) => (
              <path key={s.label} d={colPath(groupX(i) + k * (bar + gap), s.values[i] ?? 0)} className={`viz-col s${k + 1}`} />
            ))}
            {(i % step === 0 || i === categories.length - 1) && (
              <text className="viz-tick" x={PAD.left + i * slot + slot / 2} y={H - 8} textAnchor="middle">
                {c}
              </text>
            )}
          </g>
        ))}
        {/* Etiqueta selectiva: solo el máximo de la primera serie. */}
        {peak >= 0 && (series[0]!.values[peak] ?? 0) > 0 && (
          <text className="viz-endlabel" x={groupX(peak) + bar / 2} y={y(series[0]!.values[peak]!) - 6} textAnchor="middle">
            {series[0]!.values[peak]}
          </text>
        )}
      </svg>
      {hover !== null && (
        <Tooltip x={PAD.left + hover * slot + slot / 2} y={y(Math.max(...series.map((s) => s.values[hover] ?? 0)))}>
          <strong>{categories[hover]}</strong>
          {series.map((s, k) => (
            <span key={s.label}>
              <span className={`viz-swatch s${k + 1}`} aria-hidden="true" /> {s.label}: {s.values[hover]}
            </span>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

/* ── Radar (perfil de atributos) ───────────────────────── */

export function RadarChart({ axes, series, label }: { axes: string[]; series: ColumnSeries[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const size = 300;
  const c = size / 2;
  const R = 92;
  const angle = (i: number) => -Math.PI / 2 + (i / axes.length) * Math.PI * 2;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * (R * v) / 99, c + Math.sin(angle(i)) * (R * v) / 99] as const;
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ');
  return (
    <div className="viz-plot viz-radar">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        {[25, 50, 75, 99].map((ring) => (
          <polygon key={ring} className="viz-grid-fill" points={poly(axes.map(() => ring))} />
        ))}
        {axes.map((a, i) => {
          const [x, y] = pt(i, 99);
          const [lx, ly] = pt(i, 122);
          return (
            <g key={a}>
              <line className="viz-grid" x1={c} y1={c} x2={x} y2={y} />
              <text className="viz-tick viz-axis-label" x={lx} y={ly + 4} textAnchor={Math.abs(lx - c) < 8 ? 'middle' : lx > c ? 'start' : 'end'}>
                {a}
              </text>
            </g>
          );
        })}
        {[...series].reverse().map((s, ri) => {
          const k = series.length - 1 - ri;
          return (
            <g key={s.label}>
              <polygon className={`viz-area s${k + 1}`} points={poly(s.values)} />
              {s.values.map((v, i) => {
                const [x, y] = pt(i, v);
                return <circle key={i} className={`viz-dot s${k + 1}`} cx={x} cy={y} r={k === 0 ? 4.5 : 3.5} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />;
              })}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="viz-tooltip viz-tooltip-fixed" role="status">
          <strong>{axes[hover]}</strong>
          {series.map((s, k) => (
            <span key={s.label}>
              <span className={`viz-swatch s${k + 1}`} aria-hidden="true" /> {s.label}: {s.values[hover]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Cifra destacada ───────────────────────────────────── */

export function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile-label">{label}</span>
      <strong className="stat-tile-value">{value}</strong>
      {hint && <span className="small muted">{hint}</span>}
    </div>
  );
}
