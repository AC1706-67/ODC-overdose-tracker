import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';
import { supabase } from '@/lib/supabase';
import type { Trip } from '@/types/odometer.types';
import { formatMiles } from '@/utils/odometer';

export default function TripHistoryScreen() {
  const { activeOrg } = useOrg();
  const [trips, setTrips] = useState<(Trip & { vehicle_name?: string })[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTrips = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      const { data } = await supabase
        .from('trips')
        .select('*, vehicles(name)')
        .eq('organization_id', activeOrg.id)
        .order('trip_date', { ascending: false });

      setTrips(
        (data || []).map((t: any) => ({
          ...t,
          vehicle_name: t.vehicles?.name,
        }))
      );
    } catch (err) {
      console.error('[TripHistory] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const renderTrip = ({ item }: { item: Trip & { vehicle_name?: string } }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push(`/(tabs)/odometer/trip/${item.id}`)}
    >
      <View style={styles.tripRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tripVehicle}>{item.vehicle_name || 'Unknown'}</Text>
          <Text style={styles.tripDate}>{item.trip_date}</Text>
          {item.purpose && <Text style={styles.tripPurpose}>{item.purpose}</Text>}
        </View>
        <View style={styles.tripRight}>
          <Text style={styles.tripMiles}>{formatMiles(item.miles_driven)} mi</Text>
          <View style={[styles.badge, item.trip_type === 'outreach' && styles.outreachBadge]}>
            <Text style={styles.badgeText}>{item.trip_type}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.header}>Trip History</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No trips found'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  listContent: { padding: 16, paddingTop: 0 },
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
  tripPurpose: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  tripRight: { alignItems: 'flex-end', marginRight: 8 },
  tripMiles: { fontSize: 16, fontWeight: '700', color: '#7c3aed' },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  outreachBadge: { backgroundColor: '#ede9fe' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#4b5563', textTransform: 'capitalize' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
});
