// app/(tabs)/_layout.tsx
// 🔹 Bottom tab navigation + global store initialization + theme support

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../store/appStore";
import { Colors } from "../../constants/DesignSystem";

export default function TabsLayout() {
  const loadAll = useAppStore((s) => s.loadAll);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useEffect(() => {
    // Load data on app start
    loadAll();

    // Apply system theme if user selected "system"
    if (theme === "system") {
      const systemScheme = Appearance.getColorScheme();
      if (systemScheme === "dark") {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    }
  }, []);

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
