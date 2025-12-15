import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert, ToastAndroid, Platform } from "react-native";

const BASE =
  ((Constants.expoConfig?.extra?.backendUrl as string) ||
    "https://nopass-deba.vercel.app") + "/api";

function showToast(msg: string) {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("Error", msg);
}

// Add optional customHeaders parameter
async function request(
  method: string, 
  path: string, 
  body?: any, 
  customHeaders?: Record<string, string>
): Promise<any> {
  const token = await SecureStore.getItemAsync("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // If custom headers provided (like for validation), use them first
  if (customHeaders?.Authorization) {
    headers.Authorization = customHeaders.Authorization;
  } else if (token) {
    // Otherwise use stored token
    headers.Authorization = `Bearer ${token}`;
  }

  // Merge any other custom headers
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Body only for non-GET, non-DELETE (some DELETE may have body)
  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(BASE + path, fetchOptions);
    const text = await res.text();
    let json = {};

    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    // Handle 401 => Auto logout
    if (res.status === 401) {
      await SecureStore.deleteItemAsync("token");
      showToast("Session expired. Please login again.");
      return { success: false, logout: true };
    }

    if (!res.ok) throw json;
    return json;
  } catch (err: any) {
    console.log("API ERROR:", err);
    showToast(err?.message || "Network error");
    return { success: false, error: err };
  }
}

export const api = {
  get: (path: string, customHeaders?: Record<string, string>) => 
    request("GET", path, undefined, customHeaders),
  
  post: (path: string, body?: any, customHeaders?: Record<string, string>) => 
    request("POST", path, body, customHeaders),
  
  put: (path: string, body?: any, customHeaders?: Record<string, string>) => 
    request("PUT", path, body, customHeaders),
  
  del: (path: string, customHeaders?: Record<string, string>) => 
    request("DELETE", path, undefined, customHeaders),
};