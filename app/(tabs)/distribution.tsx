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
import { useDistributionStorage } from '@/hooks/useDistributionStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const KIT_TYPES = ['Narcan', 'Feminine Hygiene', 'Hygiene', 'Safe Sex'];
const LAST_KIT_OUTCOMES = [
  'Used in overdose',
  'Expired',
  'Lost',
  'Still have it',
  'Given to someone else',
  'Unknown'
];

export default function DistributionScreen() {
  const [zipCode, setZipCode] = useState('');
  const [kitType, setKitType] = useState('');
  const [kitsGiven, setKitsGiven] = useState('1');
  const [lastKitOutcome, setLastKitOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitDistribution, pendingCount, syncPending } = useDistributionStorage();
  const { isOnline } = useNetworkStatus();

  const validateForm = () => {
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return false;
    }
    if (!kitType) {
      Alert.alert('Missing Information', 'Please select a kit type.');
      return false;
    }
    const kitsNum = parseInt(kitsGiven);
    if (!kitsNum || kitsNum < 1 || kitsNum > 50) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number of kits (1-50).');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await submitDistribution({
        zip_code: zipCode,
        kit_type: kitType,
        kits_given: parseInt(kitsGiven),
        last_kit_outcome: kitType === 'Narcan' ? lastKitOutcome : undefined,
      });

      // Reset form
      setZipCode('');
      setKitType('');
      setKitsGiven('1');
      setLastKitOutcome('');

      Alert.alert('Success', 'Distribution recorded successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record distribution. It will be saved locally and synced when online.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    if (isOnline && pendingCount > 0) {
      await syncPending();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Package size={24} color="#059669" />
            <Text style={styles.title}>Log Kit Distribution</Text>
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
            {pendingCount > 0 && (
              <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
                <Text style={styles.syncText}>{pendingCount} pending</Text>
              </TouchableOpacity>
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
            <Text style={styles.label}>Kit Type *</Text>
            <View style={styles.optionsGrid}>
              {KIT_TYPES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    kitType === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setKitType(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      kitType === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Number of Kits *</Text>
            <TextInput
              style={styles.input}
              value={kitsGiven}
              onChangeText={setKitsGiven}
              placeholder="1"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {kitType === 'Narcan' && (
            <View style={styles.field}>
              <Text style={styles.label}>What happened to your last kit?</Text>
              <Text style={styles.subtitle}>
                Ask the recipient about their previous Narcan kit
              </Text>
              <View style={styles.optionsGrid}>
                {LAST_KIT_OUTCOMES.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      lastKitOutcome === option && styles.optionButtonSelected,
                    ]}
                    onPress={() => setLastKitOutcome(option)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        lastKitOutcome === option && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <CheckCircle size={20} color="#ffffff" />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Recording...' : 'Record Distribution'}
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
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
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