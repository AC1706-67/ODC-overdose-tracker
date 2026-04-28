import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';
import { uploadTripPhoto } from '@/lib/storage';
import { validateOdometer, calculateMiles, formatDate } from '@/utils/odometer';
import CameraCapture from '@/components/CameraCapture';
import type { Vehicle, TripInsert } from '@/types/odometer.types';

type TripType = 'transport' | 'outreach';

export default function LogTripScreen() {
  const { activeOrg } = useOrg();
  const session = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [tripDate, setTripDate] = useState(formatDate(new Date()));
  const [tripType, setTripType] = useState<TripType>('transport');
  const [startOdometer, setStartOdometer] = useState('');
  const [endOdometer, setEndOdometer] = useState('');
  const [participantAlias, setParticipantAlias] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [startPhotoUri, setStartPhotoUri] = useState<string | null>(null);
  const [endPhotoUri, setEndPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<'start' | 'end' | null>(null);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeOrg?.id) return;
    supabase
      .from('vehicles')
      .select('*')
      .eq('organization_id', activeOrg.id)
      .eq('status', 'active')
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Vehicle fetch error:', error);
          return;
        }
        if (data) setVehicles(data);
        if (data && data.length > 0) setSelectedVehicleId(data[0].id);
      });
  }, [activeOrg?.id]);

  const miles = startOdometer && endOdometer
    ? calculateMiles(parseFloat(startOdometer), parseFloat(endOdometer))
    : 0;

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  async function handleSubmit() {
    if (!activeOrg?.id || !session?.user?.id) {
      Alert.alert('Error', 'You must be logged in with an active organization.');
      return;
    }
    if (!selectedVehicleId) {
      Alert.alert('Error', 'Please select a vehicle.');
      return;
    }

    const start = parseFloat(startOdometer);
    const end = parseFloat(endOdometer);
    const validationError = validateOdometer(start, end);
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setSubmitting(true);
    try {
      // Create trip first to get ID
      const tripData: TripInsert = {
        vehicle_id: selectedVehicleId,
        organization_id: activeOrg.id,
        driver_id: session.user.id,
        trip_date: tripDate,
        start_odometer: start,
        end_odometer: end,
        miles_driven: calculateMiles(start, end),
        trip_type: tripType,
        participant_alias: participantAlias || null,
        purpose: purpose || null,
        notes: notes || null,
        start_photo_path: null,
        end_photo_path: null,
      };

      const { data: trip, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select('id')
        .single();

      if (error) throw error;

      // Upload photos if captured
      let startPath: string | null = null;
      let endPath: string | null = null;

      if (startPhotoUri) {
        startPath = await uploadTripPhoto(session.user.id, trip.id, startPhotoUri, 'start');
      }
      if (endPhotoUri) {
        endPath = await uploadTripPhoto(session.user.id, trip.id, endPhotoUri, 'end');
      }

      // Update trip with photo paths
      if (startPath || endPath) {
        await supabase
          .from('trips')
          .update({
            start_photo_path: startPath,
            end_photo_path: endPath,
          })
          .eq('id', trip.id);
      }

      Alert.alert('Success', 'Trip logged successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log trip.');
    } finally {
      setSubmitting(false);
    }
  }

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(uri) => {
          if (showCamera === 'start') setStartPhotoUri(uri);
          else setEndPhotoUri(uri);
          setShowCamera(null);
        }}
        onCancel={() => setShowCamera(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.header}>Log Trip</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Vehicle Picker */}
          <Text style={styles.label}>Vehicle</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowVehiclePicker(true)}
          >
            <Text style={styles.pickerText}>
              {selectedVehicle?.name || 'Select a vehicle'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>

          <Modal visible={showVehiclePicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Vehicle</Text>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.modalOption,
                      v.id === selectedVehicleId && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedVehicleId(v.id);
                      setShowVehiclePicker(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{v.name}</Text>
                    {v.make_model && (
                      <Text style={styles.modalOptionSub}>{v.make_model}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowVehiclePicker(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Trip Date */}
          <Text style={styles.label}>Trip Date</Text>
          <TextInput
            style={styles.input}
            value={tripDate}
            onChangeText={setTripDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />

          {/* Trip Type */}
          <Text style={styles.label}>Trip Type</Text>
          <View style={styles.typeRow}>
            {(['transport', 'outreach'] as TripType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeButton, tripType === t && styles.typeButtonActive]}
                onPress={() => setTripType(t)}
              >
                <Text style={[styles.typeButtonText, tripType === t && styles.typeButtonTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Odometer */}
          <Text style={styles.label}>Start Odometer</Text>
          <View style={styles.odometerRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={startOdometer}
              onChangeText={setStartOdometer}
              keyboardType="numeric"
              placeholder="e.g. 45230"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera('start')}
            >
              <Ionicons name="camera" size={22} color="#7c3aed" />
            </TouchableOpacity>
          </View>
          {startPhotoUri && (
            <Image source={{ uri: startPhotoUri }} style={styles.photoPreview} />
          )}

          {/* End Odometer */}
          <Text style={styles.label}>End Odometer</Text>
          <View style={styles.odometerRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={endOdometer}
              onChangeText={setEndOdometer}
              keyboardType="numeric"
              placeholder="e.g. 45280"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera('end')}
            >
              <Ionicons name="camera" size={22} color="#7c3aed" />
            </TouchableOpacity>
          </View>
          {endPhotoUri && (
            <Image source={{ uri: endPhotoUri }} style={styles.photoPreview} />
          )}

          {/* Miles Driven (auto-calculated) */}
          {miles > 0 && (
            <View style={styles.milesCard}>
              <Text style={styles.milesLabel}>Miles Driven</Text>
              <Text style={styles.milesValue}>{miles.toFixed(1)}</Text>
            </View>
          )}

          {/* Optional Fields */}
          <Text style={styles.label}>Participant Alias (optional)</Text>
          <TextInput
            style={styles.input}
            value={participantAlias}
            onChangeText={setParticipantAlias}
            placeholder="Alias or identifier"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Purpose (optional)</Text>
          <TextInput
            style={styles.input}
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Trip purpose"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes"
            placeholderTextColor="#9ca3af"
            multiline
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Saving...' : 'Log Trip'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
  },
  pickerText: { fontSize: 15, color: '#111827' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  typeButtonText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  typeButtonTextActive: { color: '#fff' },
  odometerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { width: '100%', height: 120, borderRadius: 10, marginTop: 8 },
  milesCard: {
    backgroundColor: '#ede9fe',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  milesLabel: { fontSize: 13, color: '#6b7280' },
  milesValue: { fontSize: 32, fontWeight: 'bold', color: '#7c3aed' },
  submitButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  modalOption: { padding: 14, borderRadius: 10, marginBottom: 6 },
  modalOptionSelected: { backgroundColor: '#ede9fe' },
  modalOptionText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  modalOptionSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  modalCancel: { padding: 14, alignItems: 'center', marginTop: 8 },
  modalCancelText: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
});
