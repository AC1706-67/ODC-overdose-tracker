import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  MapPin,
  Navigation,
  BarChart3,
  Users,
  Package,
} from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { supabase } from '@/lib/supabase';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import LocationCoverageMap from './LocationCoverageMap';
import LocationActivityChart from './LocationActivityChart';
import LocationEffectivenessMetrics from './LocationEffectivenessMetrics';

const { width } = Dimensions.get('window');

interface LocationCoverage {
  location_id: string;
  location_label: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type: string;
  visits_count: number;
  active_days: number;
  total_people_reached: number;
  total_kits_distributed: number;
  unique_team_members: number;
  last_seen_at: string | null;
  first_seen_at: string | null;
}

export default function LocationAnalytics() {
  const { activeOrgId } = useOrg();
  const [locations, setLocations] = useState<LocationCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let query = supabase
        .from('v_location_coverage_v1')
        .select('*')
        .order('visits_count', { ascending: false })
        .limit(50);

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLocations(data || []);
    } catch (err) {
      console.error('[LocationAnalytics] Error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load location data',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => fetchLocationData(true);

  useEffect(() => {
    fetchLocationData();
  }, [activeOrgId]);

  if (loading && !refreshing) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading location analytics</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  // Calculate summary metrics
  const totalLocations = locations.length;
  const totalVisits = locations.reduce((sum, loc) => sum + loc.visits_count, 0);
  const totalPeopleReached = locations.reduce(
    (sum, loc) => sum + loc.total_people_reached,
    0,
  );
  const totalKitsDistributed = locations.reduce(
    (sum, loc) => sum + loc.total_kits_distributed,
    0,
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <MapPin size={24} color="#7c3aed" />
        <Text style={styles.title}>Location Analytics</Text>
      </View>

      {/* Summary Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Navigation size={20} color="#7c3aed" />
            <Text style={styles.metricTitle}>Active Locations</Text>
          </View>
          <Text style={styles.metricValue}>{totalLocations}</Text>
          <Text style={styles.metricSubtext}>Coverage areas</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <BarChart3 size={20} color="#059669" />
            <Text style={styles.metricTitle}>Total Visits</Text>
          </View>
          <Text style={styles.metricValue}>{totalVisits}</Text>
          <Text style={styles.metricSubtext}>Outreach activities</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Users size={20} color="#3b82f6" />
            <Text style={styles.metricTitle}>People Reached</Text>
          </View>
          <Text style={styles.metricValue}>{totalPeopleReached}</Text>
          <Text style={styles.metricSubtext}>Across all locations</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Package size={20} color="#f59e0b" />
            <Text style={styles.metricTitle}>Kits Distributed</Text>
          </View>
          <Text style={styles.metricValue}>{totalKitsDistributed}</Text>
          <Text style={styles.metricSubtext}>Total supplies</Text>
        </View>
      </View>

      {/* Location Coverage Map/List */}
      <LocationCoverageMap locations={locations} />

      {/* Location Activity Charts */}
      <LocationActivityChart locations={locations} />

      {/* Location Effectiveness Metrics */}
      <LocationEffectivenessMetrics locations={locations} />

      {/* Detailed Location List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Details</Text>
        {locations.length > 0 ? (
          locations.map((location) => (
            <View key={location.location_id} style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Navigation size={16} color="#7c3aed" />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>
                    {location.location_label}
                  </Text>
                  {location.city && location.state && (
                    <Text style={styles.locationAddress}>
                      {location.city}, {location.state} {location.zip_code}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.locationStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Visits:</Text>
                  <Text style={styles.statValue}>{location.visits_count}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>People Reached:</Text>
                  <Text style={styles.statValue}>
                    {location.total_people_reached}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Team Members:</Text>
                  <Text style={styles.statValue}>
                    {location.unique_team_members}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Active Days:</Text>
                  <Text style={styles.statValue}>{location.active_days}</Text>
                </View>
              </View>

              {location.last_seen_at && (
                <Text style={styles.locationDate}>
                  Last activity:{' '}
                  {new Date(location.last_seen_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📍 No Location Data</Text>
            <Text style={styles.emptyText}>
              Location analytics will appear here once outreach activities are
              logged with location information.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  locationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  locationStats: {
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  locationDate: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
