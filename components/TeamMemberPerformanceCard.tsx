import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserCheck, Calendar, Users, TrendingUp } from 'lucide-react-native';
import { formatAnonymousName } from '@/src/utils/nameFormatter';

interface TeamMemberPerformanceCardProps {
  teamMember: {
    team_member_id: string;
    full_name: string;
    organization_id: string;
    organization_name: string;
    activities_count: number;
    active_days: number;
    total_people_reached: number;
    last_activity_at?: string;
  };
  onPress?: () => void;
}

export default function TeamMemberPerformanceCard({
  teamMember,
  onPress,
}: TeamMemberPerformanceCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No activity';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getActivityLevel = () => {
    if (teamMember.activities_count >= 10)
      return { level: 'High', color: '#059669' };
    if (teamMember.activities_count >= 5)
      return { level: 'Medium', color: '#f59e0b' };
    if (teamMember.activities_count >= 1)
      return { level: 'Low', color: '#ef4444' };
    return { level: 'None', color: '#6b7280' };
  };

  const activityLevel = getActivityLevel();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.nameSection}>
          <UserCheck size={20} color="#3b82f6" />
          <Text style={styles.name} numberOfLines={1}>
            {formatAnonymousName(teamMember.full_name)}
          </Text>
        </View>
        <View
          style={[
            styles.activityBadge,
            { backgroundColor: activityLevel.color },
          ]}
        >
          <Text style={styles.activityBadgeText}>{activityLevel.level}</Text>
        </View>
      </View>

      {/* Organization */}
      {teamMember.organization_name && (
        <Text style={styles.organization} numberOfLines={1}>
          {teamMember.organization_name}
        </Text>
      )}

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.metricValue}>{teamMember.activities_count}</Text>
          <Text style={styles.metricLabel}>Activities</Text>
        </View>

        <View style={styles.metric}>
          <TrendingUp size={16} color="#6b7280" />
          <Text style={styles.metricValue}>{teamMember.active_days}</Text>
          <Text style={styles.metricLabel}>Active Days</Text>
        </View>

        <View style={styles.metric}>
          <Users size={16} color="#6b7280" />
          <Text style={styles.metricValue}>
            {teamMember.total_people_reached}
          </Text>
          <Text style={styles.metricLabel}>People Reached</Text>
        </View>
      </View>

      {/* Last Activity */}
      <View style={styles.footer}>
        <Text style={styles.lastActivity}>
          Last activity: {formatDate(teamMember.last_activity_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  organization: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  lastActivity: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
