/**
 * Authentication state management using Zustand
 * Handles authentication state and server connection status
 */
import { create } from 'zustand';
import { connectToKavita, ServerInfo, logout } from '@/api/auth';
import { getItem, StorageKeys } from '@/utils/storage';

/**
 * Authentication state interface
 */
interface AuthState {
  // State properties
  isAuthenticated: boolean;
  serverInfo: ServerInfo | null;
  token: string | null;
  apiKey: string | null;
  baseUrl: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  connectWithOdpsUrl: (odpsUrl: string) => Promise<boolean>;
  disconnectServer: () => Promise<void>;
  checkAuthentication: () => Promise<boolean>;
  clearError: () => void;
}

/**
 * Authentication store using Zustand
 * Manages authentication state and exposes actions for login/logout
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  serverInfo: null,
  token: null,
  apiKey: null,
  baseUrl: null,
  isLoading: false,
  error: null,
  
  /**
   * Connect to Kavita server with ODPS URL
   * @param odpsUrl The ODPS URL from the user
   */
  connectWithOdpsUrl: async (odpsUrl: string) => {
    // Start loading state
    set({ isLoading: true, error: null });
    
    try {
      // Use the auth module's connection function
      const result = await connectToKavita(odpsUrl);
      
      if (result.success && result.serverInfo && result.token) {
        // Set successful connection state
        set({
          isAuthenticated: true,
          serverInfo: result.serverInfo,
          token: result.token,
          apiKey: result.apiKey,
          baseUrl: result.baseUrl,
          isLoading: false,
          error: null
        });
        return true;
      } else {
        // Set error state
        set({
          isAuthenticated: false,
          error: result.error || 'Connection failed',
          isLoading: false
        });
        return false;
      }
    } catch (error: any) {
      // Handle unexpected errors
      set({
        isAuthenticated: false,
        error: error.message || 'Connection failed',
        isLoading: false
      });
      return false;
    }
  },
  
  /**
   * Disconnect from the server and clear authentication
   */
  disconnectServer: async () => {
    try {
      // Use the auth module's logout function
      await logout();
      
      // Clear authentication state
      set({
        isAuthenticated: false,
        serverInfo: null,
        token: null,
        apiKey: null,
        baseUrl: null,
        error: null
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear state even if API logout fails
      set({
        isAuthenticated: false,
        serverInfo: null,
        token: null,
        apiKey: null,
        baseUrl: null
      });
    }
  },
  
  /**
   * Check if we have valid authentication stored
   */
  checkAuthentication: async () => {
    try {
      // Check for stored tokens using the storage module
      const token = await getItem(StorageKeys.JWT_TOKEN);
      const apiKey = await getItem(StorageKeys.API_KEY);
      const baseUrl = await getItem(StorageKeys.BASE_URL);
      
      if (token && apiKey && baseUrl) {
        // Update state with stored credentials
        set({
          isAuthenticated: true,
          token,
          apiKey,
          baseUrl
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },
  
  /**
   * Clear any error messages in the state
   */
  clearError: () => {
    set({ error: null });
  }
}));