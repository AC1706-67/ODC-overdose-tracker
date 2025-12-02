/**
 * EXAMPLE: Login screen with enhanced logging and assertions
 * This shows best practices for debugging and monitoring
 */

import { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { createLogger } from '@/src/utils/logger';

// Create a logger for this component
const logger = createLogger('LoginScreen');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    logger.action('Sign in button clicked', { email });

    // Validate inputs with assertions
    if (!email || !password) {
      logger.warn('Sign in attempted with missing credentials');
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Assert email format
    logger.assert(email.includes('@'), 'Invalid email format', { email });

    setLoading(true);

    try {
      // Time the authentication request
      const { error } = await logger.time('Sign in with password', async () => {
        logger.api('POST', '/auth/signin', { email });
        return await supabase.auth.signInWithPassword({ email, password });
      });

      setLoading(false);

      if (error) {
        logger.error('Sign in failed', error, { email });
        Alert.alert('Sign in failed', error.message);
        return;
      }

      logger.info('Sign in successful', { email });
      logger.navigation('Home', { from: 'login' });
      router.replace('/');
    } catch (error) {
      setLoading(false);
      logger.error('Unexpected error during sign in', error as Error, {
        email,
      });
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }

  function handleSignUpNavigation() {
    logger.navigation('SignUp', { from: 'login' });
    router.push('/signup');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compassionate LOG</Text>
      <Text style={styles.subtitle}>
        Recording acts of care and compassion - Sign in to continue
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          logger.debug('Email input changed', { length: value.length });
        }}
        style={styles.input}
        editable={!loading}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          logger.debug('Password input changed', { length: value.length });
        }}
        style={styles.input}
        editable={!loading}
      />

      <Button
        title={loading ? 'Signing in...' : 'Sign in'}
        onPress={signIn}
        disabled={loading}
      />

      <TouchableOpacity
        onPress={handleSignUpNavigation}
        style={styles.linkContainer}
        disabled={loading}
      >
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
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
});
