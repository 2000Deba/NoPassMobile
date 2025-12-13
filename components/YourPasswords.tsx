// app/components/YourPasswords.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import { usePasswords } from '@/context/PasswordsContext';
import { useTheme } from '@/context/ThemeContext';

interface StoredPassword {
  _id: string;
  website: string;
  username: string;
  password: string;
  createdAt?: string;
}

interface YourPasswordsProps {
  isAuthenticated: boolean;
  apiUrl: string;
}

export default function YourPasswords({
  isAuthenticated,
  apiUrl,
}: YourPasswordsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { passwords, hiddenId, startEditPassword, refreshKey, deletePassword, fetchPasswords } = usePasswords();

  const [loading, setLoading] = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: message,
    });
  };

  // ✅ Context এ isAuthenticated পাঠিয়ে দিচ্ছি
  useEffect(() => {
    const loadPasswords = async () => {
      setLoading(true);
      await fetchPasswords(apiUrl, isAuthenticated); // 👈 isAuthenticated পাঠানো হচ্ছে
      setLoading(false);
    };

    loadPasswords();
  }, [isAuthenticated, apiUrl, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to delete a password");
      return;
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this password?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePassword(id, apiUrl);
        },
      },
    ]);
  };

  const handleCopy = async (text: string) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to copy a password");
      return;
    }
    await Clipboard.setStringAsync(text);
    showToast("success", "Password copied!");
  };

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisiblePasswords(newSet);
  };

  const handleEditClick = (pwd: StoredPassword) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to edit a password");
      return;
    }
    startEditPassword(pwd);
    showToast("success", "Edit mode enabled");
  };

  const handleWebsitePress = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    Linking.openURL(url).catch(() => {
      showToast("error", "Cannot open this URL");
    });
  };

  if (loading) {
    return (
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, styles.loadingCard]}>
        <ActivityIndicator size="large" color={isDark ? '#f1f5f9' : '#1e293b'} />
        <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
          Loading your passwords...
        </Text>
      </View>
    );
  }

  const visiblePwds = passwords.filter((pwd) => pwd._id !== hiddenId);

  if (visiblePwds.length === 0) {
    return (
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, styles.emptyCard]}>
        <Text style={[styles.emptyText, styles.textMuted]}>No passwords saved yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {visiblePwds.map((pwd) => (
        <View key={pwd._id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <View style={styles.websiteRow}>
                <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                  Website/Service:{' '}
                </Text>
                <TouchableOpacity onPress={() => handleWebsitePress(pwd.website)} activeOpacity={0.7}>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {pwd.website}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.cardDescription, styles.textMuted, { flexShrink: 1, flexWrap: 'wrap' }]}>
                Username/Email: {pwd.username}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleEditClick(pwd)} style={styles.editButton} activeOpacity={0.7}>
                <Ionicons name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(pwd._id)} style={styles.deleteButton} activeOpacity={0.7}>
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={[styles.dataRow, isDark ? styles.dataRowDark : styles.dataRowLight]}>
              <Text style={[styles.dataText, isDark ? styles.textDark : styles.textLight]}>
                {visiblePasswords.has(pwd._id) ? pwd.password : '•'.repeat(pwd.password.length)}
              </Text>
              <View style={styles.iconGroup}>
                <TouchableOpacity onPress={() => togglePasswordVisibility(pwd._id)} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons
                    name={visiblePasswords.has(pwd._id) ? 'eye-off' : 'eye'}
                    size={14}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCopy(pwd.password)} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="copy" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  linkText: {
    fontSize: 15,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    flexShrink: 1,
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  cardContent: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  dataRowLight: {
    backgroundColor: '#f1f5f9',
  },
  dataRowDark: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
  },
  dataText: {
    fontSize: 13,
    fontFamily: 'monospace',
    flex: 1,
  },
  iconGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  textLight: {
    color: '#1e293b',
  },
  textDark: {
    color: '#f1f5f9',
  },
  textMuted: {
    color: '#64748b',
  },
});