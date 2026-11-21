import { mockSettings } from "@/data/settings";
import type { StoreSettings } from "@/types";
import { ensureSeeded, simulateLatency, STORAGE_KEYS, writeStorage } from "./storage";

export const settingsService = {
  async getSettings(): Promise<StoreSettings> {
    await simulateLatency();
    return ensureSeeded<StoreSettings>(STORAGE_KEYS.SETTINGS, mockSettings);
  },

  async saveSettings(settings: StoreSettings): Promise<StoreSettings> {
    await simulateLatency();
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },
};
