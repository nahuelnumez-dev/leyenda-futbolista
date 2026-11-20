/**
 * <Cinematic type data /> — escenas animadas a pantalla completa para los momentos clave de la carrera.
 * Cada tipo tiene su propia escena (scenes.tsx): el gol se ve desde el disparo, el título con la copa en alto,
 * el premio en la gala... Con «reducir movimiento» se muestra un fotograma fijo con el texto.
 * Se cierran solas (o con clic, Intro, Espacio o Escape).
 */
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { t as tr, tDynamic } from '@/i18n';
import { WORLD } from '@/data';
import { CELEBRATIONS } from '@/data/celebrations';
import { ACHIEVEMENTS } from '@/data/achievements';
import type { CinematicData, CinematicType } from '@/engine/cinematics/cinematics';
import type { AvatarConfig } from '@/engine/types/player';
import { awardName, competitionName, nationalTeamName } from '../competitionNames';
import { useClock } from './anim';
import { lookFrom } from './Figure';
import { SharedDefs } from './decor';
import { SCENES, sceneKit } from './scenes';

interface CinematicProps {
  type: CinematicType;
  data: CinematicData;
  appearance: AvatarConfig;
  playerName: string;
  shirtNumber?: number;
  reduceMotion: boolean;
  onDone: () => void;
  /** Depuración: congela la escena en este segundo (sin cierre automático). */
  freezeAt?: number;
}

const GLOOMY: CinematicType[] = ['relegation', 'injury'];
const money = new Intl.NumberFormat('es', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });

function texts(type: CinematicType, d: CinematicData, playerName: string) {
  const club = d.clubId ? WORLD.clubById.get(d.clubId) : undefined;
  const rival = d.opponentId ? WORLD.clubById.get(d.opponentId)?.shortName : d.opponentName;
  const vars = {
    nombre: playerName,
    club: club?.shortName ?? '',
    rival: rival ?? '',
    estadio: club?.stadium.name ?? '',
    competicion: d.competitionId ? competitionName(d.competitionId) : '',
    premio: d.awardId ? awardName(d.awardId, d.competitionId) : '',
    pais: nationalTeamName(d.country),
    valor: d.value ? money.format(d.value) : '',
    goles: d.value ?? 3,
    temporadas: d.value ?? 0,
    logro: ACHIEVEMENTS.find((a) => a.id === d.template)?.name.es ?? '',
  };
  const key = `cinematics.${type}`;
  return {
    kicker: tDynamic(`${key}.kicker`, vars),
    title: tDynamic(`${key}.title`, vars),
    subtitle: tDynamic(type === 'transfer' && !d.value ? `${key}.subtitleFree` : `${key}.subtitle`, vars),
  };
}

export function Cinematic({ type, data, appearance, playerName, shirtNumber = 10, reduceMotion, onDone, freezeAt }: CinematicProps) {
  const scene = SCENES[type] ?? SCENES.custom;
  const club = data.clubId ? WORLD.clubById.get(data.clubId) : undefined;
  const kit = sceneKit(type, data, club?.colors);
  const look = useMemo(() => lookFrom(appearance), [appearance]);
  const celebration = CELEBRATIONS.find((c) => c.id === data.celebration) ?? CELEBRATIONS[0]!;
  const { kicker, title, subtitle } = texts(type, data, playerName);
  const isGoal = type === 'firstGoal' || type === 'hatTrick';
  const frozen = freezeAt !== undefined;
  const clock = useClock(reduceMotion || frozen, frozen ? freezeAt : scene.still);
  const t = Math.min(frozen ? freezeAt : clock, scene.duration);
  const durationMs = scene.duration * 1000;

  useEffect(() => {
    const timer = frozen ? undefined : setTimeout(onDone, reduceMotion ? 6500 : durationMs + 400);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        onDone();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [onDone, durationMs, reduceMotion, frozen]);

  const textDelay = reduceMotion || frozen ? 0 : scene.textAt;
  const bars = reduceMotion ? 1 : Math.min(1, t / 0.6);

  // Portal: las pantallas se animan con transform, y eso rompería el position: fixed.
  return createPortal(
    <div className={`cine ${GLOOMY.includes(type) ? 'cine-gloomy' : ''}`} role="dialog" aria-modal="true" aria-label={`${kicker}: ${title}`} onClick={onDone}>
      <div className="cine-scene" aria-hidden="true">
        <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice">
          <SharedDefs />
          {scene.render({ t, data, look, kit, ...(club ? { club } : {}), celebration, shirtNumber, playerName })}
          <rect x="-50" y="-50" width="900" height="550" fill="url(#vignette)" pointerEvents="none" />
          <rect x="-50" y={-50 + (1 - bars) * -30} width="900" height="70" fill="#000" />
          <rect x="-50" y={432 + (1 - bars) * 30} width="900" height="70" fill="#000" />
        </svg>
      </div>

      <div className={`cine-text ${scene.textPos === 'bottom' ? 'cine-text-bottom' : ''}`}>
        <motion.span className="cine-kicker" initial={reduceMotion ? false : { opacity: 0, letterSpacing: '0.6em' }} animate={{ opacity: 1, letterSpacing: '0.3em' }} transition={{ duration: 0.7, delay: textDelay }}>
          {kicker}
        </motion.span>
        <motion.h2 className="cine-title" initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: textDelay + 0.1, duration: 0.55, type: 'spring', stiffness: 160, damping: 16 }}>
          {title}
        </motion.h2>
        <motion.p className="cine-subtitle" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: textDelay + 0.6, duration: 0.6 }}>
          {subtitle}
          {isGoal && <span className="cine-celebration"> · {celebration.symbol} {celebration.name}</span>}
        </motion.p>
      </div>

      <div className="cine-footer">
        {!reduceMotion && <motion.span className="cine-progress" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: scene.duration, ease: 'linear' }} />}
        <button
          className="btn btn-ghost cine-skip"
          autoFocus
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
        >
          {tr('cinematics.skip')}
        </button>
      </div>
    </div>,
    document.body,
  );
}
