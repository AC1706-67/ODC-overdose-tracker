import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Calendar, MapPin, Users, Package } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ActivityTimelineItem {
  outreach_log_id: string;
  created_at: string;
  organization_id?: string;
  organization_name?: string;
  location_name?: string;
  zip_code?: string;
  people_reached: number;
  num_kits: number;
  team_members?: string[];
  notes?: string;
}

interface TeamMemberActivityTimelineProps {
  activities: ActivityTimelineItem[];
  teamMemberName?: string;
  loading?: boolean;
}

export default function TeamMemberActivityTimeline({ 
  activities, 
  teamMemberName,
  loading = false 
}: TeamMemberActivityTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Calendar size={20} color="#3b82f6" />
          <Text style={styles.title}>Activity Timeline</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading timeline...</Text>
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Calendar size={20} color="#3b82f6" />
          <Text style={styles.title}>
            Activity Timeline
            {teamMemberName && ` - ${teamMemberName}`}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activities found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Calendar size={20} color="#3b82f6" />
        <Text style={styles.title}>
          Activity Timeline
          {teamMemberName && ` - ${teamMemberName}`}
        </Text>
      </View>

      <ScrollView 
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
      >
        {activities.map((activity, index) => {
          const dateInfo = formatDate(activity.created_at);
          const isLast = index === activities.length - 1;

          return (
            <View key={activity.outreach_log_id} style={styles.timelineItem}>
              {/* Date Circle */}
              <View style={styles.dateSection}>
                <View style={styles.dateCircle}>
                  <Text style={styles.dateDay}>{dateInfo.day}</Text>
                  <Text style={styles.dateMonth}>{dateInfo.month}</Text>
                </View>
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              {/* Activity Content */}
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTime}>
                    {dateInfo.weekday} • {formatTime(activity.created_at)}
                  </Text>
                  {activity.organization_name && (
                    <Text style={styles.organizationBadge}>
                      {activity.organization_name}
                    </Text>
                  )}
                </View>

                {/* Location */}
                {activity.location_name && (
                  <View style={styles.locationRow}>
                    <MapPin size={14} color="#7c3aed" />
                    <Text style={styles.locationText}>
                      {activity.location_name}
                      {activity.zip_code && ` (${activity.zip_code})`}
                    </Text>
                  </View>
                )}

                {/* Metrics */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Users size={14} color="#059669" />
                    <Text style={styles.metricText}>
                      {activity.people_reached} reached
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Package size={14} color="#dc2626" />
                    <Text style={styles.metricText}>
                      {activity.num_kits} kits
                    </Text>
                  </View>
                </View>

                {/* Team Members */}
                {activity.team_members && activity.team_members.length > 0 && (
                  <View style={styles.teamMembersRow}>
                    <Text style={styles.teamMembersLabel}>Team:</Text>
                    <Text style={styles.teamMembersText}>
                      {activity.team_members.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Notes */}
                {activity.notes && (
                  <View style={styles.notesRow}>
                    <Text style={styles.notesText} numberOfLines={2}>
                      {activity.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
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
    flex: 1,
  },
  timeline: {
    maxHeight: 400,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateSection: {
    alignItems: 'center',
    marginRight: 16,
    width: 50,
  },
  dateCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    minHeight: 20,
  },
  activityContent: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  organizationBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  teamMembersRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  teamMembersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginRight: 6,
  },
  teamMembersText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  notesRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
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