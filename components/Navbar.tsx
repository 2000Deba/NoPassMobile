import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safeArea, isDark ? styles.navDark : styles.navLight]}
    >
      <View style={styles.container}>
        {/* Left Side */}
        <View style={styles.left}>
          <Image
            source={require("../assets/NoPass.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, isDark ? styles.darkText : styles.lightText]}>
            NoPass
          </Text>
        </View>

        {/* Right Side */}
        <View style={styles.right}>
          {/* Theme toggle */}
          <TouchableOpacity onPress={toggle} style={styles.iconBtn}>
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={22}
              color={isDark ? "#fff" : "#0f172a"}
            />
          </TouchableOpacity>

          {/* Login / Logout */}
          {!user ? (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={logout}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },
  container: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* Layout */
  left: { flexDirection: "row", alignItems: "center" },
  right: { flexDirection: "row", alignItems: "center" },

  /* Logo */
  logo: {
    width: 34,
    height: 34,
    marginRight: 8,
  },

  title: { fontSize: 18, fontWeight: "800" },

  /* Buttons */
  iconBtn: { marginRight: 12, padding: 6 },

  loginBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  loginText: { color: "#fff", fontWeight: "700" },

  logoutBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700" },

  navDark: { backgroundColor: "#122757" },
  navLight: { backgroundColor: "#e2e8f0" },

  darkText: { color: "#ffffff" },
  lightText: { color: "#1e293b" },
});
