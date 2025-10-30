import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Heart, Users, CheckCircle, XCircle, MapPin } from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { supabase } from '@/lib/supabase';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const { width } = Dimensions.get('window');

interface HealthDashboardData {
  incidents_30d: number;
  with_narcan_30d: number;
  survived_30d: number;
  deceased_30d: number;
  zips_30d: number;
  refreshed_at: string;
}

export default function HealthDashboardScreen() {
  const { activeOrgId } = useOrg();
  const [data, setData] = useState<HealthDashboardData>({
    incidents_30d: 0,
    with_narcan_30d: 0,
    survived_30d: 0,
    deceased_30d: 0,
    zips_30d: 0,
    refreshed_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Query the health dashboard view for real data
      let query = supabase
        .from('health_dashboard_v1')
        .select('*');

      if (activeOrgId === null || activeOrgId === undefined) {
        query = query.is('organization_id', null);
      } else {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data: healthData, error } = await query.limit(1);

      if (error) {
        console.error('[HealthDashboard] Error:', error);
        return;
      }

      if (healthData && healthData.length > 0) {
        setData(healthData[0]);
      }
      
    } catch (error) {
      console.error('[HealthDashboard] Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => fetchHealthData(true);

  useEffect(() => {
    fetchHealthData();
  }, [activeOrgId]);

  if (loading && !refreshing) {
    return <LoadingSkeleton />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Time Period Info */}
        <View style={styles.periodInfo}>
          <Text style={styles.periodText}>Last 30 Days</Text>
          <Text style={styles.lastUpdated}>
            Updated {new Date(data.refreshed_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Health Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Heart size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Health Incidents</Text>
            </View>
            <Text style={styles.metricValue}>{data.incidents_30d}</Text>
            <Text style={styles.metricSubtext}>
              Total reported incidents
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={20} color="#059669" />
              <Text style={styles.metricTitle}>With Narcan</Text>
            </View>
            <Text style={styles.metricValue}>{data.with_narcan_30d}</Text>
            <Text style={styles.metricSubtext}>
              Narcan administered
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <CheckCircle size={20} color="#16a34a" />
              <Text style={styles.metricTitle}>Survived</Text>
            </View>
            <Text style={styles.metricValue}>{data.survived_30d}</Text>
            <Text style={styles.metricSubtext}>
              Positive outcomes
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <XCircle size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Deceased</Text>
            </View>
            <Text style={styles.metricValue}>{data.deceased_30d}</Text>
            <Text style={styles.metricSubtext}>
              Fatal outcomes
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={20} color="#7c3aed" />
              <Text style={styles.metricTitle}>Geographic Coverage</Text>
            </View>
            <Text style={styles.metricValue}>{data.zips_30d}</Text>
            <Text style={styles.metricSubtext}>
              ZIP codes affected
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Impact Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Survival Rate</Text>
              <Text style={styles.summaryValue}>
                {data.incidents_30d > 0 
                  ? `${Math.round((data.survived_30d / data.incidents_30d) * 100)}%`
                  : '0%'
                }
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Narcan Usage</Text>
              <Text style={styles.summaryValue}>
                {data.incidents_30d > 0 
                  ? `${Math.round((data.with_narcan_30d / data.incidents_30d) * 100)}%`
                  : '0%'
                }
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  periodInfo: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
});