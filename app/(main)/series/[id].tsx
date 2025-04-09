import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Image, 
  ScrollView, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  FlatList,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMangaStore } from '@/store/mangaStore';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Volume } from '@/api/manga'; // Removed unused Chapter import
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function SeriesDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const seriesId = parseInt(id || '0', 10);

  const {
    currentSeries,
    currentVolumes,
    isLoadingSeries,
    seriesError,
    fetchSeriesById,
    getSeriesCoverUrl,
    getVolumeCoverUrl,
    getChapterCoverUrl
  } = useMangaStore();

  const [selectedVolumeId, setSelectedVolumeId] = useState<number | null>(null);

  // Get theme colors
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  // Load series data on mount
  useEffect(() => {
    if (seriesId > 0) {
      fetchSeriesById(seriesId);
    }
  }, [seriesId]);

  // Select the first volume by default once volumes are loaded
  useEffect(() => {
    if (currentVolumes && currentVolumes.length > 0 && !selectedVolumeId) {
      setSelectedVolumeId(currentVolumes[0].id);
    }
  }, [currentVolumes]);

  // Handle starting to read a chapter
  const handleReadChapter = (chapterId: number) => {
    router.push(`/reader/${chapterId}`);
  };

  // Function to determine reading status
  const getReadingStatus = () => {
    if (!currentVolumes || !Array.isArray(currentVolumes) || currentVolumes.length === 0) {
      return { hasUnread: false, firstChapterId: null, progress: 0, isComplete: false };
    }
  
    let totalPages = 0;
    let readPages = 0;
    let firstUnreadChapterId = null;
    let firstChapterId = null;
  
    // Loop through volumes and chapters to find reading status
    for (const volume of currentVolumes) {
      if (!volume.chapters || !Array.isArray(volume.chapters)) continue;
      
      for (const chapter of volume.chapters) {
        if (!chapter || typeof chapter.id === 'undefined') continue;
        
        // Track the very first chapter for fallback
        if (firstChapterId === null) {
          firstChapterId = chapter.id;
        }
        
        // Sum up pages
        const chapterPages = typeof chapter.pages === 'number' ? chapter.pages : 0;
        const chapterPagesRead = typeof chapter.pagesRead === 'number' ? Math.min(chapter.pagesRead, chapterPages) : 0;
        
        totalPages += chapterPages;
        readPages += chapterPagesRead;
        
        // Find first unread or in-progress chapter
        if (chapterPagesRead < chapterPages && firstUnreadChapterId === null) {
          firstUnreadChapterId = chapter.id;
        }
      }
    }
    
    // Calculate overall progress percentage
    const progress = totalPages > 0 ? Math.round((readPages / totalPages) * 100) : 0;
    
    return {
      hasUnread: firstUnreadChapterId !== null,
      firstChapterId: firstChapterId,
      firstUnreadChapterId: firstUnreadChapterId,
      progress: progress,
      isComplete: totalPages > 0 && readPages === totalPages,
    };
  };

  // Function to prepare normalized chapter data
  const prepareChaptersList = () => {
    if (!currentVolumes || !Array.isArray(currentVolumes) || currentVolumes.length === 0) {
      return [];
    }
  
    // Sort volumes by number to ensure correct order
    const sortedVolumes = [...currentVolumes].sort((a, b) => {
      return a.number - b.number;
    });
    
    // Extract all chapters and normalize their data
    const allChapters: Array<{
      id: number;
      volumeId: number;
      volumeNumber: number;
      volumeName: string;
      chapterNumber: number;
      title: string;
      pages: number;
      pagesRead: number;
      created: string;
      coverImage: string;
    }> = [];
    
    sortedVolumes.forEach(volume => {
      if (!volume.chapters || !Array.isArray(volume.chapters)) return;
      
      volume.chapters.forEach((chapter, index) => {
        if (!chapter || typeof chapter.id === 'undefined') return;
        
        // For chapters with invalid titles, create proper titles based on volume
        const isInvalidTitle = 
          !chapter.title || 
          chapter.title === '-100000' || 
          chapter.title.trim() === '';
        
        // Create normalized chapter data
        allChapters.push({
          id: chapter.id,
          volumeId: volume.id,
          volumeNumber: volume.number,
          volumeName: volume.name || `Volume ${volume.number}`,
          chapterNumber: index + 1,
          title: isInvalidTitle ? `Volume ${volume.number} - Chapter ${index + 1}` : chapter.title,
          pages: typeof chapter.pages === 'number' ? chapter.pages : 0,
          pagesRead: typeof chapter.pagesRead === 'number' ? chapter.pagesRead : 0,
          created: chapter.created || volume.created,
          coverImage: chapter.coverImage || volume.coverImage
        });
      });
    });
    
    return allChapters;
  };

  // Format page progress
  const formatProgress = (read: number, total: number): string => {
    // Validate inputs to prevent negative or NaN values
    const validRead = typeof read === 'number' && !isNaN(read) && read >= 0 ? read : 0;
    const validTotal = typeof total === 'number' && !isNaN(total) && total >= 0 ? total : 0;
    
    return `${validRead} / ${validTotal} pages`;
  };

  // Render a volume item in the horizontal list
  const renderVolumeItem = ({ item }: { item: Volume }) => (
    <TouchableOpacity 
      style={[
        styles.volumeItem, 
        selectedVolumeId === item.id && styles.selectedVolumeItem
      ]}
      onPress={() => setSelectedVolumeId(item.id)}
    >
      <View style={styles.volumeImageContainer}>
        <Image 
          source={{ uri: getVolumeCoverUrl(item.id) }}
          style={styles.volumeImage}
          resizeMode="cover"
        />
      </View>
      <ThemedText 
        style={[
          styles.volumeNumber, 
          selectedVolumeId === item.id && { color: tintColor }
        ]}
      >
        {item.name || `Volume ${item.number}`}
      </ThemedText>
    </TouchableOpacity>
  );

  // Render chapters section
  const renderChaptersSection = () => {
    const allChapters = prepareChaptersList();
    
    if (allChapters.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.sectionContainer}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Chapters
        </ThemedText>
        <View style={styles.chaptersContainer}>
          {allChapters.map((chapter, index) => {
            const isCompleted = chapter.pages > 0 && chapter.pagesRead >= chapter.pages;
            
            return (
              <TouchableOpacity 
                key={chapter.id}
                style={[
                  styles.chapterItem,
                  index === 0 && styles.firstChapterItem,
                  index === allChapters.length - 1 && styles.lastChapterItem,
                  isCompleted && styles.completedChapterItem
                ]}
                onPress={() => handleReadChapter(chapter.id)}
              >
                <View style={styles.chapterInfo}>
                  <View style={styles.chapterTitleRow}>
                    <ThemedText type="defaultSemiBold" style={styles.chapterTitle}>
                      {chapter.title}
                    </ThemedText>
                    {isCompleted && (
                      <IconSymbol 
                        name="checkmark.circle.fill" 
                        size={16} 
                        color={tintColor} 
                        style={styles.completedIcon}
                      />
                    )}
                  </View>
                  <View style={styles.chapterDetails}>
                    <ThemedText style={[styles.chapterDate, styles.volumeBadge]}>
                      Vol. {chapter.volumeNumber}
                    </ThemedText>
                    <ThemedText style={styles.chapterPages}>
                      {formatProgress(chapter.pagesRead, chapter.pages)}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol 
                  name="chevron.right" 
                  size={20} 
                  color={iconColor}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Helper for rendering content based on loading state
  const renderContent = () => {
    if (isLoadingSeries) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading series details...</ThemedText>
        </View>
      );
    }

    if (seriesError) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{seriesError}</ThemedText>
        </View>
      );
    }

    if (!currentSeries) {
      return (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Series not found</ThemedText>
        </View>
      );
    }

    return (
      <>
        {/* Series Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: getSeriesCoverUrl(seriesId) }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <BlurView intensity={100} style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image 
              source={{ uri: getSeriesCoverUrl(seriesId) }}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <View style={styles.heroInfo}>
              <ThemedText type="title" style={styles.seriesTitle}>
                {currentSeries.name}
              </ThemedText>
              {currentSeries.originalName && (
                <ThemedText style={styles.originalName}>
                  {currentSeries.originalName}
                </ThemedText>
              )}
              <ThemedText style={styles.libraryName}>
                {currentSeries.libraryName}
              </ThemedText>

              {/* Reading Progress Indicator */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${getReadingStatus().progress}%`,
                        backgroundColor: tintColor,
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.progressText}>
                  {getReadingStatus().progress}% Complete
                </ThemedText>
              </View>

              {/* Continue Reading Button */}
              <TouchableOpacity 
                style={[styles.continueButton, { backgroundColor: tintColor }]}
                onPress={() => {
                  const readingStatus = getReadingStatus();
                  
                  if (readingStatus.hasUnread) {
                    handleReadChapter(readingStatus.firstUnreadChapterId);
                  } else if (readingStatus.firstChapterId) {
                    handleReadChapter(readingStatus.firstChapterId);
                  }
                }}
              >
                <ThemedText style={styles.continueButtonText}>
                  {getReadingStatus().isComplete ? 'Read Again' : 'Continue Reading'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Series Description */}
        {currentSeries.description && (
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Description
            </ThemedText>
            <ThemedText style={styles.description}>
              {currentSeries.description}
            </ThemedText>
          </View>
        )}

        {/* Volume Selector */}
        {currentVolumes && currentVolumes.length > 0 && (
          <View style={styles.sectionContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Volumes
            </ThemedText>
            <FlatList
              data={currentVolumes}
              renderItem={renderVolumeItem}
              keyExtractor={(item) => item?.id ? item.id.toString() : `volume-${Math.random()}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.volumeList}
            />
          </View>
        )}

        {/* Chapters List - updated version */}
        {renderChaptersSection()}
      </>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          title: currentSeries?.name || 'Series Details',
          headerTitleStyle: { fontSize: 16 },
          headerBackTitle: 'Library',
        }} 
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 300,
  },
  errorText: {
    color: '#e11d48',
  },
  // Hero section styles
  heroContainer: {
    position: 'relative',
    height: 320,
    overflow: 'hidden',
  },
  coverImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  heroContent: {
    flexDirection: 'row',
    padding: 16,
    position: 'relative',
    height: '100%',
    alignItems: 'center',
  },
  heroImage: {
    width: 160,
    height: 240,
    borderRadius: 8,
    marginRight: 16,
  },
  heroInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  seriesTitle: {
    fontSize: 24,
    marginBottom: 4,
    color: 'white',
  },
  originalName: {
    marginBottom: 8,
    color: 'white',
    opacity: 0.9,
  },
  libraryName: {
    marginBottom: 16,
    color: 'white',
    opacity: 0.7,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    fontWeight: 'bold',
    color: 'white',
  },
  // Section styles
  sectionContainer: {
    padding: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  description: {
    lineHeight: 22,
  },
  // Volume list styles
  volumeList: {
    paddingVertical: 8,
  },
  volumeItem: {
    marginRight: 16,
    width: 100,
    alignItems: 'center',
  },
  selectedVolumeItem: {
    opacity: 1,
  },
  volumeImageContainer: {
    width: 100,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  volumeImage: {
    width: '100%',
    height: '100%',
  },
  volumeNumber: {
    textAlign: 'center',
    fontSize: 14,
  },
  // Chapter list styles
  chaptersContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  firstChapterItem: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lastChapterItem: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  completedChapterItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },
  chapterInfo: {
    flex: 1,
    marginRight: 8,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chapterTitle: {
    marginBottom: 4,
  },
  completedIcon: {
    marginLeft: 8,
  },
  chapterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterDate: {
    fontSize: 14,
    opacity: 0.6,
  },
  chapterPages: {
    fontSize: 14,
    opacity: 0.6,
  },
  volumeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    overflow: 'hidden',
  },
});