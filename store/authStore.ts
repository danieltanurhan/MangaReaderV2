import { create } from 'zustand';
import { parseOdpsUrl } from '@/api/auth';
import { connectToKavita, refreshToken, ServerInfo } from '@/api/auth';

interface AuthStoreState {
  isLoading: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  serverInfo: ServerInfo | null;
  token: string | null;
  apiKey: string | null;
  baseUrl: string | null;
  error: string | null;
  
  // Actions
  connectWithOdpsUrl: (odpsUrl: string) => Promise<boolean>;
  checkAuthentication: () => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  isLoading: false,
  isConnected: false,
  isAuthenticated: false,
  serverInfo: null,
  token: null,
  apiKey: null,
  baseUrl: null,
  error: null,
  
  connectWithOdpsUrl: async (odpsUrl) => {
    set({ isLoading: true, error: null });
    
    try {
      // Parse the ODPS URL
      const parsed = parseOdpsUrl(odpsUrl);
      if (!parsed) {
        set({
          isLoading: false,
          error: 'Invalid ODPS URL format. Please check your URL.'
        });
        return false;
      }
      
      // Connect to Kavita with the parsed URL
      const result = await connectToKavita(odpsUrl);
      
      if (result.success && result.serverInfo && result.token) {
        set({
          isLoading: false,
          isConnected: true,
          isAuthenticated: true,
          serverInfo: result.serverInfo,
          token: result.token,
          apiKey: result.apiKey || null,
          baseUrl: result.baseUrl || null
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: result.error || 'Failed to connect'
        });
        return false;
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An unknown error occurred'
      });
      return false;
    }
  },
  
  checkAuthentication: async () => {
    set({ isLoading: true });
    
    try {
      const { apiKey, baseUrl } = get();
      
      if (!apiKey || !baseUrl) {
        set({
          isLoading: false,
          isAuthenticated: false,
        });
        return false;
      }
      
      const token = await refreshToken(baseUrl, apiKey);
      
      if (token) {
        set({
          isLoading: false,
          isAuthenticated: true,
          token
        });
        return true;
      } else {
        set({
          isLoading: false,
          isAuthenticated: false,
          token: null
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        isAuthenticated: false,
        token: null
      });
      return false;
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    
    try {
      // Clear all authentication data
      set({
        isLoading: false,
        isConnected: false,
        isAuthenticated: false,
        serverInfo: null,
        token: null,
        apiKey: null,
        baseUrl: null
      });
    } catch (error) {
      set({ isLoading: false });
      console.error('Logout error:', error);
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));