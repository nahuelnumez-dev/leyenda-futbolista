/**
 * Modo rápido: estado de la carrera. Solo orquesta; la lógica vive en src/engine/quick.
 */
import { create } from 'zustand';
import type { GameState } from '@/engine/types/game';
import type { Position } from '@/engine/types/attributes';
import { createQuickGame, playQuickSeason } from '@/engine/quick/quick';
import { careerCard } from '@/engine/legacy/legacy';
import { ENGINE_CONTENT } from '@/data';
import { getBrowserStorage } from '@/persistence/storage';
import { deleteSlot, loadFromSlot, listSlots } from '@/persistence/slots';
import { saveToSlot } from '@/persistence/slots';
import { addToHallOfFame, loadHallOfFame, type HallOfFameEntry } from '@/persistence/hallOfFame';
import { randomSeed } from './seed';

interface QuickStore {
  game: GameState | null;
  /** Simulación continua hasta la retirada en marcha. */
  running: boolean;
  hall: HallOfFameEntry[];
  start: (p: { name: string; position: Position; clubId: string }) => void;
  next: () => void;
  runToEnd: () => void;
  stop: () => void;
  resume: () => boolean;
  hasSave: () => boolean;
  abandon: () => void;
}

const storage = () => getBrowserStorage();
const now = () => new Date().toISOString();

function persist(game: GameState) {
  try {
    saveToSlot(storage(), 'auto', game, now());
    if (game.retired) addToHallOfFame(storage(), { ...careerCard(game, ENGINE_CONTENT), finishedAt: now() });
  } catch {
    // Sin almacenamiento (modo privado): se juega igual, solo que no se guarda.
  }
}

let timer: number | undefined;

export const useQuick = create<QuickStore>()((set, get) => ({
  game: null,
  running: false,
  hall: loadHallOfFame(storage()),

  start: ({ name, position, clubId }) => {
    const game = createQuickGame({ seed: randomSeed(), createdAt: now(), name, position, clubId }, ENGINE_CONTENT);
    persist(game);
    set({ game, running: false });
  },

  next: () => {
    const { game } = get();
    if (!game || game.retired) return;
    const after = playQuickSeason(game, ENGINE_CONTENT);
    persist(after);
    set({ game: after, ...(after.retired ? { running: false, hall: loadHallOfFame(storage()) } : {}) });
  },

  runToEnd: () => {
    if (get().running) return;
    set({ running: true });
    const step = () => {
      const { game, running } = get();
      if (!running || !game || game.retired) {
        set({ running: false });
        return;
      }
      get().next();
      timer = window.setTimeout(step, 280);
    };
    step();
  },

  stop: () => {
    window.clearTimeout(timer);
    set({ running: false });
  },

  resume: () => {
    try {
      const game = loadFromSlot(storage(), 'auto');
      if (!game.quickLog) return false;
      set({ game });
      return true;
    } catch {
      return false;
    }
  },

  hasSave: () => {
    try {
      const meta = listSlots(storage()).auto;
      return Boolean(meta && !meta.retired);
    } catch {
      return false;
    }
  },

  abandon: () => {
    get().stop();
    try {
      deleteSlot(storage(), 'auto');
    } catch {
      /* nada que borrar */
    }
    set({ game: null, hall: loadHallOfFame(storage()) });
  },
}));
