import { create } from "zustand";
import { settingsService } from "@/services/settingsService";
import type { StoreSettings } from "@/types";

interface SettingsState {
  settings: StoreSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  saveSettings: (next: StoreSettings) => Promise<StoreSettings>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsService.getSettings();
      set({ settings, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Gagal memuat pengaturan.",
      });
    }
  },

  saveSettings: async (next) => {
    set({ saving: true, error: null });
    try {
      const saved = await settingsService.saveSettings(next);
      set({ settings: saved, saving: false });
      return saved;
    } catch (err) {
      set({
        saving: false,
        error: err instanceof Error ? err.message : "Gagal menyimpan pengaturan.",
      });
      throw err;
    }
  },
}));
