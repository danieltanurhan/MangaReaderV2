import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, useGlobalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { getChapterPages, markChapterAsRead, updateReadingProgress, Page } from '@/api/manga';
import { useMangaStore } from '@/store/mangaStore';
import { useAuthStore } from '@/store/authStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import VerticalReader from '@/components/reader/VerticalReader';
import PageReader from '@/components/reader/PageReader';

export default function ReaderScreen() {
  const { chapterId } = useGlobalSearchParams();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readingMode, setReadingMode] = useState<'vertical' | 'page'>('page'); 
  const [currentPage, setCurrentPage] = useState(1);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [progressThrottle, setProgressThrottle] = useState<NodeJS.Timeout | null>(null);
  
  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  // Use the proper store
  const { serverInfo } = useAuthStore();
  
  // Get chapter ID as number
  const chapterIdNum = parseInt(chapterId as string);
  
  useEffect(() => {
    loadChapterPages();
    
    // Auto-hide controls after a few seconds
    const timer = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [chapterId]);
  
  const loadChapterPages = async () => {
    if (!chapterId || isNaN(chapterIdNum)) return;
    
    try {
      setIsLoading(true);
      const pagesData = await getChapterPages(chapterIdNum);
      setPages(pagesData);
    } catch (error) {
      console.error("Error loading chapter pages:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
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
    
    const throttleTimeout = setTimeout(() => {
      updateReadingProgress(chapterIdNum, pageNumber)
        .catch(error => console.error("Error updating reading progress:", error));
        
      // If we're on the last page, mark the chapter as read
      if (pageNumber === pages.length) {
        markChapterAsRead(chapterIdNum)
          .catch(error => console.error("Error marking chapter as read:", error));
      }
    }, 2000);
    
    setProgressThrottle(throttleTimeout);
  };
  
  const handleBackPress = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar hidden />
      
      {/* Main reader component */}
      <View style={styles.readerContainer} onTouchStart={toggleControls}>
        {readingMode === 'vertical' ? (
          <VerticalReader
            pages={pages}
            chapterId={chapterIdNum}
            onProgressUpdate={handleProgressUpdate}
            isLoading={isLoading}
          />
        ) : (
          <PageReader
            pages={pages}
            chapterId={chapterIdNum}
            onProgressUpdate={handleProgressUpdate}
            isLoading={isLoading}
          />
        )}
      </View>
      
      {/* Controls overlay - shown or hidden based on state */}
      {isControlsVisible && (
        <View style={styles.controlsOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            
            <ThemedText style={styles.pageIndicator}>
              Page {currentPage} of {pages.length}
            </ThemedText>
            
            <TouchableOpacity onPress={toggleReadingMode} style={styles.iconButton}>
              <Ionicons 
                name={readingMode === 'vertical' ? 'book-outline' : 'menu-outline'} 
                size={24} 
                color={textColor}
              />
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
  pageIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    color: 'white'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});