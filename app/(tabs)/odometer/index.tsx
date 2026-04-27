import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/types/odometer.types';
import { formatMiles } from '@/utils/odometer';

export default function OdometerDashboard() {
  const { activeOrg } = useOrg();
  const [recentTrips, setRecentTrips] = useState<(Trip & { vehicle_name?: string })[]>([]);
  const [monthlyMiles, setMonthlyMiles] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Monthly miles
      const { data: monthTrips } = await supabase
        .from('trips')
        .select('miles_driven')
        .eq('organization_id', activeOrg.id)
        .gte('trip_date', startOfMonth);

      const total = (monthTrips || []).reduce((sum, t) => sum + (t.miles_driven || 0), 0);
      setMonthlyMiles(total);

      // Recent 5 trips with vehicle name
      const { data: recent } = await supabase
        .from('trips')
        .select('*, vehicles(name)')
        .eq('organization_id', activeOrg.id)
        .order('trip_date', { ascending: false })
        .limit(5);

      setRecentTrips(
        (recent || []).map((t: any) => ({
          ...t,
          vehicle_name: t.vehicles?.name,
        }))
      );
    } catch (err) {
      console.error('[OdometerDashboard] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderTrip = ({ item }: { item: Trip & { vehicle_name?: string } }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push(`/(tabs)/odometer/trip/${item.id}`)}
    >
      <View style={styles.tripRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripVehicle}>{item.vehicle_name || 'Unknown Vehicle'}</Text>
          <Text style={styles.tripDate}>{item.trip_date}</Text>
        </View>
        <View style={styles.tripRight}>
          <Text style={styles.tripMiles}>{formatMiles(item.miles_driven)} mi</Text>
          <View style={[styles.tripTypeBadge, item.trip_type === 'outreach' && styles.outreachBadge]}>
            <Text style={styles.tripTypeText}>{item.trip_type}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentTrips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        ListHeaderComponent={
          <View>
            <Text style={styles.header}>Odometer Log</Text>

            {/* Monthly Miles Card */}
            <View style={styles.statsCard}>
              <Ionicons name="speedometer-outline" size={32} color="#7c3aed" />
              <View style={styles.statsText}>
                <Text style={styles.statsLabel}>Miles This Month</Text>
                <Text style={styles.statsValue}>{formatMiles(monthlyMiles)}</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <TouchableOpacity
              style={styles.logButton}
              onPress={() => router.push('/(tabs)/odometer/log-trip')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.logButtonText}>Log New Trip</Text>
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push('/(tabs)/odometer/history')}
              >
                <Ionicons name="time-outline" size={20} color="#7c3aed" />
                <Text style={styles.linkText}>Full History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push('/(tabs)/odometer/vehicles')}
              >
                <Ionicons name="car-outline" size={20} color="#7c3aed" />
                <Text style={styles.linkText}>Vehicles</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Trips</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No trips logged yet'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsText: { marginLeft: 16 },
  statsLabel: { fontSize: 14, color: '#6b7280' },
  statsValue: { fontSize: 28, fontWeight: 'bold', color: '#7c3aed' },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  logButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linksRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  linkText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
  tripCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  tripRow: { flexDirection: 'row', alignItems: 'center' },
  tripVehicle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  tripDate: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  tripRight: { alignItems: 'flex-end' },
  tripMiles: { fontSize: 16, fontWeight: '700', color: '#7c3aed' },
  tripTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  outreachBadge: { backgroundColor: '#ede9fe' },
  tripTypeText: { fontSize: 11, fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
});
