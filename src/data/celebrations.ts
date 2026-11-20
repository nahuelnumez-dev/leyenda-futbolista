/**
 * Celebraciones de gol. Se desbloquean al empezar o con eventos (efecto `unlockCelebration`).
 * `motion` indica la animación del avatar en la cinemática.
 */
export interface CelebrationDef {
  id: string;
  name: string;
  description: string;
  /** Cómo se desbloquea (texto para la interfaz). */
  unlock: string;
  motion: 'salto' | 'deslizar' | 'giro' | 'balanceo' | 'quieto' | 'mirar-arriba' | 'baile';
  /** Símbolo que acompaña a la animación. */
  symbol: string;
}

export const CELEBRATIONS: CelebrationDef[] = [
  { id: 'puno', name: 'Puño al aire', description: 'El gesto de siempre: salto y puño en alto.', unlock: 'Disponible desde el principio.', motion: 'salto', symbol: '✊' },
  { id: 'rodillas', name: 'De rodillas', description: 'Carrera hacia el córner y deslizamiento sobre el césped.', unlock: 'Disponible desde el principio.', motion: 'deslizar', symbol: '⚡' },
  { id: 'corazon', name: 'Corazón', description: 'Las manos forman un corazón hacia la grada.', unlock: 'Evento «Tu celebración».', motion: 'quieto', symbol: '❤️' },
  { id: 'avion', name: 'El avión', description: 'Brazos abiertos hasta la banda.', unlock: 'Evento «Tu celebración».', motion: 'balanceo', symbol: '✈️' },
  { id: 'silencio', name: 'Silencio', description: 'El dedo en los labios mirando a la grada rival.', unlock: 'Evento «Tu celebración».', motion: 'quieto', symbol: '🤫' },
  { id: 'cielo', name: 'Mirar al cielo', description: 'Una dedicatoria a la familia.', unlock: 'Evento «Tu celebración».', motion: 'mirar-arriba', symbol: '☝️' },
  { id: 'escudo', name: 'Besar el escudo', description: 'Para los que sienten los colores.', unlock: 'Un gesto de lealtad con tu club.', motion: 'quieto', symbol: '🛡️' },
  { id: 'chupete', name: 'El chupete', description: 'Dedicado a quien espera en casa.', unlock: 'Formar una familia.', motion: 'balanceo', symbol: '🍼' },
  { id: 'voltereta', name: 'Voltereta', description: 'Mortal hacia atrás. Solo para valientes.', unlock: 'Un hat-trick de los que se recuerdan.', motion: 'giro', symbol: '🤸' },
  { id: 'baile', name: 'El baile', description: 'Coreografía con los compañeros junto al banderín.', unlock: 'Tener mucho carisma ante las cámaras.', motion: 'baile', symbol: '💃' },
];
