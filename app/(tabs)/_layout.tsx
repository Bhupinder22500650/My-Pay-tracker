// app/(tabs)/_layout.tsx
// 🔹 Bottom tab navigation + global store initialization + theme support

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../../lib/store";
import { Colors } from "../../constants/DesignSystem";

export default function TabsLayout() {
  const loadFromCloud = useAppStore((s) => s.loadFromCloud);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    // Load data on app start
    loadFromCloud();
  }, []);

  // Separately track system appearance — don't overwrite the stored preference
  useEffect(() => {
    if (theme !== "system") return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // We read system scheme at render time — no need to persist
    });
    return () => subscription.remove();
  }, [theme]);

  const insets = useSafeAreaInsets();
  const colorScheme = useAppStore((s) => s.theme) === "dark" ? "dark" : "light";
  const themeColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: themeColors.tabBarActive,
        tabBarInactiveTintColor: themeColors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 8 : 0),
          elevation: 0, // Remove default android shadow for cleaner look
          shadowOpacity: 0, // Remove default ios shadow
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 2,
        },
        tabBarIcon: ({ focused, size, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "index") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "explore") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
