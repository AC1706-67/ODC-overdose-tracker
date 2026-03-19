import { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SignUp() {
  const { userType = 'organization' } = useLocalSearchParams<{ userType?: string }>();
  const isIndividual = userType === 'individual';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        'Error',
        'You must agree to the Terms of Service and Privacy Policy',
      );
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();

    try {
      console.log('[Signup] Starting signup for:', email, 'userType:', userType);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            terms_accepted_at: now,
            privacy_accepted_at: now,
            accepted_version: '1.0',
          },
        },
      });

      if (authError) {
        console.error('[Signup] Auth error:', authError);
        Alert.alert('Sign up failed', authError.message);
        return;
      }

      if (!authData.user) {
        console.error('[Signup] No user returned from signUp');
        Alert.alert('Error', 'User creation failed - no user returned');
        return;
      }

      console.log('[Signup] ✅ Auth user created:', authData.user.id);

      // Step 2: Create profile with user_type
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          user_type: isIndividual ? 'individual' : 'organization',
          terms_accepted_at: now,
          privacy_accepted_at: now,
          accepted_version: '1.0',
        });

      if (profileError) {
        if (
          profileError.message.includes('duplicate key') ||
          profileError.message.includes('unique constraint') ||
          profileError.code === '23505'
        ) {
          console.log('[Signup] ℹ️ Profile already exists, updating user_type');
          await supabase
            .from('profiles')
            .update({ user_type: isIndividual ? 'individual' : 'organization' })
            .eq('id', authData.user.id);
        } else {
          console.error('[Signup] Profile creation error:', profileError);
          Alert.alert(
            'Profile Error',
            'Failed to create profile.\n\nError: ' + profileError.message,
          );
          return;
        }
      } else {
        console.log('[Signup] ✅ Profile created');
      }

      // Step 3: Org assignment — only for organization users
      if (!isIndividual) {
        const { data: defaultOrg, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, slug')
          .eq('slug', 'anonymous-haven-ai')
          .single();

        if (orgError || !defaultOrg) {
          console.error('[Signup] Default org not found:', orgError);
          Alert.alert(
            'Setup Error',
            'Default organization not found. Please contact support.\n\nError: ' +
              (orgError?.message || 'No org found'),
          );
          return;
        }

        console.log('[Signup] ✅ Found default org:', defaultOrg.name);

        const { error: membershipError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: authData.user.id,
            organization_id: defaultOrg.id,
            role: 'Responder',
            is_active: true,
          });

        if (membershipError) {
          console.error('[Signup] Membership creation error:', membershipError);
          Alert.alert(
            'Organization Error',
            'Failed to assign organization.\n\nError: ' +
              membershipError.message,
          );
          return;
        }

        console.log('[Signup] ✅ User assigned to org');
      } else {
        console.log('[Signup] ℹ️ Individual user — skipping org assignment');
      }

      // Step 4: Sign out so user can sign in properly
      if (authData.session) {
        await supabase.auth.signOut();
      }

      console.log('[Signup] ✅ Signup complete!');
      Alert.alert('Success', 'Account created! You can now sign in.', [
        {
          text: 'OK',
          onPress: () => router.replace('/login'),
        },
      ]);
    } catch (err: any) {
      console.error('[Signup] Unexpected error:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred.\n\nError: ' +
          (err?.message || String(err)),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        {isIndividual
          ? 'Personal health tracker — no organization required'
          : 'Organization account — full outreach and team features'}
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#6b7280"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#6b7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        placeholder="Confirm Password"
        placeholderTextColor="#6b7280"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
        editable={!loading}
      />

      <Pressable
        style={styles.checkboxContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        disabled={loading}
      >
        <View
          style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
        >
          {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the{' '}
          <Text style={styles.link} onPress={() => router.push('/legal/terms')}>
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            style={styles.link}
            onPress={() => router.push('/legal/privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </Pressable>

      <Button
        title={loading ? 'Creating account...' : 'Sign Up'}
        onPress={signUp}
        disabled={loading || !agreedToTerms}
      />

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.linkContainer}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#fff',
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkBold: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  link: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
});
