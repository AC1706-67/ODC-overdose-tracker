import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { BarChart3 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface LocationCoverage {
  location_id: string;
  location_label: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type: string;
  visits_count: number;
  active_days: number;
  total_people_reached: number;
  total_kits_distributed: number;
  unique_team_members: number;
  last_seen_at: string | null;
  first_seen_at: string | null;
}

interface LocationActivityChartProps {
  locations: LocationCoverage[];
}

export default function LocationActivityChart({ locations }: LocationActivityChartProps) {
  if (locations.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Activity Charts</Text>
        <View style={styles.emptyState}>
          <BarChart3 size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Activity Data</Text>
          <Text style={styles.emptyText}>
            Activity charts will appear here once location data is available.
          </Text>
        </View>
      </View>
    );
  }

  // Prepare data for charts
  const sortedLocations = [...locations]
    .sort((a, b) => b.visits_count - a.visits_count)
    .slice(0, 8); // Top 8 locations for readability

  // Chart configuration
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  // Bar chart data for visit frequency
  const visitFrequencyData = {
    labels: sortedLocations.map(loc => {
      // Truncate long location names
      const name = loc.location_label;
      return name.length > 12 ? name.substring(0, 12) + '...' : name;
    }),
    datasets: [
      {
        data: sortedLocations.map(loc => loc.visits_count),
      },
    ],
  };

  // Pie chart data for people reached distribution
  const colors = [
    '#7c3aed', '#3b82f6', '#059669', '#f59e0b', 
    '#ef4444', '#8b5cf6', '#10b981', '#f97316'
  ];
  
  const peopleReachedData = sortedLocations
    .filter(loc => loc.total_people_reached > 0)
    .slice(0, 6) // Top 6 for pie chart readability
    .map((loc, index) => ({
      name: loc.location_label.length > 15 
        ? loc.location_label.substring(0, 15) + '...' 
        : loc.location_label,
      population: loc.total_people_reached,
      color: colors[index % colors.length],
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));

  // Location type distribution
  const locationTypeStats = locations.reduce((acc, loc) => {
    const type = loc.location_type || 'area';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationTypeData = Object.entries(locationTypeStats).map(([type, count], index) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    population: count,
    color: colors[index % colors.length],
    legendFontColor: '#374151',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <BarChart3 size={20} color="#7c3aed" />
        <Text style={styles.sectionTitle}>Location Activity Charts</Text>
      </View>

      {/* Visit Frequency Bar Chart */}
      {visitFrequencyData.datasets[0].data.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Visit Frequency by Location</Text>
          <Text style={styles.chartSubtitle}>
            Number of outreach activities per location (top {sortedLocations.length})
          </Text>
          <BarChart
            data={visitFrequencyData}
            width={width - 80}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            fromZero
            style={styles.chart}
          />
        </View>
      )}

      {/* People Reached Distribution Pie Chart */}
      {peopleReachedData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>People Reached by Location</Text>
          <Text style={styles.chartSubtitle}>
            Distribution of people reached across top locations
          </Text>
          <PieChart
            data={peopleReachedData}
            width={width - 80}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
            style={styles.chart}
          />
        </View>
      )}

      {/* Location Type Distribution */}
      {locationTypeData.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Location Type Distribution</Text>
          <Text style={styles.chartSubtitle}>
            Types of locations where outreach activities occur
          </Text>
          <PieChart
            data={locationTypeData}
            width={width - 80}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
            style={styles.chart}
          />
        </View>
      )}

      {/* Activity Summary Stats */}
      <View style={styles.summaryStats}>
        <Text style={styles.summaryTitle}>Activity Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(locations.reduce((sum, loc) => sum + loc.visits_count, 0) / locations.length * 10) / 10}
            </Text>
            <Text style={styles.statLabel}>Avg Visits/Location</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(locations.reduce((sum, loc) => sum + loc.total_people_reached, 0) / locations.length * 10) / 10}
            </Text>
            <Text style={styles.statLabel}>Avg People/Location</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(locations.reduce((sum, loc) => sum + loc.unique_team_members, 0) / locations.length * 10) / 10}
            </Text>
            <Text style={styles.statLabel}>Avg Team/Location</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(locations.reduce((sum, loc) => sum + loc.active_days, 0) / locations.length * 10) / 10}
            </Text>
            <Text style={styles.statLabel}>Avg Active Days</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryStats: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});