import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Info } from 'lucide-react-native';
import Constants from 'expo-constants';

interface DiagnosticsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function DiagnosticsScreen({ visible, onClose }: DiagnosticsScreenProps) {
  const diagnostics = {
    'Build Type': __DEV__ ? 'Debug' : 'Release',
    'OTA Updates': 'Disabled (Expo Updates)',
    'React Native': require('react-native/package.json').version,
    'New Architecture': 'Disabled (Classic Bridge)',
    'Hermes': 'Enabled',
    'Expo SDK': Constants.expoVersion || 'Unknown',
    'Platform': Constants.platform?.ios ? 'iOS' : 'Android',
    'Device': Constants.deviceName || 'Unknown',
    'App Version': Constants.nativeAppVersion || '1.0.0',
    'Bundle ID': Constants.easConfig?.projectId || 'com.anonymous.boltexponativewind',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Info size={24} color="#3b82f6" />
            <Text style={styles.title}>App Diagnostics</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            {Object.entries(diagnostics).map(([key, value]) => (
              <View key={key} style={styles.diagnosticRow}>
                <Text style={styles.diagnosticKey}>{key}</Text>
                <Text style={styles.diagnosticValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, styles.statusSuccess]} />
                <Text style={styles.statusText}>OTA Updates Disabled</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, styles.statusSuccess]} />
                <Text style={styles.statusText}>Using Local Bundle</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, styles.statusSuccess]} />
                <Text style={styles.statusText}>Classic Bridge Architecture</Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, styles.statusSuccess]} />
                <Text style={styles.statusText}>Single React Native Version</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.noteText}>
              • OTA updates are disabled to prevent network errors{'\n'}
              • App uses embedded JavaScript bundle{'\n'}
              • Classic bridge architecture for stability{'\n'}
              • No remote update checks on startup
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  diagnosticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  diagnosticKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  diagnosticValue: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    textAlign: 'right',
  },
  statusCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusSuccess: {
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  noteText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});