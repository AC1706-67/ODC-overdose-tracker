import React, { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useSession';

export function AuthTest() {
  const [testing, setTesting] = useState(false);
  const session = useSession();

  const testDatabaseConnection = async () => {
    if (!session) {
      Alert.alert('Error', 'No active session');
      return;
    }

    setTesting(true);
    try {
      // Test a simple select query
      const { data, error } = await supabase
        .from('incidents')
        .select('count')
        .limit(1);

      if (error) {
        Alert.alert('Database Test Failed', error.message);
      } else {
        Alert.alert('Database Test Passed', 'Successfully connected to Supabase!');
      }
    } catch (error) {
      Alert.alert('Database Test Error', 'Unexpected error occurred');
    } finally {
      setTesting(false);
    }
  };

  if (!session) {
    return null; // Don't show test button if not authenticated
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authentication Test</Text>
      <Text style={styles.status}>✅ User authenticated</Text>
      <Text style={styles.email}>Email: {session.user?.email}</Text>
      <Button 
        title={testing ? "Testing..." : "Test Database Connection"} 
        onPress={testDatabaseConnection}
        disabled={testing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f9ff',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#0c4a6e',
  },
  status: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
});