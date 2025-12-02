import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Heart,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import LoadingSkeleton from '@/components/LoadingSkeleton';

const { width } = Dimensions.get('window');

type TimePeriod = '30d' | '90d' | 'ytd' | 'fiscal' | 'all';

const TIME_PERIODS = [
  { value: '30d' as TimePeriod, label: 'Last 30 Days' },
  { value: '90d' as TimePeriod, label: 'Last 90 Days' },
  { value: 'ytd' as TimePeriod, label: 'Year to Date' },
  { value: 'fiscal' as TimePeriod, label: 'Fiscal Year' },
  { value: 'all' as TimePeriod, label: 'All Time' },
];

interface HealthDashboardData {
  total_incidents: number;
  with_narcan: number;
  survived: number;
  deceased: number;
  unique_zips: number;
  refreshed_at: string;
}

// Helper to get fiscal year start (October 1)
function getFiscalYearStart(): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  const fiscalYearStart = new Date(currentYear, 9, 1); // October 1 (month is 0-indexed)

  // If we're before October, use last year's fiscal year
  if (now < fiscalYearStart) {
    fiscalYearStart.setFullYear(currentYear - 1);
  }

  return fiscalYearStart;
}

// Helper to get date range for time period
function getDateRange(period: TimePeriod): Date | null {
  const now = new Date();

  switch (period) {
    case '30d':
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return thirtyDaysAgo;

    case '90d':
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(now.getDate() - 90);
      return ninetyDaysAgo;

    case 'ytd':
      return new Date(now.getFullYear(), 0, 1); // January 1

    case 'fiscal':
      return getFiscalYearStart();

    case 'all':
      return null; // No date filter

    default:
      return null;
  }
}

export default function HealthDashboardScreen() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('fiscal');
  const [data, setData] = useState<HealthDashboardData>({
    total_incidents: 0,
    with_narcan: 0,
    survived: 0,
    deceased: 0,
    unique_zips: 0,
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

      console.log('[HealthDashboard] Fetching data for period:', timePeriod);

      const startDate = getDateRange(timePeriod);

      // Query incidents directly with date filter
      let query = supabase.from('incidents').select('*');

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }

      const { data: incidents, error } = await query;

      if (error) {
        console.error('[HealthDashboard] Error:', error);
        return;
      }

      if (incidents) {
        // Calculate metrics from incidents
        const totalIncidents = incidents.length;
        const withNarcan = incidents.filter(
          (i) => i.narcan_used === true,
        ).length;
        const survived = incidents.filter(
          (i) => i.survival === 'Survived',
        ).length;
        const deceased = incidents.filter(
          (i) => i.survival === 'Deceased',
        ).length;
        const uniqueZips = new Set(
          incidents.map((i) => i.zip_code).filter(Boolean),
        ).size;

        setData({
          total_incidents: totalIncidents,
          with_narcan: withNarcan,
          survived: survived,
          deceased: deceased,
          unique_zips: uniqueZips,
          refreshed_at: new Date().toISOString(),
        });

        console.log('[HealthDashboard] Calculated metrics:', {
          totalIncidents,
          withNarcan,
          survived,
          deceased,
          uniqueZips,
        });
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
  }, [timePeriod]);

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
        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContent}
          >
            {TIME_PERIODS.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  timePeriod === period.value && styles.periodButtonActive,
                ]}
                onPress={() => setTimePeriod(period.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    timePeriod === period.value &&
                      styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Period Info */}
        <View style={styles.periodInfo}>
          <View style={styles.periodInfoLeft}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.periodText}>
              {TIME_PERIODS.find((p) => p.value === timePeriod)?.label}
            </Text>
          </View>
          <Text style={styles.lastUpdated}>
            Updated {new Date(data.refreshed_at).toLocaleTimeString()}
          </Text>
        </View>

        {/* Health Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Heart size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Health Incidents</Text>
            </View>
            <Text style={styles.metricValue}>{data.total_incidents}</Text>
            <Text style={styles.metricSubtext}>Total reported incidents</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={20} color="#059669" />
              <Text style={styles.metricTitle}>With Narcan</Text>
            </View>
            <Text style={styles.metricValue}>{data.with_narcan}</Text>
            <Text style={styles.metricSubtext}>Narcan administered</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <CheckCircle size={20} color="#16a34a" />
              <Text style={styles.metricTitle}>Survived</Text>
            </View>
            <Text style={styles.metricValue}>{data.survived}</Text>
            <Text style={styles.metricSubtext}>Positive outcomes</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <XCircle size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Deceased</Text>
            </View>
            <Text style={styles.metricValue}>{data.deceased}</Text>
            <Text style={styles.metricSubtext}>Fatal outcomes</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={20} color="#7c3aed" />
              <Text style={styles.metricTitle}>Geographic Coverage</Text>
            </View>
            <Text style={styles.metricValue}>{data.unique_zips}</Text>
            <Text style={styles.metricSubtext}>ZIP codes affected</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Impact Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Survival Rate</Text>
              <Text style={styles.summaryValue}>
                {data.total_incidents > 0
                  ? `${Math.round((data.survived / data.total_incidents) * 100)}%`
                  : '0%'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Narcan Usage</Text>
              <Text style={styles.summaryValue}>
                {data.total_incidents > 0
                  ? `${Math.round((data.with_narcan / data.total_incidents) * 100)}%`
                  : '0%'}
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
  periodSelector: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  periodInfo: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#9ca3af',
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
