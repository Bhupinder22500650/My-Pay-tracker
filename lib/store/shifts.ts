// lib/store/shifts.ts
// 🔹 Shifts slice — savedDays, addShift, deleteShift, loadShifts

import { StateCreator } from "zustand";
import { supabase } from "../supabase";
import { DayRecord, CompanyEntry } from "../types";
import { fetchShifts, createShift, removeShift, removeAllShifts, ShiftInsert } from "../api/shifts";

export interface ShiftsSlice {
  savedDays: DayRecord[];
  isCloudLoading: boolean;
  loadShifts: (userId: string) => Promise<void>;
  addShift: (date: string, entry: ShiftInsert) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  clearShifts: (userId: string) => Promise<void>;
}

export const createShiftsSlice: StateCreator<ShiftsSlice> = (set, get) => ({
  savedDays: [],
  isCloudLoading: false,

  loadShifts: async (userId) => {
    set({ isCloudLoading: true });
    try {
      const days = await fetchShifts(userId);
      set({ savedDays: days });
    } finally {
      set({ isCloudLoading: false });
    }
  },

  addShift: async (date, entry) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    await createShift(user.id, date, entry);
    // Reload shifts to reflect the new entry
    await get().loadShifts(user.id);
  },

  deleteShift: async (id) => {
    await removeShift(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await get().loadShifts(user.id);
  },

  clearShifts: async (userId) => {
    await removeAllShifts(userId);
    set({ savedDays: [] });
  },
});
