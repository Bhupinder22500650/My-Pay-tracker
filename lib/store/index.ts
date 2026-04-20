// lib/store/index.ts
// 🔹 Unified store — composes ShiftsSlice + SettingsSlice into one hook.
//    Provides loadFromCloud() as a single entry-point to load everything.
//
// Usage: import { useAppStore } from "../../lib/store"
//
// The split means each slice can be tested, typed, and evolved independently.
// To add a new slice: create lib/store/mySlice.ts → add to AppStore below.

import { create } from "zustand";
import { supabase } from "../supabase";
import { createShiftsSlice, ShiftsSlice } from "./shifts";
import { createSettingsSlice, SettingsSlice } from "./settings";

// ── Combined store type ───────────────────────────────────────────────────────
export type AppStore = ShiftsSlice &
  SettingsSlice & {
    /** Load all user data in parallel — call once after auth state changes. */
    loadFromCloud: () => Promise<void>;
    /** Wipe all user data from Supabase and reset local state. */
    clearAllData: () => Promise<void>;
  };

// ── Store factory ─────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>((...args) => ({
  // Compose slices
  ...createShiftsSlice(...args),
  ...createSettingsSlice(...args),

  loadFromCloud: async () => {
    const [set, get] = args;
    try {
      set({ isCloudLoading: true });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ isCloudLoading: false });
        return;
      }
      // Load profile and shifts in parallel
      await Promise.all([get().loadProfile(user.id), get().loadShifts(user.id)]);
    } catch (err) {
      console.warn("[store] loadFromCloud error:", err);
    } finally {
      set({ isCloudLoading: false });
    }
  },

  clearAllData: async () => {
    const [, get] = args;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await Promise.all([get().clearShifts(user.id), get().resetSettings(user.id)]);
  },
}));

// Re-export slice types for convenience
export type { ShiftsSlice, SettingsSlice };
