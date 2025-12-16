// app/components/AddCard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from "react-native-toast-message";
import { LinearGradient } from 'expo-linear-gradient';
import { api } from "../lib/api";
import * as SecureStore from "expo-secure-store";
import { useTheme } from '@/context/ThemeContext';

interface EditCardData {
  _id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv?: string;
}

interface AddCardProps {
  onCardAdded?: () => void;
  editData?: EditCardData | null;
  onEditCancel?: () => void;
  isAuthenticated: boolean;
  apiUrl: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  sectionRef: React.RefObject<View | null>;
}

export default function AddCard({
  onCardAdded,
  editData,
  onEditCancel,
  isAuthenticated,
  apiUrl,
  scrollViewRef,
  sectionRef
}: AddCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCVV, setShowCVV] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [errors, setErrors] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const CardholderNameRef = React.useRef<TextInput>(null!);
  const CardNumberRef = React.useRef<TextInput>(null!);
  const ExpiryRef = React.useRef<TextInput>(null!);
  const CvvRef = React.useRef<TextInput>(null!);

  // View references for measuring position
  const cardholderNameViewRef = React.useRef<View>(null!);
  const cardNumberViewRef = React.useRef<View>(null!);
  const expiryViewRef = React.useRef<View>(null!);
  const cvvViewRef = React.useRef<View>(null!);

  useEffect(() => {
    if (editData) {
      setIsEditMode(true);
      setCardholderName(editData.cardholderName || '');
      setCardNumber(editData.cardNumber.replace(/\s/g, '') || '');
      setExpiryDate(editData.expiryDate || '');
      setCvv(editData.cvv || '');
    } else {
      resetForm();
      setIsEditMode(false);
    }
  }, [editData]);

  const resetForm = () => {
    setCardholderName('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setErrors({ cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' });
  };

  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const handleCardNumberChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length <= 19) {
      setCardNumber(digitsOnly);
    }
  };

  const handleExpiryChange = (text: string) => {
    let value = text.replace(/[^\d]/g, '');
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    if (value.length <= 5) {
      setExpiryDate(value);
    }
  };

  // Auto Scroll Function (fixed)
  const scrollToInput = (
    viewRef: React.RefObject<View> | null,
    inputRef: React.RefObject<TextInput> | null,
    offset = 80
  ) => {
    if (!scrollViewRef?.current || !viewRef?.current) return;
    // measureLayout relative to scrollView
    try {
      viewRef.current.measureLayout(
        // measure relative to scrollView's native node
        scrollViewRef.current as any,
        (_x: number, y: number) => {
          // scroll a bit above the field for visibility
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - offset),
            animated: true,
          });
          // ensure input is focused after scrolling
          setTimeout(() => {
            inputRef?.current?.focus();
          }, 250);
        },
        () => {
          // failure callback (silent)
        }
      );
    } catch (e) {
      // in case measureLayout throws, silently ignore
      // console.log('measureLayout error', e);
    }
  };

  // Helper function to scroll to and focus first error field
  const scrollToFirstError = (newErrors: typeof errors) => {
    if (!scrollViewRef?.current) return; // Guard clause
    const errorFields = [
      { name: 'cardholderName', ref: CardholderNameRef, viewRef: cardholderNameViewRef },
      { name: 'cardNumber', ref: CardNumberRef, viewRef: cardNumberViewRef },
      { name: 'expiryDate', ref: ExpiryRef, viewRef: expiryViewRef },
      { name: 'cvv', ref: CvvRef, viewRef: cvvViewRef },
    ];

    for (const field of errorFields) {
      if (newErrors[field.name as keyof typeof errors]) {
        // Measure the position and scroll to it
        field.viewRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100), // Offset for better visibility
              animated: true,
            });
          },
          () => { }
        );

        // Focus the input after a short delay
        setTimeout(() => {
          field.ref.current?.focus();
        }, 400);

        break; // Only scroll to first error
      }
    }
  };

  const validate = () => {
    const newErrors = { cardholderName: '', cardNumber: '', expiryDate: '', cvv: '' };
    let isValid = true;

    if (cardholderName.length < 2) {
      newErrors.cardholderName = 'Cardholder name is required.';
      isValid = false;
    }

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 16) {
      newErrors.cardNumber = 'Card number must be at least 16 digits.';
      isValid = false;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = 'Expiry date must be in MM/YY format.';
      isValid = false;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = 'CVV must be 3 or 4 digits.';
      isValid = false;
    }

    setErrors(newErrors);

    // Scroll to first error if validation fails
    if (!isValid) {
      scrollToFirstError(newErrors);
    }

    return isValid;
  };

  const showToast = (type: "success" | "error" | "info", message: string) => {
    Toast.show({
      type,
      text1: message,
    });
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      showToast("error", "You must be logged in to add or edit a card.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        cardholderName,
        cardNumber: formatCardNumber(cardNumber),
        expiryDate,
        cvv,
        ...(isEditMode && { id: editData!._id }),
      };

      const res = isEditMode
        ? await api.put("/mobile-cards", body)
        : await api.post("/mobile-cards", body);

      if (!res?.success) {
        throw new Error(res?.message || "Request failed");
      }

      showToast("success", isEditMode ? "Card updated!" : "Card added!");
      // Scroll to this AddCard section after submit
      if (sectionRef?.current && scrollViewRef?.current) {
        sectionRef.current.measureLayout(
          scrollViewRef.current as any,   // FIX
          (_x, y) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          },
          () => { }
        );
      }
      resetForm();
      setIsEditMode(false);
      onCardAdded?.();
      onEditCancel?.();
    } catch (err) {
      console.log("❌ Save card error:", err);
      showToast("error", "Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    showToast("info", 'Edit cancelled');
    setIsEditMode(false);
    onEditCancel?.();
    onCardAdded?.();
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
          {isEditMode ? 'Edit Card' : 'Add New Card'}
        </Text>
        <Text style={[styles.description, styles.textMuted]}>
          {isEditMode ? 'Update your existing card details below.' : 'Enter your credit/debit card details securely.'}
        </Text>
        {!isAuthenticated && (
          <Text style={styles.warningText}>
            You're not logged in — demo mode active. Please log in to save your card.
          </Text>
        )}
      </View>

      <View style={styles.form}>
        {/* Cardholder Name */}
        <View ref={cardholderNameViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Cardholder Name</Text>
          <TextInput
            ref={CardholderNameRef}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="John Doe"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={cardholderName}
            onChangeText={setCardholderName}
            returnKeyType="next"
            onFocus={() => scrollToInput(cardholderNameViewRef, CardholderNameRef)}
            onSubmitEditing={() => {
              CardNumberRef.current?.focus();
              scrollToInput(cardNumberViewRef, CardNumberRef);
            }}
          />
          {errors.cardholderName ? <Text style={styles.errorText}>{errors.cardholderName}</Text> : null}
          <Text style={styles.helperText}>Name printed on the card.</Text>
        </View>

        {/* Card Number */}
        <View ref={cardNumberViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Card Number</Text>
          <TextInput
            ref={CardNumberRef}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={formatCardNumber(cardNumber)}
            onChangeText={handleCardNumberChange}
            keyboardType="number-pad"
            maxLength={23}
            returnKeyType="next"
            onFocus={() => scrollToInput(cardNumberViewRef, CardNumberRef)}
            onSubmitEditing={() => {
              ExpiryRef.current?.focus();
              scrollToInput(expiryViewRef, ExpiryRef);
            }}
          />
          {errors.cardNumber ? <Text style={styles.errorText}>{errors.cardNumber}</Text> : null}
          <Text style={styles.helperText}>16-19 digit card number.</Text>
        </View>

        {/* Expiry Date */}
        <View ref={expiryViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Expiry Date (MM/YY)</Text>
          <TextInput
            ref={ExpiryRef}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="09/28"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={expiryDate}
            onChangeText={handleExpiryChange}
            keyboardType="number-pad"
            maxLength={5}
            returnKeyType="next"
            onFocus={() => scrollToInput(expiryViewRef, ExpiryRef)}
            onSubmitEditing={() => {
              CvvRef.current?.focus();
              scrollToInput(cvvViewRef, CvvRef);
            }}
          />
          {errors.expiryDate ? <Text style={styles.errorText}>{errors.expiryDate}</Text> : null}
          <Text style={styles.helperText}>Expiry date in MM/YY format.</Text>
        </View>

        {/* CVV */}
        <View ref={cvvViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>CVV</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              ref={CvvRef}
              style={[styles.input, styles.passwordInput, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="123"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={cvv}
              onChangeText={setCvv}
              secureTextEntry={!showCVV}
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              onFocus={() => scrollToInput(cvvViewRef, CvvRef)}
              onSubmitEditing={handleSubmit} // final submit
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCVV(!showCVV)}
            >
              <Ionicons name={showCVV ? 'eye-off' : 'eye'} size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
          {errors.cvv ? <Text style={styles.errorText}>{errors.cvv}</Text> : null}
          <Text style={styles.helperText}>3 or 4 digit CVV.</Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.submitButtonContainer, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#fb923c', '#ec4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditMode ? 'Update' : 'Submit'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {isEditMode && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
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
  warningText: {
    fontSize: 13,
    color: '#f97316',
    fontWeight: '500',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    color: '#1e293b',
  },
  inputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    color: '#f1f5f9',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 45,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  submitButtonContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});