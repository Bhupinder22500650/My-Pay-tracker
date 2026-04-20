// app/_layout.tsx
// 🔹 Root layout with AuthProvider and SafeArea

import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../components/AuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAppStore } from "./store/appStore";

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // User is not signed in and trying to access a secure screen
      router.replace("/(auth)/login");
    } else if (session) {
      // User is signed in. Let's make sure cloud data is fetched instantly.
      useAppStore.getState().loadFromCloud();
      
      if (inAuthGroup) {
        // trying to access the login/register screen while logged in -> redirect 
        router.replace("/(tabs)");
      }
    }
  }, [session, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
