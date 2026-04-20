// lib/store/settings.ts
// 🔹 Settings + theme + savings goal slice

import { StateCreator } from "zustand";
import { supabase } from "../supabase";
import { Settings, ThemeOption, SavingsGoalState } from "../types";
import {
  fetchProfile,
  updateProfile,
  resetProfile,
  profileToSettings,
  profileToSavings,
} from "../api/profile";

export interface SettingsSlice {
  settings: Settings;
  theme: ThemeOption;
  savingsGoal: SavingsGoalState;
  companyOptions: string[];

  loadProfile: (userId: string) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  setTheme: (theme: ThemeOption) => Promise<void>;
  setSavingsGoal: (goal: SavingsGoalState) => Promise<void>;
  addCompanyOption: (name: string) => Promise<void>;
  deleteCompanyOption: (name: string) => Promise<void>;
  resetSettings: (userId: string) => Promise<void>;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: {},
  theme: "system",
  savingsGoal: { goal: "", current: "" },
  companyOptions: [],

  loadProfile: async (userId) => {
    const profile = await fetchProfile(userId);
    if (!profile) return;
    set({
      settings: profileToSettings(profile),
      theme: profile.theme ?? "system",
      savingsGoal: profileToSavings(profile),
      companyOptions: profile.company_options ?? [],
    });
  },

  setSettings: async (settings) => {
    const merged: Settings = { ...get().settings, ...settings };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await updateProfile(user.id, {
      user_name: merged.userName ?? null,
      ird_number: merged.irdNumber ?? null,
      primary_tax_code: merged.primaryTaxCode ?? null,
      preferred_income_bracket: merged.preferredIncomeBracket ?? null,
      theme: merged.theme,
      haptics_enabled: merged.hapticsEnabled ?? false,
    });
    set({ settings: merged, theme: merged.theme ?? "system" });
  },

  setTheme: async (theme) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateProfile(user.id, { theme });
    }
    set({ theme, settings: { ...get().settings, theme } });
  },

  setSavingsGoal: async (goal) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateProfile(user.id, {
        savings_goal: parseFloat(goal.goal) || 0,
        savings_current: parseFloat(goal.current) || 0,
      });
    }
    set({ savingsGoal: goal });
  },

  addCompanyOption: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = get().companyOptions;
    if (current.includes(trimmed)) return;
    const newOptions = [...current, trimmed];
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateProfile(user.id, { company_options: newOptions });
    }
    set({ companyOptions: newOptions });
  },

  deleteCompanyOption: async (name) => {
    const newOptions = get().companyOptions.filter((c) => c !== name);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await updateProfile(user.id, { company_options: newOptions });
    }
    set({ companyOptions: newOptions });
  },

  resetSettings: async (userId) => {
    await resetProfile(userId);
    set({
      companyOptions: [],
      savingsGoal: { goal: "", current: "" },
      settings: {},
      theme: "system",
    });
  },
});
