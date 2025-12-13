// app/components/YourCards.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Clipboard from 'expo-clipboard';
import { useCards } from '../context/CardsContext';
import { useTheme } from '@/context/ThemeContext';

interface StoredCard {
  _id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv?: string;
  createdAt?: string;
}

interface YourCardsProps {
  isAuthenticated: boolean;
  apiUrl: string;
}

export default function YourCards({ isAuthenticated, apiUrl }: YourCardsProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { cards, hiddenId, startEditCard, refreshKey, deleteCard, fetchCards } = useCards();

  const [loading, setLoading] = useState(true);
  const [visibleNumbers, setVisibleNumbers] = useState<Set<string>>(new Set());
  const [visibleCVVs, setVisibleCVVs] = useState<Set<string>>(new Set());

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: message,
    });
  };

  const maskCardNumber = (num: string) => {
    const digits = num.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const formatCardNumber = (num: string) => {
    const digits = num.replace(/\D/g, '');
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const maskCVV = (cvv?: string) => {
    if (!cvv) return '•';
    return '•'.repeat(cvv.length);
  };

  // ✅ Context এ isAuthenticated পাঠিয়ে দিচ্ছি
  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      await fetchCards(apiUrl, isAuthenticated); // 👈 isAuthenticated পাঠানো হচ্ছে
      setLoading(false);
    };

    loadCards();
  }, [isAuthenticated, apiUrl, refreshKey]);

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to delete a card");
      return;
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCard(id, apiUrl);
        },
      },
    ]);
  };

  const handleCopy = async (text: string) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to copy card details");
      return;
    }
    await Clipboard.setStringAsync(text);
    showToast("success", "Card Number Copied!");
  };

  const handleCopyCVV = async (cvv?: string) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to copy card details");
      return;
    }
    if (!cvv) {
      showToast("error", "No CVV available");
      return;
    }
    await Clipboard.setStringAsync(cvv);
    showToast("success", "CVV copied!");
  };

  const toggleNumberVisibility = (id: string) => {
    const newSet = new Set(visibleNumbers);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleNumbers(newSet);
  };

  const toggleCVVVisibility = (id: string) => {
    const newSet = new Set(visibleCVVs);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setVisibleCVVs(newSet);
  };

  const handleEditClick = (card: StoredCard) => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to edit a card");
      return;
    }
    startEditCard(card);
    showToast("success", "Edit mode enabled");
  };

  if (loading) {
    return (
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, styles.loadingCard]}>
        <ActivityIndicator size="large" color={isDark ? '#f1f5f9' : '#1e293b'} />
        <Text style={[styles.loadingText, isDark ? styles.textDark : styles.textLight]}>
          Loading your cards...
        </Text>
      </View>
    );
  }

  const visibleCards = cards.filter((card) => card._id !== hiddenId);

  if (visibleCards.length === 0) {
    return (
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, styles.emptyCard]}>
        <Text style={[styles.emptyText, styles.textMuted]}>No cards saved yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {visibleCards.map((card) => (
        <View key={card._id} style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
                Card Holder: {card.cardholderName}
              </Text>
              <Text style={[styles.cardDescription, styles.textMuted]}>Exp: {card.expiryDate}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity onPress={() => handleEditClick(card)} style={styles.editButton} activeOpacity={0.7}>
                <Ionicons name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(card._id)} style={styles.deleteButton} activeOpacity={0.7}>
                <Ionicons name="trash" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardContent}>
            {/* Card Number */}
            <View style={[styles.dataRow, isDark ? styles.dataRowDark : styles.dataRowLight]}>
              <Text style={[styles.dataText, isDark ? styles.textDark : styles.textLight]}>
                {visibleNumbers.has(card._id)
                  ? formatCardNumber(card.cardNumber)
                  : maskCardNumber(card.cardNumber)}
              </Text>
              <View style={styles.iconGroup}>
                <TouchableOpacity onPress={() => toggleNumberVisibility(card._id)} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons
                    name={visibleNumbers.has(card._id) ? 'eye-off' : 'eye'}
                    size={14}
                    color={isDark ? '#94a3b8' : '#64748b'}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleCopy(card.cardNumber)} style={styles.iconButton} activeOpacity={0.7}>
                  <Ionicons name="copy" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* CVV */}
            {card.cvv && (
              <View style={[styles.dataRow, styles.cvvRow, isDark ? styles.dataRowDark : styles.dataRowLight]}>
                <Text style={[styles.dataText, isDark ? styles.textDark : styles.textLight]}>
                  {visibleCVVs.has(card._id) ? card.cvv : maskCVV(card.cvv)}
                </Text>
                <View style={styles.iconGroup}>
                  <TouchableOpacity onPress={() => toggleCVVVisibility(card._id)} style={styles.iconButton} activeOpacity={0.7}>
                    <Ionicons
                      name={visibleCVVs.has(card._id) ? 'eye-off' : 'eye'}
                      size={14}
                      color={isDark ? '#94a3b8' : '#64748b'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCopyCVV(card.cvv)} style={styles.iconButton} activeOpacity={0.7}>
                    <Ionicons name="copy" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
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
  cvvRow: {
    width: '50%',
  },
  dataText: {
    fontSize: 13,
    fontFamily: 'monospace',
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