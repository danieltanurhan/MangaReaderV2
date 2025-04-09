import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Token storage keys
const JWT_KEY = 'kavita_jwt_token';
const API_KEY = 'kavita_api_key';
const BASE_URL_KEY = 'kavita_base_url';

// Create axios instance
export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  ...(Platform.OS === 'web' && {
    // Add web-specific configuration for CORS
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
      // Adds CORS headers that may help with simple requests
      'Access-Control-Allow-Origin': '*',
    }
  })
});

// Add a request interceptor for web platform to handle CORS
if (Platform.OS === 'web') {
  apiClient.interceptors.request.use(
    config => {
      // Log requests in development for debugging
      if (__DEV__) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );
}

// Storage adapter for cross-platform support
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};

// Get stored base URL
export const getBaseUrl = async (): Promise<string | null> => {
  return await storage.getItem(BASE_URL_KEY);
};

// Set base URL and configure axios instance
export const setBaseUrl = async (url: string): Promise<void> => {
  const baseUrl = url.endsWith('/') ? url : `${url}/`;
  await storage.setItem(BASE_URL_KEY, baseUrl);
  apiClient.defaults.baseURL = baseUrl;
};

// Get JWT token
export const getToken = async (): Promise<string | null> => {
  return await storage.getItem(JWT_KEY);
};

// Get API key
export const getApiKey = async (): Promise<string | null> => {
  return await storage.getItem(API_KEY);
};

// Set API key
export const setApiKey = async (apiKey: string): Promise<void> => {
  await storage.setItem(API_KEY, apiKey);
};

// Store auth tokens
export const storeTokens = async (jwt: string, apiKey: string): Promise<void> => {
  await storage.setItem(JWT_KEY, jwt);
  await storage.setItem(API_KEY, apiKey);
  
  // Update axios headers
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${jwt}`;
};

// Clear auth tokens
export const clearTokens = async (): Promise<void> => {
  await storage.removeItem(JWT_KEY);
  await storage.removeItem(API_KEY);
  delete apiClient.defaults.headers.common['Authorization'];
};

// Function to refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const apiKey = await getApiKey();
    const baseUrl = await getBaseUrl();
    
    if (!apiKey || !baseUrl) {
      return null;
    }
    
    const response = await axios.post(
      `${baseUrl}/api/Plugin/authenticate?apiKey=${apiKey}&pluginName=KavitaReader`
    );
    
    if (response.data && response.data.token) {
      await storage.setItem(JWT_KEY, response.data.token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

// Initialize client with stored values
(async () => {
  try {
    const baseUrl = await getBaseUrl();
    const token = await getToken();
    
    if (baseUrl) {
      apiClient.defaults.baseURL = baseUrl;
    }
    
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to load stored credentials:', error);
  }
})();