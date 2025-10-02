import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Settings, User, Shield, Database, LogOut, Info } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import DiagnosticsScreen from '@/components/DiagnosticsScreen';
import { AuthTest } from '@/components/AuthTest';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  const handleClearData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all locally stored incidents and distributions that haven\'t been synced. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // Clear local storage logic would go here
          Alert.alert('Success', 'Local data cleared.');
        }},
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export functionality will be implemented.');
  };

  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handleVersionTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 7) {
      setShowDiagnostics(true);
      setTapCount(0);
    }
    
    // Reset counter after 3 seconds
    setTimeout(() => setTapCount(0), 3000);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Settings size={24} color="#6b7280" />
            <Text style={styles.title}>Settings</Text>
          </View>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#3b82f6" />
            <Text style={styles.sectionTitle}>Profile</Text>
          </View>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Role</Text>
            <Text style={styles.settingValue}>Frontline Responder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Organization</Text>
            <Text style={styles.settingValue}>Community Health Center</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#059669" />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={notifications ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={offlineMode ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto-Sync</Text>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={autoSync ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Data Management</Text>
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingLabel}>Export Data</Text>
            <Text style={styles.settingAction}>Export</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
            <Text style={styles.settingLabel}>Clear Local Data</Text>
            <Text style={[styles.settingAction, styles.dangerAction]}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleVersionTap}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingAction}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.settingAction}>View</Text>
          </TouchableOpacity>
        </View>

        {/* Auth Test */}
        <AuthTest />

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#dc2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This app collects no personally identifiable information.
          </Text>
          <Text style={styles.footerText}>
            All data is anonymized and aggregated for public health purposes.
          </Text>
        </View>
      </ScrollView>
      
      <DiagnosticsScreen 
        visible={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  settingAction: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  dangerAction: {
    color: '#dc2626',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 4,
  },
});