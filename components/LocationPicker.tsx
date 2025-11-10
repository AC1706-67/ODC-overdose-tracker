import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { MapPin, Plus, X, Search } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface Location {
  id: string;
  name: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type: 'intersection' | 'address' | 'area';
  is_active: boolean;
}

interface LocationPickerProps {
  selectedLocation: Location | null;
  onLocationChange: (location: Location | null) => void;
  legacyLocationText?: string;
  onLegacyLocationChange?: (text: string) => void;
}

export default function LocationPicker({ 
  selectedLocation, 
  onLocationChange, 
  legacyLocationText = '',
  onLegacyLocationChange 
}: LocationPickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (isModalVisible) {
      loadLocations();
    }
  }, [isModalVisible]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      Alert.alert('Error', 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const createNewLocation = async () => {
    if (!newLocationInput.trim()) {
      setCreateError('Location name is required');
      return;
    }

    setLoading(true);
    setCreateError('');
    
    try {
      const { data, error } = await supabase.rpc('create_location_simple_v2', {
        p_name_or_intersection: newLocationInput.trim()
      });

      if (error) {
        console.error('create_location_simple_v2 error:', error);
        setCreateError(error.message || 'Failed to create location');
        return;
      }

      // Use the returned data to create location object
      const newLocation: Location = {
        id: data.id,
        name: data.name,
        address: data.address,
        zip_code: data.zip_code,
        city: data.city,
        state: data.state,
        location_type: data.location_type,
        is_active: data.is_active
      };

      // Add to available locations list
      setAvailableLocations(prev => [...prev, newLocation]);
      
      // Auto-select the new location
      onLocationChange(newLocation);
      
      // Close modal and reset form
      resetForm();
      setIsModalVisible(false);
      
    } catch (error: any) {
      console.error('Error creating location:', error);
      setCreateError(error?.message || 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewLocationInput('');
    setIsCreatingNew(false);
    setSearchQuery('');
    setCreateError('');
  };

  const selectLocation = (location: Location) => {
    onLocationChange(location);
    setIsModalVisible(false);
    resetForm();
  };

  const clearLocation = () => {
    onLocationChange(null);
    if (onLegacyLocationChange) {
      onLegacyLocationChange('');
    }
  };

  const filteredLocations = availableLocations.filter(location =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location.address && location.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (location.city && location.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const locationTypes = [
    { value: 'intersection', label: 'Intersection' },
    { value: 'address', label: 'Address' },
    { value: 'area', label: 'Area/Zone' }
  ] as const;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Location</Text>
      
      {/* Current Selection Display */}
      <View style={styles.selectionContainer}>
        {selectedLocation ? (
          <View style={styles.selectedLocation}>
            <View style={styles.locationInfo}>
              <MapPin size={16} color="#059669" />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{selectedLocation.name}</Text>
                {selectedLocation.address && (
                  <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
                )}
                {selectedLocation.city && (
                  <Text style={styles.locationCity}>
                    {selectedLocation.city}{selectedLocation.state && `, ${selectedLocation.state}`}
                    {selectedLocation.zip_code && ` ${selectedLocation.zip_code}`}
                  </Text>
                )}
                <Text style={styles.locationType}>
                  {locationTypes.find(t => t.value === selectedLocation.location_type)?.label}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={clearLocation} style={styles.clearButton}>
              <X size={16} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptySelection}>
            {useManualEntry ? (
              <TextInput
                style={styles.manualInput}
                placeholder="Enter location manually (e.g., Montana & Sioux)"
                value={legacyLocationText}
                onChangeText={onLegacyLocationChange}
                multiline
              />
            ) : (
              <Text style={styles.emptyText}>No location selected</Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setIsModalVisible(true)}
        >
          <MapPin size={20} color="#059669" />
          <Text style={styles.selectButtonText}>
            {selectedLocation ? 'Change Location' : 'Select Location'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.manualButton, useManualEntry && styles.manualButtonActive]}
          onPress={() => {
            setUseManualEntry(!useManualEntry);
            if (!useManualEntry) {
              onLocationChange(null);
            } else if (onLegacyLocationChange) {
              onLegacyLocationChange('');
            }
          }}
        >
          <Text style={[styles.manualButtonText, useManualEntry && styles.manualButtonTextActive]}>
            Manual Entry
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity
              onPress={() => {
                setIsModalVisible(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Create New Location Section */}
            {!isCreatingNew ? (
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => setIsCreatingNew(true)}
              >
                <Plus size={20} color="#059669" />
                <Text style={styles.createNewText}>Create New Location</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createForm}>
                <Text style={styles.createFormTitle}>Create New Location</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="Enter location name or intersection"
                  value={newLocationInput}
                  onChangeText={(text) => {
                    setNewLocationInput(text);
                    setCreateError('');
                  }}
                  autoFocus
                />
                
                {createError ? (
                  <Text style={styles.errorText}>{createError}</Text>
                ) : null}
                
                <View style={styles.createFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => resetForm()}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createButton, !newLocationInput.trim() && styles.createButtonDisabled]}
                    onPress={createNewLocation}
                    disabled={!newLocationInput.trim() || loading}
                  >
                    <Text style={styles.createButtonText}>
                      {loading ? 'Creating...' : 'Create Location'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Available Locations List */}
            <Text style={styles.sectionTitle}>Available Locations</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : filteredLocations.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No locations found matching your search' : 'No locations found'}
              </Text>
            ) : (
              filteredLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.locationItem}
                  onPress={() => selectLocation(location)}
                >
                  <View style={styles.locationItemContent}>
                    <MapPin size={20} color="#6b7280" />
                    <View style={styles.locationItemDetails}>
                      <Text style={styles.locationItemName}>{location.name}</Text>
                      {location.address && (
                        <Text style={styles.locationItemAddress}>{location.address}</Text>
                      )}
                      <View style={styles.locationItemMeta}>
                        <Text style={styles.locationItemType}>
                          {locationTypes.find(t => t.value === location.location_type)?.label}
                        </Text>
                        {location.city && (
                          <Text style={styles.locationItemCity}>
                            • {location.city}{location.state && `, ${location.state}`}
                          </Text>
                        )}
                        {location.zip_code && (
                          <Text style={styles.locationItemZip}>• {location.zip_code}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectionContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    marginBottom: 12,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  locationDetails: {
    marginLeft: 8,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationType: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  clearButton: {
    padding: 4,
  },
  emptySelection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  manualInput: {
    fontSize: 16,
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 40,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  manualButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  manualButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  manualButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  manualButtonTextActive: {
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    marginLeft: 8,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  createNewText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createForm: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  createFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
    marginTop: -8,
  },
  createFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  loadingText: {
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 20,
  },
  locationItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationItemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationItemAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  locationItemType: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationItemCity: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  locationItemZip: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});