import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Package,
  Users,
  MapPin,
  BarChart3,
  Clock,
  UserCheck,
  Navigation,
} from 'lucide-react-native';
import { useOrg } from '@/src/context/OrgContext';
import { fetchDashboardDirect } from '@/src/api/dashboard';
import { supabase } from '@/lib/supabase';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import DashboardCharts from '@/components/DashboardCharts';
import TeamMemberAnalytics from '@/components/TeamMemberAnalytics';
import LocationAnalytics from '../../components/LocationAnalytics';

const { width } = Dimensions.get('window');

interface TeamMember {
  team_member_id: string;
  full_name: string;
  activities_count: number;
  last_activity_at: string | null;
}

interface LocationCoverage {
  location_id: string;
  location_label: string;
  visits_count: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

interface ActivityTimeline {
  outreach_log_id: string;
  created_at: string;
  team_members: string[];
}

export default function OutreachDashboardScreen() {
  const { activeOrgId, activeOrg } = useOrg();
  const [cards, setCards] = useState({
    outreach_activities: 0,
    kits_distributed: 0,
    people_reached: 0,
    males_reached: 0,
    females_reached: 0,
    active_locations: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [locations, setLocations] = useState<LocationCoverage[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityTimeline[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'overview' | 'team' | 'locations' | 'analytics'
  >('overview');

  const refresh = async (isRefreshing = false) => {
    if (activeOrgId === undefined) return;
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch original dashboard data
      const res = await fetchDashboardDirect(activeOrgId);
      setCards(res);

      // Fetch enhanced analytics data
      await Promise.all([
        fetchTeamPerformance(),
        fetchLocationCoverage(),
        fetchRecentActivities(),
      ]);
    } catch (error) {
      console.error('[OutreachDashboard] Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTeamPerformance = async () => {
    try {
      let query = supabase
        .from('v_team_performance_v1')
        .select('*')
        .order('activities_count', { ascending: false })
        .limit(10);

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[TeamPerformance] Error:', error);
        return;
      }

      setTeamMembers(data || []);
    } catch (error) {
      console.error('[TeamPerformance] Fetch error:', error);
    }
  };

  const fetchLocationCoverage = async () => {
    try {
      let query = supabase
        .from('v_location_coverage_v1')
        .select('*')
        .order('visits_count', { ascending: false })
        .limit(10);

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[LocationCoverage] Error:', error);
        return;
      }

      setLocations(data || []);
    } catch (error) {
      console.error('[LocationCoverage] Fetch error:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      let query = supabase
        .from('v_activity_timeline_v1')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (activeOrgId) {
        query = query.eq('organization_id', activeOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ActivityTimeline] Error:', error);
        return;
      }

      setRecentActivities(data || []);
    } catch (error) {
      console.error('[ActivityTimeline] Fetch error:', error);
    }
  };

  const onRefresh = () => refresh(true);

  useEffect(() => {
    refresh();
  }, [activeOrgId]);

  if (loading && !refreshing) {
    return <LoadingSkeleton />;
  }

  const renderOverviewSection = () => (
    <>
      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Package size={20} color="#059669" />
            <Text style={styles.metricTitle}>Outreach Activities</Text>
          </View>
          <Text style={styles.metricValue}>{cards.outreach_activities}</Text>
          <Text style={styles.metricSubtext}>
            {cards.kits_distributed} supplies distributed
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Users size={20} color="#3b82f6" />
            <Text style={styles.metricTitle}>People Reached</Text>
          </View>
          <Text style={styles.metricValue}>{cards.people_reached}</Text>
          <Text style={styles.metricSubtext}>
            {cards.males_reached}M / {cards.females_reached}F
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MapPin size={20} color="#7c3aed" />
            <Text style={styles.metricTitle}>Geographic Coverage</Text>
          </View>
          <Text style={styles.metricValue}>{cards.active_locations}</Text>
          <Text style={styles.metricSubtext}>active locations</Text>
        </View>
      </View>

      {/* Charts and Visualizations */}
      <DashboardCharts cards={cards} />
    </>
  );

  const renderTeamSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Team Performance</Text>
      {teamMembers.length > 0 ? (
        teamMembers.map((member) => (
          <View key={member.team_member_id} style={styles.teamMemberCard}>
            <View style={styles.teamMemberHeader}>
              <UserCheck size={16} color="#3b82f6" />
              <Text style={styles.teamMemberName}>{member.full_name}</Text>
            </View>
            <View style={styles.teamMemberStats}>
              <Text style={styles.teamMemberStat}>
                {member.activities_count} activities
              </Text>
              {member.last_activity_at && (
                <Text style={styles.teamMemberDate}>
                  Last: {new Date(member.last_activity_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No team member data available</Text>
      )}
    </View>
  );

  const renderLocationsSection = () => (
    <View style={styles.analyticsSection}>
      <LocationAnalytics />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Organization Context Banner */}
        <View style={styles.orgBanner}>
          <Text style={styles.orgLabel}>Organization:</Text>
          <Text style={styles.orgName}>
            {activeOrg?.name || 'No Organization Selected'}
          </Text>
        </View>

        {/* Time Period Info */}
        <View style={styles.periodInfo}>
          <Text style={styles.periodText}>Last 30 Days</Text>
          <Text style={styles.lastUpdated}>
            Updated {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Section Navigation */}
        <View style={styles.sectionNav}>
          <TouchableOpacity
            style={[
              styles.navButton,
              activeSection === 'overview' && styles.navButtonActive,
            ]}
            onPress={() => setActiveSection('overview')}
          >
            <BarChart3
              size={16}
              color={activeSection === 'overview' ? '#ffffff' : '#6b7280'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeSection === 'overview' && styles.navButtonTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              activeSection === 'team' && styles.navButtonActive,
            ]}
            onPress={() => setActiveSection('team')}
          >
            <Users
              size={16}
              color={activeSection === 'team' ? '#ffffff' : '#6b7280'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeSection === 'team' && styles.navButtonTextActive,
              ]}
            >
              Team
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              activeSection === 'locations' && styles.navButtonActive,
            ]}
            onPress={() => setActiveSection('locations')}
          >
            <MapPin
              size={16}
              color={activeSection === 'locations' ? '#ffffff' : '#6b7280'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeSection === 'locations' && styles.navButtonTextActive,
              ]}
            >
              Locations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              activeSection === 'analytics' && styles.navButtonActive,
            ]}
            onPress={() => setActiveSection('analytics')}
          >
            <BarChart3
              size={16}
              color={activeSection === 'analytics' ? '#ffffff' : '#6b7280'}
            />
            <Text
              style={[
                styles.navButtonText,
                activeSection === 'analytics' && styles.navButtonTextActive,
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Content Based on Active Section */}
        {activeSection === 'overview' && renderOverviewSection()}
        {activeSection === 'team' && renderTeamSection()}
        {activeSection === 'locations' && renderLocationsSection()}
        {activeSection === 'analytics' && (
          <View style={styles.analyticsSection}>
            <TeamMemberAnalytics />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
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
    flex: 1,
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
  sectionNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  navButtonActive: {
    backgroundColor: '#3b82f6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  navButtonTextActive: {
    color: '#ffffff',
  },
  teamMemberCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  teamMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  teamMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  teamMemberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamMemberStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  teamMemberDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationStat: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  locationDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  analyticsSection: {
    flex: 1,
    marginHorizontal: -20,
    marginBottom: -20,
  },
});
