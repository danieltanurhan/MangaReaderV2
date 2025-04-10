/**
 * Authentication API functions
 * Handles all authentication-related API calls
 */
import { apiClient, makeRequest, checkProxyAvailability, debugApiClientConfig } from './client';
import { getItem, setItem, removeItem, StorageKeys } from '@/utils/storage';
import { Platform } from 'react-native';

export interface ServerInfo {
  name: string;
  version: string;
  isConnected: boolean;
  url?: string;
  apiKey?: string;
}

/**
 * Parse the ODPS URL to extract the base URL and API key
 * @param odpsUrl The ODPS URL from the user
 */
export function parseOdpsUrl(odpsUrl: string): { baseUrl: string, apiKey: string } | null {
  try {
    // Ensure URL has a protocol
    if (!odpsUrl.startsWith('http://') && !odpsUrl.startsWith('https://')) {
      odpsUrl = 'https://' + odpsUrl;
    }
    
    
    const url = new URL(odpsUrl);
    const protocol = url.protocol;
    const hostname = url.hostname;
    const port = url.port ? `:${url.port}` : '';
    const baseUrl = `${protocol}//${hostname}${port}/kavita`;
    
    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
    const apiKey = pathSegments[pathSegments.length - 1];

    

    // Validate that we extracted something that looks like an API key
    if (!apiKey || apiKey.length < 8) {
      console.error('Invalid API key extracted from URL:', apiKey);
      return null;
    }

    return {
      baseUrl,
      apiKey
    };
  } catch (error) {
    console.error('Failed to parse ODPS URL:', error);
    return null;
  }
}

/**
 * Authenticate with API key and get a JWT token
 * @param baseUrl The Kavita server base URL
 * @param apiKey The API key for authentication
 */
export async function refreshToken(baseUrl: string, apiKey: string): Promise<string | null> {
  try {
    // For web platform, check proxy availability first
    if (Platform.OS === 'web') {
      const isProxyAvailable = await checkProxyAvailability();
      if (!isProxyAvailable) {
        console.error('Proxy server not available for authentication');
        return null;
      }
    }
    
    // Use unified makeRequest for both platforms
    const response = await makeRequest(
      'Plugin/authenticate',
      'POST',
      null,
      undefined,
      {
        apiKey: apiKey,
        pluginName: 'KavitaReader'
      }
    );
    
    if (response && response.token) {
      // Store the authentication info using our unified storage adapter
      await setItem(StorageKeys.JWT_TOKEN, response.token);
      await setItem(StorageKeys.API_KEY, apiKey);
      await setItem(StorageKeys.BASE_URL, baseUrl);
      
      // Configure axios defaults for native requests
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      apiClient.defaults.baseURL = baseUrl;
      
      return response.token;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Get server information
 * @param baseUrl The Kavita server base URL
 * @param token The authentication token
 */
export async function getServerInfo(baseUrl: string, token: string): Promise<ServerInfo | null> {
  try {
    // Use unified makeRequest for both platforms
    const response = await makeRequest(
      'server/server-info',
      'GET',
      null,
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response) {
      return {
        name: response.name || 'Kavita Server',
        version: response.version || 'Unknown',
        isConnected: true,
        url: baseUrl,
        apiKey: token
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get server info:', error);
    return null;
  }
}

/**
 * Complete connection flow for Kavita servers
 * Parses ODPS URL, authenticates, and gets server info
 * @param odpsUrl The ODPS URL from the user
 */
export async function connectToKavita(odpsUrl: string): Promise<{
  success: boolean;
  serverInfo?: ServerInfo;
  token?: string;
  apiKey?: string;
  baseUrl?: string;
  error?: string;
}> {
  try {
   
    // Parse ODPS URL
    const parsed = parseOdpsUrl(odpsUrl);
    if (!parsed) {
      return {
        success: false,
        error: 'Invalid ODPS URL format'
      };
    }

    await setItem(StorageKeys.BASE_URL, parsed.baseUrl);
    await setItem(StorageKeys.API_KEY, parsed.apiKey);
    
    // Get token using API key
    const token = await refreshToken(parsed.baseUrl, parsed.apiKey);
    if (!token) {
      return {
        success: false,
        error: 'Failed to authenticate with API key'
      };
    }
    
    // Get server info
    const serverInfo = await getServerInfo(parsed.baseUrl, token);
    if (!serverInfo) {
      return {
        success: false,
        error: 'Failed to get server information'
      };
    }
    
    return {
      success: true,
      serverInfo,
      token,
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Connection failed'
    };
  }
}

/**
 * Log out from the current Kavita server
 */
export async function logout(): Promise<void> {
  try {
    // Clear all stored credentials
    await removeItem(StorageKeys.JWT_TOKEN);
    await removeItem(StorageKeys.API_KEY);
    await removeItem(StorageKeys.BASE_URL);
    
    // Clear axios defaults
    delete apiClient.defaults.headers.common['Authorization'];
    apiClient.defaults.baseURL = '';
  } catch (error) {
    console.error('Logout error:', error);
  }
}