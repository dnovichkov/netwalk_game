import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showTimer: boolean;
  showMoveCounter: boolean;

  // Actions
  toggleSound: () => void;
  toggleVibration: () => void;
  toggleTimer: () => void;
  toggleMoveCounter: () => void;
  resetSettings: () => void;
}

const defaultSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  showTimer: true,
  showMoveCounter: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      toggleTimer: () => set((state) => ({ showTimer: !state.showTimer })),
      toggleMoveCounter: () => set((state) => ({ showMoveCounter: !state.showMoveCounter })),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'netwalk-settings',
    }
  )
);
