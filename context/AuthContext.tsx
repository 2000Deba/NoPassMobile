import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { ToastAndroid, Platform, Alert } from "react-native";
import { api } from "@/lib/api";

export type UserType = {
  id: string;
  name?: string;
  email: string;
  provider?: "credentials" | "google" | "github";
  image?: string;
};

type AuthContextType = {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  requireAuthAction: (label?: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    restoreAuth();
  }, []);

  const restoreAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);

      const me = await api.get("/mobile-me");

      if (me?.success) {
        setUser(me.user);
      } else {
        showToast("Session expired. Please login again.");
        await logout();
      }
    } catch (e) {
      console.error("RESTORE FAIL:", e);
      showToast("Login expired. Please login again.");
      await logout();
    } finally {
      setLoading(false);
    }
  };

  // FIXED — Always store token as string and Synchronous state update
  const login = async (t: string) => {
    try {
      // // Store token first
      await SecureStore.setItemAsync("token", String(t));

      setToken(String(t));

      const me = await api.get("/mobile-me");
      if (!me?.success) throw new Error("User validation failed");

      setUser(me.user);
      // CRITICAL: Wait for React state to propagate
      await new Promise(resolve => setTimeout(resolve, 0));
    } catch (e) {
      console.error("LOGIN FAIL:", e);
      showToast("Login failed");
      await logout();
      throw e; // Re-throw so caller knows it failed
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await SecureStore.deleteItemAsync("token");
    } catch { }
  };

  const requireAuthAction = (label?: string) => {
    if (!user) {
      const msg = label
        ? `Login required to ${label}.`
        : `You must be logged in to continue.`;
      showToast(msg);
      return false;
    }
    return true;
  };

  const showToast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Notice", msg);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isLoggedIn: !!user,
        login,
        logout,
        requireAuthAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
