import { create } from 'zustand';
import { 
  getAllSeries, 
  getSeriesById,
  getVolumes,
  getSeriesCoverImageUrl,
  getVolumeCoverImageUrl,
  getChapterCoverImageUrl,
  getPageImageUrl,
  getChapterDetails,
  getChapterInfo,
  getChapterProgress,
  MangaSeries, 
  SeriesDetail,
  Volume,
  Page,
  // Import interfaces moved to manga.ts
  ChapterDetails,
  ChapterInfo,
  ReadingProgress
} from '@/api/manga';
import { getImageSource, ImageSource } from '@/utils/imageUtils';
import { Platform } from 'react-native';

// Image cache to improve performance and reduce API calls
const imageCache: Record<string, { url: string, timestamp: number }> = {};
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface MangaStoreState {
  // Existing state
  series: MangaSeries[];
  isLoading: boolean;
  error: string | null;
  currentSeries: SeriesDetail | null;
  currentVolumes: Volume[] | null;
  isLoadingSeries: boolean;
  seriesError: string | null;
  
  // New reader state
  currentChapterDetails: ChapterDetails | null;
  currentChapterInfo: ChapterInfo | null;
  currentReadingProgress: ReadingProgress | null;
  chapterPageUrls: Record<string, string | null>;
  isLoadingChapter: boolean;
  chapterError: string | null;
  
  // Existing actions
  fetchAllSeries: () => Promise<void>;
  fetchSeriesById: (seriesId: number) => Promise<SeriesDetail | null>;
  getSeriesCoverUrl: (seriesId: number) => Promise<string | null>;
  getVolumeCoverUrl: (volumeId: number) => Promise<string | null>;
  getChapterCoverUrl: (chapterId: number) => Promise<string | null>;
  clearCache: () => void;
  clearError: () => void;
  
  // New reader actions
  fetchChapterDetails: (chapterId: number) => Promise<ChapterDetails | null>;
  fetchChapterInfo: (chapterId: number) => Promise<ChapterInfo | null>;
  fetchReadingProgress: (chapterId: number) => Promise<ReadingProgress | null>;
  getPageUrl: (chapterId: number, pageNumber: number) => Promise<string | null>;
  clearChapterData: () => void;
}

export const useMangaStore = create<MangaStoreState>((set, get) => ({
  // Existing state
  series: [],
  isLoading: false,
  error: null,
  currentSeries: null,
  currentVolumes: null,
  isLoadingSeries: false,
  seriesError: null,
  
  // New reader state
  currentChapterDetails: null,
  currentChapterInfo: null,
  currentReadingProgress: null,
  chapterPageUrls: {},
  isLoadingChapter: false,
  chapterError: null,
  
  // Existing actions
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
  getSeriesCoverUrl: async (seriesId: number): Promise<string | null> => {
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
        return null;
      }
      
      // Convert to usable URL
      const imageSourceObj = await getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return null;
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting series cover URL for ${seriesId}:`, error);
      return null;
    }
  },
  
  /**
   * Get a usable URL for a volume cover image
   * Uses platform-aware approach and implements caching
   * @param volumeId - The volume ID
   * @returns Promise with URL string for the image
   */
  getVolumeCoverUrl: async (volumeId: number): Promise<string | null> => {
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
        return null;
      }
      
      // Convert to usable URL
      const imageSourceObj = await getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return null;
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting volume cover URL for ${volumeId}:`, error);
      return null;
    }
  },
  
  /**
   * Get a usable URL for a chapter cover image
   * Uses platform-aware approach and implements caching
   * @param chapterId - The chapter ID
   * @returns Promise with URL string for the image
   */
  getChapterCoverUrl: async (chapterId: number): Promise<string | null> => {
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
        return null;
      }
      
      // Convert to usable URL
      const imageSourceObj = await getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return null;
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting chapter cover URL for ${chapterId}:`, error);
      return null;
    }
  },
  
  /**
   * Fetch chapter details
   * @param chapterId - The chapter ID
   * @returns Promise with chapter details
   */
  fetchChapterDetails: async (chapterId: number): Promise<ChapterDetails | null> => {
    set({ isLoadingChapter: true, chapterError: null });
    
    try {
      const details = await getChapterDetails(chapterId);
      set({
        currentChapterDetails: details,
        isLoadingChapter: false
      });
      return details;
    } catch (error) {
      set({
        isLoadingChapter: false,
        chapterError: error instanceof Error ? error.message : `Failed to fetch chapter details for ${chapterId}`
      });
      return null;
    }
  },
  
  /**
   * Fetch extended chapter info including page dimensions
   * @param chapterId - The chapter ID
   * @returns Promise with extended chapter info
   */
  fetchChapterInfo: async (chapterId: number): Promise<ChapterInfo | null> => {
    set({ isLoadingChapter: true, chapterError: null });
    
    try {
      const info = await getChapterInfo(chapterId);
      set({
        currentChapterInfo: info,
        isLoadingChapter: false
      });
      return info;
    } catch (error) {
      set({
        isLoadingChapter: false,
        chapterError: error instanceof Error ? error.message : `Failed to fetch chapter info for ${chapterId}`
      });
      return null;
    }
  },
  
  /**
   * Fetch reading progress for a chapter
   * @param chapterId - The chapter ID
   * @returns Promise with reading progress info
   */
  fetchReadingProgress: async (chapterId: number): Promise<ReadingProgress | null> => {
    try {
      const progress = await getChapterProgress(chapterId);
      set({ currentReadingProgress: progress });
      return progress;
    } catch (error) {
      console.error(`Error fetching reading progress for chapter ${chapterId}:`, error);
      return null;
    }
  },
  
  /**
   * Get a usable URL for a page image
   * Uses platform-aware approach and implements caching
   * @param chapterId - The chapter ID
   * @param pageNumber - The page number (zero-based index)
   * @returns Promise with URL string for the image
   */
  getPageUrl: async (chapterId: number, pageNumber: number): Promise<string | null> => {
    try {
      // Check cache first
      const cacheKey = `page_${chapterId}_${pageNumber}`;
      const cachedImage = imageCache[cacheKey];
      
      if (cachedImage && Date.now() - cachedImage.timestamp < CACHE_EXPIRY) {
        return cachedImage.url;
      }
      
      // Get image source from API (will be URL for native, Blob for web)
      const imageSource = await getPageImageUrl(chapterId, pageNumber);
      
      if (!imageSource) {
        return null;
      }
      
      // Convert to usable URL
      const imageSourceObj = await getImageSource(imageSource, cacheKey);
      if (!imageSourceObj || !imageSourceObj.uri) {
        return null;
      }
      
      // Cache the result
      imageCache[cacheKey] = { 
        url: imageSourceObj.uri, 
        timestamp: Date.now() 
      };
      
      // Update state with this URL
      set(state => ({
        chapterPageUrls: {
          ...state.chapterPageUrls,
          [`${chapterId}_${pageNumber}`]: imageSourceObj.uri
        }
      }));
      
      return imageSourceObj.uri;
    } catch (error) {
      console.error(`Error getting page image URL for chapter ${chapterId}, page ${pageNumber}:`, error);
      return null;
    }
  },
  
  /**
   * Clear all chapter-related data
   * Useful when navigating away from reader
   */
  clearChapterData: () => {
    set({
      currentChapterDetails: null,
      currentChapterInfo: null,
      currentReadingProgress: null,
      chapterError: null
    });
  },
  
  clearCache: () => {
    // Clear in-memory cache
    Object.keys(imageCache).forEach(key => {
      delete imageCache[key];
    });
    
    // Clear page URLs from state
    set({ chapterPageUrls: {} });
  },
  
  clearError: () => set({ error: null, seriesError: null, chapterError: null })
}));