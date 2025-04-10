/**
 * Image utility functions for cross-platform image handling
 * Provides consistent interface for image sources across web and native platforms
 */
import { Platform, ImageSourcePropType } from 'react-native';
import { getItem, StorageKeys } from './storage';

// Cache to store object URLs for web platform to avoid memory leaks
const objectUrlCache: Map<string, string> = new Map();

/**
 * Create an image URL from binary data (for web platform)
 * @param blob - Binary image data
 * @param cacheKey - Key to use for caching the URL (e.g., 'series-123')
 * @returns URL string for the image
 */
export const createImageUrl = (blob: Blob, cacheKey: string): string => {
  if (Platform.OS !== 'web') {
    console.warn('createImageUrl is only intended for web platform');
    return '';
  }
  
  // Clean up existing URL if one exists for this key
  if (objectUrlCache.has(cacheKey)) {
    URL.revokeObjectURL(objectUrlCache.get(cacheKey)!);
  }
  
  // Create new object URL and cache it
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(cacheKey, url);
  
  return url;
};

/**
 * Clean up a specific object URL to prevent memory leaks
 * @param cacheKey - The key used when creating the URL
 */
export const revokeImageUrl = (cacheKey: string): void => {
  if (Platform.OS !== 'web' || !objectUrlCache.has(cacheKey)) {
    return;
  }
  
  URL.revokeObjectURL(objectUrlCache.get(cacheKey)!);
  objectUrlCache.delete(cacheKey);
};

/**
 * Clean up all created object URLs (call on app unmount/logout)
 */
export const clearAllImageUrls = (): void => {
  if (Platform.OS !== 'web') {
    return;
  }
  
  objectUrlCache.forEach(url => {
    URL.revokeObjectURL(url);
  });
  
  objectUrlCache.clear();
};

/**
 * Convert various image source types to a format usable by React Native Image component
 * @param source - The image source (URL string, Blob, or undefined)
 * @param cacheKey - Key to use for caching if it's a Blob
 * @returns Image source object for React Native Image component
 */
export const getImageSource = (
  source: string | Blob | undefined,
  cacheKey: string
): ImageSourcePropType | null => {
  if (!source) {
    return null;
  }
  
  // Handle blob data (web platform)
  if (Platform.OS === 'web' && typeof source !== 'string') {
    const url = createImageUrl(source as Blob, cacheKey);
    return { uri: url };
  }
  
  // Handle URL string (all platforms)
  if (typeof source === 'string') {
    return { uri: source };
  }
  
  return null;
};

/**
 * Generate a direct URL to an image on the Kavita server
 * Only for native platforms - web platforms should use the makeRequest approach
 * @param endpoint - API endpoint for the image
 * @param params - URL parameters as key-value pairs
 * @returns Promise with the direct URL string
 */
export const getDirectImageUrl = async (
  endpoint: string,
  params: Record<string, string | number>
): Promise<string> => {
  // Only use direct URLs for native platforms
  if (Platform.OS === 'web') {
    return '';
  }
  
  try {
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    const apiKey = await getItem(StorageKeys.API_KEY);
    
    if (!baseUrl || !apiKey) {
      return '';
    }
    
    // Build query string from params
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Return full URL with API key for authorization
    return `${baseUrl}/api/${endpoint}?${queryString}&apiKey=${apiKey}`;
  } catch (error) {
    console.error('Error generating direct image URL:', error);
    return '';
  }
};

export type ImageSource = string | Blob | null;