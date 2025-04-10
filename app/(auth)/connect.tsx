import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Linking, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { BookOpen, ExternalLink } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ConnectScreen() {
  const router = useRouter();
  const [odpsUrl, setOdpsUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  
  const { 
    connectWithOdpsUrl, 
    isAuthenticated, 
    isLoading, 
    error, 
    serverInfo,
    clearError
  } = useAuthStore();
  
  const iconColor = useThemeColor({}, 'text');
  const linkColor = useThemeColor({}, 'tint');

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, []);

  useEffect(() => {
    // If authenticated, redirect to home
    if (isAuthenticated) {
      router.replace('/(main)/home');
    }
  }, [isAuthenticated]);

  const validateUrl = (): boolean => {
    // Reset previous errors
    setUrlError('');
    
    // Check ODPS URL is provided
    if (!odpsUrl.trim()) {
      setUrlError('ODPS URL is required');
      return false;
    }
    
    return true;
  };

  const handleConnect = async () => {
    if (!validateUrl()) {
      return;
    }

    const success = await connectWithOdpsUrl(odpsUrl);
    
    if (success) {
      router.replace('/(main)/home');
    }
  };

  const handleOpenHelpLink = () => {
    Linking.openURL('https://wiki.kavitareader.com/guides/api/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView>
        <ThemedView style={styles.container}>
          <View style={styles.logoContainer}>
            <BookOpen size={64} color={iconColor} />
            <ThemedText type="title" style={styles.title}>
              Kavita Reader
            </ThemedText>
          </View>
          
          <ThemedView style={styles.formContainer}>
            <ThemedText style={styles.description}>
              Connect to your Kavita server by entering your ODPS URL
            </ThemedText>
            
            <ThemedText style={styles.helpText}>
              Paste the ODPS URL from your Kavita user dashboard (/preferences#clients)
            </ThemedText>
            
            {/* ODPS URL Input */}
            <Input
              label="ODPS URL"
              placeholder="https://your-server.com/api/opds/...."
              value={odpsUrl}
              onChangeText={setOdpsUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              fullWidth
              error={urlError}
            />
            
            <ThemedText style={styles.helpText}>
              <ThemedText 
                onPress={handleOpenHelpLink} 
                style={[styles.link, {color: linkColor}]}>
                Need help finding your ODPS URL?
                <ExternalLink size={14} color={linkColor} style={styles.linkIcon} />
              </ThemedText>
            </ThemedText>
            
            {error && (
              <ThemedText style={styles.errorText}>
                {error}
              </ThemedText>
            )}
            
            <Button
              title="Connect"
              onPress={handleConnect}
              isLoading={isLoading}
              fullWidth
            />
            
            {Platform.OS === 'web' && (
              <ThemedText style={styles.proxyNote}>
                Note: Web connections require the proxy server to be running.
              </ThemedText>
            )}
            
            {serverInfo && (
              <ThemedView style={styles.serverInfo}>
                <ThemedText type="defaultSemiBold">Connected to:</ThemedText>
                <ThemedText>{serverInfo.name} (v{serverInfo.version})</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 48,
  },
  title: {
    marginTop: 16,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
  },
  helpText: {
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  link: {
    fontWeight: '600',
  },
  linkIcon: {
    marginLeft: 4,
  },
  errorText: {
    color: '#e11d48',
    marginBottom: 16,
  },
  proxyNote: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  serverInfo: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
});