import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import { Page } from '@/api/manga';
import MangaImage from '@/components/ui/MangaImage';

interface VerticalReaderProps {
  pages: Page[];
  initialPage?: number;
  chapterId: number;
  onPageChange?: (pageNumber: number) => void;
}

const { width } = Dimensions.get('window');
const VISIBILITY_THRESHOLD = 50; // Percentage of item visible to trigger page change

export default function VerticalReader({ 
  pages, 
  initialPage = 0,
  chapterId,
  onPageChange 
}: VerticalReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (flatListRef.current && initialPage > 0) {
      // Scroll to initial page
      flatListRef.current.scrollToIndex({
        index: initialPage,
        animated: false,
      });
    }
  }, [initialPage]);
  
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      // Use the first viewable item as the current page
      const page = viewableItems[0].item;
      const pageNumber = page.pageNumber;
      
      if (pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
        
        if (onPageChange) {
          onPageChange(pageNumber);
        }
      }
    }
  }).current;
  
  const renderItem = ({ item: page }) => {
    // Generate a unique cache key for this page
    const cacheKey = `chapter_${chapterId}_page_${page.pageNumber}`;
    
    return (
      <View style={styles.pageContainer}>
        <MangaImage
          source={page.image || { uri: page.image }}
          style={styles.pageImage}
          resizeMode="contain"
          cacheKey={cacheKey}
        />
      </View>
    );
  };
  
  return (
    <FlatList
      ref={flatListRef}
      data={pages}
      vertical
      showsVerticalScrollIndicator={false}
      initialScrollIndex={initialPage}
      getItemLayout={(_, index) => ({
        length: width * 1.5, // Approximate height based on width with aspect ratio
        offset: width * 1.5 * index,
        index,
      })}
      renderItem={renderItem}
      keyExtractor={(page) => `vertical-page-${page.pageNumber}`}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: VISIBILITY_THRESHOLD
      }}
    />
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  pageImage: {
    width: width,
    height: width * 1.5, // Default aspect ratio for manga pages
    resizeMode: 'contain',
  },
});