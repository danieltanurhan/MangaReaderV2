import React from 'react';
import { StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import MangaImage from '@/components/ui/MangaImage';
import { MangaSeries } from '@/api/manga';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

interface MangaCardProps {
  series: MangaSeries;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 3; // 3 columns with 16px spacing

export default function MangaCard({ series }: MangaCardProps) {
    const iconColor = useThemeColor({}, 'text');
    const linkColor = useThemeColor({}, 'tint');
  
  
  const handlePress = () => {
    router.push(`/series/${series.id}`);
  };
  
  // Calculate read percentage
  const readPercentage = series.pages > 0 
    ? Math.round((series.pagesRead / series.pages) * 100) 
    : 0;
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {/* Replace standard Image with MangaImage component */}
        <MangaImage
          source={series.id}
          type="series"
          style={styles.coverImage}
          cacheKey={`series_card_${series.id}`}
        />
        
        {/* Progress indicator */}
        {readPercentage > 0 && (
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${readPercentage}%`,
                  backgroundColor: readPercentage === 100 
                    ? iconColor 
                    : linkColor
                }
              ]} 
            />
          </View>
        )}
      </View>
      
      <ThemedView style={styles.titleContainer}>
        <ThemedText 
          style={styles.title} 
          numberOfLines={2} 
          lightColor="#000" 
          darkColor="#fff"
        >
          {series.name}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 2/3,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  titleContainer: {
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressBar: {
    height: '100%',
  }
});