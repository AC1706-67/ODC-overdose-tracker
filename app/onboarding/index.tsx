import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrg } from '@/src/context/OrgContext';

export default function OnboardingScreen() {
  const { skipOnboarding } = useOrg();

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Compassionate LOG</Text>
        <Text style={styles.subtitle}>How would you like to join?</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/onboarding/enter-code')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="key" size={32} color="#2563eb" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>I have an organization code</Text>
            <Text style={styles.optionDescription}>
              Enter your organization's invite code to join
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/onboarding/select-org')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={32} color="#059669" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Join a certified organization</Text>
            <Text style={styles.optionDescription}>
              Browse and join existing organizations
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/onboarding/request-org')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={32} color="#7c3aed" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Request organization certification</Text>
            <Text style={styles.optionDescription}>
              My organization is not listed
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip for now</Text>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  skipButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
