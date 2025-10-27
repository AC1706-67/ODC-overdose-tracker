import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { useOrg } from '@/src/context/OrgContext';

export default function SelectOrg() {
  const { setActiveOrgId } = useOrg();
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_organizations')
        .select('organization_id, organizations(name)')
        .eq('user_id', user.id);

      if (!error && data) {
        const orgList = data.map((r: any) => ({
          id: r.organization_id,
          name: r.organizations?.name || 'Organization'
        }));
        setOrgs(orgList);
        
        // Auto-select if only one org
        if (orgList.length === 1) {
          await setActiveOrgId(orgList[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading organizations...</Text>
      </View>
    );
  }

  if (orgs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Organizations</Text>
        <Text style={styles.subtitle}>You're not a member of any organizations yet.</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setActiveOrgId(null)}
        >
          <Text style={styles.buttonText}>Continue as Anonymous</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Organization</Text>
      {orgs.map((org) => (
        <TouchableOpacity
          key={org.id}
          style={styles.orgButton}
          onPress={() => setActiveOrgId(org.id)}
        >
          <Text style={styles.orgButtonText}>{org.name}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity 
        style={[styles.button, styles.anonymousButton]}
        onPress={() => setActiveOrgId(null)}
      >
        <Text style={styles.buttonText}>Continue as Anonymous</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  orgButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  orgButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  anonymousButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});