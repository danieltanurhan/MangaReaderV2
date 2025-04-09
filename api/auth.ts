import { apiClient } from './client';
import * as SecureStore from 'expo-secure-store';

export interface ServerInfo {
  name: string;
  version: string;
  isConnected: boolean;
}

// Parse the ODPS URL to extract the base URL and API key
export function parseOdpsUrl(odpsUrl: string): { baseUrl: string, apiKey: string } | null {
  try {
    // Ensure URL has a protocol
    if (!odpsUrl.startsWith('http://') && !odpsUrl.startsWith('https://')) {
      odpsUrl = 'https://' + odpsUrl;
    }
    
    const url = new URL(odpsUrl);
    const protocol = 'https:';
    const hostname = url.hostname;
    const port = url.port ? `:${url.port}` : '';
    const baseUrl = `${protocol}//${hostname}${port}/kavita`;
    
    const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
    const apiKey = pathSegments[pathSegments.length - 1];

    // Validate that we extracted something that looks like an API key
    if (!apiKey || apiKey.length < 8) {
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

// Function to authenticate with API key
export async function refreshToken(baseUrl: string, apiKey: string): Promise<string | null> {
  try {
    const response = await apiClient.post(
      `${baseUrl}/api/Plugin/authenticate?apiKey=${apiKey}&pluginName=KavitaReader`
    );
    
    if (response.data && response.data.token) {
      // Save token to secure storage
      await SecureStore.setItemAsync('kavita_jwt_token', response.data.token);
      await SecureStore.setItemAsync('kavita_api_key', apiKey);
      await SecureStore.setItemAsync('kavita_base_url', baseUrl);
      
      // Set token in API client
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      apiClient.defaults.baseURL = baseUrl;
      
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Get server info using token
export async function getServerInfo(baseUrl: string, token: string): Promise<ServerInfo | null> {
  try {
    const response = await apiClient.get(
      `${baseUrl}/api/server/server-info`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (response.data) {
      return {
        name: response.data.name || 'Kavita Server',
        version: response.data.version || 'Unknown',
        isConnected: true
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get server info:', error);
    return null;
  }
}

// Complete connection flow
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