/**
 * Image utility functions for cross-platform image handling
 * Provides consistent interface for image sources across web and native platforms
 */
import { Platform, ImageSourcePropType } from 'react-native';
import { getItem, StorageKeys } from './storage';
import * as FileSystem from 'expo-file-system';


/**
 * Converts image data to a React Native-compatible URI, with platform-specific optimizations.
 * - Web: Uses Base64 for reliability (Blobs can leak memory).
 * - Native: Saves to filesystem for persistent caching.
 */
export async function getImageSource(
  imageData: string | ArrayBuffer | Uint8Array | null,
  cacheKey: string
): Promise<{ uri: string } | null> {
  if (!imageData) return null;
  console.log('Received imageData type:', typeof imageData);
  console.log('First 10 chars/bytes:', imageData?.toString().substring(0, 10));


  // Case 1: Already a URL (web or native)
  if (typeof imageData === 'string' && imageData.startsWith('http')) {
    console.log('Image data is a URL:', imageData);
    return { uri: imageData };
  }
  
  // Platform-specific base64 conversion
  let base64Data: string;
  let binaryData = imageData instanceof ArrayBuffer ? new Uint8Array(imageData) : imageData;
  
 // Handle binary data (web)
 if (imageData instanceof ArrayBuffer || 
  imageData instanceof Uint8Array) {
    console.log('inside binary data conversion');
    // Web-safe approach for converting binary to base64
    binaryData = imageData instanceof ArrayBuffer ? new Uint8Array(imageData) : imageData;
    const base64 = Array.from(binaryData)
    .map(byte => String.fromCharCode(byte))
    .join('');
    base64Data = base64;
  } else {
    // Native platforms can use Buffer
    base64Data = require('buffer').Buffer.from(binaryData).toString('base64');
  }
  
  const dataUri = `data:image/png;base64,${btoa(base64Data)}`;

  if (Platform.OS === 'web') {
    // Web: Use Base64 directly (more reliable than Blobs)
    return { uri: dataUri };
  } else {
    // Native: Same approach for now, filesystem caching can be added later
    return { uri: dataUri };
  }
}

/**
 * Generate a direct URL to an image on the Kavita server
 * Only for native platforms - web platforms should use the makeRequest approach
 * @param endpoint - API endpoint for the image
 * @param params - URL parameters as key-value pairs
 * @returns Promise with the direct URL string
 */
export const getDirectImageUrl = async (
  endpoint: string,
  params: Record<string, string | number>
): Promise<string> => {
  // Only use direct URLs for native platforms
  if (Platform.OS === 'web') {
    return '';
  }
  
  try {
    const baseUrl = await getItem(StorageKeys.BASE_URL);
    const apiKey = await getItem(StorageKeys.API_KEY);
    
    if (!baseUrl || !apiKey) {
      return '';
    }
    
    // Build query string from params
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Return full URL with API key for authorization
    return `${baseUrl}/api/${endpoint}?${queryString}&apiKey=${apiKey}`;
  } catch (error) {
    console.error('Error generating direct image URL:', error);
    return '';
  }
};

export type ImageSource = 
  | ArrayBuffer           // Raw binary data
  | Uint8Array;


/**
 * Handles image data returned from API calls, converting to appropriate format
 * - Web: Converts ArrayBuffer to base64 data URI
 * - Native: Returns the URL directly
 * 
 * @param imageData The image data from the API (ArrayBuffer, or URL)
 * @param mimeType Optional MIME type for the image (defaults to 'image/png')
 * @returns An object with URI that can be used in Image source
 */
// export function processImageResponse(
//   imageData: ImageSource | null,
//   mimeType: string = 'image/png'
// ): { uri: string } | null {
//   if (!imageData) {
//     console.warn('No image data received');
//     return null;
//   }

  

//   // Helper: Convert ArrayBuffer/Uint8Array to Base64
//   const toBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
//     const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  
//     if (Platform.OS === 'web') {
//       // Use TextDecoder for better performance
//       const binaryString = new TextDecoder('utf-8').decode(bytes);
//       return window.btoa(binaryString);
//     }
  
//     return Buffer.from(bytes).toString('base64');
//   };

//   // Case 1: Already a URL string
//   if (typeof imageData === 'string') {
//     console.log('Image data is a URL:', imageData);
//     return { uri: imageData };  // Simplified since both cases return the same thing
// }

//   // Case 2: Raw binary data (ArrayBuffer, Uint8Array, or number[])
//   if (imageData instanceof ArrayBuffer || imageData instanceof Uint8Array) {
//     const contentType = mimeType;
//     console.log('Image data type:', typeof imageData, 'Content type:', contentType);
//     console.log('Image data:', toBase64(imageData));
//     return { uri: `data:${contentType};base64,${toBase64(imageData)}` };
//   }

//   // Case 3: Number array (legacy format)
//   if (Array.isArray(imageData) && imageData.every(i => typeof i === 'number')) {
//     return { uri: `data:${mimeType};base64,${toBase64(new Uint8Array(imageData))}` };
//   }

//   console.warn(`Unsupported image format for ${Platform.OS}:`, typeof imageData);
//   return null;
// }

// Object to track all created object URLs so we can revoke them when needed

