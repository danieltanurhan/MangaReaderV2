prompt: okay we're doing the proposal step by step, dont do anything beyond my instructions, 

1. manga.ts
Move the TypeScript interfaces from mangaStore.ts (ChapterDetails, ChapterInfo, ReadingProgress) to manga.ts to centralize type definitions
Add proper documentation for each interface
Ensure the interfaces accurately match the API responses from Kavita
2. mangaStore.ts
Remove the duplicated interface definitions (since we're moving them to manga.ts)
Verify that the existing image caching implementation works correctly
Ensure all implemented methods follow consistent error handling patterns
Fix type inconsistencies in the return values (e.g., getChapterCoverUrl returns string but might be null)
3. app/main/reader/[chapterId].tsx
Update the component to use the useMangaStore functions instead of directly calling the API
Implement parallel loading of chapter data (details, info, progress, pages)
Start the reader at the saved reading progress position
Add proper error state handling and recovery options
Enhance the reader controls interface (navigation, settings)
4. PageReader.tsx
Update to use mangaStore.getPageUrl instead of directly loading images
Implement preloading of adjacent pages (1-2 pages ahead)
Add proper loading indicators during page transitions
Handle orientation changes and device size differences



chapterID page
okay we we have some issues with this implementation as there are two clear errors on your side, there are two functions taht need to be written  // Get required IDs from currentChapterInfo for proper update
        if (currentChapterInfo) {
          const { volumeId, seriesId, libraryId } = currentChapterInfo;
          // Store updates handled by the API, not our store
          await updateReadingProgress(chapterIdNum, pageNumber);
        }
        
        // If we're on the last page, mark the chapter as read
        if (pageNumber === totalPages) {
          await markChapterAsRead(chapterIdNum); these two functions that use await, these actually touch upon something that I havent addressed, for this page to function correctly we nee