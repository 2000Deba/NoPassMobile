// app/context/PasswordsContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

interface EditPasswordData {
  _id: string;
  website: string;
  username: string;
  password: string;
}

interface StoredPassword {
  _id: string;
  website: string;
  username: string;
  password: string;
  createdAt?: string;
}

interface PasswordsContextType {
  passwords: StoredPassword[];
  editPassword: EditPasswordData | null;
  isPasswordEditMode: boolean;
  hiddenId: string | null;
  refreshKey: number;
  startEditPassword: (password: EditPasswordData) => void;
  cancelEditPassword: () => void;
  finishEditPassword: () => void;
  fetchPasswords: (apiUrl: string, isAuthenticated?: boolean) => void;
  deletePassword: (id: string, apiUrl: string) => Promise<boolean>;
  triggerRefresh: () => void;
}

const PasswordsContext = createContext<PasswordsContextType | undefined>(undefined);

export const PasswordsProvider = ({ children }: { children: ReactNode }) => {
  const [passwords, setPasswords] = useState<StoredPassword[]>([]);
  const [editPassword, setEditPassword] = useState<EditPasswordData | null>(null);
  const [isPasswordEditMode, setIsPasswordEditMode] = useState(false);
  const [hiddenId, setHiddenId] = useState<string | null>(null);

  // Refresh trigger state
  const [refreshKey, setRefreshKey] = useState(0);
  const lastUsedApiUrlRef = useRef<string | null>(null);
  const lastAuthStateRef = useRef<boolean>(false);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  const showToast = (type: "success" | "error", message: string) => {
    Toast.show({
      type,
      text1: message,
    });
  };

  // Demo Data for unauthenticated users
  const DEMO_PASSWORDS: StoredPassword[] = [
    {
      _id: 'demo',
      website: 'Gmail',
      username: 'john@gmail.com',
      password: 'SecurePassword123!',
      createdAt: new Date().toISOString(),
    },
    {
      _id: 'demo-2',
      website: 'Facebook',
      username: 'john.doe',
      password: 'MyFb@2024!',
      createdAt: new Date().toISOString(),
    },
  ];

  // Main Fetch Function
  const fetchPasswords = async (apiUrl: string, isAuthenticated: boolean = true) => {
    if (!isAuthenticated) {
      setPasswords(DEMO_PASSWORDS);
      return;
    }
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        setPasswords(DEMO_PASSWORDS);
        return;
      }

      lastUsedApiUrlRef.current = apiUrl;
      lastAuthStateRef.current = isAuthenticated;

      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        // Sort by createdAt (newest first)
        const sortedPasswords = [...(data.passwords || data.data || [])]
          .sort((a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        setPasswords(sortedPasswords);
      } else {
        showToast("error", data.error || "Failed to fetch passwords");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast("error", "Something went wrong while loading passwords");
    }
  };

  // Trigger Refresh -> Auto Fetch
  useEffect(() => {
    if (lastUsedApiUrlRef.current) {
      fetchPasswords(lastUsedApiUrlRef.current, lastAuthStateRef.current);
    }
  }, [refreshKey]);

  const startEditPassword = (password: EditPasswordData) => {
    setEditPassword(password);
    setIsPasswordEditMode(true);
    setHiddenId(password._id);
    triggerRefresh();
  };

  const cancelEditPassword = () => {
    setEditPassword(null);
    setIsPasswordEditMode(false);
    setHiddenId(null);
    triggerRefresh();
  };

  const finishEditPassword = () => {
    setEditPassword(null);
    setIsPasswordEditMode(false);
    setHiddenId(null);
    triggerRefresh();
  };

  // Global delete function added here
  const deletePassword = async (id: string, apiUrl: string): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        showToast("error", "You must be logged in to delete a password");
        return false;
      } // extra safety return

      const res = await fetch(`${apiUrl}?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        showToast("error", result.error || "Failed to delete password");
        return false;
      }

      triggerRefresh();
      showToast("success", "Password deleted successfully");
      return true; // success return

    } catch (error) {
      console.error("Delete Error:", error);
      showToast("error", "Error deleting password");
      return false;
    }
  };

  return (
    <PasswordsContext.Provider
      value={{
        passwords,
        editPassword,
        isPasswordEditMode,
        hiddenId,
        refreshKey,
        startEditPassword,
        cancelEditPassword,
        finishEditPassword,
        fetchPasswords,
        deletePassword,
        triggerRefresh,
      }}
    >
      {children}
    </PasswordsContext.Provider>
  );
};

export const usePasswords = () => {
  const context = useContext(PasswordsContext);
  if (!context) {
    throw new Error('usePasswords must be used within PasswordsProvider');
  }
  return context;
};