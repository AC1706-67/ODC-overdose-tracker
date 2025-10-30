import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import OutreachDashboardScreen from '@/screens/dashboard/OutreachDashboardScreen';
import HealthDashboardScreen from '@/screens/dashboard/HealthDashboardScreen';

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState('outreach');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BarChart3 size={24} color="#3b82f6" />
        <Text style={styles.title}>Community Dashboard</Text>
      </View>
      
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'outreach' && styles.activeTab]}
          onPress={() => setActiveTab('outreach')}
        >
          <Text style={[styles.tabText, activeTab === 'outreach' && styles.activeTabText]}>
            Outreach
          </Text>
        </TouchableOpacity>
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
        {activeTab === 'outreach' ? <OutreachDashboardScreen /> : <HealthDashboardScreen />}
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
});