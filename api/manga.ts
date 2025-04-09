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
 * Get the cover image URL for a series
 */
export const getSeriesCoverUrl = (baseUrl: string, seriesId: number, apiKey: string): string => {
  return `${baseUrl}/api/image/series-cover?seriesId=${seriesId}&apiKey=${apiKey}`;
};