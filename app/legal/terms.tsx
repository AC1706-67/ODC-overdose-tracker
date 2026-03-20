import { ScrollView, Text, StyleSheet } from 'react-native';

export default function Terms() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Compassionate LOG</Text>
      <Text style={styles.subtitle}>Terms of Service</Text>
      <Text style={styles.date}>Last Updated: March 2026 | Beta Release</Text>

      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.paragraph}>
        By downloading, accessing, or using the Compassionate LOG mobile
        application ("the App"), you agree to be bound by these Terms of Service
        ("Terms"). If you do not agree to these Terms, do not use the App. These
        Terms constitute a legally binding agreement between you and Anonymous
        Haven ("we," "us," or "our"), a Texas-based recovery technology company.
      </Text>

      <Text style={styles.sectionTitle}>2. Beta Status</Text>
      <Text style={styles.paragraph}>
        Compassionate LOG is currently in beta / pre-launch status. Features,
        functionality, and data handling practices may change without prior
        notice. The App is provided "as is" during this period and may contain
        bugs, errors, or incomplete features. We appreciate your participation
        in helping improve the platform.
      </Text>

      <Text style={styles.sectionTitle}>3. Purpose and Intended Use</Text>
      <Text style={styles.paragraph}>
        The App is designed to support overdose incident tracking and outreach
        data collection for community recovery programs and peer support
        organizations. It is intended for use by:
      </Text>
      <Text style={styles.bullet}>
        • Individual users who wish to anonymously report health incidents in
        their community.
      </Text>
      <Text style={styles.bullet}>
        • Certified peer support organizations and outreach workers who use the
        App for program data collection and reporting.
      </Text>
      <Text style={styles.paragraph}>
        The App is not a substitute for emergency medical care, licensed clinical
        treatment, or professional crisis intervention. In the event of a
        medical emergency, call 911 immediately.
      </Text>

      <Text style={styles.sectionTitle}>4. User Accounts and Registration</Text>
      <Text style={styles.paragraph}>
        To access the App, you must create an account using a valid email address
        and password. You are responsible for maintaining the confidentiality of
        your account credentials and for all activity that occurs under your
        account. You agree to notify us immediately at support@anonymoushaven.ai
        if you suspect unauthorized access to your account.
      </Text>
      <Text style={styles.paragraph}>
        Organization accounts are subject to a separate certification and
        approval process administered by Anonymous Haven. Access to full
        organizational features is granted only upon approval.
      </Text>

      <Text style={styles.sectionTitle}>5. Feature Availability</Text>
      <Text style={styles.paragraph}>
        Individual users have access to the health incident reporting feature.
        Additional features — including outreach logging, team dashboards, and
        data export — are available exclusively to certified organizations.
        Anonymous Haven reserves the right to modify, restrict, or discontinue
        any features at any time, with or without notice.
      </Text>

      <Text style={styles.sectionTitle}>6. Data Entry Standards</Text>
      <Text style={styles.paragraph}>
        All data entered into the App must be accurate, non-identifying, and
        free of personally identifiable information (PII) about third parties.
        Incident data fields (zip code, age range, gender, outcome) are designed
        to be anonymous. Do not enter names, addresses, Social Security numbers,
        or other identifying information about individuals in any data field.
      </Text>

      <Text style={styles.sectionTitle}>7. Prohibited Conduct</Text>
      <Text style={styles.paragraph}>
        You agree not to: (a) use the App for any unlawful purpose; (b) enter
        false, misleading, or fabricated data; (c) attempt to gain unauthorized
        access to other accounts or organizational data; (d) reverse engineer,
        decompile, or attempt to extract the source code of the App; (e) use the
        App to harass, threaten, or harm any individual or organization; or (f)
        violate any applicable local, state, or federal law or regulation.
      </Text>

      <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
      <Text style={styles.paragraph}>
        All content, design, code, and materials within the App are the
        intellectual property of Anonymous Haven unless otherwise noted. You may
        not reproduce, distribute, or create derivative works from any part of
        the App without express written permission.
      </Text>

      <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
      <Text style={styles.paragraph}>
        To the fullest extent permitted by applicable law, Anonymous Haven, its
        founders, officers, employees, and contributors shall not be liable for
        any direct, indirect, incidental, special, consequential, or punitive
        damages arising out of or relating to your use of or inability to use
        the App, even if we have been advised of the possibility of such
        damages.
      </Text>

      <Text style={styles.sectionTitle}>10. Disclaimer of Warranties</Text>
      <Text style={styles.paragraph}>
        The App is provided "as is" and "as available" without warranties of any
        kind, either express or implied, including but not limited to implied
        warranties of merchantability, fitness for a particular purpose, or
        non-infringement. We do not warrant that the App will be uninterrupted,
        error-free, or free of viruses or other harmful components.
      </Text>

      <Text style={styles.sectionTitle}>11. Termination</Text>
      <Text style={styles.paragraph}>
        We reserve the right to suspend or terminate your account at any time,
        with or without cause, and with or without notice, including if we
        believe you have violated these Terms. Upon termination, your right to
        use the App will immediately cease.
      </Text>

      <Text style={styles.sectionTitle}>12. Governing Law</Text>
      <Text style={styles.paragraph}>
        These Terms shall be governed by and construed in accordance with the
        laws of the State of Texas, without regard to its conflict of law
        provisions. Any disputes arising under these Terms shall be subject to
        the exclusive jurisdiction of the courts located in El Paso County,
        Texas.
      </Text>

      <Text style={styles.sectionTitle}>13. Changes to These Terms</Text>
      <Text style={styles.paragraph}>
        We may update these Terms from time to time. We will notify users of
        material changes by updating the "Last Updated" date at the top of this
        document and, where appropriate, through in-app notification. Your
        continued use of the App after any changes constitutes your acceptance of
        the new Terms.
      </Text>

      <Text style={styles.sectionTitle}>14. Contact</Text>
      <Text style={styles.paragraph}>
        For questions, concerns, or feedback regarding these Terms, please
        contact us at:
      </Text>
      <Text style={styles.paragraph}>
        Anonymous Haven{'\n'}
        Email: support@anonymoushaven.ai{'\n'}
        Website: anonymoushaven.ai
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
