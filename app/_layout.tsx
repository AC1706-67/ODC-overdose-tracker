import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSession } from '@/hooks/useSession';

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
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
