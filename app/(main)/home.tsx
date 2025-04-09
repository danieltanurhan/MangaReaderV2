import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, RefreshControl, View, Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useAuthStore } from '@/store/authStore';
import { useMangaStore } from '@/store/mangaStore';
import { useRouter } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MangaCard } from '@/components/manga/MangaCard';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { serverInfo, isAuthenticated } = useAuthStore();
  const { series, isLoading, error, fetchAllSeries, getSeriesCoverUrl } = useMangaStore();
  
  // Extract all theme colors at the component's top level
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textMutedColor = useThemeColor({}, 'textMuted');

  // Load manga series when component mounts
  useEffect(() => {
    fetchAllSeries();
  }, []);

    // Redirect if not authenticated
    useEffect(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/connect');
      }
    }, [isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllSeries();
    setIsRefreshing(false);
  };

  // Safe render item function that checks for valid data
  const renderItem = ({ item }) => {
    // Skip rendering if item is invalid
    if (!item || typeof item.id === 'undefined') {
      console.log(`Invalid item: ${JSON.stringify(item)}`);
      return null;
    }
    
    return (
      <MangaCard
        id={String(item.id)} // Convert to string safely
        title={item.name || 'Unknown Title'}
        coverUrl={item.id ? getSeriesCoverUrl(item.id) : ''}
        onPress={() => console.log(`Pressed manga: ${item.name || 'Unknown'}`)}
      />
    );
  };

  // Safe keyExtractor that handles undefined items
  const keyExtractor = (item, index) => {
    return item && item.id ? String(item.id) : `item-${index}`;
  };

  // Filter out invalid items
  const validSeries = Array.isArray(series) ? 
    series.filter(item => item && typeof item.id !== 'undefined') : 
    [];

  const renderContent = () => {
    if (isLoading && !isRefreshing) {
      return (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading your library...</ThemedText>
        </ThemedView>
      );
    }

    return (
      <FlatList
        data={validSeries}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <IconSymbol name="house.fill" size={24} color={textColor} />
              <ThemedText type="subtitle" style={styles.headerTitle}>My Library</ThemedText>
            </View>
            {serverInfo && (
              <ThemedText style={styles.serverName}>
                {serverInfo.name}
              </ThemedText>
            )}
            {error && (
              <ThemedText style={styles.errorText}>
                {error}
              </ThemedText>
            )}
          </View>
        }
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <IconSymbol 
              name="house.fill" 
              size={40} 
              color={textMutedColor}
              style={styles.emptyIcon}
            />
            <ThemedText style={styles.emptyText}>
              {error ? 'Failed to load manga' : 'No manga found in your library'}
            </ThemedText>
          </ThemedView>
        }
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  grid: {
    padding: 12,
    paddingBottom: 80, // Add extra padding at bottom for navigation bar
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 8,
  },
  serverName: {
    marginTop: 4,
    opacity: 0.6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height * 0.5,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  errorText: {
    color: '#e11d48',
    marginTop: 8,
  }
});