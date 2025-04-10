import React, { useState, useRef } from 'react';
import { StyleSheet, Dimensions, View, FlatList } from 'react-native';
import { Page } from '@/api/manga';
import MangaImage from '@/components/ui/MangaImage';

interface PageReaderProps {
  pages: Page[];
  initialPage?: number;
  chapterId: number;
  onPageChange?: (pageNumber: number) => void;
}

const { width, height } = Dimensions.get('window');

export default function PageReader({ 
  pages, 
  initialPage = 0, 
  chapterId,
  onPageChange 
}: PageReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const flatListRef = useRef<FlatList>(null);
  
  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const page = viewableItems[0].item;
      const pageNumber = page.pageNumber;
      setCurrentPage(pageNumber);
      
      if (onPageChange) {
        onPageChange(pageNumber);
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
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={initialPage}
      getItemLayout={(_, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
      renderItem={renderItem}
      keyExtractor={(page) => `page-${page.pageNumber}`}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 50
      }}
    />
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: width,
    height: height,
  },
});