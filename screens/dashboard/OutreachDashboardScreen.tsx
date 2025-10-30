import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Package, Users, MapPin, BarChart3 } from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { fetchDashboardDirect } from '@/src/api/dashboard';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import DashboardCharts from '@/components/DashboardCharts';

const { width } = Dimensions.get('window');

export default function OutreachDashboardScreen() {
  const { activeOrgId } = useOrg();
  const [cards, setCards] = useState({ 
    outreach_activities: 0, 
    kits_distributed: 0, 
    people_reached: 0, 
    males_reached: 0,
    females_reached: 0,
    active_locations: 0 
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async (isRefreshing = false) => {
    if (activeOrgId === undefined) return;
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const res = await fetchDashboardDirect(activeOrgId);
      setCards(res);
    } catch (error) {
      console.error('[OutreachDashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => refresh(true);

  useEffect(() => {
    refresh();
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
            Updated {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Package size={20} color="#059669" />
              <Text style={styles.metricTitle}>Outreach Activities</Text>
            </View>
            <Text style={styles.metricValue}>{cards.outreach_activities}</Text>
            <Text style={styles.metricSubtext}>
              {cards.kits_distributed} supplies distributed
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={20} color="#3b82f6" />
              <Text style={styles.metricTitle}>People Reached</Text>
            </View>
            <Text style={styles.metricValue}>{cards.people_reached}</Text>
            <Text style={styles.metricSubtext}>
              {cards.males_reached}M / {cards.females_reached}F
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={20} color="#7c3aed" />
              <Text style={styles.metricTitle}>Geographic Coverage</Text>
            </View>
            <Text style={styles.metricValue}>{cards.active_locations}</Text>
            <Text style={styles.metricSubtext}>
              active locations
            </Text>
          </View>
        </View>

        {/* Charts and Visualizations */}
        <DashboardCharts cards={cards} />
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
});