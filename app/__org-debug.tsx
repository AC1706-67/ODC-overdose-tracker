import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useOrg } from '@/src/context/OrgContext';
import { canUseOutreach } from '@/src/lib/featureAccess';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function OrgDebugScreen() {
  const { activeOrg, activeOrgId, loading } = useOrg();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const outreachEnabled = canUseOutreach(activeOrg);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setDebugInfo({ error: 'Not authenticated' });
        return;
      }

      // Get user organizations
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('*, organizations(*)')
        .eq('user_id', user.id);

      // Get all organizations
      const { data: allOrgs, error: allOrgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, is_active')
        .order('name');

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email,
        },
        userOrgs: userOrgs || [],
        userOrgsError,
        allOrgs: allOrgs || [],
        allOrgsError,
        activeOrg,
        activeOrgId,
        loading,
        outreachEnabled,
      });
    } catch (error: any) {
      setDebugInfo({ error: error.message });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Organization Debug Info</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Context State</Text>
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{loading ? 'true' : 'false'}</Text>
        
        <Text style={styles.label}>Active Org ID:</Text>
        <Text style={styles.value}>{activeOrgId || 'null'}</Text>
        
        <Text style={styles.label}>Active Org:</Text>
        <Text style={styles.value}>{JSON.stringify(activeOrg, null, 2)}</Text>
        
        <Text style={styles.label}>Outreach Enabled:</Text>
        <Text style={[styles.value, outreachEnabled ? styles.success : styles.error]}>
          {outreachEnabled ? 'YES ✅' : 'NO ❌'}
        </Text>
      </View>

      {debugInfo && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current User</Text>
            <Text style={styles.value}>{JSON.stringify(debugInfo.user, null, 2)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Organizations ({debugInfo.userOrgs?.length || 0})</Text>
            {debugInfo.userOrgsError && (
              <Text style={styles.error}>Error: {JSON.stringify(debugInfo.userOrgsError)}</Text>
            )}
            {debugInfo.userOrgs?.length === 0 && (
              <Text style={styles.warning}>⚠️ User has NO organization memberships!</Text>
            )}
            {debugInfo.userOrgs?.map((uo: any, idx: number) => (
              <View key={idx} style={styles.orgCard}>
                <Text style={styles.orgName}>{uo.organizations?.name || 'Unknown'}</Text>
                <Text style={styles.detail}>ID: {uo.organization_id}</Text>
                <Text style={styles.detail}>Role: {uo.role}</Text>
                <Text style={styles.detail}>Active: {uo.is_active ? 'Yes' : 'No'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Organizations ({debugInfo.allOrgs?.length || 0})</Text>
            {debugInfo.allOrgsError && (
              <Text style={styles.error}>Error: {JSON.stringify(debugInfo.allOrgsError)}</Text>
            )}
            {debugInfo.allOrgs?.map((org: any, idx: number) => (
              <View key={idx} style={styles.orgCard}>
                <Text style={styles.orgName}>{org.name}</Text>
                <Text style={styles.detail}>Slug: {org.slug}</Text>
                <Text style={styles.detail}>ID: {org.id}</Text>
                <Text style={styles.detail}>Active: {org.is_active ? 'Yes' : 'No'}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            {debugInfo.userOrgs?.length === 0 ? (
              <Text style={styles.warning}>
                ❌ User has no organization memberships.{'\n\n'}
                Run this SQL in Supabase:{'\n\n'}
                INSERT INTO user_organizations (user_id, organization_id, role, is_active){'\n'}
                VALUES ('{debugInfo.user?.id}', 'org-id-here', 'Responder', true);
              </Text>
            ) : debugInfo.userOrgs?.filter((uo: any) => uo.is_active).length === 0 ? (
              <Text style={styles.warning}>
                ⚠️ User has organizations but none are active.{'\n\n'}
                Run this SQL:{'\n\n'}
                UPDATE user_organizations{'\n'}
                SET is_active = true{'\n'}
                WHERE user_id = '{debugInfo.user?.id}';
              </Text>
            ) : (
              <Text style={styles.success}>
                ✅ User has active organization membership.{'\n\n'}
                If Outreach tab still not showing:{'\n'}
                1. Rebuild the app{'\n'}
                2. Clear app data{'\n'}
                3. Check console logs for errors
              </Text>
            )}
          </View>
        </>
      )}

      <TouchableOpacity onPress={loadDebugInfo} style={styles.refreshButton}>
        <Text style={styles.refreshText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#2563eb',
    fontSize: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  success: {
    color: '#059669',
    fontWeight: 'bold',
  },
  error: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  warning: {
    color: '#d97706',
    fontSize: 14,
    lineHeight: 20,
  },
  orgCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detail: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
