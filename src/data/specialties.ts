/**
 * Especialidades de juego. Se consiguen solas cuando los atributos llegan a los umbrales de `requires`
 * (nivel élite: +14 en cada uno). El estilo de juego (−4) y los rasgos afines (−3) rebajan los umbrales.
 * Los efectos son por nivel: 0,08 = +8 % de esa acción en cada partido; `rating` suma a la nota.
 */
import type { SpecialtyDef } from '@/engine/types/definitions';

const es = (text: string) => ({ es: text });
const ATTACK = ['DC', 'ED', 'EI', 'MCO', 'MD', 'MI'] as const;
const WIDE = ['ED', 'EI', 'MD', 'MI', 'LD', 'LI'] as const;

export const SPECIALTIES: SpecialtyDef[] = [
  /* ── Tiro ────────────────────────────────────────── */
  {
    id: 'tiro-colocado', group: 'shooting', keeper: false,
    name: es('Tiro colocado'), description: es('Pone el balón donde el portero no llega: a la escuadra, con el interior.'),
    requires: { finishing: 74, shooting: 72, composure: 68 }, effects: { goals: 0.1, rating: 0.05 },
    styles: ['goleador-nato', 'extremo-invertido', 'llegador'], traits: ['sangre-fria'],
  },
  {
    id: 'disparo-potente', group: 'shooting', keeper: false,
    name: es('Disparo potente'), description: es('Golpea desde fuera del área con una violencia que asusta a los porteros.'),
    requires: { shooting: 78, strength: 68 }, effects: { goals: 0.08, rating: 0.04 },
    styles: ['nueve-tanque', 'llegador', 'box-to-box'], traits: ['temperamental'],
  },
  {
    id: 'cazagoles', group: 'shooting', keeper: false, positions: ['DC', 'ED', 'EI', 'MCO'],
    name: es('Cazagoles'), description: es('Siempre está donde cae el rechace. Vive en el área pequeña.'),
    requires: { positioning: 74, finishing: 74, acceleration: 68 }, effects: { goals: 0.12 },
    styles: ['goleador-nato', 'delantero-movil'], traits: ['competitivo'],
  },
  {
    id: 'rematador-cabeza', group: 'shooting', keeper: false,
    name: es('Rematador de cabeza'), description: es('Gana cada balón aéreo en el área y lo remata con intención.'),
    requires: { heading: 76, jumping: 72, strength: 66 }, effects: { goals: 0.08, tackles: 0.04 },
    styles: ['nueve-tanque', 'central-muro'], traits: ['fisico-de-hierro'],
  },
  {
    id: 'especialista-faltas', group: 'shooting', keeper: false,
    name: es('Especialista en faltas'), description: es('Cada falta cerca del área es medio gol.'),
    requires: { freeKicks: 78, shooting: 68 }, effects: { goals: 0.06, assists: 0.03, rating: 0.04 },
    styles: ['enganche', 'organizador'], traits: ['creativo'],
  },
  {
    id: 'infalible-penalti', group: 'shooting', keeper: false,
    name: es('Infalible desde el punto'), description: es('No ha fallado un penalti desde juveniles. Ni lo piensa.'),
    requires: { penalties: 78, composure: 72 }, effects: { goals: 0.05, rating: 0.03 },
    traits: ['sangre-fria'],
  },
  {
    id: 'mano-a-mano', group: 'shooting', keeper: false, positions: [...ATTACK],
    name: es('Definidor en el mano a mano'), description: es('Solo ante el portero, elige el palo con calma de veterano.'),
    requires: { composure: 76, finishing: 76, ballControl: 70 }, effects: { goals: 0.1, rating: 0.04 },
    styles: ['goleador-nato', 'falso-nueve'], traits: ['sangre-fria', 'talento-natural'],
  },

  /* ── Pase ────────────────────────────────────────── */
  {
    id: 'pase-al-hueco', group: 'passing', keeper: false,
    name: es('Pase al hueco'), description: es('Ve el desmarque antes que nadie y filtra el balón entre líneas.'),
    requires: { vision: 76, shortPassing: 72 }, effects: { assists: 0.12, keyPasses: 0.12 },
    styles: ['enganche', 'organizador', 'falso-nueve'], traits: ['creativo'],
  },
  {
    id: 'cambio-orientacion', group: 'passing', keeper: false,
    name: es('Cambio de orientación'), description: es('Pases de cuarenta metros que cambian el juego de banda a banda.'),
    requires: { longPassing: 78, vision: 70 }, effects: { keyPasses: 0.1, assists: 0.05 },
    styles: ['organizador', 'central-salida'],
  },
  {
    id: 'centro-preciso', group: 'passing', keeper: false, positions: [...WIDE],
    name: es('Centro preciso'), description: es('Pone el balón en la cabeza del delantero desde cualquier posición.'),
    requires: { crossing: 78, vision: 64 }, effects: { assists: 0.14, keyPasses: 0.08 },
    styles: ['lateral-ofensivo', 'extremo-velocista'],
  },
  {
    id: 'no-pierde-balon', group: 'passing', keeper: false,
    name: es('No pierde un balón'), description: es('Recibe de espaldas, protege y la juega fácil. Imposible quitársela.'),
    requires: { ballControl: 76, shortPassing: 76, composure: 70 }, effects: { keyPasses: 0.05, rating: 0.1 },
    styles: ['organizador', 'ancla', 'box-to-box'], traits: ['profesional', 'humilde'],
  },
  {
    id: 'director-juego', group: 'passing', keeper: false, positions: ['MCD', 'MC', 'MCO'],
    name: es('Director de juego'), description: es('Todo pasa por sus botas: marca el ritmo del partido.'),
    requires: { vision: 80, shortPassing: 78, teamwork: 72 }, effects: { keyPasses: 0.1, assists: 0.06, rating: 0.06 },
    styles: ['organizador', 'enganche'], traits: ['lider'],
  },
  {
    id: 'primer-toque', group: 'passing', keeper: false,
    name: es('Primer toque'), description: es('Juega a uno o dos toques. El balón nunca se detiene con él.'),
    requires: { ballControl: 74, shortPassing: 74, agility: 66 }, effects: { keyPasses: 0.08, dribbles: 0.04, rating: 0.04 },
    styles: ['falso-nueve', 'enganche'], traits: ['talento-natural'],
  },

  /* ── Regates característicos ─────────────────────── */
  {
    id: 'ruleta', group: 'dribbling', keeper: false, signature: true,
    name: es('Ruleta'), description: es('Pisa el balón y gira sobre sí mismo para dejar atrás al defensa.'),
    requires: { dribbling: 74, ballControl: 72, agility: 70 }, effects: { dribbles: 0.12, rating: 0.03 },
    styles: ['extremo-regateador', 'enganche'], traits: ['talento-natural', 'creativo'],
  },
  {
    id: 'sombrerito', group: 'dribbling', keeper: false, signature: true,
    name: es('Sombrerito'), description: es('Levanta el balón por encima del rival y lo recoge al otro lado.'),
    requires: { ballControl: 78, dribbling: 72 }, effects: { dribbles: 0.1, rating: 0.03 },
    styles: ['extremo-regateador', 'falso-nueve'], traits: ['creativo', 'divo'],
  },
  {
    id: 'elastica', group: 'dribbling', keeper: false, signature: true,
    name: es('Elástica'), description: es('Saca el balón hacia fuera y lo recoge hacia dentro en un solo gesto.'),
    requires: { dribbling: 80, agility: 76, ballControl: 74 }, effects: { dribbles: 0.15, rating: 0.04 },
    styles: ['extremo-regateador'], traits: ['talento-natural', 'mediatico'],
  },
  {
    id: 'bicicleta', group: 'dribbling', keeper: false, signature: true,
    name: es('Bicicleta'), description: es('Pasa las piernas por encima del balón y arranca hacia el otro lado.'),
    requires: { dribbling: 72, acceleration: 74 }, effects: { dribbles: 0.1, rating: 0.02 },
    styles: ['extremo-velocista', 'extremo-regateador'], traits: ['fragil', 'fiestero'],
  },
  {
    id: 'cano', group: 'dribbling', keeper: false, signature: true,
    name: es('Caño'), description: es('Se la pasa entre las piernas al defensa. Humillación y ventaja.'),
    requires: { dribbling: 72, ballControl: 72, vision: 64 }, effects: { dribbles: 0.1, keyPasses: 0.03 },
    styles: ['enganche', 'delantero-movil'], traits: ['rebelde', 'creativo'],
  },
  {
    id: 'rabona', group: 'dribbling', keeper: false, signature: true,
    name: es('Rabona'), description: es('Centra o chuta cruzando la pierna por detrás de la de apoyo.'),
    requires: { crossing: 74, ballControl: 76, agility: 68 }, effects: { assists: 0.05, dribbles: 0.05, rating: 0.03 },
    styles: ['extremo-invertido', 'extremo-regateador'], traits: ['divo', 'mediatico'],
  },
  {
    id: 'conduccion', group: 'dribbling', keeper: false,
    name: es('Conducción en carrera'), description: es('Atraviesa medio campo con el balón cosido al pie a toda velocidad.'),
    requires: { dribbling: 74, pace: 78, acceleration: 72 }, effects: { dribbles: 0.12, keyPasses: 0.04 },
    styles: ['extremo-velocista', 'box-to-box', 'lateral-ofensivo'], traits: ['fragil'],
  },

  /* ── Físico ──────────────────────────────────────── */
  {
    id: 'velocista', group: 'physical', keeper: false,
    name: es('Velocista'), description: es('Nadie le alcanza en una carrera de cuarenta metros.'),
    requires: { pace: 84, acceleration: 82 }, effects: { goals: 0.04, dribbles: 0.06, assists: 0.04 },
    styles: ['extremo-velocista', 'delantero-movil', 'lateral-ofensivo'], traits: ['fragil'],
  },
  {
    id: 'incansable', group: 'physical', keeper: false,
    name: es('Incansable'), description: es('Corre lo mismo en el minuto 90 que en el 1. Pulmón del equipo.'),
    requires: { stamina: 84, teamwork: 68 }, effects: { tackles: 0.08, rating: 0.06 },
    styles: ['box-to-box', 'lateral-ofensivo'], traits: ['trabajador', 'solidario'],
  },
  {
    id: 'tanque', group: 'physical', keeper: false,
    name: es('Tanque'), description: es('Gana cada choque. Los defensas rebotan contra él.'),
    requires: { strength: 84, stamina: 70 }, effects: { goals: 0.04, tackles: 0.06, rating: 0.04 },
    styles: ['nueve-tanque', 'central-muro', 'ancla'], traits: ['fisico-de-hierro'],
  },
  {
    id: 'torre', group: 'physical', keeper: false, positions: ['DFC', 'MCD', 'DC'],
    name: es('Torre'), description: es('Domina el juego aéreo en las dos áreas.'),
    requires: { jumping: 80, heading: 74, strength: 72 }, effects: { goals: 0.05, tackles: 0.06 },
    styles: ['central-muro', 'nueve-tanque'], traits: ['fisico-de-hierro'],
  },

  /* ── Defensa ─────────────────────────────────────── */
  {
    id: 'barrida', group: 'defending', keeper: false,
    name: es('Especialista en la barrida'), description: es('Se tira al suelo en el momento justo y se lleva el balón limpio.'),
    requires: { aggression: 72, positioning: 70, pace: 66 }, effects: { tackles: 0.15, rating: 0.03 },
    styles: ['central-muro', 'lateral-defensivo', 'ancla'], traits: ['temperamental', 'competitivo'],
  },
  {
    id: 'anticipacion', group: 'defending', keeper: false,
    name: es('Anticipación'), description: es('Lee el pase antes de que salga y corta sin necesidad de entrar.'),
    requires: { positioning: 78, concentration: 74 }, effects: { tackles: 0.12, rating: 0.04 },
    styles: ['ancla', 'central-salida', 'lateral-defensivo'], traits: ['timido', 'profesional'],
  },
  {
    id: 'marcaje', group: 'defending', keeper: false, positions: ['DFC', 'LD', 'LI', 'MCD'],
    name: es('Marcaje férreo'), description: es('Se pega a su par durante noventa minutos. Le hace desaparecer.'),
    requires: { concentration: 76, strength: 74, positioning: 74 }, effects: { tackles: 0.1, rating: 0.06 },
    styles: ['central-muro', 'lateral-defensivo'], traits: ['competitivo'],
  },
  {
    id: 'salida-limpia', group: 'defending', keeper: false, positions: ['DFC', 'MCD', 'LD', 'LI'],
    name: es('Salida limpia'), description: es('Defensa que saca el balón jugado y rompe líneas con el pase.'),
    requires: { shortPassing: 74, composure: 72, longPassing: 68 }, effects: { keyPasses: 0.08, rating: 0.05 },
    styles: ['central-salida', 'organizador'], traits: ['sangre-fria'],
  },
  {
    id: 'carrilero', group: 'defending', keeper: false, positions: ['LD', 'LI', 'MD', 'MI'],
    name: es('Carrilero'), description: es('Recorre la banda entera: defiende, sube y centra.'),
    requires: { stamina: 78, crossing: 72, pace: 74 }, effects: { assists: 0.08, tackles: 0.05 },
    styles: ['lateral-ofensivo'], traits: ['trabajador'],
  },

  /* ── Mental ──────────────────────────────────────── */
  {
    id: 'lider-campo', group: 'mental', keeper: false,
    name: es('Líder en el campo'), description: es('Ordena, anima y corrige a los suyos. El equipo juega mejor con él.'),
    requires: { leadership: 80, composure: 70 }, effects: { rating: 0.1 },
    traits: ['lider', 'idolo'],
  },
  {
    id: 'partidos-grandes', group: 'mental', keeper: false,
    name: es('Hombre de partidos grandes'), description: es('Cuanto más grande el escenario, mejor juega.'),
    requires: { composure: 80, concentration: 74 }, effects: { goals: 0.04, assists: 0.04, rating: 0.06 },
    traits: ['competitivo', 'sangre-fria', 'ambicioso'],
  },

  /* ── Portero ─────────────────────────────────────── */
  {
    id: 'reflejos-felinos', group: 'goalkeeping', keeper: true,
    name: es('Reflejos felinos'), description: es('Saca balones imposibles a bocajarro.'),
    requires: { reflexes: 80, agility: 66 }, effects: { saves: 0.12, rating: 0.05 },
    styles: ['portero-clasico'], traits: ['fragil', 'talento-natural'],
  },
  {
    id: 'parapenaltis', group: 'goalkeeping', keeper: true,
    name: es('Parapenaltis'), description: es('Estudia a los lanzadores y adivina el lado.'),
    requires: { diving: 76, reflexes: 74, composure: 72 }, effects: { saves: 0.05, rating: 0.06 },
    traits: ['sangre-fria'],
  },
  {
    id: 'dominio-area', group: 'goalkeeping', keeper: true,
    name: es('Dominio del área'), description: es('Sale a por cada centro y lo atrapa por encima de todos.'),
    requires: { rushingOut: 78, jumping: 68, strength: 64 }, effects: { saves: 0.06, rating: 0.05 },
    styles: ['portero-clasico'], traits: ['lider', 'fisico-de-hierro'],
  },
  {
    id: 'portero-libero', group: 'goalkeeping', keeper: true,
    name: es('Portero líbero'), description: es('Juega con los pies como un central y sale lejos de su área.'),
    requires: { kicking: 76, shortPassing: 60, rushingOut: 70 }, effects: { keyPasses: 0.3, rating: 0.05 },
    styles: ['portero-libero'], traits: ['creativo'],
  },
  {
    id: 'colocacion-perfecta', group: 'goalkeeping', keeper: true,
    name: es('Colocación perfecta'), description: es('Siempre está en el sitio: parece que le tiran a él.'),
    requires: { gkPositioning: 80, concentration: 72 }, effects: { saves: 0.1, rating: 0.04 },
    styles: ['portero-clasico', 'portero-libero'], traits: ['profesional', 'timido'],
  },
];
