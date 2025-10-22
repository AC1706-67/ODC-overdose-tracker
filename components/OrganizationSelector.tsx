import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Building2, ChevronDown, Users, Settings } from 'lucide-react-native';
import { useUserOrganizations, useProfile } from '@/hooks/useOrganizations';
import { UserOrganizationInfo } from '@/types/organization';

interface OrganizationSelectorProps {
  selectedOrgId?: string;
  onOrganizationChange?: (org: UserOrganizationInfo | null) => void;
  showCreateOption?: boolean;
}

export function OrganizationSelector({ 
  selectedOrgId, 
  onOrganizationChange,
  showCreateOption = false 
}: OrganizationSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { organizations, loading } = useUserOrganizations();
  const { profile, updateProfile } = useProfile();

  const selectedOrg = organizations.find(org => org.organization_id === selectedOrgId) ||
                     organizations.find(org => org.is_default) ||
                     organizations[0];

  const handleOrgSelect = async (org: UserOrganizationInfo) => {
    setModalVisible(false);
    onOrganizationChange?.(org);
    
    // Update user's default organization
    if (profile && org.organization_id !== profile.default_organization_id) {
      await updateProfile({ default_organization_id: org.organization_id });
    }
  };

  const handleCreateOrganization = () => {
    setModalVisible(false);
    Alert.alert(
      'Create Organization',
      'Organization creation will be implemented in the admin panel.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading organizations...</Text>
      </View>
    );
  }

  if (organizations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noOrgText}>No organizations found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <Building2 size={20} color="#3b82f6" />
          <View style={styles.orgInfo}>
            <Text style={styles.orgName} numberOfLines={1}>
              {selectedOrg?.organization_name || 'Select Organization'}
            </Text>
            <Text style={styles.orgRole} numberOfLines={1}>
              {selectedOrg?.user_role || 'No role'}
            </Text>
          </View>
          <ChevronDown size={20} color="#6b7280" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Organization</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.orgList}>
              {organizations.map((org) => (
                <TouchableOpacity
                  key={org.organization_id}
                  style={[
                    styles.orgItem,
                    selectedOrg?.organization_id === org.organization_id && styles.orgItemSelected,
                  ]}
                  onPress={() => handleOrgSelect(org)}
                >
                  <View style={styles.orgItemContent}>
                    <Building2 
                      size={24} 
                      color={selectedOrg?.organization_id === org.organization_id ? '#3b82f6' : '#6b7280'} 
                    />
                    <View style={styles.orgItemInfo}>
                      <Text style={[
                        styles.orgItemName,
                        selectedOrg?.organization_id === org.organization_id && styles.orgItemNameSelected,
                      ]}>
                        {org.organization_name}
                      </Text>
                      <View style={styles.orgItemMeta}>
                        <Text style={styles.orgItemRole}>{org.user_role}</Text>
                        {org.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {showCreateOption && (
                <TouchableOpacity
                  style={styles.createOrgButton}
                  onPress={handleCreateOrganization}
                >
                  <View style={styles.orgItemContent}>
                    <Users size={24} color="#059669" />
                    <View style={styles.orgItemInfo}>
                      <Text style={styles.createOrgText}>Create New Organization</Text>
                      <Text style={styles.createOrgSubtext}>Set up a new health center or agency</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  noOrgText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    padding: 16,
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orgRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  orgList: {
    padding: 20,
  },
  orgItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orgItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  orgItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orgItemNameSelected: {
    color: '#3b82f6',
  },
  orgItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  orgItemRole: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  createOrgButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  createOrgText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  createOrgSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});