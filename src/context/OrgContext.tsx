import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  outreach_enabled?: boolean;
  org_type?: 'full' | 'incident_only';
  features?: Record<string, any>;
}

export type OrgStatus = 'loading' | 'no-org' | 'ready' | 'error' | 'skipped';

interface OrgContextType {
  activeOrgId: string | null;
  activeOrg: Organization | null;
  loading: boolean;
  status: OrgStatus;
  setActiveOrgId: (id: string) => Promise<void>;
  clearActiveOrg: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrgStatus>('loading');

  useEffect(() => {
    // Load user's organization on app start AND when auth state changes
    const loadUserOrg = async () => {
      try {
        // Check if user has skipped onboarding
        const hasSkipped = await AsyncStorage.getItem('onboardingSkipped');
        if (hasSkipped === 'true') {
          console.log('[OrgContext] User has skipped onboarding');
          setStatus('skipped');
          setLoading(false);
          return;
        }

        // First, try to get the user's organization from user_organizations
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          console.log('[OrgContext] Loading org for user:', user.id);

          // Get user's organization memberships (may be multiple)
          const { data: memberships, error: membershipError } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('is_active', true);

          console.log(
            '[OrgContext] Membership result:',
            JSON.stringify({ memberships, error: membershipError }),
          );

          // Handle membership error
          if (membershipError) {
            console.error(
              '[OrgContext] Error loading memberships:',
              membershipError,
            );
            setStatus('error');
            setLoading(false);
            return;
          }

          // Use first membership if available
          const membership =
            memberships && memberships.length > 0 ? memberships[0] : null;

          if (membership?.organization_id) {
            console.log(
              '[OrgContext] Found organization_id:',
              membership.organization_id,
            );

            // Now get the full organization data
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .select('id, slug, name, is_active, outreach_enabled, org_type')
              .eq('id', membership.organization_id)
              .single();

            console.log(
              '[OrgContext] Organization result:',
              JSON.stringify({ org, error: orgError }),
            );

            if (org) {
              console.log(
                '[OrgContext] ✅ Successfully loaded org:',
                JSON.stringify(org),
              );
              setActiveOrg(org);
              setActiveOrgIdState(org.id);
              setStatus('ready');
              await AsyncStorage.setItem('activeOrgId', org.id);
              setLoading(false);
              return;
            } else {
              console.error('[OrgContext] ❌ Org is null, error:', orgError);
              setStatus('error');
            }
          } else {
            console.warn(
              '[OrgContext] ❌ No membership found - user needs to join an org',
            );
            setStatus('no-org');
            setLoading(false);
            return;
          }
        }

        // Fallback: try to load from saved org ID
        const saved = await AsyncStorage.getItem('activeOrgId');
        if (saved) {
          setActiveOrgIdState(saved);
          await loadOrgData(saved);
          setStatus('ready');
        } else {
          // No saved org and no user - set no-org status
          console.log('[OrgContext] No saved org and no user');
          setStatus('no-org');
        }
      } catch (error) {
        console.error('[OrgContext] Failed to load org:', error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };

    // Load org data immediately
    loadUserOrg();

    // Listen for auth state changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[OrgContext] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          // User just logged in - reload org data
          setLoading(true);
          await loadUserOrg();
        } else if (event === 'SIGNED_OUT') {
          // User logged out - clear org data
          console.log('[OrgContext] User signed out, clearing org data');
          setActiveOrg(null);
          setActiveOrgIdState(null);
          setStatus('no-org');
          setLoading(false);
        }
      },
    );

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadOrgData = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, slug, name, is_active, outreach_enabled, org_type')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      setActiveOrg(data);
    } catch (error) {
      console.warn('Failed to load org data:', error);
      setActiveOrg(null);
    }
  };

  const setActiveOrgId = async (id: string) => {
    try {
      await AsyncStorage.setItem('activeOrgId', id);
      await AsyncStorage.removeItem('onboardingSkipped'); // Clear skip flag when joining org
      setActiveOrgIdState(id);
      await loadOrgData(id);
      setStatus('ready');
    } catch (error) {
      console.warn('Failed to save org:', error);
      setActiveOrgIdState(id); // Still set in memory
      setStatus('ready');
    }
  };

  const clearActiveOrg = async () => {
    try {
      await AsyncStorage.removeItem('activeOrgId');
      setActiveOrgIdState(null);
      setActiveOrg(null);
    } catch (error) {
      console.warn('Failed to clear org:', error);
      setActiveOrgIdState(null); // Still clear in memory
      setActiveOrg(null);
    }
  };

  const skipOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingSkipped', 'true');
      setStatus('skipped');
      console.log('[OrgContext] User skipped onboarding');
    } catch (error) {
      console.warn('Failed to save skip preference:', error);
      setStatus('skipped'); // Still set in memory
    }
  };

  return (
    <OrgContext.Provider
      value={{
        activeOrgId,
        activeOrg,
        loading,
        status,
        setActiveOrgId,
        clearActiveOrg,
        skipOnboarding,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}
