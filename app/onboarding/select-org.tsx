import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import type { Organization } from '@/types/organization';
import { useOrg } from '@/src/context/OrgContext';

export default function SelectOrgScreen() {
  const { setActiveOrgId } = useOrg();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_certified', true)
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (orgId: string) => {
    setJoining(orgId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .single();

      if (existing) {
        Alert.alert('Already a Member', 'You are already a member of this organization');
        router.replace('/(tabs)');
        return;
      }

      // Join as Responder
      const { error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: orgId,
          role: 'Responder',
        });

      if (error) throw error;

      // Set the active org in context
      await setActiveOrgId(orgId);

      Alert.alert('Success!', 'You have joined the organization', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error joining organization:', error);
      Alert.alert('Error', 'Failed to join organization');
    } finally {
      setJoining(null);
    }
  };

  const renderOrganization = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={styles.orgCard}
      onPress={() => handleJoinOrg(item.id)}
      disabled={joining !== null}
    >
      <View style={styles.orgInfo}>
        <Text style={styles.orgName}>{item.name}</Text>
        {item.city && item.state && (
          <Text style={styles.orgLocation}>{item.city}, {item.state}</Text>
        )}
        {item.description && (
          <Text style={styles.orgDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.orgType}>{item.type}</Text>
      </View>
      {joining === item.id ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Organization</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : organizations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No certified organizations available</Text>
        </View>
      ) : (
        <FlatList
          data={organizations}
          renderItem={renderOrganization}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  list: {
    padding: 16,
  },
  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  orgLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orgDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orgType: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
