// lib/toast.ts
// 🔔 Lightweight in-app toast — no native linking required
// Usage: toast.success("Saved!") / toast.error("Failed") / toast.info("Check email")

import { Alert } from "react-native";

export const toast = {
  success: (message: string, title = "Success") => {
    Alert.alert(title, message);
  },
  error: (message: string, title = "Something went wrong") => {
    Alert.alert(title, message);
  },
  info: (message: string, title = "Info") => {
    Alert.alert(title, message);
  },
};
