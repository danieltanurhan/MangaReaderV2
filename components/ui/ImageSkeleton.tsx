import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

interface ImageSkeletonProps {
  width: number;
  height: number;
  color: string;
}

export default function ImageSkeleton({ width, height, color }: ImageSkeletonProps) {
  return (
    <View style={[styles.skeleton, { width, height, backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});