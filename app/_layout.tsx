// app/_layout.tsx
import { Stack } from 'expo-router';
import { CardsProvider } from '@/context/CardsContext';
import { PasswordsProvider } from '@/context/PasswordsContext';
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from "@/components/Navbar";
import Toast from "react-native-toast-message";

function RootNavigation() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      {/* Global Navbar (all screens) */}
      <Navbar />

      {/* All routes accessible (No forced redirect!) */}
      <Stack screenOptions={{ headerShown: false }} />

      {/* Global Toast */}
      <Toast position="top" visibilityTime={2500} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CardsProvider>
          <PasswordsProvider>
            <RootNavigation />
          </PasswordsProvider>
        </CardsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}