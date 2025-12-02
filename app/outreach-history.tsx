import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/src/context/OrgContext';
import { Package } from 'lucide-react-native';

type OutreachLog = {
  id: string;
  created_at: string;
  outreach_date: string;
  zip_code: string | null;
  legacy_location: string | null;
  kit_types: string[] | null;
  num_kits: number | null;
  people_reached: number | null;
  males_reached: number | null;
  females_reached: number | null;
};

export default function OutreachHistoryScreen() {
  const { activeOrgId, activeOrg } = useOrg();
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async (isRefreshing = false) => {
    if (!activeOrgId) return;

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const { data, error } = await supabase
        .from('outreach_logs')
        .select(
          'id, created_at, outreach_date, zip_code, legacy_location, kit_types, num_kits, people_reached, males_reached, females_reached',
        )
        .eq('organization_id', activeOrgId)
        .order('outreach_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Load outreach logs error:', error);
        setError(error.message);
      } else {
        setLogs(data ?? []);
      }
    } catch (err: any) {
      console.error('Unexpected error loading logs:', err);
      setError(err.message || 'Failed to load logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [activeOrgId]);

  const onRefresh = () => loadLogs(true);

  if (!activeOrgId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Package size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Organization Selected</Text>
          <Text style={styles.emptyText}>
            Select or join an organization to view outreach logs.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading outreach history...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Could not load outreach history</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (logs.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Package size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Outreach Logs Yet</Text>
          <Text style={styles.emptyText}>
            No outreach activities have been recorded for{' '}
            {activeOrg?.name || 'this organization'}.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Package size={24} color="#059669" />
        <Text style={styles.headerTitle}>Outreach History</Text>
      </View>
      <View style={styles.orgBanner}>
        <Text style={styles.orgLabel}>Organization:</Text>
        <Text style={styles.orgName}>{activeOrg?.name || 'Unknown'}</Text>
      </View>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.logDate}>
                {new Date(item.outreach_date).toLocaleDateString()}
              </Text>
              <Text style={styles.logTime}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.logDetails}>
              <Text style={styles.logLocation}>
                {item.legacy_location || 'Location not specified'} • ZIP{' '}
                {item.zip_code || 'N/A'}
              </Text>
              {item.kit_types && item.kit_types.length > 0 && (
                <Text style={styles.logKitTypes}>
                  {item.kit_types.join(', ')}
                </Text>
              )}
            </View>
            <View style={styles.logStats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Kits</Text>
                <Text style={styles.statValue}>{item.num_kits ?? 0}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>People Reached</Text>
                <Text style={styles.statValue}>{item.people_reached ?? 0}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>M / F</Text>
                <Text style={styles.statValue}>
                  {item.males_reached ?? 0} / {item.females_reached ?? 0}
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  orgBanner: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065f46',
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  logTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  logDetails: {
    marginBottom: 12,
  },
  logLocation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  logKitTypes: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
