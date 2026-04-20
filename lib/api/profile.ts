// lib/api/profile.ts
// 🔹 Data access layer — all Supabase profile queries live here.

import { supabase } from "../supabase";
import { Settings, SavingsGoalState, ThemeOption } from "../types";

export type ProfileRow = {
  id: string;
  user_name: string | null;
  ird_number: string | null;
  primary_tax_code: string | null;
  preferred_income_bracket: string | null;
  theme: ThemeOption | null;
  haptics_enabled: boolean;
  savings_goal: number;
  savings_current: number;
  company_options: string[];
};

/** Fetch a user's profile row. Returns null if not found. */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data ?? null;
}

/** Update the profile. Only sends changed fields. */
export async function updateProfile(
  userId: string,
  patch: Partial<{
    user_name: string | null;
    ird_number: string | null;
    primary_tax_code: string | null;
    preferred_income_bracket: string | null;
    theme: ThemeOption;
    haptics_enabled: boolean;
    savings_goal: number;
    savings_current: number;
    company_options: string[];
  }>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (error) throw error;
}

/** Reset a profile back to defaults (used by clearAllData). */
export async function resetProfile(userId: string): Promise<void> {
  await updateProfile(userId, {
    company_options: [],
    savings_goal: 0,
    savings_current: 0,
    user_name: null,
    ird_number: null,
    theme: "system",
    haptics_enabled: false,
  });
}

// ── Convenience mappers ────────────────────────────────────────────────────────

/** Convert a ProfileRow to the Settings shape the store uses. */
export function profileToSettings(profile: ProfileRow): Settings {
  return {
    userName: profile.user_name || undefined,
    irdNumber: profile.ird_number || undefined,
    primaryTaxCode: profile.primary_tax_code || undefined,
    preferredIncomeBracket: profile.preferred_income_bracket || undefined,
    theme: profile.theme || "system",
    hapticsEnabled: profile.haptics_enabled,
  };
}

/** Convert a ProfileRow to the SavingsGoalState shape. */
export function profileToSavings(profile: ProfileRow): SavingsGoalState {
  return {
    goal: profile.savings_goal?.toString() || "",
    current: profile.savings_current?.toString() || "",
  };
}
