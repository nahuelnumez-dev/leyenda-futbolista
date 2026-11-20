/** Pestaña Logros: bronce, plata, oro y leyenda, con progreso de los que tienen métrica. */
import { lt, t, tDynamic } from '@/i18n';
import { ACHIEVEMENTS } from '@/data/achievements';
import type { GameState } from '@/engine/types/game';
import type { Tier } from '@/engine/types/common';

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'legend'];
const ICON: Record<Tier, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', legend: '👑' };

export function AchievementsPanel({ game }: { game: GameState }) {
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter((a) => game.achievements[a.id]?.unlocked).length;
  return (
    <div className="stack">
      <p className="small muted">{t('achievements.summary', { n: done, total })}</p>
      {TIERS.map((tier) => (
        <section key={tier} className="card stack">
          <h3>
            {ICON[tier]} {tDynamic(`achievements.tier.${tier}`)}
          </h3>
          <ul className="achievement-list">
            {ACHIEVEMENTS.filter((a) => a.tier === tier).map((a) => {
              const st = game.achievements[a.id];
              const unlocked = Boolean(st?.unlocked);
              const hidden = a.hidden && !unlocked;
              return (
                <li key={a.id} className={`achievement ${unlocked ? 'is-unlocked' : ''} tier-${tier}`}>
                  <strong>{hidden ? t('achievements.hidden') : lt(a.name)}</strong>
                  <span className="small muted">{hidden ? t('achievements.hiddenHint') : lt(a.description)}</span>
                  {unlocked && st?.unlockedSeason && <span className="small faint">{t('achievements.unlocked', { season: st.unlockedSeason })}</span>}
                  {!unlocked && !hidden && a.progress && (
                    <span className="meter" aria-label={t('achievements.progress', { pct: Math.round((st?.progress ?? 0) * 100) })}>
                      <span style={{ width: `${Math.round((st?.progress ?? 0) * 100)}%` }} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
