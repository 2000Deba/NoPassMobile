// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useCards } from "@/context/CardsContext";
import { usePasswords } from "@/context/PasswordsContext";

type Counts = {
  passwords: number | null;
  cards: number | null;
};

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Context থেকে refreshKey নিচ্ছি
  const { refreshKey: cardRefreshKey } = useCards();
  const { refreshKey: passwordRefreshKey } = usePasswords();

  const [counts, setCounts] = useState<Counts>({ passwords: null, cards: null });
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_BASE =
    (Constants.expoConfig?.extra?.backendUrl as string | undefined) ??
    "https://nopass-deba.vercel.app";
  const API_BASE = `${BACKEND_BASE}/api`;
  const CARD_COUNT_URL = `${API_BASE}/mobile-cards?countOnly=true`;
  const PASSWORD_COUNT_URL = `${API_BASE}/mobile-passwords?countOnly=true`;
  const MOBILE_ME_URL = `${API_BASE}/mobile-me`; // should accept Bearer token

  useEffect(() => {
    let mounted = true;
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // parallel requests
        const [pwRes, cardRes, meRes] = await Promise.all([
          fetch(PASSWORD_COUNT_URL, { headers }),
          fetch(CARD_COUNT_URL, { headers }),
          fetch(MOBILE_ME_URL, { headers }),
        ]);

        // passwords count
        if (pwRes.ok) {
          const pwJson = await pwRes.json();
          const pwCount = typeof pwJson.count === "number" ? pwJson.count : null;
          if (mounted) setCounts((s) => ({ ...s, passwords: pwCount }));
        } else {
          if (mounted) setCounts((s) => ({ ...s, passwords: 0 }));
        }

        // cards count
        if (cardRes.ok) {
          const cardJson = await cardRes.json();
          const cCount = typeof cardJson.count === "number" ? cardJson.count : null;
          if (mounted) setCounts((s) => ({ ...s, cards: cCount }));
        } else {
          if (mounted) setCounts((s) => ({ ...s, cards: 0 }));
        }

        // user / lastLogin
        if (meRes.ok) {
          const meJson = await meRes.json();
          // mobile-me should return { name, email, image, lastLogin, createdAt }
          const raw = meRes.ok && meJson?.user?.lastLogin ? meJson.user.lastLogin : meJson?.user?.createdAt ?? null;
          if (raw && mounted) {
            const dt = new Date(raw);
            const formatted = dt.toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            });
            setLastLogin(formatted);
          } else {
            if (mounted) setLastLogin("First Login");
          }
        } else {
          if (mounted) setLastLogin("--");
        }
      } catch (err) {
        console.warn("Profile fetch error:", err);
        if (mounted) {
          setCounts({ passwords: 0, cards: 0 });
          setLastLogin("--");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfileData();
    return () => {
      mounted = false;
    };
  }, [token, cardRefreshKey, passwordRefreshKey]); // refreshKey dependencies যোগ করা হয়েছে

  return (
    <ScrollView
      style={isDark ? styles.darkBackground : styles.lightBackground}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={["#fb923c", "#f87171", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.ringInner}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <Ionicons name="person-circle-outline" size={90} color={isDark ? "#cbd5e1" : "#475569"} />
            )}
          </View>
        </LinearGradient>

        <Text style={[styles.name, { color: isDark ? "#e2e8f0" : "#1e293b" }]}>
          {user?.name || "User"}
        </Text>
        <Text style={[styles.email, { color: isDark ? "#94a3b8" : "#475569" }]}>
          {user?.email ?? ""}
        </Text>
      </View>

      {/* Summary card (counts + lastLogin) */}
      <View style={[styles.summaryCard, isDark ? styles.summaryDark : styles.summaryLight]}>
        {loading ? (
          <View style={{ paddingVertical: 12 }}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Ionicons name="key" size={20} color="#fb923c" />
              <View style={styles.summaryTextWrap}>
                <Text style={[styles.summaryLabel, isDark ? styles.textLight : styles.textDark]}>Stored Passwords</Text>
                <Text style={[styles.summaryValue, isDark ? styles.textLight : styles.textDark]}>
                  {counts.passwords ?? "--"}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="card" size={20} color="#00b4d8" />
              <View style={styles.summaryTextWrap}>
                <Text style={[styles.summaryLabel, isDark ? styles.textLight : styles.textDark]}>Saved Cards</Text>
                <Text style={[styles.summaryValue, isDark ? styles.textLight : styles.textDark]}>
                  {counts.cards ?? "--"}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="time" size={20} color="#fbbf24" />
              <View style={styles.summaryTextWrap}>
                <Text style={[styles.summaryLabel, isDark ? styles.textLight : styles.textDark]}>Last Login</Text>
                <Text style={[styles.summaryValue, isDark ? styles.textLight : styles.textDark]}>
                  {lastLogin ?? "--"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {user ? (
          <>
            <TouchableOpacity style={styles.btnWrapper} onPress={() => router.push("/(tabs)/cards")}>
              <LinearGradient colors={["#00B4D8", "#0077B6"]} style={styles.gradientButton}>
                <Text style={styles.btnText}>Your Cards</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnWrapper} onPress={() => router.push("/(tabs)/passwords")}>
              <LinearGradient colors={["#8338EC", "#F72585"]} style={styles.gradientButton}>
                <Text style={styles.btnText}>Your Passwords</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnWrapper} onPress={toggle}>
              <LinearGradient colors={["#2ECC71", "#145A32"]} style={styles.gradientButton}>
                <Text style={styles.btnText}>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity style={styles.btnWrapper} onPress={logout}>
              <LinearGradient colors={["#ef4444", "#dc2626"]} style={styles.gradientButton}>
                <Text style={styles.btnText}>Logout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Login Button */}
            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={() => router.push("/register")}
            >
              <LinearGradient
                colors={["#00B4D8", "#0077B6"]}
                style={styles.gradientButton}
              >
                <Text style={styles.btnText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnWrapper}
              onPress={() => router.push("/login")}
            >
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                style={styles.gradientButton}
              >
                <Text style={styles.btnText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Dark/Light Mode Switch → Always Visible */}
            <TouchableOpacity style={styles.btnWrapper} onPress={toggle}>
              <LinearGradient colors={["#2ECC71", "#145A32"]} style={styles.gradientButton}>
                <Text style={styles.btnText}>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {/* Designed & Built By Text */}
        <View style={styles.designedContainer}>
          <Text style={[styles.designedText, { color: isDark ? "#94a3b8" : "#475569" }]}>
            Designed & Built with ❤️ by{" "}
          </Text>
          <MaskedView
            maskElement={
              <Text style={styles.gradientNameMask}>Debasish Seal</Text>
            }
          >
            <LinearGradient
              colors={["#FF6B00", "#FF006E", "#D800A6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.gradientNameMask, { opacity: 0 }]}>
                Debasish Seal
              </Text>
            </LinearGradient>
          </MaskedView>
        </View>

        {/* Version placed inside scroll so it won't overlap */}
        <Text style={[styles.version, { color: isDark ? "#94a3b8" : "#475569" }]}>
          v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 50, // ensures space for bottom nav / gestures
  },

  avatarSection: { alignItems: "center", marginVertical: 8 },
  gradientRing: {
    width: 102,
    height: 102,
    borderRadius: 102 / 2,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 94,
    height: 94,
    borderRadius: 94 / 2,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#fff" },
  name: { fontSize: 20, fontWeight: "700", marginTop: 10, textAlign: "center" },
  email: { fontSize: 14, marginTop: 2, textAlign: "center" },

  summaryCard: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  summaryLight: { backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 1, borderColor: "#e6edf8" },
  summaryDark: { backgroundColor: "rgba(30,41,59,0.6)", borderWidth: 1, borderColor: "#243343" },

  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  summaryTextWrap: { marginLeft: 12, flex: 1, flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontWeight: "700" },

  buttonContainer: { marginTop: 20, width: "100%", gap: 10, alignItems: "center" },
  btnWrapper: { width: "100%", marginVertical: 6 },
  gradientButton: {
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  designedContainer: {
    marginTop: 15,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  designedText: {
    fontSize: 13,
    fontWeight: "500",
  },
  gradientNameMask: {
    fontSize: 13,
    fontWeight: "700",
  },
  btnText: { color: "#ffffff", fontWeight: "600", fontSize: 15 },

  version: { marginTop: 12, fontSize: 12, opacity: 0.9 },

  lightBackground: { backgroundColor: "#f8fafc" },
  darkBackground: { backgroundColor: "#0f172a" },

  textLight: { color: "#e2e8f0" },
  textDark: { color: "#1e293b" },
});