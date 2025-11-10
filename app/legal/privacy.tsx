import { ScrollView, Text, View, StyleSheet } from 'react-native';

export default function Privacy() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.date}>Last updated: November 2025</Text>

      <Text style={styles.paragraph}>
        Compassionate LOG ("the App") is designed as a community support and public health tool. It
        assists organizations in tracking overdose incidents and related outreach data. We value the
        privacy of all users and are committed to protecting it.
      </Text>

      <Text style={styles.sectionTitle}>1. Data Collection</Text>
      <Text style={styles.paragraph}>
        The App does not collect, store, or transmit any personally identifiable information (PII) or
        protected health information (PHI). All data entered is anonymized, aggregated, and used
        solely for reporting and community program development.
      </Text>

      <Text style={styles.sectionTitle}>2. Data Storage</Text>
      <Text style={styles.paragraph}>
        Any local data stored on a device remains under the user's control. Users can clear all locally
        stored information at any time by using their device's data management settings.
      </Text>

      <Text style={styles.sectionTitle}>3. Third-Party Sharing</Text>
      <Text style={styles.paragraph}>
        We do not share, sell, or transfer data to third parties, advertisers, or analytics services.
      </Text>

      <Text style={styles.sectionTitle}>4. Security</Text>
      <Text style={styles.paragraph}>
        The App employs secure communication and data practices; however, users are encouraged not to
        enter any identifiable personal or medical details. Compassionate LOG and its developers are
        not responsible for user input containing personal data.
      </Text>

      <Text style={styles.sectionTitle}>5. Policy Updates</Text>
      <Text style={styles.paragraph}>
        We may revise this policy periodically. Updates will be reflected in the version date at the
        top of this document.
      </Text>

      <Text style={styles.sectionTitle}>6. Contact</Text>
      <Text style={styles.paragraph}>
        Questions regarding this policy may be directed to support@anonymoushaven.ai.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 12,
  },
});
