/**
 * Manga API functions
 * Handles all manga-related API calls using our unified API client
 */
import { makeRequest } from './client';
import { getItem, StorageKeys } from '@/utils/storage';
import { Platform } from 'react-native';
import { getDirectImageUrl, ImageSource } from '@/utils/imageUtils';

/**
 * Manga series interface representing a series in the library
 */
export interface MangaSeries {
  id: number;
  name: string;
  originalName?: string;
  localizedName?: string;
  coverImage: string;
  pagesRead: number;
  pages: number;
  userRating?: number;
  format: number;
  created: string;
  libraryName: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface MangaSeriesResponse {
  series: MangaSeries[];
  totalPages: number;
  totalCount: number;
}

export interface Volume {
  id: number;
  number: number;
  name: string;
  coverImage: string;
  pages: number;
  pagesRead: number;
  chapters: Chapter[];
  created: string;
  lastModified: string;
  minNumber: number;
  maxNumber: number;
}

export interface Chapter {
  id: number;
  number: string;
  range: string;
  title: string;
  pages: number;
  pagesRead: number;
  coverImage: string;
  isSpecial: boolean;
  volumeId: number;
  created: string;
  lastModified: string;
}

export interface SeriesDetail extends MangaSeries {
  volumes: Volume[];
  description?: string;
  genres?: string[];
  tags?: string[];
  ageRating?: number;
  releaseYear?: number;
  publicationStatus?: number;
}

export interface Page {
  pageNumber: number;
  fileName: string;
  image: string; // This could be a base64 string or URL depending on your API
}

/**
 * Fetch all series from the Kavita API
 */
export const getAllSeries = async (): Promise<MangaSeries[]> => {
  try {
    const payload = {
      statements: [
        {
          comparison: 0,
          value: "",
          field: 1
        }
      ],
      combination: 1,
      limitTo: 0,
      sortOptions: {
        isAscending: true,
        sortField: 1
      }
    };
    
    return await makeRequest('Series/all-v2', 'POST', payload);
  } catch (error) {
    console.error('Error fetching manga series:', error);
    throw error;
  }
};

/**
 * Fetch a series by ID
 */
export const getSeriesById = async (seriesId: number): Promise<SeriesDetail> => {
  try {
    return await makeRequest(`Series/${seriesId}`, 'GET');
  } catch (error) {
    console.error(`Error fetching series ${seriesId}:`, error);
    throw error;
  }
};

/**
 * Fetch volumes for a series
 */
export const getVolumes = async (seriesId: number): Promise<Volume[]> => {
  try {
    return await makeRequest(`Series/volumes?seriesId=${seriesId}`, 'GET');
  } catch (error) {
    console.error(`Error fetching volumes for series ${seriesId}:`, error);
    throw error;
  }
};

/**
 * Fetch pages for a specific chapter
 */
export const getChapterPages = async (chapterId: number): Promise<Page[]> => {
  try {
    return await makeRequest(`Reader/chapter-page-list?chapterId=${chapterId}`, 'GET');
  } catch (error) {
    console.error(`Error fetching pages for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Mark a chapter as read
 */
export const markChapterAsRead = async (chapterId: number): Promise<void> => {
  try {
    await makeRequest(`Reader/mark-chapter-read?chapterId=${chapterId}`, 'POST');
  } catch (error) {
    console.error(`Error marking chapter ${chapterId} as read:`, error);
    throw error;
  }
};

/**
 * Update reading progress for a chapter
 */
export const updateReadingProgress = async (
  chapterId: number, 
  pageNumber: number
): Promise<void> => {
  try {
    await makeRequest('Reader/progress', 'POST', {
      chapterId,
      pageNumber,
      volumeId: 0, // The API might require volumeId, set to 0 if not needed
      seriesId: 0, // The API might require seriesId, set to 0 if not needed
    });
  } catch (error) {
    console.error(`Error updating reading progress for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Get a cover image URL for a series
 */
export const getSeriesCoverImageUrl = async (seriesId: number): Promise<ImageSource> => {
  try {
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    const apiKey = await getItem(StorageKeys.API_KEY);
   
    const base = `${baseUrl}/api/`;
    const endpoint = `image/series-cover?seriesId=${seriesId}&apiKey=${apiKey}`;
     // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return base + endpoint;
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(endpoint, 'GET');
  } catch (error) {
    console.error(`Error fetching cover image for series ${seriesId}:`, error);
    return null;
  }
};

/**
 * Get a cover image for a volume - platform aware implementation
 * Returns a URL string for native platforms or binary data for web
 * 
 * @param volumeId - The volume ID
 * @returns Promise with image source (URL string for native, Blob for web)
 */
export const getVolumeCoverImageUrl = async (volumeId: number): Promise<ImageSource> => {
  try {
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('image/volume-cover', { volumeId });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`Image/volume-cover?volumeId=${volumeId}`, 'GET');
  } catch (error) {
    console.error(`Error fetching cover image for volume ${volumeId}:`, error);
    return null;
  }
};

/**
 * Get a cover image for a chapter - platform aware implementation
 * Returns a URL string for native platforms or binary data for web
 * 
 * @param chapterId - The chapter ID
 * @returns Promise with image source (URL string for native, Blob for web)
 */
export const getChapterCoverImageUrl = async (chapterId: number): Promise<ImageSource> => {
  try {
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('image/chapter-cover', { chapterId });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`Image/chapter-cover?chapterId=${chapterId}`, 'GET');
  } catch (error) {
    console.error(`Error fetching cover image for chapter ${chapterId}:`, error);
    return null;
  }
};

/**
 * Get a page image for reading - platform aware implementation
 * Returns a URL string for native platforms or binary data for web
 * 
 * @param chapterId - The chapter ID
 * @param pageNumber - The page number (zero-based index)
 * @returns Promise with image source (URL string for native, Blob for web)
 */
export const getPageImageUrl = async (chapterId: number, pageNumber: number): Promise<ImageSource> => {
  try {
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('Reader/image', { chapterId, fileName: pageNumber });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`Reader/image?chapterId=${chapterId}&fileName=${pageNumber}`, 'GET');
  } catch (error) {
    console.error(`Error fetching page image for chapter ${chapterId}, page ${pageNumber}:`, error);
    return null;
  }
};

/**
 * Get recently updated series
 */
export const getRecentlyUpdatedSeries = async (pageSize: number = 20): Promise<MangaSeries[]> => {
  try {
    return await makeRequest('Series/recently-updated', 'POST', {
      pageSize,
      pageNumber: 1
    });
  } catch (error) {
    console.error('Error fetching recently updated series:', error);
    throw error;
  }
};

/**
 * Get on-deck series (series with unread chapters)
 */
export const getOnDeckSeries = async (pageSize: number = 20): Promise<MangaSeries[]> => {
  try {
    return await makeRequest('Series/on-deck', 'POST', {
      pageSize,
      pageNumber: 1
    });
  } catch (error) {
    console.error('Error fetching on-deck series:', error);
    throw error;
  }
};

/**
 * Search series by name
 */
export const searchSeries = async (query: string): Promise<MangaSeries[]> => {
  try {
    return await makeRequest('Series/search', 'POST', {
      queryString: query
    });
  } catch (error) {
    console.error(`Error searching for series with query "${query}":`, error);
    throw error;
  }
};