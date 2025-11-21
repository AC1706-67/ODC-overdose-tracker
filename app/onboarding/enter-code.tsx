import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';

export default function EnterCodeScreen() {
  const { setActiveOrgId } = useOrg();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter an organization code');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Look up the invite code
      const { data: inviteCode, error: codeError } = await supabase
        .from('organization_invite_codes')
        .select('organization_id, role, is_active, max_uses, current_uses, expires_at')
        .eq('code', code.toUpperCase())
        .single();

      if (codeError || !inviteCode) {
        Alert.alert('Invalid Code', 'This organization code is not valid');
        return;
      }

      if (!inviteCode.is_active) {
        Alert.alert('Inactive Code', 'This code is no longer active');
        return;
      }

      if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
        Alert.alert('Expired Code', 'This code has expired');
        return;
      }

      if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
        Alert.alert('Code Limit Reached', 'This code has reached its maximum uses');
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', inviteCode.organization_id)
        .single();

      if (existing) {
        Alert.alert('Already a Member', 'You are already a member of this organization');
        router.replace('/(tabs)');
        return;
      }

      // Join the organization
      const { error: joinError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: inviteCode.organization_id,
          role: inviteCode.role,
        });

      if (joinError) {
        console.error('Join error:', joinError);
        Alert.alert('Error', 'Failed to join organization');
        return;
      }

      // Increment code usage
      await supabase.rpc('increment_invite_code_usage', { code_text: code.toUpperCase() });

      // Set the active org in context
      await setActiveOrgId(inviteCode.organization_id);

      Alert.alert('Success!', 'You have joined the organization', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong');
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
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="key" size={48} color="#2563eb" />
        </View>

        <Text style={styles.title}>Enter Organization Code</Text>
        <Text style={styles.subtitle}>
          Enter the code provided by your organization
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., RAEP2025"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
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
            <Text style={styles.buttonText}>Join Organization</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
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
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
