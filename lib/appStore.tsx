// app/store/appStore.ts
// 🔹 Global app state with Supabase cloud database synchronization

import { create } from "zustand";
import { supabase } from "../../lib/supabase";
import { DayRecord, SavingsGoalState, Settings, ThemeOption, CompanyEntry } from "../types";

export interface AppStoreState {
  // Data
  savedDays: DayRecord[];
  companyOptions: string[];
  savingsGoal: SavingsGoalState;
  settings: Settings;
  theme: ThemeOption;
  isCloudLoading: boolean;

  // Actions
  loadFromCloud: () => Promise<void>;
  addShift: (date: string, entry: Omit<CompanyEntry, "id">) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  
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
  isCloudLoading: true, // App starts in loading state while waiting for auth

  loadFromCloud: async () => {
    try {
      set({ isCloudLoading: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isCloudLoading: false });
        return;
      }

      const [{ data: profile }, { data: shifts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("shifts").select("*").eq("user_id", user.id).order("date", { ascending: true })
      ]);

      if (profile) {
        set({
          companyOptions: profile.company_options || [],
          savingsGoal: {
            goal: profile.savings_goal?.toString() || "",
            current: profile.savings_current?.toString() || "",
          },
          settings: {
            userName: profile.user_name || undefined,
            irdNumber: profile.ird_number || undefined,
            primaryTaxCode: profile.primary_tax_code || undefined,
            preferredIncomeBracket: profile.preferred_income_bracket || undefined,
            theme: profile.theme || "system",
            hapticsEnabled: profile.haptics_enabled || false,
          },
          theme: profile.theme || "system",
        });
      }

      if (shifts) {
        const groups: Record<string, CompanyEntry[]> = {};
        for (const s of shifts) {
          if (!groups[s.date]) groups[s.date] = [];
          groups[s.date].push({
            id: s.id,
            companyOption: s.company_option,
            customCompany: s.custom_company || "",
            payRate: s.pay_rate.toString(),
            hoursWorked: s.hours_worked.toString(),
            taxCode: s.tax_code,
            incomeBracketKey: s.income_bracket_key || undefined,
          });
        }

        const formattedDays: DayRecord[] = Object.keys(groups).map((date) => ({
          date,
          companies: groups[date],
          totalGross: 0, // Calculated dynamically by UI
          totalTax: 0,   // Calculated dynamically by UI
          totalNet: 0,   // Calculated dynamically by UI
        }));

        set({ savedDays: formattedDays });
      }
    } catch (error) {
      console.log("Error loading cloud data:", error);
    } finally {
      set({ isCloudLoading: false });
    }
  },

  addShift: async (date, entry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert to cloud
      await supabase.from("shifts").insert({
        user_id: user.id,
        date: date,
        company_option: entry.companyOption,
        custom_company: entry.customCompany,
        pay_rate: parseFloat(entry.payRate),
        hours_worked: parseFloat(entry.hoursWorked),
        tax_code: entry.taxCode,
        income_bracket_key: entry.incomeBracketKey
      });

      // Optimistically reload from cloud to refresh the view
      await get().loadFromCloud();
    } catch (error) {
      console.log("Error saving shift:", error);
    }
  },

  deleteShift: async (id) => {
    try {
      await supabase.from("shifts").delete().eq("id", id);
      await get().loadFromCloud();
    } catch (error) {
      console.log("Error deleting shift:", error);
    }
  },

  addCompanyOption: async (name) => {
    const { companyOptions } = get();
    if (!name.trim()) return;
    if (companyOptions.includes(name.trim())) return;

    const newOptions = [...companyOptions, name.trim()];
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ company_options: newOptions }).eq("id", user.id);
        set({ companyOptions: newOptions });
      }
    } catch (error) {
      console.log("Error adding company option:", error);
    }
  },

  deleteCompanyOption: async (name) => {
    const { companyOptions } = get();
    const newOptions = companyOptions.filter((item) => item !== name);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ company_options: newOptions }).eq("id", user.id);
        set({ companyOptions: newOptions });
      }
    } catch (error) {
      console.log("Error deleting company option:", error);
    }
  },

  setSavingsGoal: async (goal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ 
          savings_goal: parseFloat(goal.goal) || 0,
          savings_current: parseFloat(goal.current) || 0
        }).eq("id", user.id);
        set({ savingsGoal: goal });
      }
    } catch (error) {
      console.log("Error saving savings goal:", error);
    }
  },

  setSettings: async (settings) => {
    const merged: Settings = { ...get().settings, ...settings };
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ 
          theme: merged.theme,
          haptics_enabled: merged.hapticsEnabled,
          user_name: merged.userName,
          ird_number: merged.irdNumber,
          primary_tax_code: merged.primaryTaxCode,
          preferred_income_bracket: merged.preferredIncomeBracket
        }).eq("id", user.id);
        set({ settings: merged, theme: merged.theme ?? "system" });
      }
    } catch (error) {
      console.log("Error saving settings:", error);
    }
  },

  setTheme: async (theme) => {
    const { settings } = get();
    const merged: Settings = { ...settings, theme };
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ theme }).eq("id", user.id);
        set({ theme, settings: merged });
      }
    } catch (error) {
      console.log("Error setting theme:", error);
    }
  },

  clearAllData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Wipe all shifts for user
        await supabase.from("shifts").delete().eq("user_id", user.id);
        // Wipe profile array
        await supabase.from("profiles").update({ 
          company_options: [],
          savings_goal: 0,
          savings_current: 0,
          user_name: null,
          ird_number: null,
          theme: 'system',
          haptics_enabled: false
        }).eq("id", user.id);
      }
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

// Expo Router throws warnings if files in the app folder don't have default exports.
export default function StoreIgnored() { return null; }
