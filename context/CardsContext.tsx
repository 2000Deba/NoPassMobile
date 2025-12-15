// app/context/CardsContext.tsx
import React, { createContext, useContext, useState,  useEffect, useRef, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

interface EditCardData {
  _id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv?: string;
}

interface StoredCard {
  _id: string;
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv?: string;
  createdAt?: string;
}

interface CardsContextType {
  cards: StoredCard[];
  editCard: EditCardData | null;
  isCardEditMode: boolean;
  hiddenId: string | null;
  refreshKey: number;
  startEditCard: (card: EditCardData) => void;
  cancelEditCard: () => void;
  finishEditCard: () => void;
  fetchCards: (apiUrl: string, isAuthenticated?: boolean) => void;
  deleteCard: (id: string, apiUrl: string) => Promise<boolean>;
  triggerRefresh: () => void;
}

const CardsContext = createContext<CardsContextType | undefined>(undefined);

export const CardsProvider = ({ children }: { children: ReactNode }) => {
  const [cards, setCards] = useState<StoredCard[]>([]);
  const [editCard, setEditCard] = useState<EditCardData | null>(null);
  const [isCardEditMode, setIsCardEditMode] = useState(false);
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
  const DEMO_CARDS: StoredCard[] = [
    {
      _id: 'demo',
          cardholderName: 'John Doe',
          cardNumber: '1234567890123456',
          expiryDate: '12/25',
          cvv: '123',
          createdAt: new Date().toISOString(),
    },
    {
        _id: 'demo-2',
          cardholderName: 'Vijay Kumar',
          cardNumber: '6526981234567890',
          expiryDate: '12/27',
          cvv: '258',
          createdAt: new Date().toISOString(),
    },
  ];

    // Main Fetch Function
    const fetchCards = async (apiUrl: string, isAuthenticated: boolean = true) => {
      if (!isAuthenticated) {
        setCards(DEMO_CARDS);
        return;
      }
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          setCards(DEMO_CARDS);
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
          const sortedCards = [...(data.cards || data.data || [])]
            .sort((a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
          setCards(sortedCards);
        } else {
          showToast("error", data.error || "Failed to fetch cards");
        }
      } catch (error) {
        console.error("Fetch Error:", error);
        showToast("error", "Something went wrong while loading cards");
      }
    };
  
    // Trigger Refresh -> Auto Fetch
    useEffect(() => {
      if (lastUsedApiUrlRef.current) {
        fetchCards(lastUsedApiUrlRef.current, lastAuthStateRef.current);
      }
    }, [refreshKey]);

  const startEditCard = (card: EditCardData) => {
    setEditCard(card);
    setIsCardEditMode(true);
    setHiddenId(card._id);
    triggerRefresh();
  };

  const cancelEditCard = () => {
    setEditCard(null);
    setIsCardEditMode(false);
    setHiddenId(null);
    triggerRefresh();
  };

  const finishEditCard = () => {
    setEditCard(null);
    setIsCardEditMode(false);
    setHiddenId(null);
    triggerRefresh();
  };

  // Global delete function added here
    const deleteCard = async (id: string, apiUrl: string): Promise<boolean> => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
          showToast("error", "You must be logged in to delete a card");
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
          showToast("error", result.error || "Failed to delete card");
          return false;
        }
  
        triggerRefresh();
        showToast("success", "Card deleted successfully");
        return true; // success return
  
      } catch (error) {
        console.error("Delete Error:", error);
        showToast("error", "Error deleting card");
        return false;
      }
    };

  return (
    <CardsContext.Provider
      value={{
        cards,
        editCard,
        isCardEditMode,
        hiddenId,
        refreshKey,
        startEditCard,
        cancelEditCard,
        finishEditCard,
        fetchCards,
        deleteCard,
        triggerRefresh,
      }}
    >
      {children}
    </CardsContext.Provider>
  );
};

export const useCards = () => {
  const context = useContext(CardsContext);
  if (!context) {
    throw new Error('useCards must be used within CardsProvider');
  }
  return context;
};