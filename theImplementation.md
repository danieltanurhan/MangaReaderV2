prompt: okay we're doing the proposal step by step, dont do anything beyond my instructions, 

Understanding the Issue
Your current system has these problems:

On web, makeRequest returns image binary data (Blob) instead of URL strings
Your components expect URL strings to work with React Native's Image component
Direct URLs don't work on web due to CORS restrictions
Implementation Plan
1. Create a New Image Utility
File: utils/imageUtils.ts

Purpose: Handle conversion between binary data and usable image URLs
Functions:
createImageUrl: Convert Blobs to object URLs on web
getImageSource: Platform-aware function to create proper image sources
2. Update Manga API
File: manga.ts

Add platform-aware image URL functions:
getVolumeCoverImageUrl
getChapterCoverImageUrl
Update existing getSeriesCoverImageUrl to better handle platform differences
3. Update MangaStore Methods
File: mangaStore.ts

Refactor getSeriesCoverUrl, getVolumeCoverUrl, and getChapterCoverUrl methods
Use the new image utility functions
Implement caching for better performance
4. Update Image Component
File: components/ui/MangaImage.tsx

Create a new component that wraps React Native's Image
Handle both URL strings and Blob objects
Support proper image loading across platforms
5. Apply the New Component
Use the new MangaImage component in:
components/MangaCard.tsx
[id].tsx
PageReader.tsx
VerticalReader.tsx

Technical Approach
For Native Platforms:

Continue using direct URLs for efficiency
No change in implementation needed
For Web Platform:

Use makeRequest to fetch image data through the proxy
Convert binary responses to object URLs using URL.createObjectURL()
Clean up object URLs when components unmount to prevent memory leaks
Common Interface:

Expose a unified API that works across platforms
Handle platform differences internally
Components can use the same props regardless of platform
This approach will solve the CORS issues on web while maintaining native performance on mobile platforms.