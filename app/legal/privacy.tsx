import { ScrollView, Text, StyleSheet } from 'react-native';

export default function Privacy() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Compassionate LOG</Text>
      <Text style={styles.subtitle}>Privacy Policy</Text>
      <Text style={styles.date}>Last Updated: March 2026 | Beta Release</Text>

      <Text style={styles.sectionTitle}>1. Overview</Text>
      <Text style={styles.paragraph}>
        Anonymous Haven ("we," "us," or "our") operates the Compassionate LOG
        mobile application ("the App"). This Privacy Policy explains how we
        collect, use, store, and protect information when you use the App. By
        using the App, you agree to the practices described in this policy.
      </Text>
      <Text style={styles.paragraph}>
        We are committed to protecting your privacy. We collect only what is
        necessary to operate the App and never sell your data to third parties.
      </Text>

      <Text style={styles.sectionTitle}>2. Information We Collect</Text>
      <Text style={styles.paragraph}>
        We collect two categories of information:
      </Text>
      <Text style={styles.paragraph}>
        a) Account Information: When you create an account, we collect your email
        address and a hashed (encrypted) password. This information is used
        solely to authenticate your identity and manage your account. We do not
        collect your name, phone number, physical address, or payment
        information during the current beta period.
      </Text>
      <Text style={styles.paragraph}>
        b) Incident and Outreach Data: Data you enter into the App — including
        zip code, age range, gender category, Narcan usage, and incident outcome
        — is collected for public health reporting and program improvement
        purposes. This data is designed to be anonymous and should never include
        names or personally identifying information about any individual.
      </Text>

      <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
      <Text style={styles.paragraph}>
        We use the information we collect to:
      </Text>
      <Text style={styles.bullet}>• Authenticate and manage your account</Text>
      <Text style={styles.bullet}>
        • Enable incident and outreach data entry and reporting
      </Text>
      <Text style={styles.bullet}>
        • Generate anonymized, aggregated reports for community health programs
      </Text>
      <Text style={styles.bullet}>
        • Improve the App's features and performance
      </Text>
      <Text style={styles.bullet}>
        • Respond to support requests sent to support@anonymoushaven.ai
      </Text>
      <Text style={styles.paragraph}>
        We do not use your information for advertising, marketing, or sale to
        third parties.
      </Text>

      <Text style={styles.sectionTitle}>
        4. Data Storage and Third-Party Processors
      </Text>
      <Text style={styles.paragraph}>
        Your account and app data is stored securely using Supabase, a
        third-party database and authentication platform. Supabase acts as a
        data processor on our behalf and is subject to its own privacy and
        security standards. Data is stored on servers located in the United
        States.
      </Text>
      <Text style={styles.paragraph}>
        We employ industry-standard security measures including row-level
        security (RLS), encrypted connections (TLS), and access controls to
        protect your data. Only authorized personnel — currently limited to the
        Anonymous Haven development team — have access to account-level data.
      </Text>

      <Text style={styles.sectionTitle}>5. Data Retention</Text>
      <Text style={styles.paragraph}>
        Account information is retained for as long as your account remains
        active. If you request account deletion (see Section 7), your account
        data will be removed within a reasonable timeframe.
      </Text>
      <Text style={styles.paragraph}>
        Anonymized incident and outreach data may be retained indefinitely for
        public health reporting and program evaluation purposes, as this data
        cannot be linked back to any individual.
      </Text>
      <Text style={styles.paragraph}>
        We will establish a formal data retention schedule prior to full public
        launch and will update this policy accordingly.
      </Text>

      <Text style={styles.sectionTitle}>6. Data Sharing</Text>
      <Text style={styles.paragraph}>
        We do not sell, rent, or trade your personal information. We may share
        aggregated, anonymized data with:
      </Text>
      <Text style={styles.bullet}>
        • Partner recovery organizations for public health reporting
      </Text>
      <Text style={styles.bullet}>
        • Grant-making bodies or public health agencies for program evaluation
      </Text>
      <Text style={styles.bullet}>
        • Government agencies if required by law
      </Text>
      <Text style={styles.paragraph}>
        Any such sharing involves only anonymized, aggregate-level data with no
        personally identifying information.
      </Text>

      <Text style={styles.sectionTitle}>
        7. Your Rights and Account Deletion
      </Text>
      <Text style={styles.paragraph}>You have the right to:</Text>
      <Text style={styles.bullet}>
        • Access the account information we hold about you
      </Text>
      <Text style={styles.bullet}>
        • Request correction of inaccurate account information
      </Text>
      <Text style={styles.bullet}>
        • Request deletion of your account and associated personal data
      </Text>
      <Text style={styles.paragraph}>
        To exercise any of these rights, contact us at
        support@anonymoushaven.ai. We will respond to requests within 30 days.
        Please note that anonymized incident data that cannot be linked to your
        identity may be retained even after account deletion.
      </Text>

      <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
      <Text style={styles.paragraph}>
        The App is not intended for use by individuals under the age of 18. We
        do not knowingly collect personal information from minors. If you believe
        a minor has created an account, please contact us at
        support@anonymoushaven.ai and we will remove the account promptly.
      </Text>

      <Text style={styles.sectionTitle}>9. HIPAA Notice</Text>
      <Text style={styles.paragraph}>
        Compassionate LOG is not a covered entity under the Health Insurance
        Portability and Accountability Act (HIPAA). The App is designed for
        anonymous, aggregate public health data collection and does not store
        Protected Health Information (PHI) as defined by HIPAA. Users should not
        enter any information that could identify a specific individual in any
        data field.
      </Text>

      <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
      <Text style={styles.paragraph}>
        We may update this Privacy Policy periodically. Material changes will be
        communicated by updating the "Last Updated" date at the top of this
        document and, where appropriate, through in-app notification. Your
        continued use of the App after changes are posted constitutes acceptance
        of the updated policy.
      </Text>

      <Text style={styles.sectionTitle}>11. Contact Us</Text>
      <Text style={styles.paragraph}>
        If you have questions, concerns, or requests regarding this Privacy
        Policy, please contact:
      </Text>
      <Text style={styles.paragraph}>
        Anonymous Haven{'\n'}
        Email: support@anonymoushaven.ai{'\n'}
        Website: anonymoushaven.ai{'\n'}
        El Paso, Texas
      </Text>

      <Text style={styles.copyright}>
        © 2026 Anonymous Haven. All rights reserved.
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
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
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 12,
  },
  copyright: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 32,
    textAlign: 'center',
  },
});
