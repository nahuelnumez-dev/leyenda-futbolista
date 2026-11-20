import { create } from 'zustand';
import { getBrowserStorage } from '@/persistence/storage';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '@/persistence/settings';

export type ScreenId = 'mainMenu' | 'newCareer' | 'hub' | 'load' | 'hallOfFame' | 'options' | 'debug' | 'clubs' | 'careerEnd';

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'error';
}

interface UiState {
  screen: ScreenId;
  settings: Settings;
  toasts: Toast[];
  goTo: (screen: ScreenId) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUi = create<UiState>()((set, get) => ({
  screen: 'mainMenu',
  settings: loadSettings(getBrowserStorage()),
  toasts: [],
  goTo: (screen) => set({ screen }),
  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    saveSettings(getBrowserStorage(), settings);
    set({ settings });
  },
  resetSettings: () => set({ settings: { ...DEFAULT_SETTINGS } }),
  toast: (text, tone = 'info') => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }].slice(-4) }));
    setTimeout(() => get().dismissToast(id), 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
