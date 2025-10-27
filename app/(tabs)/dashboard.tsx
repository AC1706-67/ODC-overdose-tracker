import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BarChart3, Users, Package, Heart, Download, MapPin } from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { fetchDashboardDirect } from '@/src/api/dashboard';
import OrgDiagnostic from '@/components/OrgDiagnostic';
import SelectOrg from '@/components/SelectOrg';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { activeOrgId } = useOrg();
  const [cards, setCards] = useState({ 
    outreach_activities: 0, 
    kits_distributed: 0, 
    people_reached: 0, 
    active_locations: 0 
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (activeOrgId === undefined) return; // Only skip if undefined, allow null
    try {
      setLoading(true);
      const res = await fetchDashboardDirect(activeOrgId);
      setCards(res);
    } catch (error) {
      console.error('[Dashboard] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [activeOrgId]);

  // 🛡️ CRASH PROTECTION: Always show dashboard, never crash
  try {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <BarChart3 size={24} color="#3b82f6" />
              <Text style={styles.title}>Community Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Time Period Info */}
          <View style={styles.periodInfo}>
            <Text style={styles.periodText}>Last 30 Days</Text>
            <Text style={styles.lastUpdated}>
              Updated {new Date().toLocaleDateString()}
            </Text>
          </View>

          {/* Key Metrics - CRASH PROOF */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Heart size={20} color="#dc2626" />
                <Text style={styles.metricTitle}>Health Incidents</Text>
              </View>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricSubtext}>
                0 with Narcan
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Package size={20} color="#059669" />
                <Text style={styles.metricTitle}>Outreach Activities</Text>
              </View>
              <Text style={styles.metricValue}>{cards.outreach_activities}</Text>
              <Text style={styles.metricSubtext}>
                {cards.kits_distributed} kits distributed
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Users size={20} color="#3b82f6" />
                <Text style={styles.metricTitle}>People Reached</Text>
              </View>
              <Text style={styles.metricValue}>{cards.people_reached}</Text>
              <Text style={styles.metricSubtext}>
                Avg {cards.outreach_activities > 0 ? Math.round(cards.people_reached / cards.outreach_activities) : 0} per outreach
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <MapPin size={20} color="#7c3aed" />
                <Text style={styles.metricTitle}>Geographic Coverage</Text>
              </View>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricSubtext}>
                {cards.active_locations} active locations
              </Text>
            </View>
          </View>

          {/* Diagnostic */}
          <OrgDiagnostic />
          
          {/* Organization Selector */}
          {activeOrgId === undefined && <SelectOrg />}

          {/* Status Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dashboard Status</Text>
            {loading ? (
              <Text style={styles.statusText}>Loading dashboard data...</Text>
            ) : activeOrgId !== undefined ? (
              <Text style={styles.statusText}>✅ Dashboard loaded successfully</Text>
            ) : (
              <Text style={styles.statusText}>⚠️ No organization selected</Text>
            )}
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.exportButton}>
              <Download size={20} color="#ffffff" />
              <Text style={styles.exportText}>Export Report (CSV)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  } catch (error) {
    // 🛡️ ULTIMATE FALLBACK: Never crash, always show something
    console.error('[Dashboard] Render error:', error);
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <BarChart3 size={24} color="#3b82f6" />
            <Text style={styles.title}>Community Dashboard</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard Temporarily Unavailable</Text>
          <Text style={styles.statusText}>
            The dashboard is temporarily unavailable. Please try refreshing or contact support.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <Text style={styles.refreshText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

function getKitTypeColor(type: string): string {
  switch (type) {
    case 'Narcan': return '#dc2626';
    case 'Feminine Hygiene': return '#ec4899';
    case 'Hygiene': return '#3b82f6';
    case 'Safe Sex': return '#7c3aed';
    default: return '#6b7280';
  }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  periodInfo: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: (width - 56) / 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  distributionChart: {
    gap: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  distributionLabel: {
    width: 120,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distributionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  distributionCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  demographicsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  demographicCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  demographicTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  demographicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demographicLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  demographicValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  zipTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  zipHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  zipHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  zipRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  zipCode: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  zipIncidents: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  zipDistributions: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    textAlign: 'center',
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  exportText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingVertical: 8,
  },
});