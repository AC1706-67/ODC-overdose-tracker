import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/src/lib/supabase';
import { useOrg } from '@/src/context/OrgContext';

export default function SelectOrgScreen() {
  const { setActiveOrgId } = useOrg();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitCode = async () => {
    if (!code.trim()) {
      Alert.alert('Enter a code', 'Please enter your invite code.');
      return;
    }

    setLoading(true);
    try {
      // 1. Look up the invite code
      const { data: invite, error: inviteError } = await supabase
        .from('organization_invite_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (inviteError || !invite) {
        Alert.alert('Invalid Code', 'That invite code is not valid or has expired.');
        return;
      }

      // 2. Check max uses
      if (invite.max_uses && invite.current_uses >= invite.max_uses) {
        Alert.alert('Code Expired', 'This invite code has reached its maximum uses.');
        return;
      }

      // 3. Check expiration
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        Alert.alert('Code Expired', 'This invite code has expired.');
        return;
      }

      // 4. Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 5. Insert into user_organizations
      const { error: memberError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: invite.organization_id,
          role: invite.role,
        });

      if (memberError && memberError.code !== '23505') {
        throw memberError;
      }

      // 6. Increment current_uses
      await supabase
        .from('organization_invite_codes')
        .update({ current_uses: invite.current_uses + 1 })
        .eq('id', invite.id);

      // 7. Record redemption
      await supabase.from('organization_invite_redemptions').insert({
        invite_code_id: invite.id,
        user_id: user.id,
        organization_id: invite.organization_id,
        role: invite.role,
      });

      // 8. Set active org and navigate
      await setActiveOrgId(invite.organization_id);
      Alert.alert('Welcome!', 'You have successfully joined the organization.', [
        { text: "Let's go!", onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      console.error('[InviteCode] Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
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
        <Text style={styles.headerTitle}>Join Organization</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="key-outline" size={64} color="#2563eb" style={styles.icon} />
        <Text style={styles.title}>Enter Your Invite Code</Text>
        <Text style={styles.subtitle}>
          Ask your organization administrator for your invite code to get started.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. RALLY2026"
          placeholderTextColor="#9ca3af"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmitCode}
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  icon: { marginBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
