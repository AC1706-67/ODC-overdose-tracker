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
import { useOrg } from '@/src/context/OrgContext';

const SUPPLY_TYPES = ['Narcan', 'Feminine Hygiene', 'Hygiene', 'Safe Sex', 'Wound Care'];
const COMMON_ZIP_CODES = ['79901', '79902', '79903', '79904', '79905', '79906', '79907', '79908', '79915', '79924', '79925', '79930', '79932', '79934', '79935', '79936'];

export default function DistributionScreen() {
  const { activeOrgId } = useOrg();
  const [zipCode, setZipCode] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSupplyTypes, setSelectedSupplyTypes] = useState<string[]>([]);
  const [numSupplies, setNumSupplies] = useState('0');
  const [malesReached, setMalesReached] = useState('0');
  const [femalesReached, setFemalesReached] = useState('0');
  const [notes, setNotes] = useState('');
  const [outreachDate, setOutreachDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamMembers, setTeamMembers] = useState('');
  const [memberOrganization, setMemberOrganization] = useState('');
  const [tripCount, setTripCount] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isOnline } = useNetworkStatus();

  const toggleSupplyType = (supplyType: string) => {
    setSelectedSupplyTypes(prev => 
      prev.includes(supplyType) 
        ? prev.filter(type => type !== supplyType)
        : [...prev, supplyType]
    );
  };

  const validateForm = () => {
    if (!zipCode || zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      Alert.alert('Invalid ZIP Code', 'Please enter a valid 5-digit ZIP code.');
      return false;
    }
    if (selectedSupplyTypes.length === 0) {
      Alert.alert('Missing Information', 'Select at least one supply type.');
      return false;
    }
    const suppliesNum = parseInt(numSupplies);
    if (isNaN(suppliesNum) || suppliesNum < 0) {
      Alert.alert('Invalid Number', 'Number of supplies must be 0 or greater.');
      return false;
    }
    const malesNum = parseInt(malesReached);
    if (isNaN(malesNum) || malesNum < 0) {
      Alert.alert('Invalid Number', 'Males reached must be 0 or greater.');
      return false;
    }
    const femalesNum = parseInt(femalesReached);
    if (isNaN(femalesNum) || femalesNum < 0) {
      Alert.alert('Invalid Number', 'Females reached must be 0 or greater.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Get user session for user_id
      const session = (await supabase.auth.getSession()).data.session;
      const userId = session?.user?.id || null;

      // Parse team members into array if provided
      const teamMembersArray = teamMembers 
        ? teamMembers.split(/[,&]/).map(name => name.trim()).filter(name => name)
        : [];

      const payload = {
        organization_id: activeOrgId || null,
        user_id: userId,
        outreach_date: outreachDate, // Already in YYYY-MM-DD format
        zip_code: zipCode,
        location: location || null,
        kit_types: selectedSupplyTypes, // Already an array
        num_kits: Number(numSupplies || 0),
        people_reached: Number(malesReached || 0) + Number(femalesReached || 0),
        males_reached: Number(malesReached || 0),
        females_reached: Number(femalesReached || 0),
        trip_count: Number(tripCount || 1),
        team_members: teamMembersArray.length > 0 ? teamMembersArray : null,
        team_organization: memberOrganization || null,
        notes: notes || null,
      };

      console.log('Outreach payload:', payload);

      const { data, error } = await supabase
        .from('outreach_logs')
        .insert(payload)
        .select('*');

      if (error) {
        console.log('OUTREACH INSERT ERROR', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Outreach submitted successfully:', data);

      // Reset form
      setZipCode('');
      setLocation('');
      setSelectedSupplyTypes([]);
      setNumSupplies('0');
      setMalesReached('0');
      setFemalesReached('0');
      setNotes('');
      setOutreachDate(new Date().toISOString().split('T')[0]);
      setTeamMembers('');
      setMemberOrganization('');
      setTripCount('1');

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
            <Text style={styles.quickSelectLabel}>Quick Select:</Text>
            <View style={styles.zipOptionsGrid}>
              {COMMON_ZIP_CODES.map((zip) => (
                <TouchableOpacity
                  key={zip}
                  style={[
                    styles.zipOptionButton,
                    zipCode === zip && styles.zipOptionButtonSelected,
                  ]}
                  onPress={() => setZipCode(zip)}
                >
                  <Text
                    style={[
                      styles.zipOptionText,
                      zipCode === zip && styles.zipOptionTextSelected,
                    ]}
                  >
                    {zip}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <Text style={styles.label}>Supply Type(s) *</Text>
            <View style={styles.optionsGrid}>
              {SUPPLY_TYPES.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    selectedSupplyTypes.includes(option) && styles.optionButtonSelected,
                  ]}
                  onPress={() => toggleSupplyType(option)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedSupplyTypes.includes(option) && styles.optionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Number of Supplies</Text>
            <TextInput
              style={styles.input}
              value={numSupplies}
              onChangeText={setNumSupplies}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Males Reached</Text>
            <TextInput
              style={styles.input}
              value={malesReached}
              onChangeText={setMalesReached}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Females Reached</Text>
            <TextInput
              style={styles.input}
              value={femalesReached}
              onChangeText={setFemalesReached}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Outreach Date</Text>
            <TextInput
              style={styles.input}
              value={outreachDate}
              onChangeText={setOutreachDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Team Members</Text>
            <TextInput
              style={styles.input}
              value={teamMembers}
              onChangeText={setTeamMembers}
              placeholder="e.g., John D., Maria S., Alex R."
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Team Organization</Text>
            <TextInput
              style={styles.input}
              value={memberOrganization}
              onChangeText={setMemberOrganization}
              placeholder="e.g., Casa Vida, El Paso Health Dept"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Number of Trips</Text>
            <TextInput
              style={styles.input}
              value={tripCount}
              onChangeText={setTripCount}
              placeholder="1"
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
  quickSelectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 8,
  },
  zipOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  zipOptionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  zipOptionButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  zipOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  zipOptionTextSelected: {
    color: '#ffffff',
  },
});