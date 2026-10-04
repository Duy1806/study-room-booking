import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { loginUser } from "../firebase/auth";

export default function LoginScreen({
  navigation,
}: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await loginUser(
        email.trim(),
        password
      );
    } catch (error: any) {
      Alert.alert(
        "Login failed",
        error?.message || "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View>
        <Text style={styles.title}>
          Welcome back 👋
        </Text>

        <Text style={styles.subtitle}>
          Sign in to continue to StudyRoom
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="student@vku.udn.vn"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            disabled={loading}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Signing in..."
                : "Sign In"}
            </Text>
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>
              Don't have an account?
            </Text>

            <Pressable
              onPress={() =>
                navigation.navigate("Register")
              }
            >
              <Text style={styles.registerLink}>
                Register
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 8,
  },

  form: {
    marginTop: 32,
  },

  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#0F172A",
  },

  button: {
    height: 54,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
    gap: 5,
  },

  registerText: {
    color: "#64748B",
    fontSize: 14,
  },

  registerLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
});