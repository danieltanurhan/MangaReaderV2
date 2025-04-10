import React, { useEffect } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useMangaStore } from '@/store/mangaStore';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import MangaCard from '@/components/manga/MangaCard';
import LoadingIndicator from '@/components/ui/LoadingIndicator';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function HomeScreen() {
  const { series, isLoading, error, fetchAllSeries } = useMangaStore();

  // Load series on component mount
  useEffect(() => {
    fetchAllSeries();
  }, []);

  // Handle refresh action
  const handleRefresh = () => {
    fetchAllSeries();
  };

  // Render loading state
  if (isLoading && series.length === 0) {
    return <LoadingIndicator message="Loading your manga library..." />;
  }

  // Render error state
  if (error && series.length === 0) {
    return <ErrorMessage message={error} onRetry={handleRefresh} />;
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={series}
        renderItem={({ item }) => <MangaCard series={item} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>
            No manga found in your library
          </ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.6,
  },
});