import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/context/ThemeContext";
import { View, StyleSheet } from "react-native";

export default function TabsLayout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <View style={[styles.container, isDark ? styles.darkBg : styles.lightBg]}>

      {/* Tab Navigation */}
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: isDark ? "#4ADE80" : "#2563EB",
          tabBarInactiveTintColor: isDark ? "#A1A1AA" : "#94A3B8",
          tabBarStyle: {
            backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF",
          },
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "(tabs)") iconName = "home"; // auto picks index
            else if (route.name === "cards") iconName = "card";
            else if (route.name === "passwords") iconName = "lock-closed";
            else if (route.name === "profile") iconName = "person";
            else iconName = "home";

            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="cards" options={{ title: "Cards" }} />
        <Tabs.Screen name="passwords" options={{ title: "Passwords" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkBg: {
    backgroundColor: "#0f172a",
  },
  lightBg: {
    backgroundColor: "#f8fafc",
  },
});