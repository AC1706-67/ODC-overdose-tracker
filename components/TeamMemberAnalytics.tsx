import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Users, BarChart3, Clock, TrendingUp } from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { supabase } from '@/lib/supabase';
import TeamMemberPerformanceCard from './TeamMemberPerformanceCard';
import TeamMemberActivityTimeline from './TeamMemberActivityTimeline';
import TeamMemberComparisonChart from './TeamMemberComparisonChart';
import LoadingSkeleton from './LoadingSkeleton';
import { formatAnonymousName } from '@/src/utils/nameFormatter';

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

type ViewMode = 'overview' | 'individual' | 'timeline' | 'comparison';

export default function TeamMemberAnalytics() {
  const { activeOrgId, activeOrg } = useOrg();
  const [teamMembers, setTeamMembers] = useState<TeamMemberStats[]>([]);
  const [activities, setActivities] = useState<ActivityTimelineItem[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMemberStats | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeamMemberStats = async () => {
    try {
      let query = supabase
        .from('v_team_performance_v1')
        .select('*')
        .order('activities_count', { ascending: false });

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          '[TeamMemberAnalytics] Error fetching team stats:',
          error,
        );
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('[TeamMemberAnalytics] Fetch error:', error);
    }
  };

  const fetchActivityTimeline = async (teamMemberId?: string) => {
    try {
      let query = supabase
        .from('v_activity_timeline_v1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[TeamMemberAnalytics] Error fetching timeline:', error);
        return;
      }

      let filteredData = data || [];

      // Filter by specific team member if provided
      if (teamMemberId && selectedMember) {
        filteredData = filteredData.filter(
          (activity) =>
            activity.team_members &&
            activity.team_members.includes(selectedMember.full_name),
        );
      }

      setActivities(filteredData);
    } catch (error) {
      console.error('[TeamMemberAnalytics] Timeline fetch error:', error);
    }
  };

  const refresh = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([
        fetchTeamMemberStats(),
        fetchActivityTimeline(selectedMember?.team_member_id),
      ]);
    } catch (error) {
      console.error('[TeamMemberAnalytics] Refresh error:', error);
      Alert.alert(
        'Error',
        'Failed to load team member data. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => refresh(true);

  useEffect(() => {
    refresh();
  }, [activeOrgId]);

  useEffect(() => {
    if (viewMode === 'timeline') {
      fetchActivityTimeline(selectedMember?.team_member_id);
    }
  }, [selectedMember, viewMode]);

  const handleMemberPress = (member: TeamMemberStats) => {
    setSelectedMember(member);
    setViewMode('individual');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'overview') {
      setSelectedMember(null);
    }
  };

  if (loading && !refreshing) {
    return <LoadingSkeleton />;
  }

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'overview' && styles.viewModeButtonActive,
        ]}
        onPress={() => handleViewModeChange('overview')}
      >
        <Users
          size={16}
          color={viewMode === 'overview' ? '#ffffff' : '#6b7280'}
        />
        <Text
          style={[
            styles.viewModeText,
            viewMode === 'overview' && styles.viewModeTextActive,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'comparison' && styles.viewModeButtonActive,
        ]}
        onPress={() => handleViewModeChange('comparison')}
      >
        <BarChart3
          size={16}
          color={viewMode === 'comparison' ? '#ffffff' : '#6b7280'}
        />
        <Text
          style={[
            styles.viewModeText,
            viewMode === 'comparison' && styles.viewModeTextActive,
          ]}
        >
          Compare
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'timeline' && styles.viewModeButtonActive,
        ]}
        onPress={() => handleViewModeChange('timeline')}
      >
        <Clock
          size={16}
          color={viewMode === 'timeline' ? '#ffffff' : '#6b7280'}
        />
        <Text
          style={[
            styles.viewModeText,
            viewMode === 'timeline' && styles.viewModeTextActive,
          ]}
        >
          Timeline
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {teamMembers.length > 0 ? (
        teamMembers.map((member) => (
          <TeamMemberPerformanceCard
            key={member.team_member_id}
            teamMember={member}
            onPress={() => handleMemberPress(member)}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>👥 No Team Members Found</Text>
          <Text style={styles.emptyText}>
            Team member data will appear here once outreach activities are
            logged with the new enhanced schema.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderIndividualView = () => {
    if (!selectedMember) return null;

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.individualHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleViewModeChange('overview')}
          >
            <Text style={styles.backButtonText}>← Back to Overview</Text>
          </TouchableOpacity>
          <Text style={styles.individualTitle}>{formatAnonymousName(selectedMember.full_name)}</Text>
          <Text style={styles.individualOrg}>
            {selectedMember.organization_name}
          </Text>
        </View>

        <TeamMemberPerformanceCard teamMember={selectedMember} />

        <View style={styles.individualActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewModeChange('timeline')}
          >
            <Clock size={16} color="#3b82f6" />
            <Text style={styles.actionButtonText}>View Timeline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderComparison = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <TeamMemberComparisonChart teamMembers={teamMembers} loading={loading} />
    </ScrollView>
  );

  const renderTimeline = () => (
    <ScrollView
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {selectedMember && (
        <View style={styles.timelineHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleViewModeChange('individual')}
          >
            <Text style={styles.backButtonText}>
              ← Back to {formatAnonymousName(selectedMember.full_name)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TeamMemberActivityTimeline
        activities={activities}
        teamMemberName={selectedMember ? formatAnonymousName(selectedMember.full_name) : undefined}
        loading={loading}
      />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={24} color="#3b82f6" />
        <Text style={styles.title}>Team Member Analytics</Text>
      </View>

      {/* Organization Context Banner */}
      <View style={styles.orgBanner}>
        <Text style={styles.orgLabel}>Organization:</Text>
        <Text style={styles.orgName}>
          {activeOrg?.name || 'No Organization Selected'}
        </Text>
      </View>

      {renderViewModeSelector()}

      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'individual' && renderIndividualView()}
      {viewMode === 'comparison' && renderComparison()}
      {viewMode === 'timeline' && renderTimeline()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  orgBanner: {
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orgLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  viewModeTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 40,
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
  individualHeader: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  individualTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  individualOrg: {
    fontSize: 16,
    color: '#6b7280',
  },
  individualActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  timelineHeader: {
    marginBottom: 16,
  },
});
