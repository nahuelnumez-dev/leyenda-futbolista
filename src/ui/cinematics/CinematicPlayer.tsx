/**
 * Reproduce la cola de cinemáticas de la partida según el ajuste del jugador:
 * «todas», «solo importantes» (las 'major') o «desactivadas».
 */
import { useEffect } from 'react';
import type { GameState } from '@/engine/types/game';
import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import { Cinematic } from './Cinematic';

/** ¿Hay una cinemática que se va a mostrar ahora? */
export function visibleCinematic(game: GameState, setting: 'all' | 'important' | 'off') {
  const next = game.cinematics?.[0];
  if (!next || setting === 'off') return null;
  if (setting === 'important' && next.importance !== 'major') return null;
  return next;
}

export function CinematicPlayer({ game }: { game: GameState }) {
  const setting = useUi((s) => s.settings.cinematics);
  const reduceMotion = useUi((s) => s.settings.reduceMotion);
  const next = useGame((s) => s.nextCinematic);
  const pending = game.cinematics?.[0];
  const visible = visibleCinematic(game, setting);

  // Las que no se van a ver se descartan solas para no bloquear la cola.
  useEffect(() => {
    if (pending && !visible) next();
  }, [pending, visible, next]);

  if (!visible) return null;
  return (
    <Cinematic
      key={`${visible.type}-${visible.season}-${game.cinematics?.length}`}
      type={visible.type}
      data={visible}
      appearance={game.player.appearance}
      playerName={game.player.identity.nickname ?? game.player.identity.name}
      shirtNumber={game.player.contract?.shirtNumber ?? game.player.preferredNumber}
      reduceMotion={reduceMotion}
      onDone={next}
    />
  );
}
