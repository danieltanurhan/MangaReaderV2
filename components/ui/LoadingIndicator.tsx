import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * A reusable loading indicator component with optional message
 * Can be used as a full screen loader or inline
 */
export default function LoadingIndicator({ 
  message = 'Loading...', 
  fullScreen = true 
}: LoadingIndicatorProps) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme].tint;

  return (
    <ThemedView style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={tintColor} />
      {message && (
        <ThemedText style={styles.message}>
          {message}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  fullScreen: {
    flex: 1,
    padding: 0,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});