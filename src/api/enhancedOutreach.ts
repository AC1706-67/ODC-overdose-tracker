import { supabase } from '@/lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  organization_id: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type: 'intersection' | 'address' | 'area';
  is_active: boolean;
  created_at: string;
}

export interface OutreachTeamMember {
  id: string;
  outreach_log_id: string;
  team_member_id: string;
  role_in_activity?: string;
  created_at: string;
}

export interface EnhancedOutreachSubmission {
  organization_id: string;
  user_id: string;
  outreach_date: string;
  zip_code: string;
  location_id?: string;
  legacy_location?: string;
  kit_types: string[];
  num_kits: number;
  people_reached: number;
  males_reached: number;
  females_reached: number;
  trip_count: number;
  legacy_team_members?: string[];
  team_organization?: string;
  notes?: string;
  team_members: Array<{
    team_member_id: string;
    role_in_activity?: string;
  }>;
}

/**
 * Submit an enhanced outreach log with team member and location associations
 */
export async function submitEnhancedOutreach(
  submission: EnhancedOutreachSubmission,
) {
  const { team_members, ...outreachData } = submission;

  // Insert the main outreach log
  const { data: outreachLog, error: outreachError } = await supabase
    .from('outreach_logs')
    .insert([outreachData])
    .select('*')
    .single();

  if (outreachError) {
    throw outreachError;
  }

  // Insert team member associations if any
  if (team_members && team_members.length > 0) {
    const teamMemberAssociations = team_members.map((member) => ({
      outreach_log_id: outreachLog.id,
      team_member_id: member.team_member_id,
      role_in_activity: member.role_in_activity || 'volunteer',
    }));

    const { error: teamMemberError } = await supabase
      .from('outreach_team_members')
      .insert(teamMemberAssociations);

    if (teamMemberError) {
      // Log the error but don't fail the whole submission
      console.error('Team member association error:', teamMemberError);
    }
  }

  return outreachLog;
}

/**
 * Get team members for an organization
 */
export async function getTeamMembers(
  organizationId: string,
): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a new team member
 */
export async function createTeamMember(
  teamMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([teamMember])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all active locations
 */
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a new location
 */
export async function createLocation(
  location: Omit<Location, 'id' | 'created_at'>,
): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Search for existing locations by name (for duplicate prevention)
 */
export async function searchLocationsByName(name: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .ilike('name', `%${name}%`)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
}
