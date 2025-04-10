/**
 * Central API client for all API requests
 * Handles platform-specific routing (direct for native, proxy for web)
 */
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getItem, setItem, removeItem, StorageKeys } from '@/utils/storage';

// Create axios instance for native API calls
export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Get the base URL for the proxy server (web platform only)
 */
const getProxyBaseUrl = (): string | null => {
  // Only use proxy for web platform
  if (Platform.OS !== 'web') {
    return null;
  }
  
  // For development
  if (__DEV__) {
    return 'http://localhost:3031';
  }
  
  // For production
  return Constants.expoConfig?.extra?.proxyServerUrl || 'https://your-proxy-server.com';
};

/**
 * Check if the proxy server is available (only relevant for web platform)
 * @returns Promise<boolean> - true if proxy is available or if on native platform
 */
export const checkProxyAvailability = async (): Promise<boolean> => {
  const proxyUrl = getProxyBaseUrl();
  
  // If not on web, no proxy is needed
  if (!proxyUrl) return true;
  
  try {
    const response = await fetch(`${proxyUrl}/health`, { 
      method: 'GET'
    });
    
    // Basic validation of response
    return response.ok;
  } catch (error) {
    console.warn('Proxy server not available:', error);
    return false;
  }
};

/**
 * Make a platform-aware API request to the Kavita server
 * - For web: Routes through proxy to avoid CORS issues
 * - For native: Makes direct API calls
 * 
 * @param endpoint - The Kavita API endpoint (without leading slash)
 * @param method - HTTP method (GET or POST)
 * @param body - Request body (for POST requests)
 * @param headers - Additional headers
 * @returns Promise with the response data
 */
export const makeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<any> => {
  try {
    // Get auth info and server details
    const token = await getItem(StorageKeys.JWT_TOKEN);
    const apiKey = await getItem(StorageKeys.API_KEY);
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    
    if (!baseUrl) {
      throw new Error('Server URL not configured');
    }
    
    // === WEB PLATFORM: Use proxy ===
    if (Platform.OS === 'web') {
      const proxyUrl = getProxyBaseUrl();
      
      if (!proxyUrl) {
        throw new Error('Proxy URL not configured for web platform');
      }
      
      const url = `${proxyUrl}/api-proxy`;
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      // Send request to our proxy with all necessary info
      const response = await fetch(url, {
        method: 'POST', // Always POST to proxy endpoint
        headers: requestHeaders,
        body: JSON.stringify({
          target: endpoint,
          method: method,
          body: body || {},
          kavitaApiKey: apiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
      }
      
      // Check if it's an image response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('image')) {
        return await response.blob();
      }
      
      return await response.json();
    }
    
    // === NATIVE PLATFORM: Direct API call ===
    // Add authorization header if token exists
    const requestHeaders = {
      ...headers
    };
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    if (method === 'GET') {
      const response = await apiClient.get(`${baseUrl}/api/${endpoint}`, { 
        headers: requestHeaders 
      });
      return response.data;
    } else {
      const response = await apiClient.post(`${baseUrl}/api/${endpoint}`, body, { 
        headers: requestHeaders 
      });
      return response.data;
    }
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Configure the API client with the base URL and authorization token
 */
export const configureApiClient = async (): Promise<void> => {
  try {
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    const token = await getItem(StorageKeys.JWT_TOKEN);
    
    if (baseUrl) {
      apiClient.defaults.baseURL = baseUrl;
    }
    
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to configure API client:', error);
  }
};

// Initialize client when imported
configureApiClient();