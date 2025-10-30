import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Users, Calendar, MapPin, TrendingUp, Building } from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { fetchTeamDashboardData } from '@/src/api/teamDashboard';
import { PieChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface TeamStats {
  total_team_members: number;
  unique_organizations: number;
  total_trips: number;
  active_locations: number;
  avg_trips_per_member: number;
  organization_breakdown: Array<{ org: string; count: number }>;
  monthly_activity: Array<{ month: string; trips: number; members: number }>;
}

export default function TeamDashboard() {
  const { activeOrgId } = useOrg();
  const [stats, setStats] = useState<TeamStats>({
    total_team_members: 0,
    unique_organizations: 0,
    total_trips: 0,
    active_locations: 0,
    avg_trips_per_member: 0,
    organization_breakdown: [],
    monthly_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await fetchTeamDashboardData(activeOrgId);
      setStats(data);
    } catch (error) {
      console.error('[TeamDashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => refresh(true);

  useEffect(() => {
    refresh();
  }, [activeOrgId]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  // Organization breakdown pie chart data
  const orgPieData = stats.organization_breakdown.map((org, index) => ({
    name: org.org || 'Unknown',
    population: org.count,
    color: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'][index % 6],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  // Monthly activity bar chart
  const monthlyBarData = {
    labels: stats.monthly_activity.slice(-6).map(m => m.month.slice(0, 3)),
    datasets: [
      {
        data: stats.monthly_activity.slice(-6).map(m => m.trips),
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading team data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Users size={24} color="#10b981" />
        <Text style={styles.title}>Team Analytics</Text>
      </View>

      {/* Team Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Users size={20} color="#10b981" />
            <Text style={styles.metricTitle}>Team Members</Text>
          </View>
          <Text style={styles.metricValue}>{stats.total_team_members}</Text>
          <Text style={styles.metricSubtext}>Active volunteers</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Building size={20} color="#3b82f6" />
            <Text style={styles.metricTitle}>Organizations</Text>
          </View>
          <Text style={styles.metricValue}>{stats.unique_organizations}</Text>
          <Text style={styles.metricSubtext}>Partner orgs</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Calendar size={20} color="#f59e0b" />
            <Text style={styles.metricTitle}>Total Trips</Text>
          </View>
          <Text style={styles.metricValue}>{stats.total_trips}</Text>
          <Text style={styles.metricSubtext}>Outreach trips</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <TrendingUp size={20} color="#ef4444" />
            <Text style={styles.metricTitle}>Avg per Member</Text>
          </View>
          <Text style={styles.metricValue}>{stats.avg_trips_per_member.toFixed(1)}</Text>
          <Text style={styles.metricSubtext}>Trips per person</Text>
        </View>
      </View>

      {/* Organization Breakdown Chart */}
      {orgPieData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Team by Organization</Text>
          <PieChart
            data={orgPieData}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
          />
        </View>
      )}

      {/* Monthly Activity Chart */}
      {monthlyBarData.datasets[0].data.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Monthly Trip Activity</Text>
          <BarChart
            data={monthlyBarData}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Empty State */}
      {stats.total_team_members === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>👥 Team Data Coming Soon</Text>
          <Text style={styles.emptyText}>
            Start adding team member information to outreach logs to see team analytics!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  chartSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
    margin: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});