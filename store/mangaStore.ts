import { create } from 'zustand';
import { 
  getAllSeries, 
  getSeriesById,
  getVolumes,
  MangaSeries, 
  SeriesDetail,
  Volume 
} from '@/api/manga';
import { getApiKey, getBaseUrl } from '@/api/client';

interface MangaStoreState {
  // Library state
  series: MangaSeries[];
  isLoading: boolean;
  error: string | null;
  baseUrl: string | null;
  apiKey: string | null;
  
  // Current series details
  currentSeries: SeriesDetail | null;
  currentVolumes: Volume[] | null;
  isLoadingSeries: boolean;
  seriesError: string | null;
  
  // Actions
  fetchAllSeries: () => Promise<void>;
  fetchSeriesById: (seriesId: number) => Promise<SeriesDetail | null>;
  getSeriesCoverUrl: (seriesId: number) => string;
  getVolumeCoverUrl: (volumeId: number) => string;
  getChapterCoverUrl: (chapterId: number) => string;
  clearError: () => void;
}

export const useMangaStore = create<MangaStoreState>((set, get) => ({
  // Library state
  series: [],
  isLoading: false,
  error: null,
  baseUrl: null,
  apiKey: null,
  
  // Current series details
  currentSeries: null,
  currentVolumes: null,
  isLoadingSeries: false,
  seriesError: null,
  
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
  
  fetchSeriesById: async (seriesId: number) => {
    set({ isLoadingSeries: true, seriesError: null });
    
    try {
      // Get series details
      const seriesDetail = await getSeriesById(seriesId);
      console.log('Fetched series detail:', seriesDetail);
      
      // Get volumes if they weren't included in the series response
      let volumes = seriesDetail.volumes;
      if (!volumes || volumes.length === 0) {
        volumes = await getVolumes(seriesId);
      }
      
      set({
        currentSeries: seriesDetail,
        currentVolumes: volumes,
        isLoadingSeries: false
      });
      
      return seriesDetail;
    } catch (error) {
      set({
        isLoadingSeries: false,
        seriesError: error instanceof Error ? error.message : `Failed to fetch series ${seriesId}`
      });
      return null;
    }
  },
  
  getSeriesCoverUrl: (seriesId: number): string => {
    const { baseUrl, apiKey } = get();
    if (!baseUrl || !apiKey) return '';
    
    return `${baseUrl}/api/image/series-cover?seriesId=${seriesId}&apiKey=${apiKey}`;
  },
  
  getVolumeCoverUrl: (volumeId: number): string => {
    const { baseUrl, apiKey } = get();
    if (!baseUrl || !apiKey) return '';
    
    return `${baseUrl}/api/image/volume-cover?volumeId=${volumeId}&apiKey=${apiKey}`;
  },
  
  getChapterCoverUrl: (chapterId: number): string => {
    const { baseUrl, apiKey } = get();
    if (!baseUrl || !apiKey) return '';
    
    return `${baseUrl}/api/image/chapter-cover?chapterId=${chapterId}&apiKey=${apiKey}`;
  },
  
  clearError: () => set({ error: null, seriesError: null })
}));