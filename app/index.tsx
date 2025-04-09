import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we decide where to navigate
        await SplashScreen.preventAutoHideAsync();
        
        // Wait a moment for authentication check to complete
        if (!isLoading) {
          // Hide the splash screen
          await SplashScreen.hideAsync();
          
          // Navigate based on auth state
          if (isAuthenticated) {
            router.replace('/(main)/home');
          } else {
            console.log('User is not authenticated, redirecting to connect screen');
            router.replace('/(auth)/connect');
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [isLoading, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>Kavita Manga Reader</Text>
      <ActivityIndicator size="large" />
    </View>
  );
}
