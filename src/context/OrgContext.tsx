import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  outreach_enabled?: boolean;
  features?: Record<string, any>;
}

interface OrgContextType {
  activeOrgId: string | null;
  activeOrg: Organization | null;
  loading: boolean;
  setActiveOrgId: (id: string) => Promise<void>;
  clearActiveOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user's organization on app start
    (async () => {
      try {
        // First, try to get the user's organization from user_organizations
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          console.log('[OrgContext] Loading org for user:', user.id);
          
          // Get user's organization membership
          const { data: membership, error: membershipError } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

          console.log('[OrgContext] Membership result:', JSON.stringify({ membership, error: membershipError }));

          if (membership?.organization_id) {
            console.log('[OrgContext] Found organization_id:', membership.organization_id);
            
            // Now get the full organization data
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .select('id, slug, name, is_active')
              .eq('id', membership.organization_id)
              .single();

            console.log('[OrgContext] Organization result:', JSON.stringify({ org, error: orgError }));

            if (org) {
              console.log('[OrgContext] ✅ Successfully loaded org:', JSON.stringify(org));
              setActiveOrg(org);
              setActiveOrgIdState(org.id);
              await AsyncStorage.setItem('activeOrgId', org.id);
              setLoading(false);
              return;
            } else {
              console.error('[OrgContext] ❌ Org is null, error:', orgError);
            }
          } else {
            console.warn('[OrgContext] ❌ No membership found or no organization_id');
          }
        }

        // Fallback: try to load from saved org ID
        const saved = await AsyncStorage.getItem('activeOrgId');
        if (saved) {
          setActiveOrgIdState(saved);
          await loadOrgData(saved);
        }
      } catch (error) {
        console.warn('Failed to load org:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadOrgData = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, slug, name, is_active')
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
      setActiveOrgIdState(id);
      await loadOrgData(id);
    } catch (error) {
      console.warn('Failed to save org:', error);
      setActiveOrgIdState(id); // Still set in memory
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

  return (
    <OrgContext.Provider value={{ activeOrgId, activeOrg, loading, setActiveOrgId, clearActiveOrg }}>
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