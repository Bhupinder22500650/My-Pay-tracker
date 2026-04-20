// app/(auth)/register.tsx
// 📝 Register — react-hook-form + zod, email-sent confirmation state

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
import { registerSchema, RegisterFormData } from "../../lib/schemas";
import { toast } from "../../lib/toast";

const BRAND = "#6B4EFF";

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message, "Registration failed");
    } else {
      setSentTo(data.email);
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centred}>
          <View style={styles.confirmIcon}>
            <Ionicons name="mail" size={48} color={BRAND} />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmBody}>
            We sent a confirmation link to{"\n"}
            <Text style={{ fontWeight: "700", color: "#111827" }}>{sentTo}</Text>
            {"\n\n"}
            Tap the link to activate your account, then sign in.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.btnText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start tracking your shifts today</Text>
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
                  <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#9CA3AF" value={value} onChangeText={onChange} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
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
                  <TextInput style={styles.input} placeholder="At least 8 characters" placeholderTextColor="#9CA3AF" value={value} onChangeText={onChange} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            {/* Confirm */}
            <Text style={[styles.label, { marginTop: 12 }]}>Confirm password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.inputRow, errors.confirmPassword && styles.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#9CA3AF" style={styles.icon} />
                  <TextInput style={styles.input} placeholder="Repeat your password" placeholderTextColor="#9CA3AF" value={value} onChangeText={onChange} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} />
                </View>
              )}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

            <TouchableOpacity style={[styles.btn, { marginTop: 20 }, isSubmitting && { opacity: 0.7 }]} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchRow} onPress={() => router.back()}>
            <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Sign in</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flexGrow: 1, padding: 24, paddingTop: 16 },
  centred: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  back: { marginBottom: 24, width: 40, height: 40, justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: "#F9FAFB" },
  inputError: { borderColor: "#EF4444" },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 4, marginBottom: 4 },
  btn: { backgroundColor: BRAND, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", shadowColor: BRAND, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switchRow: { alignItems: "center" },
  switchText: { fontSize: 14, color: "#6B7280" },
  switchLink: { color: BRAND, fontWeight: "600" },
  confirmIcon: { width: 96, height: 96, borderRadius: 24, backgroundColor: "#EDE9FF", justifyContent: "center", alignItems: "center", marginBottom: 28 },
  confirmTitle: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 16 },
  confirmBody: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 24, marginBottom: 36 },
});
