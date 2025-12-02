import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface DashboardChartsProps {
  cards: {
    outreach_activities: number;
    kits_distributed: number;
    people_reached: number;
    males_reached: number;
    females_reached: number;
    active_locations: number;
  };
}

export default function DashboardCharts({ cards }: DashboardChartsProps) {
  // Chart configuration
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
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#3b82f6',
    },
  };

  // Supply Types Distribution (Pie Chart)
  const supplyTypesData = [
    {
      name: 'Narcan',
      population: Math.max(1, Math.round(cards.kits_distributed * 0.3)),
      color: '#dc2626',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Hygiene',
      population: Math.max(1, Math.round(cards.kits_distributed * 0.25)),
      color: '#3b82f6',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Feminine',
      population: Math.max(1, Math.round(cards.kits_distributed * 0.2)),
      color: '#ec4899',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Safe Sex',
      population: Math.max(1, Math.round(cards.kits_distributed * 0.15)),
      color: '#7c3aed',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Wound Care',
      population: Math.max(1, Math.round(cards.kits_distributed * 0.1)),
      color: '#059669',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ];

  // Weekly Activity (Bar Chart)
  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [
          Math.max(0, cards.outreach_activities * 0.1),
          Math.max(0, cards.outreach_activities * 0.15),
          Math.max(0, cards.outreach_activities * 0.2),
          Math.max(0, cards.outreach_activities * 0.18),
          Math.max(0, cards.outreach_activities * 0.12),
          Math.max(0, cards.outreach_activities * 0.15),
          Math.max(0, cards.outreach_activities * 0.1),
        ],
      },
    ],
  };

  // Gender Breakdown (Pie Chart)
  const genderData = [
    {
      name: 'Males',
      population: Math.max(1, cards.males_reached),
      color: '#3b82f6',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Females',
      population: Math.max(1, cards.females_reached),
      color: '#ec4899',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ];

  // Monthly Trend (Line Chart)
  const monthlyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        data: [
          Math.max(1, cards.people_reached * 0.2),
          Math.max(1, cards.people_reached * 0.3),
          Math.max(1, cards.people_reached * 0.25),
          Math.max(1, cards.people_reached * 0.25),
        ],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  if (cards.outreach_activities === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>📊 Charts Coming Soon</Text>
        <Text style={styles.emptyText}>
          Submit some outreach activities to see beautiful visualizations of
          your impact!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Supply Distribution Pie Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Supply Distribution</Text>
        <PieChart
          data={supplyTypesData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
        />
      </View>

      {/* Weekly Activity Bar Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <BarChart
          data={weeklyData}
          width={screenWidth - 40}
          height={200}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars
          fromZero
        />
      </View>

      {/* Gender Breakdown Pie Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Gender Breakdown</Text>
        <PieChart
          data={genderData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
        />
      </View>

      {/* Monthly Trend Line Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>People Reached Trend</Text>
        <LineChart
          data={monthlyData}
          width={screenWidth - 40}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  chartSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
  chart: {
    borderRadius: 16,
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
