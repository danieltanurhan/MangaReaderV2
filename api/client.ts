/**
 * Central API client for all API requests
 * Handles platform-specific routing (direct for native, proxy for web)
 */
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getItem, setItem, removeItem, StorageKeys } from '@/utils/storage';
// import { processImageResponse } from '@/utils/imageUtils';


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
 * @param params - Query parameters (for GET requests)
 * @returns Promise with the response data
 */
export const makeRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers: Record<string, string> = {},
  params: Record<string, any> = {}
): Promise<any> => {
  try {
    // Get auth info and server details
    const token = await getItem(StorageKeys.JWT_TOKEN);
    const apiKey = await getItem(StorageKeys.API_KEY);
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    
    if (!baseUrl) {
      throw new Error('Server URL not configured');
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const fullEndpoint = `${endpoint}${queryString}`;
    
    // === WEB PLATFORM: Use proxy ===
    if (Platform.OS === 'web') {
      const proxyUrl = getProxyBaseUrl();
      
      if (!proxyUrl) {
        throw new Error('Proxy URL not configured for web platform');
      }
      
      const url = `${proxyUrl}/api-proxy`;
    
      interface RequestHeaders {
        'Content-Type': string;
        'Authorization'?: string;
        [key: string]: any; 
      }
    
      const requestHeaders: RequestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };
      
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    
      try {
        // For image endpoints, we need special handling
        const isImageEndpoint = endpoint.includes('/image') || 
                              endpoint.includes('/cover') ||
                              endpoint.includes('series-cover') ||
                              endpoint.includes('volume-cover') ||
                              endpoint.includes('chapter-cover');
        
        if (isImageEndpoint) {
          console.log('Image endpoint detected, using raw response');
          // For images, we need the raw response (not parsed JSON)
          const response = await axios({
            method: 'POST',
            url: url,
            headers: requestHeaders,
            responseType: 'arraybuffer',
            data: {
              target: endpoint,
              method: 'GET', // Images are always GET
              params: params || {}
            }
          });

          return response.data;
        } else {
          // Regular JSON endpoint
          const response = await axios({
            method: 'POST',
            url: url,
            headers: requestHeaders,
            data: {
              target: endpoint,
              method: method,
              body: body || {},
              params: params || {}
            }
          });
          
          // Axios automatically parses JSON responses
          return response.data;
        }
      } catch (axiosError: any) {
        const errorData = axiosError.response?.data || {};
        throw new Error(`API error: ${axiosError.response?.status || 500} ${errorData.message || axiosError.message}`);
      }
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
      const response = await apiClient.get(`${baseUrl}/api/${fullEndpoint}`, { 
        headers: requestHeaders 
      });
      return response.data;
    } else {
      const response = await apiClient.post(`${baseUrl}/api/${fullEndpoint}`, body, { 
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
 * Debug helper that logs the current API client configuration
 * This can be called from anywhere to see the current state
 */
export const debugApiClientConfig = async (): Promise<void> => {
  console.log('=== API CLIENT DEBUG INFO ===');
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Development mode: ${__DEV__ ? 'Yes' : 'No'}`);
  
  // Check storage values
  const baseUrl = await getItem(StorageKeys.BASE_URL);
  const token = await getItem(StorageKeys.JWT_TOKEN);
  const apiKey = await getItem(StorageKeys.API_KEY);
  
  console.log(`Base URL in storage: ${baseUrl || 'Not set'}`);
  console.log(`JWT Token exists: ${!!token}`);
  console.log(`API Key exists: ${!!apiKey}`);
  
  // Check axios defaults
  console.log(`Axios baseURL: ${apiClient.defaults.baseURL || 'Not set'}`);
  console.log(`Axios auth header exists: ${!!apiClient.defaults.headers.common['Authorization']}`);
  
  // Check proxy configuration
  if (Platform.OS === 'web') {
    const proxyUrl = getProxyBaseUrl();
    console.log(`Proxy URL: ${proxyUrl || 'Not set'}`);
    
    try {
      const isAvailable = await checkProxyAvailability();
      console.log(`Proxy available: ${isAvailable ? 'Yes' : 'No'}`);
    } catch (error) {
      console.log('Error checking proxy:', error);
    }
  }
  
  console.log('==============================');
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