import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be minimum 8 characters")
    .max(128)
    .regex(/[A-Z]/, "At least 1 uppercase required")
    .regex(/[0-9]/, "At least 1 number required"),
});

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});


  // Scroll + input refs (nullable types to satisfy TS)
  const scrollViewRef = useRef<ScrollView | null>(null);
  const emailRef = React.useRef<TextInput | null>(null);
  const passwordRef = React.useRef<TextInput | null>(null);

  const emailViewRef = useRef<View | null>(null);
  const passwordViewRef = useRef<View | null>(null);

  const BACKEND =
    (Constants.expoConfig?.extra as any)?.backendUrl ??
    "https://nopass-deba.vercel.app";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "nopassmobile",
    path: "redirect",
  });

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: message,
    });
  };

  const loginWithGoogle = async () => {
    try {
      const startUrl = `${BACKEND}/api/mobile-google-start?next=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(
        startUrl,
        redirectUri
      );

      if (result.type === "success" && result.url) {
        const token = result.url.match(/[?&]token=([^&]+)/)?.[1];
        if (!token) return showToast("error", "Token not found in redirect URL");

        const json = await api.post(
          "/mobile-validate",
          {},
          {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        );

        if (json.success) {
          await login(token);
          // CRITICAL: Wait for state propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace("/(tabs)");
          // Show toast AFTER navigation completes
          setTimeout(() => {
            showToast("success", "Welcome Back! 🎉");
          }, 200);
        } else {
          showToast("error", json.message ?? "Validation failed");
        }
      }
    } catch (err: any) {
      showToast("error", err?.message ?? "Google login failed");
    }
  };

  const loginWithGithub = async () => {
    try {
      const startUrl = `${BACKEND}/api/mobile-github-start?next=${encodeURIComponent(
        redirectUri
      )}`;

      const result = await WebBrowser.openAuthSessionAsync(
        startUrl,
        redirectUri
      );

      if (result.type === "success" && result.url) {
        const token = result.url.match(/[?&]token=([^&]+)/)?.[1];
        if (!token) return showToast("error", "Token not found in redirect URL");

        const json = await api.post(
          "/mobile-validate",
          {},
          {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        );

        if (json.success) {
          await login(token);
          // CRITICAL: Wait for state propagation
          await new Promise(resolve => setTimeout(resolve, 100));
          router.replace("/(tabs)");
          // Show toast AFTER navigation completes
          setTimeout(() => {
            showToast("success", "Welcome Back! 🎉");
          }, 200);
        } else {
          showToast("error", json.message ?? "Validation failed");
        }
      }
    } catch (err: any) {
      showToast("error", err?.message ?? "GitHub login failed");
    }
  };

  // Simple scroll helper
  const scrollToField = (containerRef: React.RefObject<View | null>) => {
    setTimeout(() => {
      if (containerRef.current && scrollViewRef.current) {
        containerRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 120),
              animated: true,
            });
          },
          () => { }
        );
      }
    }, 100);
  };

  // Focus handler with auto-scroll
  const handleFieldFocus = (
    containerRef: React.RefObject<View | null>,
    inputRef: React.RefObject<TextInput | null>
  ) => {
    inputRef.current?.focus();
    scrollToField(containerRef);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});

    const validation = LoginSchema.safeParse({ email, password });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};

      // First issue only
      const firstIssue = validation.error.issues[0];
      const firstField = firstIssue.path[0] as string;

      // Toast for first error only
      Toast.show({
        type: "error",
        text1: firstIssue.message,
      });

      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        fieldErrors[fieldName] = issue.message;
      });

      setErrors(fieldErrors);

      // Auto scroll to error field with proper focus
      setTimeout(() => {
        if (firstField === "email") {
          emailRef.current?.focus();
          scrollToField(emailViewRef);
        } else if (firstField === "password") {
          passwordRef.current?.focus();
          scrollToField(passwordViewRef);
        }
      }, 150);

      return;
    }

    try {
      setLoading(true);
      const json = await api.post("/mobile-login", { email, password });
      if (json?.token) {
        await login(json.token);
        router.replace("/(tabs)");
        showToast("success", "Welcome Back! 🎉");
      } else {
        showToast("error", "Invalid credentials");
      }
    } catch (err: any) {
      showToast("error", err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Smart Gradient Background
  const gradients = {
    dark: ["#0A0A15", "#101535", "#1A1F4D"] as const,
    light: ["#EFF3FF", "#DDE6FF", "#FFFFFF"] as const,
  };

  const bgGradient = isDark ? gradients.dark : gradients.light;

  return (
    <LinearGradient colors={bgGradient} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}  // key line for Android+iOS
            keyboardDismissMode="on-drag" // If the user scrolls, the keyboard will be hidden.
          >
            <Ionicons
              name="shield-checkmark"
              size={60}
              color={isDark ? "#8AA2FF" : "#4C5DFF"}
              style={{ alignSelf: "center", marginBottom: 8 }}
            />

            <Text
              style={[
                styles.title,
                { color: isDark ? "#E6ECF8" : "#1A1E2E" },
              ]}
            >
              Login to NoPass
            </Text>

            {/* Email */}
            <View ref={emailViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(emailViewRef, emailRef)}
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#1E2438" : "#ffffffdd",
                      borderColor: isDark ? "#2A3150" : "#C9D1F0",
                    },
                  ]}
                >
                  <Ionicons name="mail" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={emailRef}
                    placeholder="Email"
                    placeholderTextColor={isDark ? "#A5ABBC" : "#80889A"}
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.inputText, { color: isDark ? "#E8ECF3" : "#1B1F29" }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onFocus={() => scrollToField(emailViewRef)}
                    onSubmitEditing={() =>
                      // keep keyboard active: first focus next input, then scroll
                      handleFieldFocus(passwordViewRef, passwordRef)}
                  />
                </View>
              </TouchableOpacity>
              {errors.email && (
                <Text style={styles.errorText}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password */}
            <View ref={passwordViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(passwordViewRef, passwordRef)}
              >
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#1E2438" : "#ffffffdd",
                      borderColor: isDark ? "#2A3150" : "#C9D1F0",
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    placeholderTextColor={isDark ? "#A5ABBC" : "#80889A"}
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.inputText, { color: isDark ? "#E8ECF3" : "#1B1F29" }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onFocus={() => scrollToField(passwordViewRef)}
                    onSubmitEditing={handleLogin} // final submit
                  />

                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={isDark ? "#A4AAC5" : "#555"}
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              {errors.password && (
                <Text style={styles.errorText}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient
                colors={["#4C3FE3", "#7A46F3", "#A03BFA"]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.divider, { color: isDark ? "#A5ABBC" : "#737070" }]}>OR</Text>

            {/* Google */}
            <TouchableOpacity style={styles.socialBtn} onPress={loginWithGoogle}>
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text style={[styles.socialText, { color: isDark ? "#F3F4F6" : "#1F2937" }]}>
                {" "}
                Login with Google
              </Text>
            </TouchableOpacity>

            {/* GitHub */}
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: "#111" }]}
              onPress={loginWithGithub}
            >
              <Ionicons name="logo-github" size={18} color="#fff" />
              <Text style={[styles.socialText, { color: "#fff" }]}>
                {" "}
                Login with GitHub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={[styles.link, { color: isDark ? "#8EA8FF" : "#4061cf" }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={[styles.link, { color: isDark ? "#8EA8FF" : "#4061cf" }]}>
                Create new account
              </Text>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 26,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    textAlign: "center",
    marginVertical: 14,
    fontSize: 13,
    fontWeight: "500",
  },
  socialBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "500",
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    width: "100%",
    color: "#ff6b6b",
    marginBottom: 12,
    paddingLeft: 4,
    fontSize: 13,
  },
});