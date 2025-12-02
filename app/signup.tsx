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
import { useRouter } from 'expo-router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUp() {
    // Validation
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
    const { error } = await supabase.auth.signUp({
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
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    // Success
    Alert.alert('Success', 'Account created! You can now sign in.', [
      {
        text: 'OK',
        onPress: () => router.back(),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Join Compassionate LOG to start recording acts of care
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        placeholder="Password (min 6 characters)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        placeholder="Confirm Password"
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
