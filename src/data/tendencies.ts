/**
 * Tendencias de personalidad (-100 a 100). Se mueven con las decisiones y, al cruzar el umbral,
 * el jugador gana el rasgo asociado (o lo pierde si vuelve a bajar de la mitad del umbral).
 */
import type { TendencyDef } from '@/engine/types/definitions';

export const TENDENCY_THRESHOLD = 40;

export const TENDENCIES: TendencyDef[] = [
  {
    id: 'ego',
    name: { es: 'Ego' },
    opposite: { es: 'Humildad' },
    description: { es: 'Cuánto se cree el centro del mundo. Atrae focos y seguidores, pero cansa al vestuario.' },
    threshold: 40,
    positiveTrait: 'divo',
    negativeTrait: 'humilde',
  },
  {
    id: 'rebeldia',
    name: { es: 'Rebeldía' },
    opposite: { es: 'Disciplina' },
    description: { es: 'Cuánto cuestiona a la autoridad: entrenadores, directivos y normas del club.' },
    threshold: 40,
    positiveTrait: 'rebelde',
    negativeTrait: 'trabajador',
  },
  {
    id: 'lealtad',
    name: { es: 'Lealtad' },
    opposite: { es: 'Mercenarismo' },
    description: { es: 'Apego a los colores frente a ir donde más pagan.' },
    threshold: 40,
    positiveTrait: 'leal',
    negativeTrait: 'ambicioso',
  },
  {
    id: 'profesionalidad',
    name: { es: 'Profesionalidad' },
    opposite: { es: 'Dejadez' },
    description: { es: 'Cuidado del cuerpo, del descanso y del trabajo diario.' },
    threshold: 40,
    positiveTrait: 'profesional',
    negativeTrait: 'fiestero',
  },
  {
    id: 'temperamento',
    name: { es: 'Temperamento' },
    opposite: { es: 'Calma' },
    description: { es: 'Facilidad para perder los nervios en el campo y fuera de él.' },
    threshold: 40,
    positiveTrait: 'temperamental',
    negativeTrait: 'sangre-fria',
  },
  {
    id: 'carisma',
    name: { es: 'Carisma' },
    opposite: { es: 'Reserva' },
    description: { es: 'Cómo se maneja ante cámaras, aficionados y redes.' },
    threshold: 40,
    positiveTrait: 'mediatico',
    negativeTrait: 'timido',
  },
  {
    id: 'solidaridad',
    name: { es: 'Solidaridad' },
    opposite: { es: 'Individualismo' },
    description: { es: 'Compromiso con los demás: compañeros, afición y causas sociales.' },
    threshold: 40,
    positiveTrait: 'solidario',
  },
];
