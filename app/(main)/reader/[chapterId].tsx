import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useGlobalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Page } from '@/api/manga';
import { useMangaStore } from '@/store/mangaStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import VerticalReader from '@/components/reader/VerticalReader';
import PageReader from '@/components/reader/PageReader';

export default function ReaderScreen() {
  const { chapterId } = useGlobalSearchParams();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingMode, setReadingMode] = useState<'vertical' | 'page'>('page'); 
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [progressThrottle, setProgressThrottle] = useState<NodeJS.Timeout | null>(null);
  
  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const errorColor = useThemeColor({}, 'tint');
  
  // Get store functions
  const { 
    fetchChapterDetails, 
    fetchChapterInfo, 
    fetchReadingProgress,
    getPageUrl,
    currentChapterInfo,
    currentChapterDetails,
    currentReadingProgress,
    chapterError,
    isLoadingChapter,
    clearChapterData,
  } = useMangaStore();
  
  // Get chapter ID as number
  const chapterIdNum = parseInt(chapterId as string);
  
  // Hook to clear chapter data when leaving screen
  useEffect(() => {
    return () => clearChapterData();
  }, []);

  const loadChapterData = async () => {
    try {
      // Load all chapter data in parallel
      const [details, info, progress] = await Promise.all([
        fetchChapterDetails(chapterIdNum),
        fetchChapterInfo(chapterIdNum),
        fetchReadingProgress(chapterIdNum),
      ]);
      
      if (!info) {
        throw new Error("Failed to load chapter information");
      }
      
      // Create page objects based on chapter info
      const pageObjects = Array.from({ length: info.pages }, (_, i) => ({
        pageNumber: i,
        fileName: info.pageDimensions[i]?.fileName || `page_${i}`,
        image: '' // Will be loaded on demand by PageReader component
      }));
      
      setPages(pageObjects);
      setTotalPages(pageObjects.length);
      
      // Set initial page from reading progress if available
      if (progress) {
        setCurrentPage(progress.pageNum);
      } else {
        setCurrentPage(0);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading chapter data:", err);
      setError(err instanceof Error ? err.message : "Failed to load chapter");
      setIsLoading(false);
    }
  };
  
  // Load chapter data in parallel
  useEffect(() => {
    if (!chapterId || isNaN(chapterIdNum)) {
      setError("Invalid chapter ID");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    loadChapterData();
    
    // Auto-hide controls after a few seconds
    const timer = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [chapterIdNum]);
  
  // Monitor store error state
  useEffect(() => {
    if (chapterError) {
      setError(chapterError);
    }
  }, [chapterError]);
  
  const toggleReadingMode = () => {
    setReadingMode(prevMode => prevMode === 'vertical' ? 'page' : 'vertical');
  };
  
  const toggleControls = () => {
    setIsControlsVisible(prev => !prev);
  };
  
  const handleProgressUpdate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    
    // Throttle progress updates to avoid excessive API calls
    if (progressThrottle) {
      clearTimeout(progressThrottle);
    }
    
    // Use timeout to reduce API calls
    const throttleTimeout = setTimeout(async () => {
      try {
        // Get required IDs from currentChapterInfo for proper update
        if (currentChapterInfo) {
          const { volumeId, seriesId, libraryId } = currentChapterInfo;
          // Store updates handled by the API, not our store
          // await updateReadingProgress(chapterIdNum, pageNumber);
        }
        
        // If we're on the last page, mark the chapter as read
        if (pageNumber === totalPages) {
          // await markChapterAsRead(chapterIdNum);
        }
      } catch (error) {
        console.error("Error updating reading progress:", error);
      }
    }, 2000);
    
    setProgressThrottle(throttleTimeout);
  };
  
  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate to a fallback screen if there's no screen to go back to
      router.push(`/(main)/series/${currentChapterInfo?.seriesId}`);
    }
  };
  
  // Retry loading if there was an error
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Re-trigger the useEffect that loads data
    setTimeout(() => {
      loadChapterData();
    }, 100);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar hidden />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={textColor} />
          <ThemedText style={styles.loadingText}>Loading chapter...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar hidden />
        <ThemedView style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={errorColor} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <ThemedText style={styles.retryText}>Retry</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <ThemedText>Back to Series</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar hidden />

      {/* Invisible button to toggle controls */}
      <TouchableOpacity
        style={styles.invisibleButton}
        onPress={toggleControls}
        activeOpacity={1} // Prevents visual feedback
      />

      {/* Main reader component */}
      <View style={styles.readerContainer}>
        {readingMode === 'vertical' ? (
          <VerticalReader
            pages={pages}
            chapterId={chapterIdNum}
            onPageChange={handleProgressUpdate}
            isLoading={isLoading}
            initialPage={currentPage}
          />
        ) : (
          <PageReader
            pages={pages}
            chapterId={chapterIdNum}
            onPageChange={handleProgressUpdate}
            isLoading={isLoading}
            initialPage={currentPage}
          />
        )}
      </View>

      {/* Controls overlay - shown or hidden based on state */}
      {isControlsVisible && (
        <View style={styles.controlsOverlay} pointerEvents="box-none">
          {/* Top control bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <ThemedText style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </ThemedText>

            <View style={styles.rightControls}>
              <TouchableOpacity onPress={toggleReadingMode} style={styles.iconButton}>
                <Ionicons
                  name={readingMode === 'vertical' ? 'book-outline' : 'menu-outline'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom control bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => handleProgressUpdate(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.progressIndicator}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(currentPage / totalPages) * 100}%` },
                ]}
              />
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={() => handleProgressUpdate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  readerContainer: {
    flex: 1,
  },
  invisibleButton: {
    position: 'absolute', // Position it relative to the screen
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    transform: [{ translateX: -25 }, { translateY: -25 }], // Offset by half the width/height to truly center
    width: 150, // Set a fixed width
    height: 150, // Set a fixed height
    backgroundColor: 'transparent', // Invisible
    zIndex: 1, // Ensures it is above the reader
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 20,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  pageIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
  },
  progressIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
});