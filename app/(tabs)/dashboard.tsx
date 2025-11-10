import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import OutreachDashboardScreen from '@/screens/dashboard/OutreachDashboardScreen';
import HealthDashboardScreen from '@/screens/dashboard/HealthDashboardScreen';
import { useOrg } from '@/src/context/OrgContext';
import { canUseOutreach } from '@/src/lib/featureAccess';

export default function DashboardScreen() {
  const { activeOrg, loading } = useOrg();
  const outreachEnabled = !loading && canUseOutreach(activeOrg);
  const [activeTab, setActiveTab] = useState(outreachEnabled ? 'outreach' : 'health');

  // Update active tab if outreach access changes
  useEffect(() => {
    if (!loading && !outreachEnabled && activeTab === 'outreach') {
      setActiveTab('health');
    }
  }, [loading, outreachEnabled, activeTab]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <BarChart3 size={24} color="#3b82f6" />
          <Text style={styles.title}>Community Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BarChart3 size={24} color="#3b82f6" />
        <Text style={styles.title}>Community Dashboard</Text>
      </View>
      
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        {outreachEnabled && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'outreach' && styles.activeTab]}
            onPress={() => setActiveTab('outreach')}
          >
            <Text style={[styles.tabText, activeTab === 'outreach' && styles.activeTabText]}>
              Outreach
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'health' && styles.activeTab]}
          onPress={() => setActiveTab('health')}
        >
          <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
            Health
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'outreach' && outreachEnabled ? (
          <OutreachDashboardScreen />
        ) : (
          <HealthDashboardScreen />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  tabBar: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});