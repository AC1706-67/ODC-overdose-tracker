import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';
import { joinOrganizationWithCode } from '@/src/api/organizationOnboarding';

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
      const result = await joinOrganizationWithCode(code);

      // Set the active org in context
      await setActiveOrgId(result.organizationId);

      Alert.alert('Success!', 'You have joined the organization', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      console.error('Error:', error);
      
      // Check if user needs to accept terms
      if (error.message === 'TERMS_NOT_ACCEPTED') {
        Alert.alert(
          'Terms Required',
          'You must accept our Terms of Service and Privacy Policy before joining an organization.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Accept Terms', 
              onPress: () => router.push('/consent')
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Something went wrong');
      }
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
    paddingBottom: 100, // Extra space for phone navigation bar
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
