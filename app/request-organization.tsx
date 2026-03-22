import { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function RequestOrganization() {
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [orgType, setOrgType] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [accessTier, setAccessTier] = useState<'full' | 'incident_only'>('full');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submitRequest() {
    // Validation
    if (!orgName || !contactName || !contactEmail || !orgType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      console.log('[OrgRequest] Submitting request for:', orgName);

      // Insert into certification_requests table
      const { error } = await supabase
        .from('certification_requests')
        .insert({
          organization_name: orgName,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          organization_type: orgType,
          city: city || null,
          state: state || null,
          description: description || null,
          org_type: accessTier,
          status: 'pending',
        });

      if (error) {
        console.error('[OrgRequest] Error:', error);
        Alert.alert(
          'Submission Error',
          'Failed to submit request.\n\nError: ' + error.message
        );
        return;
      }

      console.log('[OrgRequest] ✅ Request submitted');
      Alert.alert(
        'Request Submitted!',
        'Thank you for your interest in Compassionate LOG. We will review your request and contact you at ' +
          contactEmail +
          ' within 2-3 business days.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error('[OrgRequest] Unexpected error:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred.\n\nError: ' +
          (err?.message || String(err))
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Request Organization Access</Text>
      <Text style={styles.subtitle}>
        Are you part of a harm reduction organization, recovery center, or
        community group? Request dedicated access to Compassionate LOG for your
        team.
      </Text>

      <Text style={styles.sectionTitle}>Organization Information</Text>

      <Text style={styles.label}>
        Organization Name <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        placeholder="e.g., Recovery Alliance"
        value={orgName}
        onChangeText={setOrgName}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>
        Organization Type <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        placeholder="e.g., Harm Reduction Center, Recovery Support"
        value={orgType}
        onChangeText={setOrgType}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        placeholder="e.g., San Francisco"
        value={city}
        onChangeText={setCity}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>State</Text>
      <TextInput
        placeholder="e.g., CA"
        value={state}
        onChangeText={setState}
        style={styles.input}
        editable={!loading}
        maxLength={2}
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Description (Optional)</Text>
      <TextInput
        placeholder="Tell us about your organization and how you plan to use Compassionate LOG"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        editable={!loading}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.sectionTitle}>Contact Information</Text>

      <Text style={styles.label}>
        Contact Name <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        placeholder="Your full name"
        value={contactName}
        onChangeText={setContactName}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>
        Contact Email <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        placeholder="your.email@organization.org"
        autoCapitalize="none"
        keyboardType="email-address"
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.label}>Contact Phone (Optional)</Text>
      <TextInput
        placeholder="(555) 123-4567"
        keyboardType="phone-pad"
        value={contactPhone}
        onChangeText={setContactPhone}
        style={styles.input}
        editable={!loading}
      />

      <Text style={styles.sectionTitle}>Access Level</Text>
      <Text style={styles.label}>
        How will your organization use Compassionate Log?{' '}
        <Text style={styles.required}>*</Text>
      </Text>

      <TouchableOpacity
        style={[
          styles.tierCard,
          accessTier === 'full' && styles.tierCardSelected,
        ]}
        onPress={() => setAccessTier('full')}
        disabled={loading}
      >
        <View style={styles.tierRadio}>
          {accessTier === 'full' && <View style={styles.tierRadioInner} />}
        </View>
        <View style={styles.tierText}>
          <Text style={styles.tierTitle}>Full Access</Text>
          <Text style={styles.tierDescription}>
            Incidents, outreach logs, team management, locations, and dashboards
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tierCard,
          accessTier === 'incident_only' && styles.tierCardSelected,
        ]}
        onPress={() => setAccessTier('incident_only')}
        disabled={loading}
      >
        <View style={styles.tierRadio}>
          {accessTier === 'incident_only' && (
            <View style={styles.tierRadioInner} />
          )}
        </View>
        <View style={styles.tierText}>
          <Text style={styles.tierTitle}>Incident Tracking Only</Text>
          <Text style={styles.tierDescription}>
            Health incident and overdose tracking only
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit Request'}
          onPress={submitRequest}
          disabled={loading}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.linkContainer}
        disabled={loading}
      >
        <Text style={styles.linkText}>Cancel</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 After submitting, we'll review your request and set up a dedicated
          space for your organization with custom branding and team management
          features.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    color: '#1f2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  tierCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  tierRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  tierRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  tierText: {
    flex: 1,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tierDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
