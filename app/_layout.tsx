import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSession } from '@/hooks/useSession';

function WithInsetsContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.safeArea]} edges={['top', 'left', 'right']}>
      {/* Apply extra top padding for Android devices with odd cutouts if needed */}
      <View style={{ flex: 1, paddingTop: 0 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  useFrameworkReady();
  
  const session = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Mark navigation as ready after first render
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for navigation to be ready and session to be determined
    if (!isNavigationReady || session === undefined) return;
    
    const inAuth = segments[0] === 'login';
    
    if (!session && !inAuth) {
      // User is not signed in and not on login page, redirect to login
      router.replace('/login');
    } else if (session && inAuth) {
      // User is signed in but on login page, redirect to home
      router.replace('/');
    }
  }, [session, segments, isNavigationReady]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" translucent={false} backgroundColor="#ffffff" />
      <WithInsetsContainer>
        <Stack 
          screenOptions={{
            headerTransparent: false,
            // Make sure Router doesn't add extra space on top:
            contentStyle: { backgroundColor: '#ffffff', paddingTop: 0 },
            headerStyle: { backgroundColor: '#ffffff' },
            headerTitleStyle: { color: '#111827' }, // slate-900
            headerTintColor: '#111827',
            headerShown: false,
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </WithInsetsContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
