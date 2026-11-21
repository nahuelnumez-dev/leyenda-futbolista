/** Pestaña Especialidades: las conseguidas, la que entrena y lo que le falta para las demás. */
import { lt, t, tDynamic } from '@/i18n';
import { SPECIALTIES } from '@/data/specialties';
import type { GameState } from '@/engine/types/game';
import type { SpecialtyDef, SpecialtyGroup } from '@/engine/types/definitions';
import { requirements, specialtyApplies, specialtyProgress, thresholdDiscount } from '@/engine/player/specialties';

const GROUPS: SpecialtyGroup[] = ['shooting', 'passing', 'dribbling', 'physical', 'defending', 'mental', 'goalkeeping'];

export function SpecialtiesPanel({ game, onFocus }: { game: GameState; onFocus: (id: string | null) => void }) {
  const p = game.player;
  const owned = new Map((p.specialties ?? []).map((s) => [s.id, s.level]));
  const available = SPECIALTIES.filter((d) => specialtyApplies(d, p));
  const focus = SPECIALTIES.find((d) => d.id === p.specialtyFocus);
  const mine = available.filter((d) => owned.has(d.id));

  return (
    <div className="stack">
      <div className="card stack">
        <h3>{t('specialties.mine', { n: mine.length })}</h3>
        {mine.length === 0 ? (
          <p className="small muted">{t('specialties.none')}</p>
        ) : (
          <div className="chip-row">
            {mine.map((d) => (
              <span key={d.id} className={`badge ${owned.get(d.id) === 2 ? 'badge-warn' : 'badge-accent'}`}>
                {owned.get(d.id) === 2 ? '★★ ' : '★ '}
                {lt(d.name)}
              </span>
            ))}
          </div>
        )}
        <p className="small muted">
          {focus ? t('specialties.focusOn', { name: lt(focus.name) }) : t('specialties.focusOff')}
        </p>
        <p className="small faint">{t('specialties.help')}</p>
      </div>

      {GROUPS.map((g) => {
        const list = available.filter((d) => d.group === g);
        if (!list.length) return null;
        return (
          <section key={g} className="card stack">
            <h3>{tDynamic(`specialties.group.${g}`)}</h3>
            <ul className="achievement-list">
              {list.map((d) => (
                <SpecialtyRow key={d.id} def={d} game={game} level={owned.get(d.id) ?? 0} focused={p.specialtyFocus === d.id} onFocus={onFocus} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SpecialtyRow({ def, game, level, focused, onFocus }: { def: SpecialtyDef; game: GameState; level: number; focused: boolean; onFocus: (id: string | null) => void }) {
  const p = game.player;
  const next = (level >= 1 ? 2 : 1) as 1 | 2;
  const reqs = requirements(def, p, next);
  const pct = Math.round(specialtyProgress(def, p, next) * 100);
  const discount = thresholdDiscount(def, p);
  return (
    <li className={`achievement ${level > 0 ? 'is-unlocked' : ''}`}>
      <strong>
        {level === 2 ? '★★ ' : level === 1 ? '★ ' : ''}
        {lt(def.name)}
        {def.signature && <span className="badge badge-pitch" style={{ marginLeft: 6 }}>{t('specialties.signature')}</span>}
      </strong>
      <span className="small muted">{lt(def.description)}</span>
      <span className="small">
        {level < 2 && (level === 1 ? t('specialties.toElite') : t('specialties.toUnlock'))}
        {level < 2 &&
          reqs.map(([id, v], i) => (
            <span key={id} className={p.attributes[id] >= v ? 'delta-up' : 'faint'}>
              {i ? ' · ' : ' '}
              {tDynamic(`attr.${id}`)} {p.attributes[id]}/{v}
            </span>
          ))}
        {level === 2 && <span className="delta-up">{t('specialties.maxed')}</span>}
      </span>
      {discount > 0 && <span className="small faint">{t('specialties.discount', { n: discount })}</span>}
      {level < 2 && (
        <span className="meter" aria-label={t('achievements.progress', { pct })}>
          <span style={{ width: `${pct}%` }} />
        </span>
      )}
      {level < 2 && (
        <button type="button" className={`btn ${focused ? 'btn-primary' : ''}`} style={{ alignSelf: 'flex-start', marginTop: 4 }} aria-pressed={focused} onClick={() => onFocus(focused ? null : def.id)}>
          {focused ? t('specialties.training') : t('specialties.train')}
        </button>
      )}
    </li>
  );
}
