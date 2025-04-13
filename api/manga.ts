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
  image: string;
}

/**
 * Interface representing detailed chapter metadata and file information
 * Used in the reader to show chapter details and access files
 */
export interface ChapterDetails {
  id: number;
  range: string;
  number: string;
  pages: number;
  isSpecial: boolean;
  title: string;
  files: {
    id: number;
    filePath: string;
    pages: number;
    bytes: number;
    format: number;
    created: string;
    extension: string;
  }[];
}

/**
 * Interface representing extended chapter information including page dimensions
 * Used to display chapter information in the reader and for layout calculations
 */
export interface ChapterInfo {
  chapterNumber: string;
  volumeNumber: string;
  volumeId: number;
  seriesName: string;
  seriesFormat: number;
  seriesId: number;
  libraryId: number;
  libraryType: number;
  chapterTitle: string;
  pages: number;
  fileName: string;
  isSpecial: boolean;
  subtitle: string;
  title: string;
  seriesTotalPages: number;
  seriesTotalPagesRead: number;
  pageDimensions: {
    width: number;
    height: number;
    pageNumber: number;
    fileName: string;
    isWide: boolean;
  }[];
}

/**
 * Interface representing a user's reading progress for a chapter
 * Used to resume reading from the last page viewed
 */
export interface ReadingProgress {
  volumeId: number;
  chapterId: number;
  pageNum: number;
  seriesId: number;
  libraryId: number;
  lastModifiedUtc: string;
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
 * Get the cover image URL for a series
 * @param seriesId The series ID
 * @returns A usable image source (URL string or Blob)
 */
export async function getSeriesCoverImageUrl(seriesId: number): Promise<any> {
  try {
    // Get API key for image endpoints
    const apiKey = await getItem(StorageKeys.API_KEY);
    if (Platform.OS !== 'web') {
      console.log('Native platform detected, using direct URL for series cover image');
      return await getDirectImageUrl('image/series-cover', { seriesId });
    }
    
    
    if (!apiKey) {
      throw new Error('API key not available');
    }
    
    // Use the makeRequest function, which now handles images
    const imageSource = await makeRequest(
      'image/series-cover',
      'GET',
      null,
      {},
      {
        seriesId, 
        apiKey
      }
    );
    
    return imageSource;
  } catch (error) {
    console.error(`Error getting series cover for ${seriesId}:`, error);
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
export const getVolumeCoverImageUrl = async (volumeId: number): Promise<any> => {
  try {
    const apiKey = await getItem(StorageKeys.API_KEY);
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('image/volume-cover', { volumeId });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`image/volume-cover`, 'GET', null, {}, { volumeId, apiKey });
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
export const getChapterCoverImageUrl = async (chapterId: number): Promise<any> => {
  try {
    const apiKey = await getItem(StorageKeys.API_KEY);
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('image/chapter-cover', { chapterId });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`image/chapter-cover`, 'GET', null, {}, { chapterId, apiKey });
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
export const getPageImageUrl = async (chapterId: number, pageNumber: number): Promise<any> => {
  try {
    const apiKey = await getItem(StorageKeys.API_KEY);
    
    // For native platforms, return a direct URL
    if (Platform.OS !== 'web') {
      return await getDirectImageUrl('reader/image', { chapterId, page: pageNumber });
    }
    
    // For web platform, use makeRequest to get binary data through proxy
    return await makeRequest(`reader/image`, 'GET', null, {}, { chapterId, page: pageNumber, apiKey });
  } catch (error) {
    console.error(`Error fetching page image for chapter ${chapterId}, page ${pageNumber}:`, error);
    return null;
  }
};

/**
 * Get chapter details
 * 
 * @param chapterId - The chapter ID
 * @returns Promise with chapter details
 */
export const getChapterDetails = async (chapterId: number): Promise<any> => {
  try {
    return await makeRequest(`chapter`, 'GET', null, {}, { chapterId });
  } catch (error) {
    console.error(`Error fetching chapter details for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Get extended chapter info including page dimensions
 * 
 * @param chapterId - The chapter ID
 * @returns Promise with extended chapter info
 */
export const getChapterInfo = async (chapterId: number): Promise<any> => {
  try {
    return await makeRequest(`reader/chapter-info`, 'GET', null, {}, { 
      chapterId,
      includeDimensions: true 
    });
  } catch (error) {
    console.error(`Error fetching chapter info for chapter ${chapterId}:`, error);
    throw error;
  }
};

/**
 * Get reading progress for a chapter
 * 
 * @param chapterId - The chapter ID
 * @returns Promise with reading progress info
 */
export const getChapterProgress = async (chapterId: number): Promise<any> => {
  try {
    return await makeRequest(`reader/get-progress`, 'GET', null, {}, { chapterId });
  } catch (error) {
    console.error(`Error fetching reading progress for chapter ${chapterId}:`, error);
    throw error;
  }
};