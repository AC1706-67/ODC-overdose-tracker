import { supabase } from '@/lib/supabase';

export async function fetchTeamDashboardData(activeOrgId: string | null) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('outreach_logs')
    .select(
      'team_members, team_organization, trip_count, location, outreach_date, created_at',
    )
    .gte('created_at', since);

  // Filter by organization
  if (activeOrgId === null) {
    query = query.is('organization_id', null);
  } else {
    query = query.eq('organization_id', activeOrgId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Process the data
  const logs = data || [];

  // Extract unique team members (split by comma and clean up)
  const allMembers = new Set<string>();
  const organizationCounts: { [key: string]: number } = {};
  let totalTrips = 0;
  const locations = new Set<string>();
  const monthlyActivity: {
    [key: string]: { trips: number; members: Set<string> };
  } = {};

  logs.forEach((log) => {
    // Process team members
    if (log.team_members) {
      const members = log.team_members
        .split(',')
        .map((m: string) => m.trim())
        .filter((m: string) => m.length > 0);

      members.forEach((member: string) => allMembers.add(member));
    }

    // Process organizations
    if (log.team_organization) {
      const org = log.team_organization.trim();
      organizationCounts[org] = (organizationCounts[org] || 0) + 1;
    }

    // Process trips
    totalTrips += log.trip_count || 1;

    // Process locations
    if (log.location) {
      locations.add(log.location.trim());
    }

    // Process monthly activity
    const date = new Date(log.outreach_date || log.created_at);
    const monthKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });

    if (!monthlyActivity[monthKey]) {
      monthlyActivity[monthKey] = { trips: 0, members: new Set() };
    }

    monthlyActivity[monthKey].trips += log.trip_count || 1;

    if (log.team_members) {
      const members = log.team_members
        .split(',')
        .map((m: string) => m.trim())
        .filter((m: string) => m.length > 0);

      members.forEach((member: string) =>
        monthlyActivity[monthKey].members.add(member),
      );
    }
  });

  // Calculate metrics
  const totalTeamMembers = allMembers.size;
  const uniqueOrganizations = Object.keys(organizationCounts).length;
  const activeLocations = locations.size;
  const avgTripsPerMember =
    totalTeamMembers > 0 ? totalTrips / totalTeamMembers : 0;

  // Format organization breakdown
  const organizationBreakdown = Object.entries(organizationCounts)
    .map(([org, count]) => ({ org, count }))
    .sort((a, b) => b.count - a.count);

  // Format monthly activity
  const monthlyActivityArray = Object.entries(monthlyActivity)
    .map(([month, data]) => ({
      month,
      trips: data.trips,
      members: data.members.size,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return {
    total_team_members: totalTeamMembers,
    unique_organizations: uniqueOrganizations,
    total_trips: totalTrips,
    active_locations: activeLocations,
    avg_trips_per_member: avgTripsPerMember,
    organization_breakdown: organizationBreakdown,
    monthly_activity: monthlyActivityArray,
  };
}
