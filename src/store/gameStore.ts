/**
 * Estado de la partida en curso. El store solo orquesta: toda la lógica vive en src/engine
 * (funciones puras) y el acceso a disco en src/persistence.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createNewGame, type NewGameParams } from '@/engine/world/newGame';
import type { GameState } from '@/engine/types/game';
import { advancePhase } from '@/engine/season/advance';
import { chooseOption, queuePhaseEvents } from '@/engine/events/engine';
import { Rng } from '@/engine/rng';
import { respondToOffer } from '@/engine/market/offers';
import { chooseNationalTeam } from '@/engine/competitions/nationalTeam';
import { dismissCinematic, selectCelebration } from '@/engine/cinematics/cinematics';
import { careerCard, retireNow } from '@/engine/legacy/legacy';
import { addToHallOfFame } from '@/persistence/hallOfFame';
import { ENGINE_CONTENT } from '@/data';
import { getBrowserStorage } from '@/persistence/storage';
import {
  deleteSlot,
  exportFileName,
  exportGame,
  importGame,
  latestSlot,
  listSlots,
  loadFromSlot,
  saveToSlot,
  type SlotId,
  type SlotMeta,
} from '@/persistence/slots';
import { clearHallOfFame } from '@/persistence/hallOfFame';
import { randomSeed } from './seed';

interface GameStore {
  game: GameState | null;
  /** Ranura de la que se cargó o en la que se guardó por última vez. */
  activeSlot: SlotId | null;
  slots: Record<SlotId, SlotMeta | null>;

  refreshSlots: () => void;
  startNewGame: (params: Omit<NewGameParams, 'seed' | 'createdAt'> & { seed?: string }) => GameState;
  /** Avanza una fase de la temporada y autoguarda. */
  advance: () => GameState | null;
  /** Elige una opción del evento activo y autoguarda. */
  choose: (optionId: string) => void;
  /** Acepta o rechaza una oferta y autoguarda. */
  respondOffer: (offerId: string, accept: boolean) => void;
  /** Elige selección (decisión definitiva) y autoguarda. */
  chooseCountry: (country: string) => void;
  /** Pasa a la siguiente cinemática pendiente. */
  nextCinematic: () => void;
  /** Elige la celebración de los goles. */
  chooseCelebration: (id: string) => void;
  /** Retirada por decisión propia (fin de temporada, 30 años o más). */
  retire: () => void;
  autosave: () => void;
  saveTo: (slot: SlotId) => SlotMeta;
  loadSlot: (slot: SlotId) => void;
  continueLatest: () => boolean;
  deleteSlot: (slot: SlotId) => void;
  exportCurrent: () => { fileName: string; json: string } | null;
  importInto: (json: string, slot: SlotId) => GameState;
  closeGame: () => void;
  wipeAll: () => void;
}

const storage = () => getBrowserStorage();
const now = () => new Date().toISOString();

export const useGame = create<GameStore>()(
  immer((set, get) => ({
    game: null,
    activeSlot: null,
    slots: listSlots(storage()),

    refreshSlots: () => set({ slots: listSlots(storage()) }),

    startNewGame: ({ seed, ...rest }) => {
      const finalSeed = seed?.trim() || randomSeed();
      const game = createNewGame({ ...rest, seed: finalSeed, customSeed: rest.customSeed ?? Boolean(seed?.trim()), createdAt: now() });
      // Eventos de la primera pretemporada (p. ej. el primer día en la cantera).
      queuePhaseEvents(game, ENGINE_CONTENT, Rng.fromSeed(finalSeed).fork('events:start'));
      set({ game, activeSlot: null });
      get().autosave();
      return game;
    },

    advance: () => {
      const { game } = get();
      if (!game) return null;
      const next = advancePhase(game, ENGINE_CONTENT);
      set({ game: next });
      get().autosave();
      return next;
    },

    choose: (optionId) => {
      const { game } = get();
      if (!game) return;
      set({ game: chooseOption(game, optionId, ENGINE_CONTENT) });
      get().autosave();
    },

    respondOffer: (offerId, accept) => {
      const { game } = get();
      if (!game) return;
      set({ game: respondToOffer(game, offerId, accept, ENGINE_CONTENT.world) });
      get().autosave();
    },

    chooseCountry: (country) => {
      const { game } = get();
      if (!game) return;
      set({ game: chooseNationalTeam(game, country, ENGINE_CONTENT.intl) });
      get().autosave();
    },

    nextCinematic: () => {
      const { game } = get();
      if (!game) return;
      set({ game: dismissCinematic(game) });
      get().autosave();
    },

    chooseCelebration: (id) => {
      const { game } = get();
      if (!game) return;
      set({ game: selectCelebration(game, id) });
      get().autosave();
    },

    retire: () => {
      const { game } = get();
      if (!game) return;
      set({ game: retireNow(game, ENGINE_CONTENT) });
      get().autosave();
    },

    autosave: () => {
      const { game } = get();
      if (!game) return;
      saveToSlot(storage(), 'auto', game, now());
      if (game.retired) addToHallOfFame(storage(), { ...careerCard(game, ENGINE_CONTENT), finishedAt: now() });
      get().refreshSlots();
    },

    saveTo: (slot) => {
      const { game } = get();
      if (!game) throw new Error('No hay partida activa');
      const meta = saveToSlot(storage(), slot, game, now());
      set({ activeSlot: slot });
      get().refreshSlots();
      return meta;
    },

    loadSlot: (slot) => {
      const game = loadFromSlot(storage(), slot);
      set({ game, activeSlot: slot });
    },

    continueLatest: () => {
      const latest = latestSlot(storage());
      if (!latest) return false;
      get().loadSlot(latest.slotId);
      return true;
    },

    deleteSlot: (slot) => {
      deleteSlot(storage(), slot);
      if (get().activeSlot === slot) set({ activeSlot: null });
      get().refreshSlots();
    },

    exportCurrent: () => {
      const { game } = get();
      if (!game) return null;
      return { fileName: exportFileName(game), json: exportGame(game, now()) };
    },

    importInto: (json, slot) => {
      const game = importGame(json);
      saveToSlot(storage(), slot, game, now());
      set({ game, activeSlot: slot });
      get().refreshSlots();
      return game;
    },

    closeGame: () => set({ game: null, activeSlot: null }),

    wipeAll: () => {
      const s = storage();
      for (const id of ['auto', '1', '2', '3'] as const) deleteSlot(s, id);
      clearHallOfFame(s);
      s.removeItem('leyenda:settings');
      set({ game: null, activeSlot: null, slots: listSlots(s) });
    },
  })),
);
