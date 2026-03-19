import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserTypeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compassionate LOG</Text>
      <Text style={styles.subtitle}>How will you use Compassionate Log?</Text>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/signup?userType=individual')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
          <Ionicons name="person" size={32} color="#d97706" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Personal Health Tracker</Text>
          <Text style={styles.optionDescription}>
            Track incidents and personal health data for yourself or your
            community. No organization needed.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/signup?userType=organization')}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#ede9fe' }]}>
          <Ionicons name="people" size={32} color="#7c3aed" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>Organization / Outreach Worker</Text>
          <Text style={styles.optionDescription}>
            Peer specialist or outreach worker with an organization. Full access
            to outreach logs, dashboards, and team features.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>
          Already have an account? <Text style={styles.backBold}>Sign in</Text>
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backText: {
    fontSize: 14,
    color: '#6b7280',
  },
  backBold: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
