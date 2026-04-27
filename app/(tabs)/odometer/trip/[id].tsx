import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { getSignedPhotoUrl } from '@/lib/storage';
import { formatMiles } from '@/utils/odometer';
import type { Trip } from '@/types/odometer.types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<(Trip & { vehicle_name?: string; driver_email?: string }) | null>(null);
  const [startPhotoUrl, setStartPhotoUrl] = useState<string | null>(null);
  const [endPhotoUrl, setEndPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('trips')
          .select('*, vehicles(name), profiles:driver_id(email)')
          .eq('id', id)
          .single();

        if (data) {
          const tripData = {
            ...data,
            vehicle_name: (data as any).vehicles?.name,
            driver_email: (data as any).profiles?.email,
          };
          setTrip(tripData);

          // Load signed photo URLs
          if (data.start_photo_path) {
            try {
              const url = await getSignedPhotoUrl(data.start_photo_path);
              setStartPhotoUrl(url);
            } catch {}
          }
          if (data.end_photo_path) {
            try {
              const url = await getSignedPhotoUrl(data.end_photo_path);
              setEndPhotoUrl(url);
            } catch {}
          }
        }
      } catch (err) {
        console.error('[TripDetail] Load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.header}>Trip Detail</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Trip not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.header}>Trip Detail</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Miles Card */}
        <View style={styles.milesCard}>
          <Text style={styles.milesLabel}>Miles Driven</Text>
          <Text style={styles.milesValue}>{formatMiles(trip.miles_driven)}</Text>
        </View>

        {/* Info Rows */}
        <View style={styles.infoSection}>
          <InfoRow icon="car" label="Vehicle" value={trip.vehicle_name || 'Unknown'} />
          <InfoRow icon="calendar" label="Date" value={trip.trip_date} />
          <InfoRow icon="person" label="Driver" value={trip.driver_email || trip.driver_id} />
          <InfoRow
            icon="swap-horizontal"
            label="Trip Type"
            value={trip.trip_type.charAt(0).toUpperCase() + trip.trip_type.slice(1)}
          />
          <InfoRow label="Start Odometer" icon="speedometer" value={`${trip.start_odometer}`} />
          <InfoRow label="End Odometer" icon="speedometer-outline" value={`${trip.end_odometer}`} />
          {trip.participant_alias && (
            <InfoRow icon="people" label="Participant" value={trip.participant_alias} />
          )}
          {trip.purpose && <InfoRow icon="flag" label="Purpose" value={trip.purpose} />}
          {trip.notes && <InfoRow icon="document-text" label="Notes" value={trip.notes} />}
        </View>

        {/* Photos */}
        {startPhotoUrl && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Start Odometer Photo</Text>
            <Image source={{ uri: startPhotoUrl }} style={styles.photo} resizeMode="cover" />
          </View>
        )}
        {endPhotoUrl && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>End Odometer Photo</Text>
            <Image source={{ uri: endPhotoUrl }} style={styles.photo} resizeMode="cover" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={20} color="#7c3aed" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  milesCard: {
    backgroundColor: '#ede9fe',
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  milesLabel: { fontSize: 14, color: '#6b7280' },
  milesValue: { fontSize: 40, fontWeight: 'bold', color: '#7c3aed' },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: { fontSize: 14, color: '#6b7280', marginLeft: 10, width: 110 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  photoSection: { marginBottom: 16 },
  photoLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  photo: { width: '100%', height: 200, borderRadius: 12 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
});
