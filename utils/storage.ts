/**
 * Unified storage adapter for cross-platform storage operations
 * Handles localStorage for web and SecureStore for native platforms
 */
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Get an item from storage
 * @param key - Storage key to retrieve
 * @returns Promise with the value or null if not found
 */
export const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

/**
 * Save an item to storage
 * @param key - Storage key
 * @param value - Value to store
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  return await SecureStore.setItemAsync(key, value);
};

/**
 * Remove an item from storage
 * @param key - Storage key to remove
 */
export const removeItem = async (key: string): Promise<void> => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  return await SecureStore.deleteItemAsync(key);
};

// Common storage keys used throughout the app
export const StorageKeys = {
  JWT_TOKEN: 'kavita_jwt_token',
  API_KEY: 'kavita_api_key',
  BASE_URL: 'kavita_base_url',
};