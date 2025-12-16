// app/components/AddPassword.tsx
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
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/context/ThemeContext';

interface EditPasswordData {
  _id: string;
  website: string;
  username: string;
  password: string;
}

interface AddPasswordProps {
  onPasswordAdded?: () => void;
  editData?: EditPasswordData | null;
  onEditCancel?: () => void;
  isAuthenticated: boolean;
  apiUrl: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  sectionRef: React.RefObject<View | null>;
}

export default function AddPassword({
  onPasswordAdded,
  editData,
  onEditCancel,
  isAuthenticated,
  apiUrl,
  scrollViewRef,
  sectionRef
}: AddPasswordProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [website, setWebsite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [errors, setErrors] = useState({
    website: '',
    username: '',
    password: '',
  });

  const websiteRef = React.useRef<TextInput>(null!);
  const emailRef = React.useRef<TextInput>(null!);
  const passwordRef = React.useRef<TextInput>(null!);

  // View references for measuring position
  const websiteViewRef = React.useRef<View>(null!);
  const emailViewRef = React.useRef<View>(null!);
  const passwordViewRef = React.useRef<View>(null!);

  useEffect(() => {
    if (editData) {
      setIsEditMode(true);
      setWebsite(editData.website || '');
      setUsername(editData.username || '');
      setPassword(editData.password || '');
    } else {
      resetForm();
      setIsEditMode(false);
    }
  }, [editData]);

  const resetForm = () => {
    setWebsite('');
    setUsername('');
    setPassword('');
    setErrors({ website: '', username: '', password: '' });
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
      { name: 'website', ref: websiteRef, viewRef: websiteViewRef },
      { name: 'username', ref: emailRef, viewRef: emailViewRef },
      { name: 'password', ref: passwordRef, viewRef: passwordViewRef },
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
    const newErrors = { website: '', username: '', password: '' };
    let isValid = true;

    if (website.length < 6) {
      newErrors.website = 'Website name must be at least 6 characters.';
      isValid = false;
    }

    if (username.length < 4) {
      newErrors.username = 'Username or email must be at least 4 characters.';
      isValid = false;
    }

    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
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
      showToast("error", "You must be logged in to save or edit passwords.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        website,
        username,
        password,
        ...(isEditMode && { id: editData!._id }),
      };

      const res = isEditMode
        ? await api.put('/mobile-passwords', body)
        : await api.post('/mobile-passwords', body);

      if (!res?.success) {
        throw new Error(res?.message || "Request failed");
      }

      showToast("success", isEditMode ? "Password updated!" : "Password added!");
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
      onPasswordAdded?.();
      onEditCancel?.();
    } catch (err) {
      console.log('❌ Save password error:', err);
      showToast("error", "Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };


  const handleCancel = () => {
    resetForm();
    showToast("info", "Edit cancelled");
    setIsEditMode(false);
    onEditCancel?.();
    onPasswordAdded?.();
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
          {isEditMode ? 'Edit Password' : 'Add New Password'}
        </Text>
        <Text style={[styles.description, styles.textMuted]}>
          {isEditMode ? 'Update your saved password details below.' : 'Store your passwords securely'}
        </Text>
        {!isAuthenticated && (
          <Text style={styles.warningText}>
            You're not logged in — demo mode active. Please log in to save your passwords.
          </Text>
        )}
      </View>

      <View style={styles.form}>
        {/* Website */}
        <View ref={websiteViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Website / Service</Text>
          <TextInput
            ref={websiteRef}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="e.g., Gmail, GitHub"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={website}
            onChangeText={setWebsite}
            autoCapitalize="none"
            returnKeyType="next"
            onFocus={() => scrollToInput(websiteViewRef, websiteRef)}
            onSubmitEditing={() => {
              emailRef.current?.focus();
              scrollToInput(emailViewRef, emailRef);
            }}
          />
          {errors.website ? <Text style={styles.errorText}>{errors.website}</Text> : null}
          <Text style={styles.helperText}>Website URL or service name.</Text>
        </View>

        {/* Username */}
        <View ref={emailViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Username / Email</Text>
          <TextInput
            ref={emailRef}
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="your@email.com"
            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onFocus={() => scrollToInput(emailViewRef, emailRef)}
            onSubmitEditing={() => {
              passwordRef.current?.focus();
              scrollToInput(passwordViewRef, passwordRef);
            }}
          />
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
          <Text style={styles.helperText}>Username or Email used for this account.</Text>
        </View>

        {/* Password */}
        <View ref={passwordViewRef} style={styles.inputGroup}>
          <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Enter password"
              placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onFocus={() => scrollToInput(passwordViewRef, passwordRef)}
              onSubmitEditing={handleSubmit} // final submit
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          <Text style={styles.helperText}>Password for this account.</Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.submitButtonContainer, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366f1', '#14b8a6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{isEditMode ? 'Update' : 'Add Password'}</Text>
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