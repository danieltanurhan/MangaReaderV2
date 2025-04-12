import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, useWindowDimensions, ViewToken } from 'react-native';
import { Page } from '@/api/manga';
import MangaImage from '@/components/ui/MangaImage';
import { useMangaStore } from '@/store/mangaStore';
import { useThemeColor } from '@/hooks/useThemeColor';

interface PageReaderProps {
  pages: Page[];
  initialPage?: number;
  chapterId: number;
  onPageChange?: (pageNumber: number) => void;
  isLoading?: boolean;
}

export default function PageReader({
  pages,
  initialPage = 0,
  chapterId,
  onPageChange,
  isLoading = false
}: PageReaderProps) {
  // Use window dimensions to handle orientation changes
  const { width, height } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageUrls, setPageUrls] = useState<Record<number, string | null>>({});
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const flatListRef = useRef<FlatList>(null);
  
  // Get the mangaStore's getPageUrl function
  const { getPageUrl } = useMangaStore();
  
  // Get theme color for loading indicator
  const loadingColor = useThemeColor({}, 'tint');
  
  // Handle viewability changes to track the current page
  const handleViewableItemsChanged = useRef(({ viewableItems }: {
    viewableItems: Array<ViewToken>;
  }) => {
    if (viewableItems.length > 0) {
      // Type assertion to specify that item is a Page
      const page = viewableItems[0].item as Page;
      const pageNumber = page.pageNumber;
      
      // Update internal state with the current page index (0-based)
      setCurrentPage(pageNumber - 1);
      
      // Call the parent component with the 1-based page number
      if (onPageChange) {
        onPageChange(pageNumber);
      }
      
      // Preload adjacent pages when the current page changes
      preloadAdjacentPages(pageNumber);
      
      // Immediately load the image for the current page
      loadPageImage(pageNumber);
    }
  }).current;
  
  // External update: When the parent component changes the page
  useEffect(() => {
    // Only respond to external page changes (from controls)
    if (flatListRef.current && initialPage !== currentPage) {
      flatListRef.current.scrollToIndex({
        index: initialPage,
        animated: true
      });
      setCurrentPage(initialPage);
    }
  }, [initialPage]);
  
  // Load a page's image URL and cache it
  const loadPageImage = async (pageNumber: number) => {
    // Check if we've already loaded this page
    if (pageUrls[pageNumber]) {
      return pageUrls[pageNumber];
    }
    
    setLoadingPages(prev => ({ ...prev, [pageNumber]: true }));
    
    try {
      // Get the image URL from mangaStore (which handles caching internally)
      const url = await getPageUrl(chapterId, pageNumber);
      
      // Store the URL in our local state
      setPageUrls(prev => ({ ...prev, [pageNumber]: url }));
      setLoadingPages(prev => ({ ...prev, [pageNumber]: false }));
      
      return url;
    } catch (error) {
      console.error(`Error loading page ${pageNumber}:`, error);
      setLoadingPages(prev => ({ ...prev, [pageNumber]: false }));
      return null;
    }
  };
  
  // Preload adjacent pages for smoother reading experience
  const preloadAdjacentPages = (currentPageNumber: number) => {
    // Define which pages to preload (next 2 pages and previous page)
    const pagesToPreload = [
      currentPageNumber + 1, // Next page
      currentPageNumber + 2, // Page after next
      currentPageNumber - 1  // Previous page
    ];
    
    // Filter out invalid page numbers
    const validPagesToPreload = pagesToPreload.filter(
      pageNum => pageNum > 0 && pageNum <= pages.length
    );
    
    // Preload each page in the background
    validPagesToPreload.forEach(pageNum => {
      // Don't wait for these to complete - let them load in background
      loadPageImage(pageNum);
    });
  };
  
  // Load the initial page and its adjacent pages
  useEffect(() => {
    if (!isLoading && pages.length > 0) {
      const pageNumber = initialPage + 1;
      
      // Load the current page first
      loadPageImage(pageNumber);
      
      // Then preload adjacent pages
      preloadAdjacentPages(pageNumber);
    }
  }, [isLoading, pages]);
  
  // Reset FlatList when orientation changes
  useEffect(() => {
    if (flatListRef.current && currentPage >= 0) {
      // Add small delay to allow layout to complete
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentPage,
          animated: false,
        });
      }, 100);
    }
  }, [width, height]);
  
  // Render a page item in the FlatList
  const renderPage = ({ item: page }: { item: Page }) => {
    const pageNumber = page.pageNumber;
    const isPageLoading = loadingPages[pageNumber];
    const pageUrl = pageUrls[pageNumber];
    
    return (
      <View style={[styles.pageContainer, { width, height }]}>
        {/* If we have a URL, render the image */}
        {pageUrl ? (
          <MangaImage
            source={pageUrl}
            style={[styles.pageImage, { width, height }]}
            resizeMode="contain"
            showLoadingIndicator={false}
            cacheKey={`page_${chapterId}_${pageNumber}`}
          />
        ) : null}
        
        {/* Loading indicator overlay */}
        {isPageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={loadingColor} />
          </View>
        )}
      </View>
    );
  };
  
  return (
    <FlatList
      ref={flatListRef}
      data={pages}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={initialPage}
      getItemLayout={(_, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      renderItem={renderPage}
      keyExtractor={(page) => `page-${page.pageNumber}`}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50
      }}
      windowSize={3} // Render 1 page before and after for smoother transitions
      maxToRenderPerBatch={2} // Don't render too many at once to avoid stuttering
      removeClippedSubviews={true} // Improve memory usage
      onScrollToIndexFailed={(info) => {
        // Handle scroll failures gracefully
        const wait = new Promise(resolve => setTimeout(resolve, 100));
        wait.then(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ 
              index: info.index, 
              animated: false 
            });
          }
        });
      }}
    />
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pageImage: {
    resizeMode: 'contain',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});