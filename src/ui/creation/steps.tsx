/** Pasos del asistente de creación del personaje. Cada paso edita una parte de `CharacterInput`. */
import { lt, t, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import { PLAY_STYLES } from '@/data/playStyles';
import { STARTING_TRAIT_COUNT, TRAITS } from '@/data/traits';
import { ACCESSORIES, BOOT_COLORS, BUILDS, EYE_COLORS, FACIAL_HAIR, HAIR_COLORS, HAIR_STYLES, HEIGHT_RANGE, SKIN_TONES } from '@/data/avatar';
import { POSITIONS, type Position } from '@/engine/types/attributes';
import type { CharacterInput } from '@/engine/player/create';
import { MAX_SECONDARY_POSITIONS, daysInMonth, stylesFor } from '@/engine/player/create';
import type { AvatarConfig } from '@/engine/types/player';
import type { Foot } from '@/engine/types/common';

export interface StepProps {
  draft: CharacterInput;
  update: (patch: Partial<CharacterInput>) => void;
}

const CONTENT = { styles: PLAY_STYLES, traits: TRAITS };

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Swatches({ label, value, colors, onChange }: { label: string; value: string; colors: readonly string[]; onChange: (c: string) => void }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="swatch-row" role="group" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={c}
            type="button"
            className="swatch-btn"
            style={{ background: c }}
            aria-pressed={value === c}
            aria-label={`${label} ${i + 1}`}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 1. Origen ─────────────────────────────────────────── */

export function OriginStep({ draft, update, seed, setSeed, locked }: StepProps & { seed: string; setSeed: (s: string) => void; locked: boolean }) {
  const country = WORLD.countryById.get(draft.birthPlace.country);
  const regions = country?.regions ?? [];
  const region = regions.find((r) => r.name === draft.birthPlace.region) ?? regions[0];
  const countries = [...WORLD.countries].sort((a, b) => lt(a.name).localeCompare(lt(b.name), 'es'));
  const second = draft.nationalities[1] ?? '';

  const setCountry = (id: string) => {
    const c = WORLD.countryById.get(id);
    const r = c?.regions[0];
    update({
      birthPlace: { country: id, region: r?.name ?? '', city: r?.cities[0] ?? '' },
      nationalities: [id, ...draft.nationalities.slice(1).filter((n) => n !== id)],
    });
  };

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="cr-name">{t('creation.name')}</label>
        <input id="cr-name" className="input" value={draft.name} maxLength={40} placeholder={t('creation.namePlaceholder')} onChange={(e) => update({ name: e.target.value })} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="cr-nick">{t('creation.nickname')}</label>
        <input id="cr-nick" className="input" value={draft.nickname ?? ''} maxLength={24} onChange={(e) => update({ nickname: e.target.value })} />
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="cr-country">{t('creation.birthCountry')}</label>
          <select id="cr-country" className="select" value={draft.birthPlace.country} disabled={locked} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {lt(c.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cr-region">{t('creation.region')}</label>
          <select
            id="cr-region"
            className="select"
            value={region?.name ?? ''}
            disabled={locked}
            onChange={(e) => {
              const r = regions.find((x) => x.name === e.target.value);
              update({ birthPlace: { ...draft.birthPlace, region: e.target.value, city: r?.cities[0] ?? '' } });
            }}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cr-city">{t('creation.city')}</label>
          <select id="cr-city" className="select" value={draft.birthPlace.city} disabled={locked} onChange={(e) => update({ birthPlace: { ...draft.birthPlace, city: e.target.value } })}>
            {(region?.cities ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="cr-nat2">{t('creation.secondNationality')}</label>
        <select
          id="cr-nat2"
          className="select"
          value={second}
          onChange={(e) => update({ nationalities: e.target.value ? [draft.nationalities[0]!, e.target.value] : [draft.nationalities[0]!] })}
        >
          <option value="">{t('creation.none')}</option>
          {countries
            .filter((c) => c.id !== draft.nationalities[0])
            .map((c) => (
              <option key={c.id} value={c.id}>
                {lt(c.name)}
              </option>
            ))}
        </select>
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="cr-day">{t('creation.day')}</label>
          <select id="cr-day" className="select" value={draft.birthDay} onChange={(e) => update({ birthDay: Number(e.target.value) })}>
            {Array.from({ length: daysInMonth(draft.birthMonth) }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cr-month">{t('creation.month')}</label>
          <select
            id="cr-month"
            className="select"
            value={draft.birthMonth}
            onChange={(e) => {
              const m = Number(e.target.value);
              update({ birthMonth: m, birthDay: Math.min(draft.birthDay, daysInMonth(m)) });
            }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {tDynamic(`months.${m}`)}
              </option>
            ))}
          </select>
        </div>
        <Segmented<Foot>
          label={t('creation.foot')}
          value={draft.foot}
          options={(['derecho', 'izquierdo', 'ambidiestro'] as const).map((f) => ({ value: f, label: tDynamic(`creation.feet.${f}`) }))}
          onChange={(foot) => update({ foot })}
        />
      </div>

      <div className="field">
        <label htmlFor="cr-seed">{t('creation.seed')}</label>
        <input id="cr-seed" className="input" value={seed} maxLength={40} disabled={locked} onChange={(e) => setSeed(e.target.value)} />
        <span className="hint">{locked ? t('creation.seedLocked') : t('creation.seedHint')}</span>
      </div>
    </div>
  );
}

/* ── 2. Aspecto ────────────────────────────────────────── */

export function LookStep({ draft, update }: StepProps) {
  const look = draft.appearance;
  const set = (patch: Partial<AvatarConfig>) => update({ appearance: { ...look, ...patch } });
  const random = () => {
    const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;
    set({
      skinTone: Math.floor(Math.random() * SKIN_TONES.length),
      hairStyle: pick(HAIR_STYLES),
      hairColor: pick(HAIR_COLORS.slice(0, 7)),
      facialHair: Math.random() < 0.7 ? 'ninguno' : pick(FACIAL_HAIR),
      eyeColor: pick(EYE_COLORS),
      height: Math.round(165 + Math.random() * 25),
      build: pick(BUILDS),
    });
  };

  return (
    <div className="stack">
      <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={random}>
        🎲 {t('creation.randomLook')}
      </button>
      <div className="field">
        <span className="field-label">{t('creation.skin')}</span>
        <div className="swatch-row" role="group" aria-label={t('creation.skin')}>
          {SKIN_TONES.map((c, i) => (
            <button key={c} type="button" className="swatch-btn" style={{ background: c }} aria-pressed={look.skinTone === i} aria-label={`${t('creation.skin')} ${i + 1}`} onClick={() => set({ skinTone: i })} />
          ))}
        </div>
      </div>
      <Segmented label={t('creation.hair')} value={look.hairStyle} options={HAIR_STYLES.map((h) => ({ value: h, label: tDynamic(`avatar.hair.${h}`) }))} onChange={(hairStyle) => set({ hairStyle })} />
      <Swatches label={t('creation.hairColor')} value={look.hairColor} colors={HAIR_COLORS} onChange={(hairColor) => set({ hairColor })} />
      <Segmented label={t('creation.facial')} value={look.facialHair} options={FACIAL_HAIR.map((f) => ({ value: f, label: tDynamic(`avatar.facial.${f}`) }))} onChange={(facialHair) => set({ facialHair })} />
      <Swatches label={t('creation.eyes')} value={look.eyeColor ?? EYE_COLORS[0]} colors={EYE_COLORS} onChange={(eyeColor) => set({ eyeColor })} />
      <Segmented label={t('creation.accessory')} value={look.accessory ?? 'ninguno'} options={ACCESSORIES.map((a) => ({ value: a, label: tDynamic(`avatar.accessory.${a}`) }))} onChange={(accessory) => set({ accessory })} />
      <div className="field">
        <label htmlFor="cr-height">
          {t('creation.height')}: <strong>{t('creation.heightValue', { cm: look.height })}</strong>
        </label>
        <input id="cr-height" type="range" min={HEIGHT_RANGE[0]} max={HEIGHT_RANGE[1]} value={look.height} onChange={(e) => set({ height: Number(e.target.value) })} />
      </div>
      <Segmented<AvatarConfig['build']> label={t('creation.build')} value={look.build} options={BUILDS.map((b) => ({ value: b, label: tDynamic(`avatar.build.${b}`) }))} onChange={(build) => set({ build })} />
      <Swatches label={t('creation.boots')} value={look.boots} colors={BOOT_COLORS} onChange={(boots) => set({ boots })} />
    </div>
  );
}

/* ── 3. Posición ───────────────────────────────────────── */

/** Coordenadas (% ancho, % alto) de cada posición en el campo vertical. */
const PITCH_SPOTS: Record<Position, [number, number]> = {
  DC: [50, 12], EI: [17, 22], ED: [83, 22], MCO: [50, 32], MI: [15, 46], MD: [85, 46], MC: [50, 47],
  MCD: [50, 61], LI: [15, 72], LD: [85, 72], DFC: [50, 77], POR: [50, 92],
};

export function PositionStep({ draft, update }: StepProps) {
  const setMain = (p: Position) => {
    const keeper = p === 'POR';
    const secondary = draft.secondaryPositions.filter((s) => s !== p && (s === 'POR') === keeper);
    const style = stylesFor(p, CONTENT).some((s) => s.id === draft.style) ? draft.style : (stylesFor(p, CONTENT)[0]?.id ?? draft.style);
    update({ mainPosition: p, secondaryPositions: secondary, style, preferredNumber: keeper && draft.preferredNumber !== 1 && draft.mainPosition !== 'POR' ? 1 : draft.preferredNumber });
  };
  const toggleSecondary = (p: Position) => {
    const has = draft.secondaryPositions.includes(p);
    if (has) update({ secondaryPositions: draft.secondaryPositions.filter((s) => s !== p) });
    else if (draft.secondaryPositions.length < MAX_SECONDARY_POSITIONS) update({ secondaryPositions: [...draft.secondaryPositions, p] });
  };
  const keeper = draft.mainPosition === 'POR';

  return (
    <div className="stack">
      <span className="field-label">{t('creation.mainPosition')}</span>
      <div className="pitch" role="group" aria-label={t('creation.mainPosition')}>
        <div className="pitch-lines" aria-hidden="true">
          <span className="pitch-half" />
          <span className="pitch-circle" />
          <span className="pitch-box pitch-box-top" />
          <span className="pitch-box pitch-box-bottom" />
        </div>
        {POSITIONS.map((p) => {
          const [x, y] = PITCH_SPOTS[p];
          const isMain = draft.mainPosition === p;
          const isSecondary = draft.secondaryPositions.includes(p);
          return (
            <button
              key={p}
              type="button"
              className={`pitch-spot${isMain ? ' is-main' : ''}${isSecondary ? ' is-secondary' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-pressed={isMain}
              aria-label={tDynamic(`pos.${p}`)}
              title={tDynamic(`pos.${p}`)}
              onClick={() => setMain(p)}
            >
              {p}
            </button>
          );
        })}
      </div>
      <p className="small muted">
        {draft.mainPosition} · {tDynamic(`pos.${draft.mainPosition}`)}
      </p>

      <div className="field">
        <span className="field-label">{t('creation.secondary')}</span>
        <div className="chip-row" role="group" aria-label={t('creation.secondary')}>
          {POSITIONS.filter((p) => p !== draft.mainPosition && (p === 'POR') === keeper).map((p) => {
            const on = draft.secondaryPositions.includes(p);
            return (
              <button
                key={p}
                type="button"
                className="chip"
                aria-pressed={on}
                disabled={!on && draft.secondaryPositions.length >= MAX_SECONDARY_POSITIONS}
                title={tDynamic(`pos.${p}`)}
                onClick={() => toggleSecondary(p)}
              >
                {p}
              </button>
            );
          })}
        </div>
        <span className="hint">{t('creation.secondaryHint')}</span>
      </div>

      <div className="field" style={{ maxWidth: 160 }}>
        <label htmlFor="cr-number">{t('creation.number')}</label>
        <input
          id="cr-number"
          className="input"
          type="number"
          min={1}
          max={99}
          value={draft.preferredNumber}
          onChange={(e) => update({ preferredNumber: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
        />
      </div>
    </div>
  );
}

/* ── 4. Estilo ─────────────────────────────────────────── */

export function StyleStep({ draft, update }: StepProps) {
  const styles = stylesFor(draft.mainPosition, CONTENT);
  return (
    <div className="stack">
      <p className="muted small">{t('creation.styleIntro')}</p>
      <div className="option-grid" role="radiogroup" aria-label={t('creation.steps.style')}>
        {styles.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={draft.style === s.id} className="option-card" onClick={() => update({ style: s.id })}>
            <strong>{lt(s.name)}</strong>
            <span className="small muted">{lt(s.description)}</span>
            <span className="option-tags">
              {Object.entries(s.bonuses).map(([attr, v]) => (
                <span key={attr} className="badge badge-accent">
                  {tDynamic(`attr.${attr}`)} +{v}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 5. Personalidad ───────────────────────────────────── */

export function TraitsStep({ draft, update }: StepProps) {
  const selectable = TRAITS.filter((tr) => tr.selectableAtStart);
  const toggle = (id: string) => {
    if (draft.traits.includes(id)) update({ traits: draft.traits.filter((x) => x !== id) });
    else if (draft.traits.length < STARTING_TRAIT_COUNT) update({ traits: [...draft.traits, id] });
  };
  return (
    <div className="stack">
      <p className="muted small">{t('creation.traitsIntro', { n: STARTING_TRAIT_COUNT })}</p>
      <p className="small" aria-live="polite">
        {t('creation.traitsCount', { n: draft.traits.length, total: STARTING_TRAIT_COUNT })}
      </p>
      <div className="option-grid">
        {selectable.map((tr) => {
          const on = draft.traits.includes(tr.id);
          const clash = selectable.find((o) => draft.traits.includes(o.id) && (o.opposites?.includes(tr.id) || tr.opposites?.includes(o.id)));
          const disabled = !on && (draft.traits.length >= STARTING_TRAIT_COUNT || Boolean(clash));
          return (
            <button key={tr.id} type="button" className="option-card" aria-pressed={on} disabled={disabled} onClick={() => toggle(tr.id)}>
              <strong>{lt(tr.name)}</strong>
              <span className="small muted">{lt(tr.description)}</span>
              {clash && !on && <span className="small warn-text">{t('creation.incompatible', { trait: lt(clash.name) })}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
