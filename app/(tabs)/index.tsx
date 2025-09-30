import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Wifi, WifiOff } from 'lucide-react-native';
import { useIncidentStorage } from '@/hooks/useIncidentStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say', 'Unknown'];
const AGE_OPTIONS = ['<18', '18-25', '26-35', '36-45', '46-55', '56-65', '65+', 'Unknown'];
const SURVIVAL_OPTIONS = ['Survived', 'Deceased', 'Unknown'];

export default function IncidentScreen() {
  const [zipCode, setZipCode] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [narcanUsed, setNarcanUsed] = useState<boolean | null>(null);
  const [survival, setSurvival] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitIncident, pendingCount, syncPending } = useIncidentStorage();
  const { isOnline } = useNetworkStatus();

  const validateForm = () => {
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return false;
    }
    if (!gender || !age || narcanUsed === null || !survival) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await submitIncident({
        zip_code: zipCode,
        gender,
        approx_age: age,
        narcan_used: narcanUsed!,
        survival,
      });

      // Reset form
      setZipCode('');
      setGender('');
      setAge('');
      setNarcanUsed(null);
      setSurvival('');

      Alert.alert('Success', 'Incident recorded successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to record incident. It will be saved locally and synced when online.');
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AlertCircle size={24} color="#dc2626" />
            <Text style={styles.title}>Report Overdose Incident</Text>
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
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.optionsGrid}>
              {GENDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    gender === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setGender(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Age Range *</Text>
            <View style={styles.optionsGrid}>
              {AGE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    age === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setAge(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      age === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Narcan Used *</Text>
            <View style={styles.booleanOptions}>
              <TouchableOpacity
                style={[
                  styles.booleanButton,
                  narcanUsed === true && styles.optionButtonSelected,
                ]}
                onPress={() => setNarcanUsed(true)}
              >
                <Text
                  style={[
                    styles.optionText,
                    narcanUsed === true && styles.optionTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.booleanButton,
                  narcanUsed === false && styles.optionButtonSelected,
                ]}
                onPress={() => setNarcanUsed(false)}
              >
                <Text
                  style={[
                    styles.optionText,
                    narcanUsed === false && styles.optionTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Outcome *</Text>
            <View style={styles.optionsGrid}>
              {SURVIVAL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    survival === option && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSurvival(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      survival === option && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <CheckCircle size={20} color="#ffffff" />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Recording...' : 'Record Incident'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  booleanOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#dc2626',
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