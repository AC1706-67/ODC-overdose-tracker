import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { OrganizationType } from '@/types/organization';
import { submitCertificationRequest } from '@/src/api/organizationOnboarding';

const ORG_TYPES: OrganizationType[] = [
  'Health Center',
  'Hospital',
  'Community Organization',
  'Government Agency',
  'Compassionate Community Engagement (CCE)',
  'Peer Support Network',
  'Faith-Based Organization',
  'Other',
];

export default function RequestOrgScreen() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Community Organization' as OrganizationType,
    city: '',
    state: '',
    website: '',
    contactEmail: '',
    contactName: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.contactEmail.trim() || !formData.contactName.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await submitCertificationRequest({
        organizationName: formData.name,
        organizationType: formData.type,
        city: formData.city,
        state: formData.state,
        website: formData.website,
        contactName: formData.contactName,
        contactEmail: formData.contactEmail,
        description: formData.description,
      });

      Alert.alert(
        'Request Submitted!',
        'Your organization certification request has been submitted. You will be notified when it is reviewed.',
        [{ text: 'OK', onPress: () => router.replace('/onboarding') }]
      );
    } catch (error: any) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Certification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="add-circle" size={48} color="#7c3aed" />
        </View>

        <Text style={styles.title}>Request Organization Certification</Text>
        <Text style={styles.subtitle}>
          Submit your organization for review and certification
        </Text>

        <Text style={styles.label}>Organization Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Community Recovery Center"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          editable={!loading}
        />

        <Text style={styles.label}>Organization Type *</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowTypePicker(!showTypePicker)}
          disabled={loading}
        >
          <Text style={styles.pickerText}>{formData.type}</Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>

        {showTypePicker && (
          <View style={styles.pickerOptions}>
            {ORG_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.pickerOption}
                onPress={() => {
                  setFormData({ ...formData, type });
                  setShowTypePicker(false);
                }}
              >
                <Text style={styles.pickerOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., El Paso"
          value={formData.city}
          onChangeText={(text) => setFormData({ ...formData, city: text })}
          editable={!loading}
        />

        <Text style={styles.label}>State</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., TX"
          value={formData.state}
          onChangeText={(text) => setFormData({ ...formData, state: text })}
          maxLength={2}
          autoCapitalize="characters"
          editable={!loading}
        />

        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.org"
          value={formData.website}
          onChangeText={(text) => setFormData({ ...formData, website: text })}
          keyboardType="url"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Contact Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          value={formData.contactName}
          onChangeText={(text) => setFormData({ ...formData, contactName: text })}
          editable={!loading}
        />

        <Text style={styles.label}>Contact Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="contact@example.org"
          value={formData.contactEmail}
          onChangeText={(text) => setFormData({ ...formData, contactEmail: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Brief description of your organization"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#111827',
  },
  pickerOptions: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
