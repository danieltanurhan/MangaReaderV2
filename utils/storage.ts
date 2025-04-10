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
  try {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } catch (error) {
        console.warn(`[Storage] Error accessing localStorage for key ${key}:`, error);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`[Storage] Failed to get item ${key}:`, error);
    return null;
  }
};

/**
 * Save an item to storage
 * @param key - Storage key
 * @param value - Value to store
 * @returns Promise resolving to void
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
          return;
        }
      } catch (error) {
        console.warn(`[Storage] Error saving to localStorage for key ${key}:`, error);
      }
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`[Storage] Failed to set item ${key}:`, error);
  }
};

/**
 * Remove an item from storage
 * @param key - Storage key to remove
 * @returns Promise resolving to void
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
          return;
        }
      } catch (error) {
        console.warn(`[Storage] Error removing from localStorage for key ${key}:`, error);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`[Storage] Failed to remove item ${key}:`, error);
  }
};

// Common storage keys used throughout the app
export const StorageKeys = {
  JWT_TOKEN: 'kavita_jwt_token',
  API_KEY: 'kavita_api_key',
  BASE_URL: 'kavita_base_url',
};

/**
 * Check if storage is available and working
 * @returns Promise resolving to a boolean indicating if storage is working
 */
export const isStorageAvailable = async (): Promise<boolean> => {
  const testKey = '__storage_test__';
  const testValue = 'test';
  
  try {
    await setItem(testKey, testValue);
    const retrievedValue = await getItem(testKey);
    await removeItem(testKey);
    
    return retrievedValue === testValue;
  } catch (error) {
    console.error('[Storage] Storage availability test failed:', error);
    return false;
  }
};