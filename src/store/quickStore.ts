/**
 * Modo rápido: estado de la carrera. Solo orquesta; la lógica vive en src/engine/quick.
 */
import { create } from 'zustand';
import type { GameState } from '@/engine/types/game';
import type { Position } from '@/engine/types/attributes';
import { advanceQuick, createQuickGame, decideQuickMarket, recommendedOffer, type QuickSeason } from '@/engine/quick/quick';
import { careerCard } from '@/engine/legacy/legacy';
import { ENGINE_CONTENT } from '@/data';
import { ACHIEVEMENTS } from '@/data/achievements';
import { getBrowserStorage } from '@/persistence/storage';
import { deleteSlot, listSlots, loadFromSlot, saveToSlot } from '@/persistence/slots';
import { addToHallOfFame, loadHallOfFame, type HallOfFameEntry } from '@/persistence/hallOfFame';
import { randomSeed } from './seed';

/** Aviso de un trofeo, premio o logro conseguido. */
export interface QuickNotice {
  id: number;
  kind: 'trophy' | 'award' | 'achievement' | 'league';
  icon: string;
  title: string;
  detail: string;
  /** Nombre de la competición o del premio (la interfaz lo traduce). */
  ref?: { competitionId?: string; awardId?: string; scope?: string };
}

interface QuickStore {
  game: GameState | null;
  /** Simulación continua hasta la retirada en marcha. */
  running: boolean;
  hall: HallOfFameEntry[];
  notices: QuickNotice[];
  start: (p: { name: string; position: Position; clubId: string }) => void;
  next: () => void;
  decide: (offerId: string | null) => void;
  runToEnd: () => void;
  stop: () => void;
  resume: () => boolean;
  hasSave: () => boolean;
  abandon: () => void;
  dismiss: (id: number) => void;
}

const storage = () => getBrowserStorage();
const now = () => new Date().toISOString();
const TIER_ICON = { bronze: '🥉', silver: '🥈', gold: '🥇', legend: '👑' } as const;

function persist(game: GameState) {
  try {
    saveToSlot(storage(), 'auto', game, now());
    if (game.retired) addToHallOfFame(storage(), { ...careerCard(game, ENGINE_CONTENT), finishedAt: now() });
  } catch {
    // Sin almacenamiento (modo privado): se juega igual, solo que no se guarda.
  }
}

let noticeId = 0;

/** Avisos de lo conseguido en las temporadas nuevas del registro. */
function noticesFor(seasons: QuickSeason[]): QuickNotice[] {
  const out: QuickNotice[] = [];
  for (const s of seasons) {
    for (const competitionId of s.trophies) out.push({ id: ++noticeId, kind: 'trophy', icon: '🏆', title: '¡Campeón!', detail: '', ref: { competitionId } });
    if (s.promoted) out.push({ id: ++noticeId, kind: 'league', icon: '⬆️', title: '¡Ascenso!', detail: 'Tu equipo sube de categoría.' });
    for (const a of s.awards.filter((x) => x.rank === 1)) out.push({ id: ++noticeId, kind: 'award', icon: '🏅', title: 'Premio individual', detail: '', ref: { awardId: a.awardId, ...(a.scope ? { scope: a.scope } : {}) } });
    for (const id of s.achievements) {
      const def = ACHIEVEMENTS.find((x) => x.id === id);
      if (def) out.push({ id: ++noticeId, kind: 'achievement', icon: TIER_ICON[def.tier], title: `Logro: ${def.name.es}`, detail: def.description.es });
    }
  }
  return out;
}

let timer: number | undefined;

export const useQuick = create<QuickStore>()((set, get) => {
  /** Guarda el nuevo estado y avisa de lo conseguido desde el anterior. */
  const commit = (before: GameState, after: GameState) => {
    persist(after);
    const fresh = (after.quickLog ?? []).slice((before.quickLog ?? []).length);
    const notices = noticesFor(fresh);
    set((st) => ({
      game: after,
      notices: [...st.notices, ...notices].slice(-6),
      ...(after.retired ? { running: false, hall: loadHallOfFame(storage()) } : {}),
    }));
    for (const n of notices) window.setTimeout(() => get().dismiss(n.id), get().running ? 3500 : 6000);
  };

  return {
    game: null,
    running: false,
    hall: loadHallOfFame(storage()),
    notices: [],

    start: ({ name, position, clubId }) => {
      const game = createQuickGame({ seed: randomSeed(), createdAt: now(), name, position, clubId }, ENGINE_CONTENT);
      persist(game);
      set({ game, running: false, notices: [] });
    },

    next: () => {
      const { game } = get();
      if (!game || game.retired || game.quickMarket) return;
      commit(game, advanceQuick(game, ENGINE_CONTENT, 'manual'));
    },

    decide: (offerId) => {
      const { game } = get();
      if (!game?.quickMarket) return;
      const decided = decideQuickMarket(game, offerId, ENGINE_CONTENT);
      // Tras elegir, la temporada sigue hasta el final (o hasta el siguiente mercado).
      commit(game, advanceQuick(decided, ENGINE_CONTENT, 'manual'));
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
        // En modo continuo el mercado lo decide el piloto automático.
        const ready = game.quickMarket ? decideQuickMarket(game, recommendedOffer(game)?.id ?? null, ENGINE_CONTENT) : game;
        commit(game, advanceQuick(ready, ENGINE_CONTENT, 'auto'));
        timer = window.setTimeout(step, 320);
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
        set({ game, notices: [] });
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
      set({ game: null, notices: [], hall: loadHallOfFame(storage()) });
    },

    dismiss: (id) => set((st) => ({ notices: st.notices.filter((n) => n.id !== id) })),
  };
});
