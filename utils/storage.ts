// utils/storage.ts
import * as SecureStore from "expo-secure-store";

export const storage = {
  save: async (k: string, v: any) => {
    const value = typeof v === "string" ? v : JSON.stringify(v);
    return SecureStore.setItemAsync(k, value);
  },
  load: async (k: string) => {
    const v = await SecureStore.getItemAsync(k);
    if (!v) return null;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  },
  remove: async (k: string) => SecureStore.deleteItemAsync(k),
};
