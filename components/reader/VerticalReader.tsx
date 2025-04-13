import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, useWindowDimensions, ViewToken } from 'react-native';
import { Page, getChapterInfo, ChapterInfo } from '@/api/manga';
import MangaImage from '@/components/ui/MangaImage';
import { useMangaStore } from '@/store/mangaStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';

// Create a skeleton component for image placeholders
// filepath: c:\Users\danie\OneDrive\Documents\CIS\VSCodeRepos\MangaReaderV2\components\ui\ImageSkeleton.tsx
const ImageSkeleton = ({ width, height, color }: { width: number, height: number, color: string }) => {
  return (
    <View style={[
      styles.skeleton, 
      { 
        width: width, 
        height: height,
        backgroundColor: 'rgba(0, 0, 0, 0.05)' // More subtle background
      }
    ]}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
};

interface VerticalReaderProps {
  pages: Page[];
  initialPage?: number;
  chapterId: number;
  onPageChange?: (pageNumber: number) => void;
  isLoading?: boolean;
}

export default function VerticalReader({
  pages,
  initialPage = 0,
  chapterId,
  onPageChange,
  isLoading = false
}: VerticalReaderProps) {
  // Use window dimensions to handle orientation changes
  const { width, height } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageUrls, setPageUrls] = useState<Record<number, string | null>>({});
  const [loadingPages, setLoadingPages] = useState<Record<number, boolean>>({});
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number, height: number }>>({});
  const [estimatedHeights, setEstimatedHeights] = useState<Record<number, number>>({});
  const flatListRef = useRef<FlatList>(null);
  
  // Get the mangaStore's getPageUrl function
  const { getPageUrl } = useMangaStore();
  
  // Get theme colors for UI elements
  const loadingColor = useThemeColor({}, 'tint');
  const skeletonColor = useThemeColor({}, 'background');
  
  // Calculate default page height based on aspect ratio (1:1.5 is common for manga)
  const defaultPageHeight = width * 1.5;
  
  // Pre-calculate estimated heights for all pages to prevent scroll jumps
  useEffect(() => {
    if (pages.length > 0) {
      // Create default heights for all pages
      const heights: Record<number, number> = {};
      
      pages.forEach(page => {
        // Start with default height
        heights[page.pageNumber] = defaultPageHeight;
      });
      
      setEstimatedHeights(heights);
    }
  }, [pages, width]);
  
  // Update estimated heights when we get real dimensions
  useEffect(() => {
    if (Object.keys(pageDimensions).length > 0) {
      setEstimatedHeights(prev => {
        const newHeights = { ...prev };
        
        // Update heights with real dimensions
        Object.entries(pageDimensions).forEach(([pageNumber, dimensions]) => {
          const pageNum = parseInt(pageNumber, 10);
          if (!isNaN(pageNum)) {
            const aspectRatio = dimensions.height / dimensions.width;
            newHeights[pageNum] = width * aspectRatio;
          }
        });
        
        return newHeights;
      });
    }
  }, [pageDimensions, width]);
  
  // Handle viewability changes to track the current page
  const handleViewableItemsChanged = useRef(({ viewableItems }: {
    viewableItems: Array<ViewToken>;
  }) => {
    if (viewableItems.length > 0) {
      // Type assertion to specify that item is a Page
      const page = viewableItems[0].item as Page;
      const pageNumber = page.pageNumber;
      
      // Update internal state with the current page
      if (pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
        
        // Call the parent component with the page number
        if (onPageChange) {
          onPageChange(pageNumber);
        }
        
        // Preload adjacent pages when the current page changes
        preloadAdjacentPages(pageNumber);
      }
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
    // Define which pages to preload (next 3 pages for vertical scrolling)
    const pagesToPreload = [
      currentPageNumber + 1, // Next page
      currentPageNumber + 2, // Page after next
      currentPageNumber + 3  // Page after next + 1
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
      const pageNumber = initialPage;
      
      // Load the current page first
      loadPageImage(pageNumber);
      
      // Then preload adjacent pages
      preloadAdjacentPages(pageNumber);
    }
  }, [isLoading, pages]);
  
  // Reset FlatList when orientation changes
  useEffect(() => {
    if (flatListRef.current && currentPage > 0) {
      // Add small delay to allow layout to complete
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentPage,
          animated: false,
        });
      }, 100);
    }
  }, [width, height]);
  
  // Fetch chapter info including page dimensions when component mounts
  useEffect(() => {
    const fetchChapterInfo = async () => {
      try {
        const chapterInfo = await getChapterInfo(chapterId) as ChapterInfo;
        if (chapterInfo.pageDimensions) {
          // Transform the array into a map for easy lookup by page number
          const dimensions = chapterInfo.pageDimensions.reduce((acc, dim) => {
            acc[dim.pageNumber] = {
              width: dim.width,
              height: dim.height
            };
            return acc;
          }, {} as Record<number, { width: number, height: number }>);
          
          setPageDimensions(dimensions);
        }
      } catch (error) {
        console.error('Error fetching chapter info with dimensions:', error);
      }
    };
    
    fetchChapterInfo();
  }, [chapterId]);

  // Update getPageHeight function to be more robust
  const getPageHeight = (pageNumber: number): number => {
    // Use estimated height if available, otherwise default
    if (estimatedHeights[pageNumber]) {
      return estimatedHeights[pageNumber];
    }
    
    // Fallback to dimensions from API if available
    const dimensions = pageDimensions[pageNumber];
    if (dimensions && dimensions.width > 0) {
      const aspectRatio = dimensions.height / dimensions.width;
      return width * aspectRatio;
    }
    
    // Ultimate fallback is default height
    return defaultPageHeight;
  };

  // Update renderPage for consistent sizing
  const renderPage = ({ item: page }: { item: Page }) => {
    const pageNumber = page.pageNumber;
    const isPageLoading = loadingPages[pageNumber];
    const pageUrl = pageUrls[pageNumber];
    
    // Get the height for this page
    const imageHeight = getPageHeight(pageNumber);
    
    const imageStyle = {
      width: width,
      height: imageHeight,
      resizeMode: 'contain' as 'contain' // TypeScript needs this cast
    };
    
    return (
      <View style={[styles.pageContainer, { width: width }]}>
        {/* If we have a URL, render the image */}
        {pageUrl ? (
          <MangaImage
            source={pageUrl}
            style={imageStyle}
            resizeMode="contain"
            showLoadingIndicator={false}
            cacheKey={`page_${chapterId}_${pageNumber}`}
          />
        ) : (
          // Show skeleton while loading - with identical dimensions
          <ImageSkeleton 
            width={width} 
            height={imageHeight} 
            color={loadingColor} 
          />
        )}
        
        {/* Loading indicator overlay */}
        {isPageLoading && (
          <View style={[styles.loadingOverlay, imageStyle]}>
            <ActivityIndicator size="large" color={loadingColor} />
          </View>
        )}
      </View>
    );
  };
  
  // Get item layout with correct height estimation to prevent scroll jumps
  const getItemLayout = (_: any, index: number) => {
    const pageNumber = pages[index]?.pageNumber;
    const itemHeight = pageNumber ? getPageHeight(pageNumber) : defaultPageHeight;
    
    // Calculate offset by summing heights of all previous pages
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevPageNumber = pages[i]?.pageNumber;
      offset += prevPageNumber ? getPageHeight(prevPageNumber) : defaultPageHeight;
    }
    
    return {
      length: itemHeight,
      offset,
      index,
    };
  };
  
  return (
    <FlatList
      ref={flatListRef}
      data={pages}
      showsVerticalScrollIndicator={false}
      initialScrollIndex={initialPage}
      getItemLayout={getItemLayout}
      renderItem={renderPage}
      keyExtractor={(page) => `vertical-page-${page.pageNumber}`}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50
      }}
      windowSize={5} // Render more items for vertical scrolling
      maxToRenderPerBatch={3} // Render more items for vertical scrolling
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
      ItemSeparatorComponent={() => <View style={{ height: 0 }} />} // No gap between pages
      contentContainerStyle={styles.flatListContent}
    />
  );
}

// Update styles for consistent image sizing
const styles = StyleSheet.create({
  flatListContent: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  pageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pageImage: {
    width: '100%',
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
  skeleton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});