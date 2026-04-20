// app/(auth)/register.tsx
// 📝 Register screen with password confirmation + strength enforcement

import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  async function signUp() {
    const trimEmail = email.trim();
    if (!trimEmail || !password || !confirmPassword) {
      toast.error("Please fill in all fields.", "Missing info");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      toast.error("Please enter a valid email address.", "Invalid email");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        "Weak password"
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", "Mismatch");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: trimEmail,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message, "Registration failed");
    } else {
      setEmailSent(true);
    }
  }

  // ── Email sent confirmation screen ────────────────────────────────────────
  if (emailSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Ionicons name="mail" size={48} color={BRAND} />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmBody}>
            We've sent a confirmation link to{"\n"}
            <Text style={{ fontWeight: "700", color: "#111827" }}>{email}</Text>
            {"\n\n"}
            Click the link in the email to activate your account, then come back
            and sign in.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start tracking your shifts today
            </Text>
          </View>

          <View style={styles.card}>
            {/* Email */}
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

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm password */}
            <Text style={styles.label}>Confirm password</Text>
            <View style={[
              styles.inputRow,
              confirmPassword.length > 0 && password !== confirmPassword && styles.inputRowError
            ]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords don't match</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={signUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchRow}
            onPress={() => router.back()}
          >
            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flexGrow: 1, padding: 24, paddingTop: 16 },

  back: { marginBottom: 24, width: 40, height: 40, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
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
    marginBottom: 16,
  },
  inputRowError: { borderColor: "#EF4444" },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: -12, marginBottom: 12 },

  btn: {
    backgroundColor: BRAND,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    shadowColor: BRAND,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  switchRow: { alignItems: "center" },
  switchText: { fontSize: 14, color: "#6B7280" },
  switchLink: { color: BRAND, fontWeight: "600" },

  // Email-sent confirmation
  confirmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  confirmIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#EDE9FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  confirmTitle: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
  confirmBody: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 36,
  },
});
