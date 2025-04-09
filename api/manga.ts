import { apiClient } from './client';

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
    
    const response = await apiClient.post('/api/Series/all-v2', payload);
    return response.data;
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
    const response = await apiClient.get(`/api/Series/${seriesId}`);
    return response.data;
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
    const response = await apiClient.get(`/api/Series/volumes?seriesId=${seriesId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching volumes for series ${seriesId}:`, error);
    throw error;
  }
};

/**
 * Get the cover image URL for a series
 */
export const getSeriesCoverUrl = (baseUrl: string, seriesId: number, apiKey: string): string => {
  return `${baseUrl}/api/image/series-cover?seriesId=${seriesId}&apiKey=${apiKey}`;
};

/**
 * Get volume cover image URL
 */
export const getVolumeCoverUrl = (baseUrl: string, volumeId: number, apiKey: string): string => {
  return `${baseUrl}/api/image/volume-cover?volumeId=${volumeId}&apiKey=${apiKey}`;
};

/**
 * Get chapter cover image URL
 */
export const getChapterCoverUrl = (baseUrl: string, chapterId: number, apiKey: string): string => {
  return `${baseUrl}/api/image/chapter-cover?chapterId=${chapterId}&apiKey=${apiKey}`;
};