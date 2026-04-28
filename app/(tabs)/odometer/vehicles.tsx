import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import type { Vehicle, VehicleInsert } from '@/types/odometer.types';
import { formatDate } from '@/utils/odometer';

export default function VehiclesScreen() {
  const { activeOrg } = useOrg();
  const session = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [startingOdometer, setStartingOdometer] = useState('');
  const [startingOdometerDate, setStartingOdometerDate] = useState(formatDate(new Date()));
  const [submitting, setSubmitting] = useState(false);

  const loadVehicles = useCallback(async () => {
    if (!activeOrg?.id) return;
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('organization_id', activeOrg.id)
        .neq('status', 'deleted')
        .order('name');
      if (error) {
        console.error('Vehicle fetch error:', error);
        return;
      }
      setVehicles(data || []);
    } catch (err) {
      console.error('[Vehicles] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  async function handleAddVehicle() {
    if (!activeOrg?.id || !session?.user?.id) return;
    if (!name.trim()) {
      Alert.alert('Error', 'Vehicle name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const vehicleData: VehicleInsert = {
        organization_id: activeOrg.id,
        name: name.trim(),
        make_model: makeModel.trim() || null,
        license_plate: licensePlate.trim() || null,
        starting_odometer: startingOdometer ? parseFloat(startingOdometer) : null,
        starting_odometer_date: startingOdometerDate || null,
        status: 'active',
        created_by: session.user.id,
      };

      const { error } = await supabase.from('vehicles').insert(vehicleData);
      if (error) throw error;

      // Reset form
      setName('');
      setMakeModel('');
      setLicensePlate('');
      setStartingOdometer('');
      setStartingOdometerDate(formatDate(new Date()));
      setShowAddForm(false);
      await loadVehicles();
      Alert.alert('Success', 'Vehicle added!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add vehicle.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVehicleStatus(vehicle: Vehicle) {
    const newStatus = vehicle.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status: newStatus })
        .eq('id', vehicle.id);
      if (error) throw error;
      await loadVehicles();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update vehicle.');
    }
  }

  function handleDeleteVehicle(vehicle: Vehicle) {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete "${vehicle.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('vehicles')
                .update({ status: 'deleted' })
                .eq('id', vehicle.id);
              if (error) throw error;
              await loadVehicles();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete vehicle.');
            }
          },
        },
      ],
    );
  }

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <View style={styles.vehicleCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.vehicleName}>{item.name}</Text>
        {item.make_model && <Text style={styles.vehicleSub}>{item.make_model}</Text>}
        {item.license_plate && <Text style={styles.vehicleSub}>Plate: {item.license_plate}</Text>}
        {item.starting_odometer != null && (
          <Text style={styles.vehicleSub}>Starting: {item.starting_odometer} mi</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.statusBadge, item.status === 'inactive' && styles.inactiveBadge]}
        onPress={() => toggleVehicleStatus(item)}
      >
        <Text style={[styles.statusText, item.status === 'inactive' && styles.inactiveText]}>
          {item.status}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVehicle(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.header}>Vehicles</Text>
        <TouchableOpacity onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={28} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No vehicles yet'}
            </Text>
          </View>
        }
      />

      {/* Add Vehicle Modal */}
      <Modal visible={showAddForm} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Add Vehicle</Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Van #1"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Make / Model</Text>
              <TextInput
                style={styles.input}
                value={makeModel}
                onChangeText={setMakeModel}
                placeholder="e.g. Ford Transit"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="e.g. ABC-1234"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />

              <Text style={styles.label}>Starting Odometer</Text>
              <TextInput
                style={styles.input}
                value={startingOdometer}
                onChangeText={setStartingOdometer}
                keyboardType="numeric"
                placeholder="Current mileage"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>Starting Odometer Date</Text>
              <TextInput
                style={styles.input}
                value={startingOdometerDate}
                onChangeText={setStartingOdometerDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleAddVehicle}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? 'Adding...' : 'Add Vehicle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  vehicleName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  vehicleSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  inactiveBadge: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600', color: '#065f46', textTransform: 'capitalize' },
  inactiveText: { color: '#991b1b' },
  deleteButton: { marginLeft: 10, padding: 6 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
});
