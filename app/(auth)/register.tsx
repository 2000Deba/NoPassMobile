// app/(auth)/register.tsx
import React, { useState } from "react";
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

// Validation Schema
const RegisterSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters")
    .max(50, { message: "The name is too big." })
    .regex(/^[\p{L}\s.'-]+$/u, {
      message: "The name contains invalid characters.",
    }),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be minimum 8 characters")
    .max(128)
    .regex(/[A-Z]/, "At least 1 uppercase required")
    .regex(/[0-9]/, "At least 1 number required"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Register() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Separate error states for each field
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");

  const scrollViewRef = React.useRef<ScrollView | null>(null);
  const nameRef = React.useRef<TextInput | null>(null);
  const emailRef = React.useRef<TextInput | null>(null);
  const passwordRef = React.useRef<TextInput | null>(null);
  const confirmPasswordRef = React.useRef<TextInput | null>(null);

  const nameViewRef = React.useRef<View | null>(null);
  const emailViewRef = React.useRef<View | null>(null);
  const passwordViewRef = React.useRef<View | null>(null);
  const confirmPasswordViewRef = React.useRef<View | null>(null);

  const BACKEND =
    (Constants.expoConfig?.extra?.backendUrl as string) ??
    "https://nopass-deba.vercel.app";

  // Helper function to scroll to a specific field
  const scrollToField = (containerRef: React.RefObject<View | null>) => {
    setTimeout(() => {
      if (containerRef.current && scrollViewRef.current) {
        containerRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 120), // negative scroll prevent করার জন্য
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

  const handleRegister = async () => {
    // Clear all errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    const validation = RegisterSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      // Map all errors to their respective fields
      const errors = validation.error.issues;

      errors.forEach((err) => {
        const field = err.path[0];
        switch (field) {
          case "name":
            setNameError(err.message);
            break;
          case "email":
            setEmailError(err.message);
            break;
          case "password":
            setPasswordError(err.message);
            break;
          case "confirmPassword":
            setConfirmPasswordError(err.message);
            break;
        }
      });

      // Show toast for first error only
      const firstErr = errors[0];

      Toast.show({
        type: "error",
        text1: firstErr.message,
      });

      // Auto-scroll and focus on first error field
      setTimeout(() => {
        const errorPath = firstErr.path[0];
        switch (errorPath) {
          case "name":
            nameRef.current?.focus();
            scrollToField(nameViewRef);
            break;
          case "email":
            emailRef.current?.focus();
            scrollToField(emailViewRef);
            break;
          case "password":
            passwordRef.current?.focus();
            scrollToField(passwordViewRef);
            break;
          case "confirmPassword":
            confirmPasswordRef.current?.focus();
            scrollToField(confirmPasswordViewRef);
            break;
        }
      }, 150);

      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BACKEND}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // show server error in toast (or fallback)
        Toast.show({
          type: "error",
          text1: data?.error || data?.message || "Registration failed",
        });
        setLoading(false);
        return;
      }

      // Success
      Toast.show({
        type: "success",
        text1: "Account created successfully! 🎉",
        text2: "Redirecting to login...",
      });

      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
    } catch (err: any) {
      console.error("register err", err);
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: err?.message ?? "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const bgGradient = isDark
    ? (["#0A0A15", "#101535", "#1A1F4D"] as const)
    : (["#EFF3FF", "#DDE6FF", "#FFFFFF"] as const);

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
            automaticallyAdjustKeyboardInsets={true}  // key line for Android+iOS
            keyboardDismissMode="on-drag" // If the user scrolls, the keyboard will be hidden.
          >
            <Ionicons
              name="person-add"
              size={64}
              color={isDark ? "#8AA2FF" : "#4C5DFF"}
              style={{ alignSelf: "center", marginBottom: 8 }}
            />

            <Text style={[styles.title, { color: textColor }]}>
              Create Account
            </Text>

            {/* Name */}
            <View ref={nameViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(nameViewRef, nameRef)}>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                  <Ionicons name="person" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={nameRef}
                    placeholder="Full name"
                    placeholderTextColor={placeholderColor}
                    value={name}
                    onChangeText={setName}
                    style={[styles.inputText, { color: textColor }]}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => handleFieldFocus(emailViewRef, emailRef)}
                    onFocus={() => scrollToField(nameViewRef)}
                  />
                </View>
              </TouchableOpacity>

              {/* Inline error */}
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View ref={emailViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(emailViewRef, emailRef)}>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                  <Ionicons name="mail" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={emailRef}
                    placeholder="Email"
                    placeholderTextColor={placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.inputText, { color: textColor }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => handleFieldFocus(passwordViewRef, passwordRef)}
                    onFocus={() => scrollToField(emailViewRef)}
                  />
                </View>
              </TouchableOpacity>

              {/* Inline error */}
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View ref={passwordViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(passwordViewRef, passwordRef)}>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                  <Ionicons name="lock-closed" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={passwordRef}
                    placeholder="Password"
                    placeholderTextColor={placeholderColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    style={[styles.inputText, { color: textColor }]}
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => handleFieldFocus(confirmPasswordViewRef, confirmPasswordRef)}
                    onFocus={() => scrollToField(passwordViewRef)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={isDark ? "#A4AAC5" : "#555"}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Inline error */}
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View ref={confirmPasswordViewRef}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleFieldFocus(confirmPasswordViewRef, confirmPasswordRef)}>
                <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor }]}>
                  <Ionicons name="lock-closed" size={18} color="#888" style={{ marginRight: 8 }} />
                  <TextInput
                    ref={confirmPasswordRef}
                    placeholder="Confirm password"
                    placeholderTextColor={placeholderColor}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.inputText, { color: textColor }]}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleRegister} // final submit
                    onFocus={() => scrollToField(confirmPasswordViewRef)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={isDark ? "#A4AAC5" : "#555"}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Inline error */}
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Register button */}
            <TouchableOpacity onPress={handleRegister} disabled={loading}>
              <LinearGradient
                colors={["#4C3FE3", "#7A46F3", "#A03BFA"]}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Links */}
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={[styles.link, { color: isDark ? "#8EA8FF" : "#4061cf" }]}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>

            <View style={{ height: 36 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        {/* </SafeAreaView> */}
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
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 18,
    textAlign: "center",
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
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
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