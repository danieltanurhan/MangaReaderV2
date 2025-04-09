import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

export default function MainLayout() {
  const { isAuthenticated, checkAuthentication } = useAuthStore();
  const router = useRouter();
  
  // Verify authentication when accessing main routes
  useEffect(() => {
    async function verifyAuth() {
      const authenticated = await checkAuthentication();
      if (!authenticated) {
        router.replace('/(auth)/connect');
      }
    }
    
    verifyAuth();
  }, []);
  
  return (
    <Stack>
      <Stack.Screen 
        name="(main)/home" 
        options={{ 
          title: "My Library",
          headerShown: true 
        }} 
      />
      {/* Add screen configuration for the series detail screen */}
      <Stack.Screen 
        name="(main)/series/[id]" 
        options={{ 
          headerShown: true,
          presentation: 'push' 
        }} 
      />
    </Stack>
  );
}