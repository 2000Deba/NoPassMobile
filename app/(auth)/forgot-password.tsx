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
import Toast from "react-native-toast-message";
import { useTheme } from "@/context/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { z } from "zod";

const ForgotSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export default function ForgotPassword() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");

  const scrollViewRef = useRef<ScrollView | null>(null);
  const emailRef = useRef<TextInput>(null);
  const emailViewRef = useRef<View | null>(null);

  const BACKEND =
    (Constants.expoConfig?.extra?.backendUrl as string) ??
    "https://nopass-deba.vercel.app";

  // Scroll helper
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

  const handleForgotPassword = async () => {
    // Clear previous error
    setEmailError("");

    const validation = ForgotSchema.safeParse({ email });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0].message;

      Toast.show({
        type: "error",
        text1: errorMessage,
      });

      setEmailError(errorMessage);

      // Focus and scroll to error field with delay
      setTimeout(() => {
        emailRef.current?.focus();
        scrollToField(emailViewRef);
      }, 150);

      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        Toast.show({
          type: "error",
          text1: data?.message || "No account found with this email",
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Reset link sent successfully! 📩",
        text2: "Check your email inbox",
      });

      // Clear the email input after successful submission
      setEmail("");

      setTimeout(() => {
        router.push("/(auth)/login");
      }, 2000);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Request failed",
        text2: error?.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const bgGradient: [string, string, string] = isDark
    ? ["#0A0A15", "#101535", "#1A1F4D"]
    : ["#EFF3FF", "#DDE6FF", "#FFFFFF"];

  const textColor = isDark ? "#E6ECF8" : "#1A1E2E";
  const placeholderColor = isDark ? "#A5ABBC" : "#80889A";
  const inputBg = isDark ? "#1E2438" : "#ffffffdd";
  const borderColor = isDark ? "#2A3150" : "#C9D1F0";

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
            automaticallyAdjustKeyboardInsets={true}  // 👈 key line for Android+iOS
            keyboardDismissMode="on-drag" // If the user scrolls, the keyboard will be hidden.
          >
            <Ionicons
              name="mail-open"
              size={64}
              color={isDark ? "#8AA2FF" : "#4C5DFF"}
              style={{ alignSelf: "center", marginBottom: 12 }}
            />

            <Text style={[styles.title, { color: textColor }]}>
              Forgot Password 🔑
            </Text>
            <Text style={[styles.subtitle, { color: placeholderColor }]}>
              Enter your email to receive reset instructions.
            </Text>

            {/* Email Input */}
            <View ref={emailViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(emailViewRef, emailRef)}
              >
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: inputBg, borderColor },
                  ]}
                >
                  <Ionicons name="mail" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={emailRef}
                    placeholder="Email"
                    placeholderTextColor={placeholderColor}
                    style={[styles.inputText, { color: textColor }]}
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onFocus={() => scrollToField(emailViewRef)}
                    onSubmitEditing={handleForgotPassword}
                  />
                </View>
              </TouchableOpacity>

              {/* Inline error */}
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <LinearGradient
                colors={["#4C3FE3", "#7A46F3", "#A03BFA"]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text
                style={[
                  styles.link,
                  { color: isDark ? "#8EA8FF" : "#4061cf" },
                ]}
              >
                Back to Login
              </Text>
            </TouchableOpacity>

            <View style={{ height: 36 }} />
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
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
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
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "700",
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
