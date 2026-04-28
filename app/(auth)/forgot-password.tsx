// app/(auth)/forgot-password.tsx
// 🔑 Password reset — sends a magic link via Supabase Auth

import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { toast } from "../../lib/toast";

const BRAND = "#6B4EFF";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function sendReset() {
    const trimEmail = email.trim();
    if (!trimEmail) {
      toast.error("Please enter your email address.", "Missing email");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimEmail);
    setLoading(false);

    if (error) {
      toast.error(error.message, "Reset failed");
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centred}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={56} color={BRAND} />
          </View>
          <Text style={styles.doneTitle}>Reset link sent!</Text>
          <Text style={styles.doneBody}>
            Check your inbox at{"\n"}
            <Text style={{ fontWeight: "700", color: "#111827" }}>{email}</Text>
            {"\n\n"}
            Follow the link to choose a new password. Then come back and sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.btnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we&apos;ll send you a reset link.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={sendReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flex: 1, padding: 24, paddingTop: 16 },
  centred: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },

  back: { marginBottom: 24, width: 40, height: 40, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 6, lineHeight: 22 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },

  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },

  btn: {
    backgroundColor: BRAND,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#EDE9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  doneTitle: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
  doneBody: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 24, marginBottom: 36 },
});
