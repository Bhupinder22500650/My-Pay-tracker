// app/_layout.tsx
// 🔹 Root layout — SafeAreaProvider → QueryClientProvider → AuthProvider → InitialLayout

import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../components/AuthProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../lib/store";

// One shared QueryClient for the whole app.
// staleTime: 30 s — data is considered fresh for 30 seconds before a background refetch.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session) {
      useAppStore.getState().loadFromCloud();
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
