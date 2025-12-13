import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function RedirectHandler() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    handleRedirect();
  }, []);

  const handleRedirect = async () => {
    try {
      const token = params.token as string;

      if (token) {
        // Login through context
        await login(token);

        // CRITICAL: Wait for state to fully update
        await new Promise(resolve => setTimeout(resolve, 150));

        // Use replace to clear navigation stack
        router.replace("/(tabs)");
      } else {
        // No token found
        console.log("No token in redirect URL");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("Redirect handler error:", error);
      // On error, go back to login
      router.replace("/(auth)/login");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading screen during processing
  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}>
      <ActivityIndicator size="large" color={isDark ? "#8AA2FF" : "#4C3FE3"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});