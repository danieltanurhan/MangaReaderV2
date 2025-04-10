import React, { useEffect, useState } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useMangaStore } from '@/store/mangaStore';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export type MangaImageProps = Omit<ImageProps, 'source'> & {
  source: number | string; // Can be series/volume/chapter ID or direct URL
  type?: 'series' | 'volume' | 'chapter' | 'page';
  showLoadingIndicator?: boolean;
  cacheKey?: string;
};

/**
 * Cross-platform image component for manga content
 */
export default function MangaImage({
  source,
  type = 'series',
  style,
  resizeMode = 'cover', 
  showLoadingIndicator = true,
  cacheKey,
  ...rest
}: MangaImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const iconColor = useThemeColor({}, 'text');
  const linkColor = useThemeColor({}, 'tint');
  
  // Get store methods for fetching image URLs
  const { 
    getSeriesCoverUrl, 
    getVolumeCoverUrl, 
    getChapterCoverUrl 
  } = useMangaStore();

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(false);

    const loadImage = async () => {
      try {
        let finalImageUrl: string | null = null;

        // Direct URL string
        if (typeof source === 'string') {
          finalImageUrl = source;
        } 
        // ID number (series, volume, chapter)
        else if (typeof source === 'number') {
          switch (type) {
            case 'series':
              finalImageUrl = await getSeriesCoverUrl(source);
              break;
            case 'volume':
              finalImageUrl = await getVolumeCoverUrl(source);
              break;
            case 'chapter':
              finalImageUrl = await getChapterCoverUrl(source);
              break;
          }
        }

        if (mounted) {
          setImageUrl(finalImageUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [source, type, cacheKey]);

  // Render loading state
  if (isLoading && showLoadingIndicator) {
    return (
      <View style={[styles.container]}>
        <ActivityIndicator 
          size="small" 
          color={linkColor} 
        />
      </View>
    );
  }

  // Render error state
  if (error || !imageUrl) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.errorImage} />
      </View>
    );
  }

  // Render image
  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      resizeMode={resizeMode}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  errorContainer: {
    backgroundColor: '#e0e0e0',
  },
  errorImage: {
    width: '50%',
    height: '50%',
    opacity: 0.5,
    backgroundColor: '#ccc',
  }
});