import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useOrg } from '@/src/context/OrgContext';

export default function OrgDiagnostic() {
  try {
    const { activeOrgId } = useOrg();
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 Org Context Diagnostic</Text>
        <Text style={styles.text}>Active Org ID: {activeOrgId || 'null'}</Text>
        <Text style={styles.text}>Status: {activeOrgId ? '✅ Connected' : '⚠️ No org selected'}</Text>
      </View>
    );
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ Org Context Error</Text>
        <Text style={styles.error}>{String(error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    margin: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    color: 'red',
  },
});