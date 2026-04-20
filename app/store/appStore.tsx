// app/store/appStore.ts
// 🔹 Global app state with AsyncStorage persistence

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  DayRecord,
  SavingsGoalState,
  Settings,
  ThemeOption
} from "../types";

const STORAGE_KEY_DAYS = "MYPAYTRACKER_DAYS";
const STORAGE_KEY_COMPANY_OPTIONS = "MYPAYTRACKER_COMPANY_OPTIONS";
const STORAGE_KEY_SAVINGS = "MYPAYTRACKER_SAVINGS_GOAL";
const STORAGE_KEY_SETTINGS = "MYPAYTRACKER_SETTINGS";

export interface AppStoreState {
  // Data
  savedDays: DayRecord[];
  companyOptions: string[];
  savingsGoal: SavingsGoalState;
  settings: Settings;
  theme: ThemeOption;

  // Actions
  loadAll: () => Promise<void>;
  setSavedDays: (days: DayRecord[]) => Promise<void>;
  addOrUpdateDayRecord: (record: DayRecord) => Promise<void>;
  setCompanyOptions: (options: string[]) => Promise<void>;
  addCompanyOption: (name: string) => Promise<void>;
  deleteCompanyOption: (name: string) => Promise<void>;
  setSavingsGoal: (goal: SavingsGoalState) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  setTheme: (theme: ThemeOption) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  savedDays: [],
  companyOptions: [],
  savingsGoal: { goal: "", current: "" },
  settings: {},
  theme: "system",

  loadAll: async () => {
    try {
      const [days, companies, savings, settingsRaw] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_DAYS),
        AsyncStorage.getItem(STORAGE_KEY_COMPANY_OPTIONS),
        AsyncStorage.getItem(STORAGE_KEY_SAVINGS),
        AsyncStorage.getItem(STORAGE_KEY_SETTINGS),
      ]);

      const parsedSettings: Settings = settingsRaw ? JSON.parse(settingsRaw) : {};

      set({
        savedDays: days ? JSON.parse(days) : [],
        companyOptions: companies
          ? JSON.parse(companies)
          : [],
        savingsGoal: savings
          ? JSON.parse(savings)
          : { goal: "", current: "" },
        settings: parsedSettings,
        theme: parsedSettings.theme ?? "system",
      });
    } catch (error) {
      console.log("Error loading persisted data:", error);
    }
  },

  setSavedDays: async (days) => {
    set({ savedDays: days });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DAYS, JSON.stringify(days));
    } catch (error) {
      console.log("Error saving days:", error);
    }
  },

  addOrUpdateDayRecord: async (record) => {
    const { savedDays } = get();
    const idx = savedDays.findIndex((d) => d.date === record.date);

    let newDays: DayRecord[];
    if (idx === -1) {
      newDays = [...savedDays, record];
    } else {
      newDays = [...savedDays];
      newDays[idx] = record;
    }

    set({ savedDays: newDays });
    try {
      await AsyncStorage.setItem(STORAGE_KEY_DAYS, JSON.stringify(newDays));
    } catch (error) {
      console.log("Error adding/updating day record:", error);
    }
  },

  setCompanyOptions: async (options) => {
    set({ companyOptions: options });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_COMPANY_OPTIONS,
        JSON.stringify(options)
      );
    } catch (error) {
      console.log("Error saving company options:", error);
    }
  },

  addCompanyOption: async (name) => {
    const { companyOptions } = get();
    if (!name.trim()) return;
    if (companyOptions.includes(name.trim())) return;

    const newOptions = [...companyOptions, name.trim()];
    set({ companyOptions: newOptions });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_COMPANY_OPTIONS,
        JSON.stringify(newOptions)
      );
    } catch (error) {
      console.log("Error adding company option:", error);
    }
  },

  deleteCompanyOption: async (name) => {
    const { companyOptions } = get();
    const newOptions = companyOptions.filter((item) => item !== name);
    set({ companyOptions: newOptions });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_COMPANY_OPTIONS,
        JSON.stringify(newOptions)
      );
    } catch (error) {
      console.log("Error deleting company option:", error);
    }
  },

  setSavingsGoal: async (goal) => {
    set({ savingsGoal: goal });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_SAVINGS,
        JSON.stringify(goal)
      );
    } catch (error) {
      console.log("Error saving savings goal:", error);
    }
  },

  setSettings: async (settings) => {
    const merged: Settings = { ...get().settings, ...settings };
    set({ settings: merged, theme: merged.theme ?? "system" });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify(merged)
      );
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  },

  setTheme: async (theme) => {
    const { settings } = get();
    const merged: Settings = { ...settings, theme };
    set({ theme, settings: merged });
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify(merged)
      );
    } catch (error) {
      console.log("Error setting theme:", error);
    }
  },

  clearAllData: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY_DAYS,
        STORAGE_KEY_COMPANY_OPTIONS,
        STORAGE_KEY_SAVINGS,
        STORAGE_KEY_SETTINGS,
      ]);
    } catch (error) {
      console.log("Error clearing storage:", error);
    }

    set({
      savedDays: [],
      companyOptions: [],
      savingsGoal: { goal: "", current: "" },
      settings: {},
      theme: "system",
    });
  },
}));
