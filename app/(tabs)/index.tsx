import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import AddCard from '../../components/AddCard';
import AddPassword from '../../components/AddPassword';
import YourCards from '@/components/YourCards';
import YourPasswords from '@/components/YourPasswords';
import { useCards } from '../../context/CardsContext';
import { usePasswords } from '../../context/PasswordsContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { editCard, isCardEditMode, cancelEditCard, finishEditCard, triggerRefresh: triggerCardRefresh } = useCards();
  const { editPassword, isPasswordEditMode, cancelEditPassword, finishEditPassword, triggerRefresh: triggerPasswordRefresh } = usePasswords();

  // Use real auth state
  const { isLoggedIn } = useAuth();

  // Refs for auto-scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const addCardRef = useRef<View>(null);
  const addPasswordRef = useRef<View>(null);

  // Build backend base from expo config (same pattern as lib/api.ts)
  const BACKEND_BASE =
    (Constants.expoConfig?.extra?.backendUrl as string | undefined) ??
    'https://nopass-deba.vercel.app';

  const API_BASE = `${BACKEND_BASE}/api`;
  const CARD_API_URL = `${API_BASE}/mobile-cards`;
  const PASSWORD_API_URL = `${API_BASE}/mobile-passwords`;

  // Auto-scroll to AddCard when edit mode enabled
  useEffect(() => {
    if (isCardEditMode && addCardRef.current) {
      setTimeout(() => {
        addCardRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => { }
        );
      }, 300);
    }
  }, [isCardEditMode]);

  // Auto-scroll to AddPassword when edit mode enabled
  useEffect(() => {
    if (isPasswordEditMode && addPasswordRef.current) {
      setTimeout(() => {
        addPasswordRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
          },
          () => { }
        );
      }, 300);
    }
  }, [isPasswordEditMode]);

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e293b', '#334155'] : ['#f8fafc', '#f1f5f9', '#e2e8f0']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}  // key line for Android+iOS
            keyboardDismissMode="on-drag" // If the user scrolls, the keyboard will be hidden.
          >
            {/* Header */}
            {/* Website Style Hero Section */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, isDark ? styles.iconContainerDark : styles.iconContainerLight]}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={46}
                  color={isDark ? "#fff" : "#0f172a"}
                />
              </View>
              <MaskedView
                maskElement={
                  <Text style={[styles.mainTitle, styles.mainTitleMask]}>
                    Secure your digital life with NoPass
                  </Text>
                }
              >
                <LinearGradient
                  colors={['#fb923c', '#f87171', '#ec4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.mainTitle, { opacity: 0 }]}>
                    Secure your digital life with NoPass
                  </Text>
                </LinearGradient>
              </MaskedView>
            </View>

            {/* Add/Edit Card section */}
            <View style={styles.section} ref={addCardRef}>
              <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                {isCardEditMode ? 'Edit Card' : 'Add A Credit/Debit Card'}
              </Text>
              <AddCard
                editData={editCard}
                onCardAdded={() => {
                  finishEditCard();
                  triggerCardRefresh();
                }}
                onEditCancel={cancelEditCard}
                isAuthenticated={isLoggedIn}
                apiUrl={CARD_API_URL}
                scrollViewRef={scrollViewRef}
                sectionRef={addCardRef}
              />
            </View>

            {/* Add/Edit Password section */}
            <View style={styles.section} ref={addPasswordRef}>
              <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>
                {isPasswordEditMode ? 'Edit Password' : 'Add A Password'}
              </Text>
              <AddPassword
                editData={editPassword}
                onEditCancel={cancelEditPassword}
                onPasswordAdded={() => {
                  finishEditPassword();
                  triggerPasswordRefresh();
                }}
                isAuthenticated={isLoggedIn}
                apiUrl={PASSWORD_API_URL}
                scrollViewRef={scrollViewRef}
                sectionRef={addPasswordRef}
              />
            </View>

            {/* Your Cards */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>Your Cards</Text>
              <YourCards
                isAuthenticated={isLoggedIn}
                apiUrl={CARD_API_URL}
              />
            </View>

            {/* Your Passwords */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark ? styles.textDark : styles.textLight]}>Your Passwords</Text>
              <YourPasswords
                isAuthenticated={isLoggedIn}
                apiUrl={PASSWORD_API_URL}
              />
            </View>
            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#0f172a' },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 10,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  iconContainerLight: { backgroundColor: "#dbeafe" },
  iconContainerDark: { backgroundColor: "#1e3a8a" },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  mainTitleMask: {
    color: 'black',
  },
  heroBrand: { color: "#f97316" },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  textLight: { color: '#1e293b' },
  textDark: { color: '#f1f5f9' },
  textWhite: { color: "#fff" },
  textDarkBlue: { color: "#0f172a" },
  textMuted: { color: "#475569" },
  textMutedDark: { color: "#94a3b8" }
});
