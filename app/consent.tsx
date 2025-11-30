import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export default function ConsentScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function acceptTerms() {
    if (!agreedToTerms) {
      Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Error', 'You must be logged in');
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({
        terms_accepted_at: now,
        privacy_accepted_at: now,
        accepted_version: '1.0',
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save your acceptance. Please try again.');
      console.error('Terms acceptance error:', error);
      return;
    }

    Alert.alert(
      'Success',
      'Thank you for accepting our terms. You can now continue.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/onboarding'),
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms & Privacy</Text>
      <Text style={styles.subtitle}>
        Before you can join an organization, you must accept our Terms of Service and Privacy Policy.
      </Text>

      <View style={styles.linksContainer}>
        <Pressable 
          style={styles.linkButton}
          onPress={() => router.push('/legal/terms')}
        >
          <Text style={styles.linkButtonText}>📄 Read Terms of Service</Text>
        </Pressable>

        <Pressable 
          style={styles.linkButton}
          onPress={() => router.push('/legal/privacy')}
        >
          <Text style={styles.linkButtonText}>🔒 Read Privacy Policy</Text>
        </Pressable>
      </View>

      <Pressable 
        style={styles.checkboxContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        disabled={loading}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I have read and agree to the Terms of Service and Privacy Policy
        </Text>
      </Pressable>

      <Pressable
        style={[styles.button, (!agreedToTerms || loading) && styles.buttonDisabled]}
        onPress={acceptTerms}
        disabled={!agreedToTerms || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Accept & Continue'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
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
    paddingTop: 60,
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
  linksContainer: {
    gap: 12,
    marginBottom: 32,
  },
  linkButton: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  linkButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
