// app/(tabs)/settings.tsx
// ⚙️ Settings: profile, tax defaults, theme, savings goal, data management

import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../lib/store";
import { Settings, ThemeOption } from "../../lib/types";
import { supabase } from "../../lib/supabase";
import { ALL_TAX_CODES } from "../../lib/taxEngine";

export default function SettingsScreen() {
  const {
    settings,
    setSettings,
    savingsGoal,
    setSavingsGoal,
    theme,
    setTheme,
    clearAllData,
  } = useAppStore();

  const [localSettings, setLocalSettings] = useState<Settings>({
    ...settings,
  });
  const [goal, setGoal] = useState<string>(savingsGoal.goal || "");
  const [current, setCurrent] = useState<string>(savingsGoal.current || "");

  const handleSaveSettings = async () => {
    await setSettings(localSettings);
    Alert.alert("Saved", "Settings updated.");
  };

  const handleSaveSavings = async () => {
    await setSavingsGoal({ goal, current });
    Alert.alert("Saved", "Savings goal updated.");
  };

  const handleChangeTheme = async (value: ThemeOption) => {
    await setTheme(value);
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear all data",
      "This will remove all saved days, companies, settings and savings goal. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearAllData(),
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          useAppStore.setState({
            savedDays: [],
            settings: {},
            theme: "system",
            savingsGoal: { goal: "", current: "" },
            companyOptions: [],
          });
        },
      },
    ]);
  };

  const toggleHaptics = (value: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      hapticsEnabled: value,
    }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Personalise MyPayTracker to match how you work and save.
        </Text>

        {/* PROFILE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bhupinder"
            value={localSettings.userName ?? ""}
            onChangeText={(text) =>
              setLocalSettings((prev) => ({ ...prev, userName: text }))
            }
          />

          <Text style={styles.label}>IRD number (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 123-456-789"
            value={localSettings.irdNumber ?? ""}
            onChangeText={(text) =>
              setLocalSettings((prev) => ({ ...prev, irdNumber: text }))
            }
          />
        </View>

        {/* TAX DEFAULTS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tax defaults</Text>
          <Text style={styles.helper}>
            These are used as defaults on the Home screen (you can override per
            shift).
          </Text>

          <Text style={styles.label}>Primary tax code</Text>
          <View style={styles.chipRow}>
            {ALL_TAX_CODES.map((code) => {
              const active = localSettings.primaryTaxCode === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      primaryTaxCode: code,
                    }))
                  }
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* THEME + APP PREFERENCES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance & feedback</Text>

          <Text style={styles.label}>Theme</Text>
          <View style={styles.chipRow}>
            {(["system", "light", "dark"] as ThemeOption[]).map((opt) => {
              const active = theme === opt;
              const label =
                opt === "system" ? "System" : opt === "light" ? "Light" : "Dark";
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleChangeTheme(opt)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Haptic feedback</Text>
              <Text style={styles.switchCaption}>
                Light vibration when interacting with dropdowns and buttons.
              </Text>
            </View>
            <Switch
              value={!!localSettings.hapticsEnabled}
              onValueChange={toggleHaptics}
            />
          </View>
        </View>

        {/* SAVINGS GOAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Savings goal</Text>
          <Text style={styles.helper}>
            Used on the Explore tab to show your progress.
          </Text>

          <Text style={styles.label}>Goal (NZD)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 30000"
            value={goal}
            onChangeText={setGoal}
          />

          <Text style={styles.label}>Current saved (NZD)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 5023"
            value={current}
            onChangeText={setCurrent}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveSavings}
          >
            <Text style={styles.primaryButtonText}>Save savings goal</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIONS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSaveSettings}
          >
            <Text style={styles.secondaryButtonText}>Save all settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.destructiveButton}
            onPress={handleClearAll}
          >
            <Text style={styles.destructiveButtonText}>Clear all data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* ABOUT */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About MyPayTracker</Text>
          <Text style={styles.aboutText}>
            MyPayTracker helps shift workers quickly calculate hours, NZ PAYE tax,
            and take-home pay. Keep a day-by-day history and stay on top of long-term savings goals.
          </Text>
          <Text style={styles.aboutTextSmall}>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 8,
  },
  helper: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#6B4EFF",
    borderColor: "#6B4EFF",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  switchCaption: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
    maxWidth: 220,
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#6B4EFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#6B4EFF",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6B4EFF",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: "#6B4EFF",
    fontWeight: "600",
    fontSize: 15,
  },
  destructiveButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
    paddingVertical: 12,
    alignItems: "center",
  },
  destructiveButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
  aboutText: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },
  aboutTextSmall: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
