import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { TrendingUp, Target, Users, Calendar, Award, AlertTriangle } from 'lucide-react-native';

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

interface LocationEffectivenessMetricsProps {
  locations: LocationCoverage[];
}

interface EffectivenessMetric {
  location_id: string;
  location_label: string;
  effectiveness_score: number;
  people_per_visit: number;
  kits_per_visit: number;
  team_efficiency: number;
  consistency_score: number;
  category: 'high' | 'medium' | 'low';
  insights: string[];
}

export default function LocationEffectivenessMetrics({ locations }: LocationEffectivenessMetricsProps) {
  if (locations.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Effectiveness Metrics</Text>
        <View style={styles.emptyState}>
          <Target size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Effectiveness Data</Text>
          <Text style={styles.emptyText}>
            Effectiveness metrics will appear here once location activity data is available.
          </Text>
        </View>
      </View>
    );
  }

  // Calculate effectiveness metrics for each location
  const calculateEffectivenessMetrics = (): EffectivenessMetric[] => {
    return locations
      .filter(loc => loc.visits_count > 0) // Only locations with activity
      .map(location => {
        // Basic efficiency metrics
        const peoplePerVisit = location.total_people_reached / location.visits_count;
        const kitsPerVisit = location.total_kits_distributed / location.visits_count;
        const teamEfficiency = location.unique_team_members > 0 
          ? location.total_people_reached / location.unique_team_members 
          : 0;
        
        // Consistency score (active days vs total visits)
        const consistencyScore = location.active_days > 0 
          ? Math.min(location.visits_count / location.active_days, 3) / 3 * 100 
          : 0;

        // Overall effectiveness score (weighted average)
        const normalizedPeoplePerVisit = Math.min(peoplePerVisit / 10, 1) * 100; // Normalize to 0-100
        const normalizedKitsPerVisit = Math.min(kitsPerVisit / 5, 1) * 100; // Normalize to 0-100
        const normalizedTeamEfficiency = Math.min(teamEfficiency / 20, 1) * 100; // Normalize to 0-100
        
        const effectivenessScore = (
          normalizedPeoplePerVisit * 0.4 + 
          normalizedKitsPerVisit * 0.3 + 
          normalizedTeamEfficiency * 0.2 + 
          consistencyScore * 0.1
        );

        // Categorize effectiveness
        let category: 'high' | 'medium' | 'low';
        if (effectivenessScore >= 70) category = 'high';
        else if (effectivenessScore >= 40) category = 'medium';
        else category = 'low';

        // Generate insights
        const insights: string[] = [];
        
        if (peoplePerVisit >= 8) {
          insights.push('High people reach per visit');
        } else if (peoplePerVisit < 3) {
          insights.push('Low people reach - consider timing/approach');
        }

        if (kitsPerVisit >= 4) {
          insights.push('Strong kit distribution');
        } else if (kitsPerVisit < 1.5) {
          insights.push('Low kit distribution rate');
        }

        if (teamEfficiency >= 15) {
          insights.push('Excellent team efficiency');
        } else if (teamEfficiency < 5) {
          insights.push('Consider team size optimization');
        }

        if (consistencyScore >= 80) {
          insights.push('Consistent regular activity');
        } else if (consistencyScore < 40) {
          insights.push('Irregular activity pattern');
        }

        if (location.visits_count >= 10) {
          insights.push('Well-established location');
        } else if (location.visits_count < 3) {
          insights.push('New or underutilized location');
        }

        return {
          location_id: location.location_id,
          location_label: location.location_label,
          effectiveness_score: Math.round(effectivenessScore),
          people_per_visit: Math.round(peoplePerVisit * 10) / 10,
          kits_per_visit: Math.round(kitsPerVisit * 10) / 10,
          team_efficiency: Math.round(teamEfficiency * 10) / 10,
          consistency_score: Math.round(consistencyScore),
          category,
          insights: insights.slice(0, 3), // Limit to top 3 insights
        };
      })
      .sort((a, b) => b.effectiveness_score - a.effectiveness_score);
  };

  const effectivenessMetrics = calculateEffectivenessMetrics();

  // Summary statistics
  const highPerformers = effectivenessMetrics.filter(m => m.category === 'high').length;
  const mediumPerformers = effectivenessMetrics.filter(m => m.category === 'medium').length;
  const lowPerformers = effectivenessMetrics.filter(m => m.category === 'low').length;
  
  const avgEffectiveness = effectivenessMetrics.length > 0 
    ? Math.round(effectivenessMetrics.reduce((sum, m) => sum + m.effectiveness_score, 0) / effectivenessMetrics.length)
    : 0;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'high': return '#059669';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'high': return <Award size={16} color="#059669" />;
      case 'medium': return <TrendingUp size={16} color="#f59e0b" />;
      case 'low': return <AlertTriangle size={16} color="#ef4444" />;
      default: return <Target size={16} color="#6b7280" />;
    }
  };

  const renderMetricItem = ({ item }: { item: EffectivenessMetric }) => (
    <View style={[styles.metricCard, { borderLeftColor: getCategoryColor(item.category) }]}>
      <View style={styles.metricHeader}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName} numberOfLines={1}>
            {item.location_label}
          </Text>
          <View style={styles.categoryBadge}>
            {getCategoryIcon(item.category)}
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.effectivenessScore, { color: getCategoryColor(item.category) }]}>
            {item.effectiveness_score}%
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.miniMetric}>
          <Users size={14} color="#6b7280" />
          <Text style={styles.miniMetricValue}>{item.people_per_visit}</Text>
          <Text style={styles.miniMetricLabel}>People/Visit</Text>
        </View>
        
        <View style={styles.miniMetric}>
          <Target size={14} color="#6b7280" />
          <Text style={styles.miniMetricValue}>{item.kits_per_visit}</Text>
          <Text style={styles.miniMetricLabel}>Kits/Visit</Text>
        </View>
        
        <View style={styles.miniMetric}>
          <TrendingUp size={14} color="#6b7280" />
          <Text style={styles.miniMetricValue}>{item.team_efficiency}</Text>
          <Text style={styles.miniMetricLabel}>Team Eff.</Text>
        </View>
        
        <View style={styles.miniMetric}>
          <Calendar size={14} color="#6b7280" />
          <Text style={styles.miniMetricValue}>{item.consistency_score}%</Text>
          <Text style={styles.miniMetricLabel}>Consistency</Text>
        </View>
      </View>

      {item.insights.length > 0 && (
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Key Insights:</Text>
          {item.insights.map((insight, index) => (
            <Text key={index} style={styles.insightText}>
              • {insight}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Target size={20} color="#059669" />
        <Text style={styles.sectionTitle}>Location Effectiveness Metrics</Text>
      </View>

      {/* Summary Overview */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{avgEffectiveness}%</Text>
          <Text style={styles.summaryLabel}>Avg Effectiveness</Text>
        </View>
        
        <View style={styles.performanceBreakdown}>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceDot, { backgroundColor: '#059669' }]} />
            <Text style={styles.performanceText}>High: {highPerformers}</Text>
          </View>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.performanceText}>Medium: {mediumPerformers}</Text>
          </View>
          <View style={styles.performanceItem}>
            <View style={[styles.performanceDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.performanceText}>Low: {lowPerformers}</Text>
          </View>
        </View>
      </View>

      {/* Effectiveness Metrics List */}
      <FlatList
        data={effectivenessMetrics.slice(0, 10)} // Show top 10
        renderItem={renderMetricItem}
        keyExtractor={(item) => item.location_id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {effectivenessMetrics.length > 10 && (
        <View style={styles.moreLocations}>
          <Text style={styles.moreText}>
            +{effectivenessMetrics.length - 10} more locations analyzed
          </Text>
        </View>
      )}
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryCard: {
    alignItems: 'center',
    marginRight: 24,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  performanceBreakdown: {
    flex: 1,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  performanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  performanceText: {
    fontSize: 14,
    color: '#374151',
  },
  metricCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  effectivenessScore: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  miniMetric: {
    alignItems: 'center',
    flex: 1,
  },
  miniMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  miniMetricLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    lineHeight: 16,
  },
  moreLocations: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  moreText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
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