import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggle: () => void;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("theme");
        if (stored === "light" || stored === "dark") {
          setTheme(stored);
        } else {
          const sys = Appearance.getColorScheme();
          setTheme(sys === "dark" ? "dark" : "light");
        }
      } catch (err) {
        const sys = Appearance.getColorScheme();
        setTheme(sys === "dark" ? "dark" : "light");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    await AsyncStorage.setItem("theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
