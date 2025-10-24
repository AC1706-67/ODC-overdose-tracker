import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Package, CircleCheck as CheckCircle, Wifi, WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/lib/supabase';

const KIT_TYPES = ['Narcan', 'Feminine Hygiene', 'Hygiene', 'Safe Sex'];

export default function DistributionScreen() {
  const [zipCode, setZipCode] = useState('');
  const [location, setLocation] = useState('');
  const [selectedKitTypes, setSelectedKitTypes] = useState<string[]>([]);
  const [numKits, setNumKits] = useState('0');
  const [peopleReached, setPeopleReached] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isOnline } = useNetworkStatus();

  const toggleKitType = (kitType: string) => {
    setSelectedKitTypes(prev => 
      prev.includes(kitType) 
        ? prev.filter(type => type !== kitType)
        : [...prev, kitType]
    );
  };

  const validateForm = () => {
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return false;
    }
    if (selectedKitTypes.length === 0) {
      Alert.alert('Missing Information', 'Select at least one kit type.');
      return false;
    }
    const kitsNum = parseInt(numKits);
    if (isNaN(kitsNum) || kitsNum < 0) {
      Alert.alert('Invalid Number', 'Number of kits must be 0 or greater.');
      return false;
    }
    const peopleNum = parseInt(peopleReached);
    if (isNaN(peopleNum) || peopleNum < 0) {
      Alert.alert('Invalid Number', 'People reached must be 0 or greater.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('outreach_logs').insert({
        zip_code: zipCode,
        location: location || null,
        kit_types: selectedKitTypes,
        num_kits: Number(numKits || 0),
        people_reached: Number(peopleReached || 0),
        notes: notes || null,
      });

      if (error) throw error;

      // Reset form
      setZipCode('');
      setLocation('');
      setSelectedKitTypes([]);
      setNumKits('0');
      setPeopleReached('0');
      setNotes('');

      Alert.alert('Success', 'Outreach recorded.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record outreach. Please try again.');
      console.error('Outreach submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Package size={24} color="#059669" />
            <Text style={styles.title}>Outreach Log</Text>
          </View>
          <View style={styles.statusRow}>
            {isOnline ? (
              <View style={styles.onlineStatus}>
                <Wifi size={16} color="#059669" />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            ) : (
              <View style={styles.offlineStatus}>
                <WifiOff size={16} color="#dc2626" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>ZIP Code *</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="12345"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Montana & Sioux, GWW/Lomaland, 1499 Lee Treviño"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Kit Type(s) *</Text>
            <View style={styles.optionsGrid}>
              {KIT_TYPES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    selectedKitTypes.includes(option) && styles.optionButtonSelected,
                  ]}
                  onPress={() => toggleKitType(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedKitTypes.includes(option) && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Number of Kits</Text>
            <TextInput
              style={styles.input}
              value={numKits}
              onChangeText={setNumKits}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>People Reached</Text>
            <TextInput
              style={styles.input}
              value={peopleReached}
              onChangeText={setPeopleReached}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes/Observations</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about the outreach activity..."
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <CheckCircle size={20} color="#ffffff" />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Recording...' : 'Record Outreach'}
            </Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  offlineText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  syncButton: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  submitButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});