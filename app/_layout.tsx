import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSession } from '@/hooks/useSession';
import { OrgProvider, useOrg } from '@/src/context/OrgContext';

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

function NavigationController() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const session = useSession();
  const { status: orgStatus, loading: orgLoading } = useOrg();
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
    if (!isNavigationReady || session === undefined || orgLoading) return;
    
    const inAuth = segments[0] === 'login' || segments[0] === 'signup';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    
    console.log('[Navigation] session:', !!session, 'orgStatus:', orgStatus, 'segments:', segments[0]);
    
    // Not logged in → go to login
    if (!session && !inAuth) {
      console.log('[Navigation] No session, redirecting to login');
      router.replace('/login');
      return;
    }
    
    // Logged in but on auth screen → go to appropriate place
    if (session && inAuth) {
      if (orgStatus === 'no-org' || orgStatus === 'error') {
        console.log('[Navigation] Logged in, no org, redirecting to onboarding');
        router.replace('/onboarding');
      } else if (orgStatus === 'ready') {
        console.log('[Navigation] Logged in with org, redirecting to tabs');
        router.replace('/(tabs)');
      }
      return;
    }
    
    // Logged in, no org, not in onboarding → go to onboarding
    if (session && (orgStatus === 'no-org' || orgStatus === 'error') && !inOnboarding) {
      console.log('[Navigation] User needs org, redirecting to onboarding');
      router.replace('/onboarding');
      return;
    }
    
    // Logged in, has org, in onboarding → go to tabs
    if (session && orgStatus === 'ready' && inOnboarding) {
      console.log('[Navigation] User has org, leaving onboarding');
      router.replace('/(tabs)');
      return;
    }
  }, [session, orgStatus, orgLoading, segments, isNavigationReady]);

  return null;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <OrgProvider>
      <SafeAreaProvider>
        <StatusBar style="dark" translucent={false} backgroundColor="#ffffff" />
        <WithInsetsContainer>
          <NavigationController />
          <Stack 
            screenOptions={{
              headerTransparent: false,
              contentStyle: { backgroundColor: '#ffffff', paddingTop: 0 },
              headerStyle: { backgroundColor: '#ffffff' },
              headerTitleStyle: { color: '#111827' },
              headerTintColor: '#111827',
              headerShown: false,
            }}
          >
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </WithInsetsContainer>
      </SafeAreaProvider>
    </OrgProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
