/**
 * Enhanced Outreach Analytics Type Definitions
 *
 * Types for the new database schema supporting team member and location analytics
 */

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
  coordinates?: [number, number]; // [longitude, latitude]
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

export interface EnhancedOutreachLog {
  id: string;
  organization_id?: string;
  location_id?: string;
  outreach_date: string;
  zip_code: string;
  kit_types: string[];
  num_kits: number;
  people_reached: number;
  males_reached?: number;
  females_reached?: number;
  trip_count?: number;
  notes?: string;
  submitted_by?: string;
  created_at: string;
  updated_at: string;

  // Legacy fields for migration compatibility
  legacy_location?: string;
  legacy_team_members?: string[];

  // Joined data
  team_members?: TeamMember[];
  location?: Location;
  organization?: {
    id: string;
    name: string;
  };
}

// Analytics View Types
export interface TeamMemberStats {
  id: string;
  name: string;
  organization_id: string;
  organization_name: string;
  total_activities: number;
  active_days: number;
  total_people_reached: number;
  last_activity_date?: string;
}

export interface LocationAnalytics {
  id: string;
  name: string;
  zip_code?: string;
  city?: string;
  total_activities: number;
  total_people_reached: number;
  total_kits_distributed: number;
  active_days: number;
  last_activity_date?: string;
  unique_team_members: number;
}

export interface ActivityTimeline {
  outreach_id: string;
  outreach_date: string;
  organization_id?: string;
  organization_name?: string;
  location_name?: string;
  zip_code?: string;
  people_reached: number;
  num_kits: number;
  team_members?: string[];
  notes?: string;
}

// Form Types for Creating/Updating
export interface CreateTeamMemberRequest {
  name: string;
  organization_id: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface CreateLocationRequest {
  name: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  location_type?: 'intersection' | 'address' | 'area';
}

export interface CreateOutreachLogRequest {
  organization_id?: string;
  location_id?: string;
  outreach_date: string;
  zip_code: string;
  kit_types: string[];
  num_kits: number;
  people_reached: number;
  males_reached?: number;
  females_reached?: number;
  trip_count?: number;
  notes?: string;
  team_member_ids: string[];
  team_member_roles?: { [team_member_id: string]: string };
}

// API Response Types
export interface TeamMemberStatsResponse {
  data: TeamMemberStats[];
  total_count: number;
}

export interface LocationAnalyticsResponse {
  data: LocationAnalytics[];
  total_count: number;
}

export interface ActivityTimelineResponse {
  data: ActivityTimeline[];
  total_count: number;
  has_more: boolean;
}
