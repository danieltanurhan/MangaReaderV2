import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl: string;
  unreadCount?: number;
  onPress?: () => void;
}

// Calculate width based on screen size (2 columns with padding)
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2; // 2 columns with 12px padding on sides and 12px between cards
const CARD_HEIGHT = CARD_WIDTH * 1.5; // 2:3 aspect ratio common for manga covers

export function MangaCard({ id, title, coverUrl, unreadCount, onPress }: MangaCardProps) {
  const router = useRouter();
  const cardBgColor = useThemeColor({}, 'background');
  const shadowColor = useThemeColor({}, 'text');
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Update the navigation route to match the new location
      router.push(`/(main)/series/${id}`);
    }
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: cardBgColor,
          shadowColor: shadowColor,
        }
      ]}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: coverUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        {unreadCount !== undefined && unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
            </View>
          </View>
        )}
      </View>
      <View style={styles.titleContainer}>
        <ThemedText 
          numberOfLines={2} 
          style={styles.title}
        >
          {title}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  badge: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
});