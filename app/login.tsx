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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, signInWithEmailAndPassword } from "@/config/firebase";
import { UI_COLORS } from "@/constants/gamification";
import ScottyDog from "@/components/ScottyDog";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/(tabs)/tasks");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    router.replace("/(tabs)/tasks");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          {/* Scotty Mascot */}
          <View style={styles.mascotBox}>
            <ScottyDog size={80} animated={true} />
            <Text style={styles.appTitle}>ScottyTasks</Text>
            <Text style={styles.appSubtitle}>
              Stay on track, earn rewards &amp; level up
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Welcome Back</Text>

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
              placeholder="Enter your password"
              placeholderTextColor={UI_COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Logging in..." : "Log In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuest}
            >
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/signup")}
          >
            <Text style={styles.linkText}>
              Don&apos;t have an account?{" "}
              <Text style={{ color: UI_COLORS.cmuRed, fontWeight: "800" }}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  mascotBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: UI_COLORS.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },
  card: {
    backgroundColor: UI_COLORS.bgCard,
    borderColor: UI_COLORS.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "900",
    color: UI_COLORS.textPrimary,
    marginBottom: 16,
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
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: UI_COLORS.textPrimary,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: UI_COLORS.cmuRed,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  guestButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  guestButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: UI_COLORS.textSecondary,
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
