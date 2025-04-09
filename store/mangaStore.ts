import { create } from 'zustand';
import { getAllSeries, MangaSeries } from '@/api/manga';
import { getBaseUrl, getApiKey } from '@/api/client';

interface MangaStoreState {
  series: MangaSeries[];
  isLoading: boolean;
  error: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  
  // Actions
  fetchAllSeries: () => Promise<void>;
  getSeriesCoverUrl: (seriesId: number) => string;
  clearError: () => void;
}

export const useMangaStore = create<MangaStoreState>((set, get) => ({
  series: [],
  isLoading: false,
  error: null,
  baseUrl: null,
  apiKey: null,
  
  fetchAllSeries: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const baseUrl = await getBaseUrl();
      const apiKey = await getApiKey();
      
      if (!baseUrl || !apiKey) {
        set({ 
          isLoading: false,
          error: 'Missing server connection information' 
        });
        return;
      }
      
      const seriesData = await getAllSeries();
      
      set({
        series: seriesData,
        isLoading: false,
        baseUrl,
        apiKey,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch manga series'
      });
    }
  },
  
  getSeriesCoverUrl: (seriesId: number): string => {
    const { baseUrl, apiKey } = get();
    if (!baseUrl || !apiKey) return '';
    
    return `${baseUrl}/api/image/series-cover?seriesId=${seriesId}&apiKey=${apiKey}`;
  },
  
  clearError: () => set({ error: null })
}));