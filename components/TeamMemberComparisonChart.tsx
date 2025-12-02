import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface TeamMemberStats {
  team_member_id: string;
  full_name: string;
  organization_id: string;
  organization_name: string;
  activities_count: number;
  active_days: number;
  total_people_reached: number;
  last_activity_at?: string;
}

interface TeamMemberComparisonChartProps {
  teamMembers: TeamMemberStats[];
  loading?: boolean;
}

export default function TeamMemberComparisonChart({
  teamMembers,
  loading = false,
}: TeamMemberComparisonChartProps) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={20} color="#3b82f6" />
          <Text style={styles.title}>Team Comparison</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading comparison data...</Text>
        </View>
      </View>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={20} color="#3b82f6" />
          <Text style={styles.title}>Team Comparison</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No team member data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for charts
  const topPerformers = teamMembers
    .sort((a, b) => b.activities_count - a.activities_count)
    .slice(0, 8); // Top 8 performers

  // Activities Bar Chart Data
  const activitiesBarData = {
    labels: topPerformers.map((member) =>
      member.full_name.length > 8
        ? member.full_name.substring(0, 8) + '...'
        : member.full_name,
    ),
    datasets: [
      {
        data: topPerformers.map((member) => member.activities_count),
      },
    ],
  };

  // People Reached Bar Chart Data
  const peopleReachedBarData = {
    labels: topPerformers.map((member) =>
      member.full_name.length > 8
        ? member.full_name.substring(0, 8) + '...'
        : member.full_name,
    ),
    datasets: [
      {
        data: topPerformers.map((member) => member.total_people_reached),
      },
    ],
  };

  // Activity Distribution Pie Chart Data
  const activityDistributionData = topPerformers
    .slice(0, 6)
    .map((member, index) => ({
      name:
        member.full_name.length > 12
          ? member.full_name.substring(0, 12) + '...'
          : member.full_name,
      population: member.activities_count,
      color: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'][
        index % 6
      ],
      legendFontColor: '#374151',
      legendFontSize: 11,
    }));

  // Calculate summary stats
  const totalActivities = teamMembers.reduce(
    (sum, member) => sum + member.activities_count,
    0,
  );
  const avgActivitiesPerMember =
    teamMembers.length > 0 ? totalActivities / teamMembers.length : 0;
  const mostActiveTeamMember = teamMembers.reduce((prev, current) =>
    prev.activities_count > current.activities_count ? prev : current,
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TrendingUp size={20} color="#3b82f6" />
        <Text style={styles.title}>Team Comparison</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Users size={16} color="#3b82f6" />
          <Text style={styles.summaryValue}>{teamMembers.length}</Text>
          <Text style={styles.summaryLabel}>Team Members</Text>
        </View>

        <View style={styles.summaryCard}>
          <Calendar size={16} color="#059669" />
          <Text style={styles.summaryValue}>{totalActivities}</Text>
          <Text style={styles.summaryLabel}>Total Activities</Text>
        </View>

        <View style={styles.summaryCard}>
          <TrendingUp size={16} color="#f59e0b" />
          <Text style={styles.summaryValue}>
            {avgActivitiesPerMember.toFixed(1)}
          </Text>
          <Text style={styles.summaryLabel}>Avg per Member</Text>
        </View>

        <View style={styles.summaryCard}>
          <Award size={16} color="#ef4444" />
          <Text style={styles.summaryValue}>
            {mostActiveTeamMember.activities_count}
          </Text>
          <Text style={styles.summaryLabel}>Top Performer</Text>
        </View>
      </View>

      {/* Top Performer Highlight */}
      <View style={styles.topPerformerCard}>
        <View style={styles.topPerformerHeader}>
          <Award size={20} color="#f59e0b" />
          <Text style={styles.topPerformerTitle}>Top Performer</Text>
        </View>
        <Text style={styles.topPerformerName}>
          {mostActiveTeamMember.full_name}
        </Text>
        <View style={styles.topPerformerStats}>
          <Text style={styles.topPerformerStat}>
            {mostActiveTeamMember.activities_count} activities
          </Text>
          <Text style={styles.topPerformerStat}>
            {mostActiveTeamMember.total_people_reached} people reached
          </Text>
        </View>
      </View>

      {/* Activities Comparison Chart */}
      {topPerformers.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Activities by Team Member</Text>
          <BarChart
            data={activitiesBarData}
            width={width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={45}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      )}

      {/* People Reached Comparison Chart */}
      {topPerformers.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>People Reached by Team Member</Text>
          <BarChart
            data={peopleReachedBarData}
            width={width - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            }}
            verticalLabelRotation={45}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      )}

      {/* Activity Distribution Pie Chart */}
      {activityDistributionData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Activity Distribution</Text>
          <PieChart
            data={activityDistributionData}
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

      {/* Team Member Rankings */}
      <View style={styles.rankingsSection}>
        <Text style={styles.rankingsTitle}>Team Rankings</Text>
        {teamMembers
          .sort((a, b) => b.activities_count - a.activities_count)
          .slice(0, 10)
          .map((member, index) => (
            <View key={member.team_member_id} style={styles.rankingItem}>
              <View style={styles.rankingPosition}>
                <Text style={styles.rankingNumber}>#{index + 1}</Text>
              </View>
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName}>{member.full_name}</Text>
                <Text style={styles.rankingOrg}>
                  {member.organization_name}
                </Text>
              </View>
              <View style={styles.rankingStats}>
                <Text style={styles.rankingActivities}>
                  {member.activities_count} activities
                </Text>
                <Text style={styles.rankingPeople}>
                  {member.total_people_reached} people
                </Text>
              </View>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    width: (width - 80) / 2,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  topPerformerCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  topPerformerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topPerformerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  topPerformerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  topPerformerStats: {
    flexDirection: 'row',
    gap: 16,
  },
  topPerformerStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  rankingsSection: {
    marginTop: 8,
  },
  rankingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  rankingOrg: {
    fontSize: 12,
    color: '#6b7280',
  },
  rankingStats: {
    alignItems: 'flex-end',
  },
  rankingActivities: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  rankingPeople: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});
