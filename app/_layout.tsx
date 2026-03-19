import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { OrgProvider, useOrg } from '@/src/context/OrgContext';

function WithInsetsContainer({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={[styles.safeArea]} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, paddingTop: 0 }}>{children}</View>
    </SafeAreaView>
  );
}

function NavigationController() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const session = useSession();
  const { status: orgStatus, loading: orgLoading } = useOrg();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user_type from profile when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setUserType(null);
      return;
    }

    supabase
      .from('profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setUserType(data?.user_type ?? 'organization');
        console.log('[Navigation] user_type:', data?.user_type);
      });
  }, [session?.user?.id]);

  useEffect(() => {
    // Wait for navigation to be ready, session to be determined, and org to load
    if (!isNavigationReady || session === undefined || orgLoading) return;

    // If logged in, wait for userType to be fetched before routing
    if (session && userType === null) return;

    const inAuth =
      segments[0] === 'login' ||
      segments[0] === 'signup' ||
      segments[0] === 'user-type';
    const inOnboarding = segments[0] === 'onboarding';
    const inPublicRoute =
      segments[0] === 'request-organization' || segments[0] === 'legal';

    console.log(
      '[Navigation] session:',
      !!session,
      'userType:',
      userType,
      'orgStatus:',
      orgStatus,
      'segments:',
      segments[0],
    );

    // Not logged in → go to login (unless on auth or public route)
    if (!session && !inAuth && !inPublicRoute) {
      console.log('[Navigation] No session, redirecting to login');
      router.replace('/login');
      return;
    }

    // Logged in but on auth screen → route based on user type
    if (session && inAuth) {
      if (userType === 'individual') {
        console.log('[Navigation] Individual user, going to tabs');
        router.replace('/(tabs)');
      } else if (orgStatus === 'no-org' || orgStatus === 'error') {
        console.log('[Navigation] Org user, no org, going to onboarding');
        router.replace('/onboarding');
      } else if (orgStatus === 'ready' || orgStatus === 'skipped') {
        console.log('[Navigation] Org user with org, going to tabs');
        router.replace('/(tabs)');
      }
      return;
    }

    // Logged in, org user, no org, not in onboarding → go to onboarding
    if (
      session &&
      userType === 'organization' &&
      (orgStatus === 'no-org' || orgStatus === 'error') &&
      !inOnboarding
    ) {
      console.log('[Navigation] Org user needs org, redirecting to onboarding');
      router.replace('/onboarding');
      return;
    }

    // Logged in, individual user, stuck in onboarding → go to tabs
    if (session && userType === 'individual' && inOnboarding) {
      console.log('[Navigation] Individual user in onboarding, going to tabs');
      router.replace('/(tabs)');
      return;
    }

    // Logged in, has org or skipped, in onboarding → go to tabs
    if (
      session &&
      (orgStatus === 'ready' || orgStatus === 'skipped') &&
      inOnboarding
    ) {
      console.log('[Navigation] User has org or skipped, leaving onboarding');
      router.replace('/(tabs)');
      return;
    }
  }, [session, userType, orgStatus, orgLoading, segments, isNavigationReady]);

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
            <Stack.Screen name="user-type" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="request-organization" options={{ headerShown: false }} />
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
