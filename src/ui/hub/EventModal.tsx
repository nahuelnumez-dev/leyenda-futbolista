/**
 * Situaciones: en la versión alternativa casi todas se juegan con un minijuego (ganar da recompensas y perder,
 * penalizaciones); las estructurales (traspasos, agentes, retirada) siguen mostrando opciones.
 * Después se ve el resultado y los cambios. No se puede cerrar sin resolver.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { lt, t, tDynamic } from '@/i18n';
import { ENGINE_CONTENT } from '@/data';
import { TRAITS } from '@/data/traits';
import type { GameState } from '@/engine/types/game';
import { checkAll } from '@/engine/events/conditions';
import { fill } from '@/engine/events/context';
import { useGame } from '@/store/gameStore';
import { isMinigameEvent, minigameFor, themeOf, type MinigameId } from '@/engine/minigames/minigames';
import { MINIGAME_ICON, MinigamePlayer } from '../minigames/Minigames';

const SPEAKER_ICON: Record<string, string> = {
  coach: '📋', agent: '💼', press: '🎙️', fans: '📣', teammate: '👟', board: '🏛️', family: '🏠', social: '📱', narrator: '⚽',
};

const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function changeLabel(key: string, value: number | string): string {
  if (key === 'effects.money' && typeof value === 'number') return `${t('effects.money')} ${value > 0 ? '+' : ''}${money.format(value)}`;
  if (key.startsWith('effects.trait')) {
    const name = lt(TRAITS.find((x) => x.id === value)?.name ?? { es: String(value) });
    return tDynamic(key, { trait: name });
  }
  if (typeof value === 'string') return tDynamic(key, { value });
  return `${tDynamic(key)} ${value > 0 ? '+' : ''}${value}`;
}

export function EventModal({ game }: { game: GameState }) {
  const choose = useGame((s) => s.choose);
  const playMinigame = useGame((s) => s.playMinigame);
  // Índice del último resultado ya visto (para mostrar cada resultado una sola vez).
  const [seenOutcome, setSeenOutcome] = useState(game.eventLog.length);
  const showOutcome = Boolean(game.lastOutcome) && seenOutcome < game.eventLog.length;
  const active = game.activeEvent;
  const ev = active ? ENGINE_CONTENT.events.find((e) => e.id === active.eventId) : undefined;
  if (!showOutcome && !ev) return null;

  const outcomeEvent = game.lastOutcome ? ENGINE_CONTENT.events.find((e) => e.id === game.lastOutcome!.eventId) : undefined;
  const shown = showOutcome ? outcomeEvent : ev;
  const vars = active?.vars ?? {};
  const spec = !showOutcome && ev && isMinigameEvent(ev) ? minigameFor(game, ev) : undefined;
  const played = showOutcome ? game.lastOutcome?.minigame : undefined;

  return (
    <div className="modal-backdrop event-backdrop" role="presentation">
      <AnimatePresence mode="wait">
        <motion.div
          key={showOutcome ? `out-${game.eventLog.length}` : active?.eventId}
          className={`modal event-card${spec ? ' minigame-card' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-title"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.22 }}
        >
          <div className="event-head">
            <span className="event-icon" aria-hidden="true">
              {SPEAKER_ICON[shown?.speaker ?? 'narrator']}
            </span>
            <span className="slot-label">{tDynamic(`events.category.${shown?.category ?? 'personal'}`)}</span>
          </div>

          {showOutcome && game.lastOutcome ? (
            <>
              <h2 id="event-title">{fill(outcomeEvent?.title.es ?? '', vars)}</h2>
              {played && (
                <p className="mg-summary">
                  <span aria-hidden="true">{MINIGAME_ICON[played.id as MinigameId] ?? '⚽'}</span>{' '}
                  {t('minigames.summary', { name: tDynamic(`minigames.${played.id}.name`), ok: played.successes, total: played.rounds })}
                  {' · '}
                  <strong>{tDynamic(`minigames.tier.${played.tier}`)}</strong>
                </p>
              )}
              {game.lastOutcome.success !== undefined && (
                <p className={game.lastOutcome.success ? 'trial-ok' : 'trial-ko'}>{game.lastOutcome.success ? t('events.success') : t('events.failure')}</p>
              )}
              {game.lastOutcome.text && <p className="event-text">{game.lastOutcome.text}</p>}
              {game.lastOutcome.changes.length > 0 && (
                <ul className="change-list">
                  {game.lastOutcome.changes.map((c, i) => (
                    <li key={i} className={typeof c.value === 'number' ? (c.value > 0 ? 'delta-up' : 'delta-down') : ''}>
                      {changeLabel(c.key, c.value)}
                    </li>
                  ))}
                </ul>
              )}
              <div className="modal-actions">
                <button className="btn btn-primary" autoFocus onClick={() => setSeenOutcome(game.eventLog.length)}>
                  {game.activeEvent ? t('events.next') : t('events.continue')}
                </button>
              </div>
            </>
          ) : ev && spec ? (
            <>
              <h2 id="event-title">{fill(ev.title.es, vars)}</h2>
              <p className="event-text">{fill(ev.text.es, vars)}</p>
              <MinigamePlayer key={`${active?.eventId}-${game.eventLog.length}`} spec={spec} stakes={tDynamic(`minigames.theme.${themeOf(ev)}`)} onDone={playMinigame} />
              {(game.eventQueue?.length ?? 0) > 0 && <p className="faint small">{game.eventQueue!.length === 1 ? t('events.pendingOne') : t('events.pending', { n: game.eventQueue!.length })}</p>}
            </>
          ) : ev ? (
            <>
              <h2 id="event-title">{fill(ev.title.es, vars)}</h2>
              <p className="event-text">{fill(ev.text.es, vars)}</p>
              <div className="event-options">
                {ev.options.map((o, i) => {
                  const ok = checkAll(o.requires, game, ENGINE_CONTENT);
                  return (
                    <button key={o.id} className="btn event-option" disabled={!ok} autoFocus={i === 0} onClick={() => choose(o.id)}>
                      <span className="event-option-n">{i + 1}</span>
                      <span>{fill(o.text.es, vars)}</span>
                      {o.roll && <span className="badge" title={t('events.riskHint')}>🎲</span>}
                    </button>
                  );
                })}
              </div>
              {(game.eventQueue?.length ?? 0) > 0 && <p className="faint small">{game.eventQueue!.length === 1 ? t('events.pendingOne') : t('events.pending', { n: game.eventQueue!.length })}</p>}
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
