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
import { Plus, X, User, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useOrg } from '@/src/context/OrgContext';

interface TeamMember {
  id: string;
  name: string;
  organization_id: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active: boolean;
}

interface SelectedTeamMember extends TeamMember {
  role_in_activity?: string;
}

interface TeamMemberPickerProps {
  selectedMembers: SelectedTeamMember[];
  onMembersChange: (members: SelectedTeamMember[]) => void;
}

export default function TeamMemberPicker({ selectedMembers, onMembersChange }: TeamMemberPickerProps) {
  const { activeOrgId } = useOrg();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalVisible && activeOrgId) {
      loadTeamMembers();
    }
  }, [isModalVisible, activeOrgId]);

  const loadTeamMembers = async () => {
    if (!activeOrgId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', activeOrgId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAvailableMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const createNewMember = async () => {
    if (!newMemberName.trim()) return;

    setLoading(true);
    try {
      // Get organization slug from activeOrgId
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', activeOrgId)
        .single();

      if (orgError) throw orgError;
      if (!orgData?.slug) throw new Error('Organization slug not found');

      // Use the create_team_member RPC function
      const { data, error } = await supabase.rpc('create_team_member', {
        p_full_name: newMemberName.trim(),
        p_email: newMemberEmail.trim(),
        p_role: newMemberRole.trim(),
        p_org_slug: orgData.slug
      });

      if (error) {
        console.error('create_team_member error', error);
        throw error;
      }

      // Convert the returned JSON to TeamMember format
      const newMember: TeamMember = {
        id: data.id,
        name: data.name,
        organization_id: data.organization_id,
        email: data.email,
        phone: null, // Not handled by RPC function yet
        role: data.role,
        is_active: data.is_active
      };

      // Add to available members (or update if it was an existing member)
      if (data.action === 'created') {
        setAvailableMembers(prev => [...prev, newMember]);
      } else {
        setAvailableMembers(prev => 
          prev.map(member => member.id === newMember.id ? newMember : member)
        );
      }
      
      // Auto-select the new/updated member
      const selectedMember: SelectedTeamMember = {
        ...newMember,
        role_in_activity: 'volunteer'
      };
      
      // Check if already selected, if so update, otherwise add
      const isAlreadySelected = selectedMembers.some(m => m.id === newMember.id);
      if (isAlreadySelected) {
        onMembersChange(
          selectedMembers.map(member =>
            member.id === newMember.id ? selectedMember : member
          )
        );
      } else {
        onMembersChange([...selectedMembers, selectedMember]);
      }

      // Reset form
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberRole('');
      setIsCreatingNew(false);
      
      const actionText = data.action === 'created' ? 'created' : 'updated';
      Alert.alert('Success', `Team member ${actionText} and added to outreach`);
    } catch (error) {
      console.error('Error creating team member:', error);
      Alert.alert('Error', error.message || 'Failed to create team member');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (member: TeamMember) => {
    const isSelected = selectedMembers.some(m => m.id === member.id);
    
    if (isSelected) {
      onMembersChange(selectedMembers.filter(m => m.id !== member.id));
    } else {
      const selectedMember: SelectedTeamMember = {
        ...member,
        role_in_activity: 'volunteer'
      };
      onMembersChange([...selectedMembers, selectedMember]);
    }
  };

  const updateMemberRole = (memberId: string, role: string) => {
    onMembersChange(
      selectedMembers.map(member =>
        member.id === memberId
          ? { ...member, role_in_activity: role }
          : member
      )
    );
  };

  const removeMember = (memberId: string) => {
    onMembersChange(selectedMembers.filter(m => m.id !== memberId));
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleOptions = ['lead', 'volunteer', 'coordinator', 'supervisor'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Team Members</Text>
      
      {/* Selected Members Display */}
      <View style={styles.selectedContainer}>
        {selectedMembers.length === 0 ? (
          <Text style={styles.emptyText}>No team members selected</Text>
        ) : (
          selectedMembers.map((member) => (
            <View key={member.id} style={styles.selectedMember}>
              <View style={styles.memberInfo}>
                <User size={16} color="#059669" />
                <Text style={styles.memberName}>{member.name}</Text>
                {member.role_in_activity && (
                  <Text style={styles.memberRole}>({member.role_in_activity})</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => removeMember(member.id)}
                style={styles.removeButton}
              >
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Add Members Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Plus size={20} color="#059669" />
        <Text style={styles.addButtonText}>Add Team Members</Text>
      </TouchableOpacity>

      {/* Team Member Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Team Members</Text>
            <TouchableOpacity
              onPress={() => {
                setIsModalVisible(false);
                setIsCreatingNew(false);
                setSearchQuery('');
              }}
              style={styles.closeButton}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search team members..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Create New Member Section */}
            {!isCreatingNew ? (
              <TouchableOpacity
                style={styles.createNewButton}
                onPress={() => setIsCreatingNew(true)}
              >
                <Plus size={20} color="#059669" />
                <Text style={styles.createNewText}>Create New Team Member</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.createForm}>
                <Text style={styles.createFormTitle}>Create New Team Member</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Role (optional)"
                  value={newMemberRole}
                  onChangeText={setNewMemberRole}
                />
                <View style={styles.createFormButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsCreatingNew(false);
                      setNewMemberName('');
                      setNewMemberEmail('');
                      setNewMemberRole('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createButton, !newMemberName.trim() && styles.createButtonDisabled]}
                    onPress={createNewMember}
                    disabled={!newMemberName.trim() || loading}
                  >
                    <Text style={styles.createButtonText}>
                      {loading ? 'Creating...' : 'Create & Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Available Members List */}
            <Text style={styles.sectionTitle}>Available Team Members</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading...</Text>
            ) : filteredMembers.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No members found matching your search' : 'No team members found'}
              </Text>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMembers.some(m => m.id === member.id);
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.memberItem, isSelected && styles.memberItemSelected]}
                    onPress={() => toggleMemberSelection(member)}
                  >
                    <View style={styles.memberItemContent}>
                      <User size={20} color={isSelected ? "#059669" : "#6b7280"} />
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberItemName, isSelected && styles.memberItemNameSelected]}>
                          {member.name}
                        </Text>
                        {member.role && (
                          <Text style={styles.memberItemRole}>{member.role}</Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <Check size={20} color="#059669" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Selected Members with Role Assignment */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedSectionTitle}>
                Selected Members ({selectedMembers.length})
              </Text>
              <ScrollView style={styles.selectedList} showsVerticalScrollIndicator={false}>
                {selectedMembers.map((member) => (
                  <View key={member.id} style={styles.selectedMemberRow}>
                    <Text style={styles.selectedMemberName}>{member.name}</Text>
                    <View style={styles.roleSelector}>
                      {roleOptions.map((role) => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleOption,
                            member.role_in_activity === role && styles.roleOptionSelected
                          ]}
                          onPress={() => updateMemberRole(member.id, role)}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            member.role_in_activity === role && styles.roleOptionTextSelected
                          ]}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}const
 styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectedContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    marginBottom: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  selectedMember: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  memberRole: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
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
  addButtonText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  memberItemSelected: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  memberItemNameSelected: {
    color: '#059669',
  },
  memberItemRole: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  selectedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: 200,
  },
  selectedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  selectedList: {
    flex: 1,
  },
  selectedMemberRow: {
    marginBottom: 12,
  },
  selectedMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleOption: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
  },
  doneButton: {
    backgroundColor: '#059669',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});