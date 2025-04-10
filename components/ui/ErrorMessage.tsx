import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

/**
 * A reusable error message component with optional retry button
 * Can be used as a full screen error or inline
 */
export default function ErrorMessage({ 
  message, 
  onRetry, 
  fullScreen = true 
}: ErrorMessageProps) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme].tint;
  const errorColor = '#e11d48'; // Custom error color

  return (
    <ThemedView style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color={errorColor} 
        />
      </View>

      <ThemedText style={[styles.message, { color: errorColor }]}>
        {message}
      </ThemedText>
      
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { borderColor: tintColor }]} 
          onPress={onRetry}
        >
          <Ionicons 
            name="refresh-outline" 
            size={20} 
            color={tintColor} 
            style={styles.retryIcon}
          />
          <ThemedText style={{ color: tintColor }}>
            Try Again
          </ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  fullScreen: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  message: {
    marginBottom: 24,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryIcon: {
    marginRight: 8,
  },
});