import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useOrg } from '@/src/context/OrgContext';
import { getJoinableCertifiedOrganizations, joinOrganization, getMyOrganizations } from '@/src/api/orgMembership';

type CertifiedOrg = {
  id: string;
  name: string;
  slug: string;
  type: string;
  city?: string;
  state?: string;
  description?: string;
  is_demo_organization?: boolean;
};

export default function SelectOrgScreen() {
  const { setActiveOrgId } = useOrg();
  const [organizations, setOrganizations] = useState<CertifiedOrg[]>([]);
  const [myOrgIds, setMyOrgIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load both joinable orgs and user's current memberships
      const [orgs, myOrgs] = await Promise.all([
        getJoinableCertifiedOrganizations(),
        getMyOrganizations()
      ]);
      
      setOrganizations(orgs);
      setMyOrgIds(new Set(myOrgs.map(m => m.organization_id)));
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', error.message || 'Something went wrong loading organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (orgId: string, orgName: string) => {
    setJoining(orgId);
    try {
      const isMember = myOrgIds.has(orgId);
      
      if (isMember) {
        // User is already a member, just set as active org
        console.log('[SelectOrg] User is already a member, setting as active org');
        await setActiveOrgId(orgId);
        
        Alert.alert('Success!', `Switched to ${orgName}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        // User is not a member, join the organization first
        console.log('[SelectOrg] User is not a member, joining organization');
        await joinOrganization(orgId, 'Responder');
        
        // Set as active org
        await setActiveOrgId(orgId);

        Alert.alert('Success!', `You have joined ${orgName}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error: any) {
      console.error('Error joining organization:', error);
      Alert.alert('Error', error.message || 'Failed to join organization');
    } finally {
      setJoining(null);
    }
  };

  const renderOrganization = ({ item }: { item: CertifiedOrg }) => {
    const isMember = myOrgIds.has(item.id);
    const isDemo = item.is_demo_organization === true;
    
    return (
      <View style={styles.orgCard}>
        <View style={styles.orgInfo}>
          <View style={styles.orgHeader}>
            <Text style={styles.orgName}>{item.name}</Text>
            {isDemo && (
              <View style={styles.demoBadge}>
                <Ionicons name="flask" size={12} color="#7c3aed" />
                <Text style={styles.demoText}>Demo</Text>
              </View>
            )}
            {isMember && (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.memberText}>Member</Text>
              </View>
            )}
          </View>
          {item.city && item.state && (
            <Text style={styles.orgLocation}>{item.city}, {item.state}</Text>
          )}
          {item.description && (
            <Text style={styles.orgDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {isDemo && (
            <Text style={styles.demoExplanation}>
              Use this organization to test the app before going live.
            </Text>
          )}
          <Text style={styles.orgType}>{item.type}</Text>
        </View>
        <TouchableOpacity
          style={[
            isMember ? styles.selectButton : styles.joinButton,
            joining === item.id && styles.joinButtonDisabled
          ]}
          onPress={() => handleJoinOrg(item.id, item.name)}
          disabled={joining !== null}
        >
          {joining === item.id ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.joinButtonText}>
              {isMember ? 'Select' : 'Join'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

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
          <Text style={styles.emptyText}>No certified organizations are available yet.</Text>
          <Text style={styles.emptySubtext}>
            Check back later or request certification for your organization.
          </Text>
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
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
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
    marginRight: 12,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberText: {
    fontSize: 11,
    color: '#059669',
    marginLeft: 3,
    fontWeight: '500',
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  demoText: {
    fontSize: 11,
    color: '#7c3aed',
    marginLeft: 3,
    fontWeight: '500',
  },
  demoExplanation: {
    fontSize: 12,
    color: '#7c3aed',
    fontStyle: 'italic',
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
  joinButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
