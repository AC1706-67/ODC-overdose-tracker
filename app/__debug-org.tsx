import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useOrg } from '@/src/context/OrgContext';
import { canUseOutreach } from '@/src/lib/featureAccess';

export default function DebugOrg() {
  const { activeOrg, activeOrgId, loading } = useOrg();
  const hasAccess = canUseOutreach(activeOrg);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔍 Organization Debug</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Loading:</Text>
        <Text style={styles.value}>{loading ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Active Org ID:</Text>
        <Text style={styles.value}>{activeOrgId || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Active Org Object:</Text>
        <Text style={styles.value}>{JSON.stringify(activeOrg, null, 2)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Org ID:</Text>
        <Text style={styles.value}>{activeOrg?.id || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Org Slug:</Text>
        <Text style={styles.value}>{activeOrg?.slug || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Org Name:</Text>
        <Text style={styles.value}>{activeOrg?.name || 'null'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Has Outreach Access:</Text>
        <Text style={[styles.value, hasAccess ? styles.success : styles.error]}>
          {hasAccess ? '✅ YES' : '❌ NO'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Debug Info:</Text>
        <Text style={styles.value}>
          ID Match:{' '}
          {activeOrg?.id === '6e892800-0429-442f-bff8-417b4d4ec793'
            ? '✅'
            : '❌'}
          {'\n'}
          Slug Match:{' '}
          {activeOrg?.slug === 'recovery-alliance-el-paso' ? '✅' : '❌'}
          {'\n'}
          Name Match:{' '}
          {activeOrg?.name === 'Recovery Alliance of El Paso' ? '✅' : '❌'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Allowed Slugs:</Text>
        <Text style={styles.value}>
          - recovery-alliance-el-paso{'\n'}- recovery-alliance
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Allowed Names:</Text>
        <Text style={styles.value}>
          - Recovery Alliance of El Paso{'\n'}- Recovery Alliance
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'monospace',
  },
  success: {
    color: '#059669',
    fontWeight: '700',
  },
  error: {
    color: '#dc2626',
    fontWeight: '700',
  },
});
