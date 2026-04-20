// app/(auth)/login.tsx
// 🔐 Login — react-hook-form + zod validation

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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../../lib/supabase";
import { loginSchema, LoginFormData } from "../../lib/schemas";
import { toast } from "../../lib/toast";

const BRAND = "#6B4EFF";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) toast.error(error.message, "Sign in failed");
    // On success: _layout listens to onAuthStateChange and navigates automatically
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="wallet" size={36} color="#fff" />
            </View>
            <Text style={styles.appName}>MyPayTracker</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.card}>
            {/* Email */}
            <Text style={styles.label}>Email address</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputRow, errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            {/* Password */}
            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputRow, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your password"
                    placeholderTextColor="#9CA3AF"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotRow} onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit */}
            <TouchableOpacity style={[styles.btn, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchRow} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.switchText}>Don't have an account? <Text style={styles.switchLink}>Create one</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 36 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: BRAND, justifyContent: "center", alignItems: "center", marginBottom: 16, shadowColor: BRAND, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 8 },
  appName: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: "#F9FAFB" },
  inputError: { borderColor: "#EF4444" },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4, marginBottom: 4 },
  forgotRow: { alignItems: "flex-end", marginVertical: 12 },
  forgotText: { fontSize: 13, color: BRAND, fontWeight: "500" },
  btn: { backgroundColor: BRAND, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", shadowColor: BRAND, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchRow: { alignItems: "center" },
  switchText: { fontSize: 14, color: "#6B7280" },
  switchLink: { color: BRAND, fontWeight: "600" },
});
