import { ScrollView, Text, StyleSheet } from 'react-native';

export default function Terms() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.date}>Last updated: November 2025</Text>

      <Text style={styles.paragraph}>
        By using Compassionate LOG ("the App"), you agree to the following terms and conditions.
        The App is operated under the umbrella of Anonymous Haven and provided for informational,
        non-clinical purposes only.
      </Text>

      <Text style={styles.sectionTitle}>1. Purpose</Text>
      <Text style={styles.paragraph}>
        The App is intended to support overdose tracking and data collection for community recovery
        programs. It is not a substitute for medical care, emergency response, or licensed
        professional treatment.
      </Text>

      <Text style={styles.sectionTitle}>2. Feature Availability</Text>
      <Text style={styles.paragraph}>
        Certain features such as the Outreach Log are made available only to authorized
        organizations and may be limited, inactive, or subject to testing during development. The
        primary live feature is the Overdose Tracker.
      </Text>

      <Text style={styles.sectionTitle}>3. User Responsibility</Text>
      <Text style={styles.paragraph}>
        Users agree to use the App solely for its intended purposes and in compliance with applicable
        laws. Data entered must be accurate and free of personal identifiers.
      </Text>

      <Text style={styles.sectionTitle}>4. No Guarantee of Outcomes</Text>
      <Text style={styles.paragraph}>
        We make no guarantee of specific results or service continuity. The App is provided "as is,"
        without warranties, either express or implied.
      </Text>

      <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
      <Text style={styles.paragraph}>
        Anonymous Haven, its founders, and contributors shall not be liable for any direct, indirect,
        incidental, or consequential damages arising from the use or inability to use the App.
      </Text>

      <Text style={styles.sectionTitle}>6. Data Use and Anonymity</Text>
      <Text style={styles.paragraph}>
        All data recorded through the App is anonymized and aggregated for public health and
        program improvement purposes only.
      </Text>

      <Text style={styles.sectionTitle}>7. Termination and Updates</Text>
      <Text style={styles.paragraph}>
        We reserve the right to modify, suspend, or discontinue the App or its features at any time
        without prior notice.
      </Text>

      <Text style={styles.sectionTitle}>8. Contact</Text>
      <Text style={styles.paragraph}>
        For questions, assistance, or feedback, please email support@anonymoushaven.ai.
      </Text>

      <Text style={styles.copyright}>
        © 2025 Anonymous Haven. All rights reserved.
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
  copyright: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 32,
    textAlign: 'center',
  },
});
