// Organization and user management types for Compassionate LOG

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  settings: Record<string, any>;
  is_active: boolean;
  is_certified: boolean;
  status: OrganizationStatus;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  contact_email?: string;
  contact_name?: string;
  certification_notes?: string;
  created_at: string;
  updated_at: string;
}

export type OrganizationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type OrganizationType = 
  | 'Health Center'
  | 'Hospital'
  | 'Community Organization'
  | 'Government Agency'
  | 'Harm Reduction Program'
  | 'Peer Support Network'
  | 'Faith-Based Organization'
  | 'Other';

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
  default_organization_id?: string;
  preferences: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  permissions: Record<string, any>;
  joined_at: string;
  invited_by?: string;
  is_active: boolean;
}

export type UserRole = 
  | 'Owner'      // Full admin access, can delete org
  | 'Admin'      // Full management access
  | 'Manager'    // Can manage users and view all data
  | 'Supervisor' // Can view all data, limited user management
  | 'Responder'  // Can submit incidents/distributions, view own data
  | 'Viewer';    // Read-only access to aggregated data

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export interface OrganizationInviteCode {
  id: string;
  organization_id: string;
  code: string;
  description?: string;
  role: UserRole;
  is_active: boolean;
  max_uses?: number;
  current_uses: number;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRequest {
  name: string;
  type: OrganizationType;
  city?: string;
  state?: string;
  website?: string;
  contact_email: string;
  contact_name: string;
  description?: string;
}

export interface UserOrganizationInfo {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  user_role: UserRole;
  is_default: boolean;
}

export interface OrganizationStats {
  total_incidents: number;
  total_distributions: number;
  narcan_incidents: number;
  survival_rate: number;
  unique_zip_codes: number;
  active_responders: number;
}

// Enhanced incident and distribution types with organization support
export interface IncidentWithOrg {
  incident_id: string;
  timestamp: string;
  zip_code: string;
  gender: string;
  approx_age: string;
  narcan_used: boolean;
  survival: string;
  client_id: string;
  organization_id?: string;
  submitted_by?: string;
  created_at: string;
}

export interface DistributionWithOrg {
  distribution_id: string;
  timestamp: string;
  zip_code: string;
  kit_type: string;
  kits_given: number;
  last_kit_outcome?: string;
  organization_id?: string;
  submitted_by?: string;
  created_at: string;
}

// Permission checking utilities
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'Viewer': 1,
  'Responder': 2,
  'Supervisor': 3,
  'Manager': 4,
  'Admin': 5,
  'Owner': 6,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'Manager');
}

export function canViewAllData(role: UserRole): boolean {
  return hasPermission(role, 'Supervisor');
}

export function canSubmitData(role: UserRole): boolean {
  return hasPermission(role, 'Responder');
}

export function canManageOrganization(role: UserRole): boolean {
  return hasPermission(role, 'Admin');
}