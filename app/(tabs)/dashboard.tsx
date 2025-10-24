import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BarChart3, TrendingUp, Users, Package, Heart, Download, MapPin } from 'lucide-react-native';
import { useOrgDashboard } from '@/hooks/useOrgDashboard';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null); // Default to anonymous data (NULL)
  const { kpis, timeSeries, loading, refresh } = useOrgDashboard(selectedOrg);

  // Diagnostic logs
  useEffect(() => {
    console.log('[Dashboard] Render Start', { selectedOrg, kpis, loading, timeSeries });
  }, [selectedOrg, kpis, loading, timeSeries]);

  // Guard for undefined variables
  if (typeof data === 'undefined') {
    console.log('[Dashboard] Data reference missing — should be defined or removed usage');
  }

  // Show last 30 days of data

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
          {kpis?.last_updated && (
            <Text style={styles.lastUpdated}>
              Updated {new Date(kpis.last_updated).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Heart size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Health Incidents</Text>
            </View>
            <Text style={styles.metricValue}>{kpis?.total_incidents || 0}</Text>
            <Text style={styles.metricSubtext}>
              {kpis?.narcan_incidents || 0} with Narcan
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Package size={20} color="#059669" />
              <Text style={styles.metricTitle}>Outreach Activities</Text>
            </View>
            <Text style={styles.metricValue}>{kpis?.total_outreach || 0}</Text>
            <Text style={styles.metricSubtext}>
              {kpis?.total_kits || 0} kits distributed
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Users size={20} color="#3b82f6" />
              <Text style={styles.metricTitle}>People Reached</Text>
            </View>
            <Text style={styles.metricValue}>{kpis?.people_reached || 0}</Text>
            <Text style={styles.metricSubtext}>
              Avg {kpis?.avg_people_per_outreach || 0} per outreach
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MapPin size={20} color="#7c3aed" />
              <Text style={styles.metricTitle}>Geographic Coverage</Text>
            </View>
            <Text style={styles.metricValue}>{kpis?.unique_zip_codes || 0}</Text>
            <Text style={styles.metricSubtext}>
              {kpis?.active_locations || 0} active locations
            </Text>
          </View>
        </View>

        {/* Distribution by Kit Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kit Distribution by Type</Text>
          <View style={styles.distributionChart}>
            {data?.distributions?.byType?.map((item, index) => (
              <View key={item.type} style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionFill,
                      {
                        width: `${(item.count / (data.distributions?.total || 1)) * 100}%`,
                        backgroundColor: getKitTypeColor(item.type),
                      },
                    ]}
                  />
                </View>
                <View style={styles.distributionLabel}>
                  <Text style={styles.distributionType}>{item.type}</Text>
                  <Text style={styles.distributionCount}>{item.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demographics</Text>
          <View style={styles.demographicsGrid}>
            <View style={styles.demographicCard}>
              <Text style={styles.demographicTitle}>Gender Distribution</Text>
              {data?.demographics?.gender?.map((item) => (
                <View key={item.gender} style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>{item.gender}</Text>
                  <Text style={styles.demographicValue}>{item.count}</Text>
                </View>
              ))}
            </View>

            <View style={styles.demographicCard}>
              <Text style={styles.demographicTitle}>Age Distribution</Text>
              {data?.demographics?.age?.map((item) => (
                <View key={item.age} style={styles.demographicItem}>
                  <Text style={styles.demographicLabel}>{item.age}</Text>
                  <Text style={styles.demographicValue}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Top ZIP Codes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top ZIP Codes</Text>
          <View style={styles.zipTable}>
            <View style={styles.zipHeader}>
              <Text style={styles.zipHeaderText}>ZIP Code</Text>
              <Text style={styles.zipHeaderText}>Incidents</Text>
              <Text style={styles.zipHeaderText}>Kits Distributed</Text>
            </View>
            {data?.zipCodes?.map((zip) => (
              <TouchableOpacity
                key={zip.zipCode}
                style={styles.zipRow}
                onPress={() => setSelectedZip(zip.zipCode === selectedZip ? '' : zip.zipCode)}
              >
                <Text style={styles.zipCode}>{zip.zipCode}</Text>
                <Text style={styles.zipIncidents}>{zip.incidents}</Text>
                <Text style={styles.zipDistributions}>{zip.distributions}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
});