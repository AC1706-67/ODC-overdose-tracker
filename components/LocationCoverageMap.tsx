import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { MapPin, Navigation, Users, Calendar } from 'lucide-react-native';

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

interface LocationCoverageMapProps {
  locations: LocationCoverage[];
}

export default function LocationCoverageMap({ locations }: LocationCoverageMapProps) {
  // Sort locations by activity level for better visualization
  const sortedLocations = [...locations].sort((a, b) => b.visits_count - a.visits_count);
  
  // Get top 10 locations for the map view
  const topLocations = sortedLocations.slice(0, 10);

  const renderLocationItem = ({ item, index }: { item: LocationCoverage; index: number }) => {
    // Calculate activity intensity for visual representation
    const maxVisits = Math.max(...topLocations.map(loc => loc.visits_count));
    const intensity = maxVisits > 0 ? (item.visits_count / maxVisits) : 0;
    
    // Color intensity based on activity level
    const getIntensityColor = (intensity: number) => {
      if (intensity >= 0.8) return '#dc2626'; // High activity - red
      if (intensity >= 0.6) return '#ea580c'; // Medium-high - orange
      if (intensity >= 0.4) return '#d97706'; // Medium - amber
      if (intensity >= 0.2) return '#65a30d'; // Medium-low - lime
      return '#16a34a'; // Low activity - green
    };

    const intensityColor = getIntensityColor(intensity);

    return (
      <View style={[styles.locationItem, { borderLeftColor: intensityColor }]}>
        <View style={styles.locationRank}>
          <Text style={styles.rankNumber}>#{index + 1}</Text>
        </View>
        
        <View style={styles.locationContent}>
          <View style={styles.locationHeader}>
            <Navigation size={16} color={intensityColor} />
            <Text style={styles.locationName} numberOfLines={1}>
              {item.location_label}
            </Text>
          </View>
          
          <View style={styles.locationDetails}>
            {item.city && item.state && (
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.city}, {item.state} {item.zip_code}
              </Text>
            )}
            
            <View style={styles.activityMetrics}>
              <View style={styles.metric}>
                <Calendar size={12} color="#6b7280" />
                <Text style={styles.metricText}>{item.visits_count} visits</Text>
              </View>
              
              <View style={styles.metric}>
                <Users size={12} color="#6b7280" />
                <Text style={styles.metricText}>{item.total_people_reached} reached</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={[styles.activityIndicator, { backgroundColor: intensityColor }]}>
          <Text style={styles.activityLevel}>
            {Math.round(intensity * 100)}%
          </Text>
        </View>
      </View>
    );
  };

  if (locations.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location Coverage Map</Text>
        <View style={styles.emptyState}>
          <MapPin size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Location Data</Text>
          <Text style={styles.emptyText}>
            Location coverage will be displayed here once outreach activities are logged.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Location Coverage Map</Text>
        <Text style={styles.sectionSubtitle}>
          Top {Math.min(10, locations.length)} most active locations
        </Text>
      </View>

      {/* Coverage Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Activity Level:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.legendText}>High (80-100%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ea580c' }]} />
            <Text style={styles.legendText}>Med-High (60-80%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#d97706' }]} />
            <Text style={styles.legendText}>Medium (40-60%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#65a30d' }]} />
            <Text style={styles.legendText}>Med-Low (20-40%)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.legendText}>Low (0-20%)</Text>
          </View>
        </View>
      </View>

      {/* Location List */}
      <FlatList
        data={topLocations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.location_id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {locations.length > 10 && (
        <View style={styles.moreLocations}>
          <Text style={styles.moreText}>
            +{locations.length - 10} more locations with activity
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  legend: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationRank: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  locationContent: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  locationDetails: {
    gap: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6b7280',
  },
  activityMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6b7280',
  },
  activityIndicator: {
    width: 48,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  activityLevel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
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