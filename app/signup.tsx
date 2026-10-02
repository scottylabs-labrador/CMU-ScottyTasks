import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { requireSupabase } from "@/config/supabase";
import { UI_COLORS } from "@/constants/gamification";
import ScottyDog from "@/components/ScottyDog";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email: email.trim(), password,
        options: { data: { name: name.trim() } },
      });
      if (error) throw error;
      if (!data.session) {
        Alert.alert("Check your email", "Confirm your email address, then return here to log in.");
        router.replace("/login");
        return;
      }

      router.replace("/(tabs)/scotty");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.mascotBox}>
            <ScottyDog size={64} animated={true} />
            <Text style={styles.appTitle}>Create Account</Text>
            <Text style={styles.appSubtitle}>
              Join CMU ScottyTasks and compete with classmates
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Andrew Carnegie"
              placeholderTextColor={UI_COLORS.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>CMU Email</Text>
            <TextInput
              style={styles.input}
              placeholder="andrew_id@andrew.cmu.edu"
              placeholderTextColor={UI_COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={UI_COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor={UI_COLORS.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={{ color: UI_COLORS.cmuRed, fontWeight: "800" }}>
                Log In
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_COLORS.bgWarm,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },
  mascotBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: "transparent",
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: UI_COLORS.bgWarm,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: UI_COLORS.textPrimary,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: UI_COLORS.textOnAccent,
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
  },
});
