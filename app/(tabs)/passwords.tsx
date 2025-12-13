import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import YourPasswords from "@/components/YourPasswords";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Constants from "expo-constants";
import { usePasswords } from "@/context/PasswordsContext";
import { useRouter } from "expo-router";

export default function PasswordsScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const { isLoggedIn } = useAuth();
  const { triggerRefresh, isPasswordEditMode } = usePasswords(); // global refresh trigger

  const [refreshing, setRefreshing] = useState(false);

  const BACKEND_BASE =
    (Constants.expoConfig?.extra?.backendUrl as string | undefined) ??
    "https://nopass-deba.vercel.app";
  const API_BASE = `${BACKEND_BASE}/api`;
  const PASSWORD_API_URL = `${API_BASE}/mobile-passwords`;

  const handleRefresh = () => {
    setRefreshing(true);
    // trigger global refresh so YourCards (and Home) refetch
    triggerRefresh();
    // small UX delay so refreshControl hides smoothly
    setTimeout(() => setRefreshing(false), 700);
  };

  // When edit mode enabled → go to Home automatically
  useEffect(() => {
    if (isPasswordEditMode) {
      const timer = setTimeout(() => {
        router.push("/");
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPasswordEditMode, router]);

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.darkBackground : styles.lightBackground]}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <Text style={[styles.heading, isDark ? styles.textDark : styles.textLight]}>🔐 Your Passwords</Text>

      <View style={{ marginBottom: 16 }}>
        <YourPasswords
          isAuthenticated={!!isLoggedIn}
          apiUrl={PASSWORD_API_URL}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  lightBackground: {
    backgroundColor: "#f8fafc",
  },
  darkBackground: {
    backgroundColor: "#0f172a",
  },
  textLight: {
    color: "#1e293b",
  },
  textDark: {
    color: "#f1f5f9",
  },
});
