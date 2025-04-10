import { create } from 'zustand';
import { 
  getAllSeries, 
  getSeriesById,
  getVolumes,
  getSeriesCoverImageUrl,
  getVolumeCoverImageUrl,
  getChapterCoverImageUrl,
  MangaSeries, 
  SeriesDetail,
  Volume 
} from '@/api/manga';
import { getImageSource, ImageSource } from '@/utils/imageUtils';
import { Platform } from 'react-native';

// Image cache to improve performance and reduce API calls
const imageCache: Record<string, { url: string, timestamp: number }> = {};
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface MangaStoreState {
  // Library state
  series: MangaSeries[];
  isLoading: boolean;
  error: string | null;
  
  // Current series details
  currentSeries: SeriesDetail | null;
  currentVolumes: Volume[] | null;
  isLoadingSeries: boolean;
  seriesError: string | null;
  
  // Actions
  fetchAllSeries: () => Promise<void>;
  fetchSeriesById: (seriesId: number) => Promise<SeriesDetail | null>;
  getSeriesCoverUrl: (seriesId: number) => Promise<string>;
  getVolumeCoverUrl: (volumeId: number) => Promise<string>;
  getChapterCoverUrl: (chapterId: number) => Promise<string>;
  clearCache: () => void;
  clearError: () => void;
}

export const useMangaStore = create<MangaStoreState>((set, get) => ({
  // Library state
  series: [],
  isLoading: false,
  error: null,
  
  // Current series details
  currentSeries: null,
  currentVolumes: null,
  isLoadingSeries: false,
  seriesError: null,
  
  fetchAllSeries: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const seriesData = await getAllSeries();
      
      set({
        series: seriesData,
        isLoading: false,
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
  
  /**
   * Get a usable URL for a series cover image
   * Uses platform-aware approach and implements caching
   * @param seriesId - The series ID
   * @returns Promise with URL string for the image
   */
  getSeriesCoverUrl: async (seriesId: number): Promise<string> => {
    try {
      // Check cache first
      const cacheKey = `series_${seriesId}`;
      const cachedImage = imageCache[cacheKey];
      
      if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_EXPIRY) {
        return cachedImage.url;
      }
      
      // Get image source from API (will be URL for native, Blob for web)
      const imageSource = await getSeriesCoverImageUrl(seriesId);
      
      if (!imageSource) {
        return '';
      }
      
      // Convert to usable URL
      const imageSourceObj = getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return '';
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting series cover URL for ${seriesId}:`, error);
      return '';
    }
  },
  
  /**
   * Get a usable URL for a volume cover image
   * Uses platform-aware approach and implements caching
   * @param volumeId - The volume ID
   * @returns Promise with URL string for the image
   */
  getVolumeCoverUrl: async (volumeId: number): Promise<string> => {
    try {
      // Check cache first
      const cacheKey = `volume_${volumeId}`;
      const cachedImage = imageCache[cacheKey];
      
      if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_EXPIRY) {
        return cachedImage.url;
      }
      
      // Get image source from API (will be URL for native, Blob for web)
      const imageSource = await getVolumeCoverImageUrl(volumeId);
      
      if (!imageSource) {
        return '';
      }
      
      // Convert to usable URL
      const imageSourceObj = getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return '';
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting volume cover URL for ${volumeId}:`, error);
      return '';
    }
  },
  
  /**
   * Get a usable URL for a chapter cover image
   * Uses platform-aware approach and implements caching
   * @param chapterId - The chapter ID
   * @returns Promise with URL string for the image
   */
  getChapterCoverUrl: async (chapterId: number): Promise<string> => {
    try {
      // Check cache first
      const cacheKey = `chapter_${chapterId}`;
      const cachedImage = imageCache[cacheKey];
      
      if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_EXPIRY) {
        return cachedImage.url;
      }
      
      // Get image source from API (will be URL for native, Blob for web)
      const imageSource = await getChapterCoverImageUrl(chapterId);
      
      if (!imageSource) {
        return '';
      }
      
      // Convert to usable URL
      const imageSourceObj = getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return '';
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting chapter cover URL for ${chapterId}:`, error);
      return '';
    }
  },
  
  /**
   * Clear the image cache
   * Useful when logging out or refreshing data
   */
  clearCache: () => {
    // Clear in-memory cache
    Object.keys(imageCache).forEach(key => {
      delete imageCache[key];
    });
  },
  
  clearError: () => set({ error: null, seriesError: null })
}));