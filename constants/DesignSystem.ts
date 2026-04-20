// constants/DesignSystem.ts
// 🔹 Premium UI/UX tokens for MyPayTracker

export const Colors = {
  light: {
    primary: "#6B4EFF", // Vibrant Purple
    secondary: "#10B981", // Emerald Green
    background: "#F8F9FA",
    surface: "#FFFFFF",
    text: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    tabBarActive: "#6B4EFF",
    tabBarInactive: "#9CA3AF",
  },
  dark: {
    primary: "#8B5CF6", // Lighter Vibrant Purple
    secondary: "#34D399", // Lighter Emerald Green
    background: "#111827",
    surface: "#1F2937",
    text: "#F9FAFB",
    textMuted: "#9CA3AF",
    border: "#374151",
    error: "#F87171",
    tabBarActive: "#8B5CF6",
    tabBarInactive: "#6B7280",
  },
};

export const Typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    bold: "System",
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
