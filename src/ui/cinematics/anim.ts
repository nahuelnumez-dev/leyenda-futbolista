/**
 * Mini motor de animación de las cinemáticas: un reloj con requestAnimationFrame, interpolación por fotogramas
 * clave y poses articuladas del jugador (cinemática directa). Las transformaciones se escriben como atributos
 * SVG en cada fotograma, así cada articulación gira sobre su propio punto sin depender de transform-origin.
 */
import { useEffect, useRef, useState } from 'react';

/** Segundos transcurridos desde que se monta la escena (fijo en `still` si se reduce el movimiento). */
export function useClock(reduceMotion: boolean, still: number): number {
  const [t, setT] = useState(reduceMotion ? still : 0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    if (reduceMotion) return;
    let raf = 0;
    const tick = (now: number) => {
      start.current ??= now;
      setT((now - start.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);
  return t;
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
export const easeOut = (u: number) => 1 - (1 - u) ** 3;
export const easeIn = (u: number) => u * u * u;
/** Rebote al final (aterrizajes, objetos que caen). */
export const easeOutBack = (u: number) => 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2;

/** Progreso 0-1 de un tramo [from, to] del reloj. */
export const seg = (t: number, from: number, to: number, ease: (u: number) => number = (u) => u) => ease(clamp01((t - from) / (to - from)));

/** Interpolación por fotogramas clave: [[segundo, valor], ...] con suavizado entre cada par. */
export function kf(t: number, frames: [number, number][], ease: (u: number) => number = easeInOut): number {
  if (t <= frames[0]![0]) return frames[0]![1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1] = frames[i]!;
    const [t0, v0] = frames[i - 1]!;
    if (t <= t1) return lerp(v0, v1, ease((t - t0) / (t1 - t0 || 1)));
  }
  return frames[frames.length - 1]![1];
}

/**
 * Pose del jugador visto de lado, mirando a la derecha. Ángulos en grados:
 * - piernas (lB/lF) y brazos (aB/aF): positivo = hacia delante; 0 = colgando; 180 = brazo arriba.
 * - rodillas (kB/kF): flexión hacia atrás. Codos (eB/eF): flexión hacia delante.
 * - lean: inclinación del tronco hacia delante. head: barbilla hacia el pecho (negativo = mirar arriba).
 * - rot: giro de todo el cuerpo alrededor de la cadera (volteretas, caídas).
 */
export interface Pose {
  x: number;
  y: number;
  lean: number;
  head: number;
  aB: number;
  eB: number;
  aF: number;
  eF: number;
  lB: number;
  kB: number;
  lF: number;
  kF: number;
  rot: number;
}

/** Medidas del cuerpo (unidades del SVG de la escena a escala 1). */
export const BODY = { torso: 58, upperArm: 26, foreArm: 24, thigh: 37, shin: 37, shoulderY: -52, headY: -74, headR: 13 };
/** Altura de la cadera sobre el suelo con las piernas rectas. */
export const HIP_HEIGHT = BODY.thigh + BODY.shin + 4;

export const STAND: Pose = { x: 0, y: 0, lean: 2, head: 0, aB: -6, eB: 12, aF: 8, eF: 14, lB: -4, kB: 4, lF: 5, kF: 3, rot: 0 };

export function mix(a: Pose, b: Pose, u: number): Pose {
  const out = { ...a };
  for (const k of Object.keys(a) as (keyof Pose)[]) out[k] = lerp(a[k], b[k], u);
  return out;
}

/** Secuencia de poses: [[segundo, pose], ...]. */
export function poseAt(t: number, frames: [number, Partial<Pose>][], base: Pose = STAND, ease = easeInOut): Pose {
  const full = frames.map(([s, p]) => [s, { ...base, ...p }] as [number, Pose]);
  if (t <= full[0]![0]) return full[0]![1];
  for (let i = 1; i < full.length; i++) {
    const [t1, p1] = full[i]!;
    const [t0, p0] = full[i - 1]!;
    if (t <= t1) return mix(p0, p1, ease((t - t0) / (t1 - t0 || 1)));
  }
  return full[full.length - 1]![1];
}

/** Ciclo de carrera (fase en radianes). `speed` 0-1 abre más o menos la zancada. */
export function runPose(phase: number, speed = 1): Partial<Pose> {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  return {
    lean: 10 + 6 * speed,
    head: -4,
    lF: 38 * s * speed,
    lB: -38 * s * speed,
    kF: 18 + 55 * Math.max(0, -c) * speed,
    kB: 18 + 55 * Math.max(0, c) * speed,
    aF: -42 * s * speed,
    aB: 42 * s * speed,
    eF: 80,
    eB: 80,
    y: -5 * Math.abs(c) * speed,
  };
}

/** Ciclo de paseo. */
export function walkPose(phase: number): Partial<Pose> {
  const s = Math.sin(phase);
  return { lean: 3, lF: 20 * s, lB: -20 * s, kF: 6 + 14 * Math.max(0, -Math.cos(phase)), kB: 6 + 14 * Math.max(0, Math.cos(phase)), aF: -16 * s, aB: 16 * s, eF: 18, eB: 18, y: -2 * Math.abs(Math.cos(phase)) };
}

const rad = (d: number) => (d * Math.PI) / 180;

/** Posición de la mano delantera/trasera en coordenadas de la escena (para colgarle una copa, un balón...). */
export function handPosition(p: Pose, which: 'front' | 'back', scale = 1, facing: 1 | -1 = 1): { x: number; y: number } {
  const arm = which === 'front' ? p.aF : p.aB;
  const elbow = which === 'front' ? p.eF : p.eB;
  // Tronco (inclinado `lean` en sentido horario) y luego brazo (sentido antihorario = hacia delante).
  const torsoAng = rad(p.lean + p.rot);
  const shoulder = rotate(0, BODY.shoulderY, torsoAng);
  const upperAng = torsoAng - rad(arm);
  const elbowP = add(shoulder, rotate(0, BODY.upperArm, upperAng));
  const foreAng = upperAng - rad(elbow);
  const hand = add(elbowP, rotate(0, BODY.foreArm, foreAng));
  return { x: p.x + facing * hand.x * scale, y: p.y + hand.y * scale };
}

/** Posición de la punta del pie delantero (para golpear el balón). */
export function footPosition(p: Pose, scale = 1, facing: 1 | -1 = 1): { x: number; y: number } {
  const hipAng = rad(p.rot) - rad(p.lF);
  const knee = rotate(0, BODY.thigh, hipAng);
  const shinAng = hipAng + rad(p.kF);
  const foot = add(knee, rotate(0, BODY.shin, shinAng));
  return { x: p.x + facing * (foot.x + 6) * scale, y: p.y + foot.y * scale };
}

function rotate(x: number, y: number, a: number) {
  return { x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) };
}
function add(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Generador pseudoaleatorio estable para decorados (público, confeti...). */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
