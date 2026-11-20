/**
 * Estilos de juego. Cada uno da puntos extra iniciales a sus atributos clave (`bonuses`)
 * y, desde la Fase 4, hace que esos atributos crezcan algo más rápido.
 */
import type { PlayStyleDef } from '@/engine/types/definitions';

export const PLAY_STYLES: PlayStyleDef[] = [
  {
    id: 'portero-clasico',
    name: { es: 'Portero clásico' },
    description: { es: 'Bajo palos, reflejos felinos y colocación impecable.' },
    positions: ['POR'],
    bonuses: { reflexes: 6, diving: 5, gkPositioning: 4 },
  },
  {
    id: 'portero-libero',
    name: { es: 'Portero líbero' },
    description: { es: 'Sale lejos del área y juega con los pies como un defensa más.' },
    positions: ['POR'],
    bonuses: { rushingOut: 6, kicking: 5, shortPassing: 4, composure: 2 },
  },
  {
    id: 'central-muro',
    name: { es: 'Central muro' },
    description: { es: 'Fuerte, contundente y dominador del juego aéreo.' },
    positions: ['DFC'],
    bonuses: { strength: 6, heading: 5, jumping: 4, aggression: 3 },
  },
  {
    id: 'central-salida',
    name: { es: 'Central con salida' },
    description: { es: 'Inicia el juego desde atrás con pases tensos y mucha calma.' },
    positions: ['DFC', 'MCD'],
    bonuses: { shortPassing: 5, longPassing: 5, composure: 4, vision: 2 },
  },
  {
    id: 'lateral-ofensivo',
    name: { es: 'Lateral ofensivo' },
    description: { es: 'Sube y baja la banda todo el partido y pone centros peligrosos.' },
    positions: ['LD', 'LI'],
    bonuses: { stamina: 6, crossing: 5, pace: 4, dribbling: 2 },
  },
  {
    id: 'lateral-defensivo',
    name: { es: 'Lateral defensivo' },
    description: { es: 'Sobrio y fiable: primero defender, después atacar.' },
    positions: ['LD', 'LI'],
    bonuses: { positioning: 6, concentration: 5, strength: 3, aggression: 2 },
  },
  {
    id: 'ancla',
    name: { es: 'Mediocentro ancla' },
    description: { es: 'Protege a la defensa, corta líneas de pase y gana duelos.' },
    positions: ['MCD'],
    bonuses: { positioning: 6, aggression: 4, strength: 4, concentration: 3 },
  },
  {
    id: 'organizador',
    name: { es: 'Organizador' },
    description: { es: 'El cerebro del equipo: marca el ritmo y encuentra el pase.' },
    positions: ['MCD', 'MC'],
    bonuses: { shortPassing: 6, vision: 5, longPassing: 4, composure: 2 },
  },
  {
    id: 'box-to-box',
    name: { es: 'Box to box' },
    description: { es: 'Llega a las dos áreas con un motor inagotable.' },
    positions: ['MC'],
    bonuses: { stamina: 6, teamwork: 4, shooting: 4, strength: 3 },
  },
  {
    id: 'enganche',
    name: { es: 'Enganche' },
    description: { es: 'El diez clásico: pausa, último pase y faltas directas.' },
    positions: ['MCO', 'MC'],
    bonuses: { vision: 6, dribbling: 4, ballControl: 4, freeKicks: 4 },
  },
  {
    id: 'llegador',
    name: { es: 'Mediapunta llegador' },
    description: { es: 'Aparece desde segunda línea para rematar.' },
    positions: ['MCO', 'MC'],
    bonuses: { shooting: 6, finishing: 4, positioning: 4, acceleration: 2 },
  },
  {
    id: 'extremo-regateador',
    name: { es: 'Extremo regateador' },
    description: { es: 'Desborda en el uno contra uno con cambios de ritmo.' },
    positions: ['ED', 'EI', 'MD', 'MI'],
    bonuses: { dribbling: 7, agility: 5, ballControl: 3, acceleration: 2 },
  },
  {
    id: 'extremo-velocista',
    name: { es: 'Extremo velocista' },
    description: { es: 'Pura velocidad a la espalda de la defensa y centro al área.' },
    positions: ['ED', 'EI', 'MD', 'MI'],
    bonuses: { pace: 7, acceleration: 5, crossing: 4 },
  },
  {
    id: 'extremo-invertido',
    name: { es: 'Extremo a pierna cambiada' },
    description: { es: 'Recorta hacia dentro y busca el disparo con su pierna buena.' },
    positions: ['ED', 'EI'],
    bonuses: { shooting: 6, finishing: 4, dribbling: 4, composure: 2 },
  },
  {
    id: 'goleador-nato',
    name: { es: 'Goleador nato' },
    description: { es: 'Vive del área: desmarque, instinto y sangre fría.' },
    positions: ['DC'],
    bonuses: { finishing: 7, positioning: 5, composure: 4 },
  },
  {
    id: 'nueve-tanque',
    name: { es: 'Nueve de área' },
    description: { es: 'Referencia física: aguanta de espaldas y gana todo por arriba.' },
    positions: ['DC'],
    bonuses: { strength: 6, heading: 6, jumping: 4, finishing: 2 },
  },
  {
    id: 'falso-nueve',
    name: { es: 'Falso nueve' },
    description: { es: 'Baja a recibir, asocia y arrastra a los centrales.' },
    positions: ['DC', 'MCO'],
    bonuses: { vision: 5, shortPassing: 5, dribbling: 4, ballControl: 3 },
  },
  {
    id: 'delantero-movil',
    name: { es: 'Delantero móvil' },
    description: { es: 'Rompe al espacio y castiga las defensas adelantadas.' },
    positions: ['DC', 'ED', 'EI'],
    bonuses: { pace: 6, acceleration: 5, finishing: 4 },
  },
];
