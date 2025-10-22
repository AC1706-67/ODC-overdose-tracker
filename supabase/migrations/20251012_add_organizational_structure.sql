/*
  # Add Organizational Structure to Compassionate LOG

  1. New Tables
    - `organizations` - Health centers, agencies, community groups
    - `profiles` - User profiles with roles and metadata
    - `user_organizations` - Many-to-many relationship between users and orgs
    - `organization_invites` - Pending invitations to join organizations

  2. Enhanced Security
    - Organization-based RLS policies
    - Role-based permissions (Admin, Manager, Responder, Viewer)
    - Data isolation between organizations

  3. Triggers
    - Auto-create profile on user signup
    - Handle organization membership
*/

-- =============================================
-- ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL, -- URL-friendly identifier
  type text NOT NULL CHECK (type IN (
    'Health Center', 
    'Hospital', 
    'Community Organization', 
    'Government Agency', 
    'Harm Reduction Program',
    'Peer Support Network',
    'Faith-Based Organization',
    'Other'
  )),
  description text,
  address text,
  city text,
  state text,
  zip_code text CHECK (zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  phone text,
  email text,
  website text,
  logo_url text,
  settings jsonb DEFAULT '{}', -- Organization-specific settings
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- USER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  first_name text,
  last_name text,
  display_name text,
  phone text,
  title text, -- Job title/position
  bio text,
  avatar_url text,
  default_organization_id uuid REFERENCES organizations(id),
  preferences jsonb DEFAULT '{}', -- User preferences
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- USER-ORGANIZATION RELATIONSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'Owner',        -- Full admin access, can delete org
    'Admin',        -- Full management access
    'Manager',      -- Can manage users and view all data
    'Supervisor',   -- Can view all data, limited user management
    'Responder',    -- Can submit incidents/distributions, view own data
    'Viewer'        -- Read-only access to aggregated data
  )),
  permissions jsonb DEFAULT '{}', -- Additional granular permissions
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  
  UNIQUE(user_id, organization_id)
);

-- =============================================
-- ORGANIZATION INVITES
-- =============================================
CREATE TABLE IF NOT EXISTS organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'Supervisor', 'Responder', 'Viewer')),
  invited_by uuid NOT NULL REFERENCES profiles(id),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(organization_id, email)
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - ORGANIZATIONS
-- =============================================

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admins and Owners can update their organizations
CREATE POLICY "Admins can update organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
        AND role IN ('Owner', 'Admin') 
        AND is_active = true
    )
  );

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
        AND role = 'Owner' 
        AND is_active = true
    )
  );

-- =============================================
-- RLS POLICIES - PROFILES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Managers+ can view profiles in their organizations
CREATE POLICY "Managers can view org member profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT uo1.user_id
      FROM user_organizations uo1
      WHERE uo1.organization_id IN (
        SELECT uo2.organization_id
        FROM user_organizations uo2
        WHERE uo2.user_id = auth.uid()
          AND uo2.role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
          AND uo2.is_active = true
      )
      AND uo1.is_active = true
    )
  );

-- =============================================
-- RLS POLICIES - USER_ORGANIZATIONS
-- =============================================

-- Users can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Managers+ can view memberships in their organizations
CREATE POLICY "Managers can view org memberships"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
        AND is_active = true
    )
  );

-- Admins+ can manage memberships
CREATE POLICY "Admins can manage memberships"
  ON user_organizations
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
        AND is_active = true
    )
  );

-- =============================================
-- RLS POLICIES - ORGANIZATION_INVITES
-- =============================================

-- Managers+ can view and manage invites for their organizations
CREATE POLICY "Managers can manage org invites"
  ON organization_invites
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager')
        AND is_active = true
    )
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS organizations_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_type_idx ON organizations(type);
CREATE INDEX IF NOT EXISTS organizations_is_active_idx ON organizations(is_active);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_default_org_idx ON profiles(default_organization_id);

CREATE INDEX IF NOT EXISTS user_organizations_user_idx ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS user_organizations_org_idx ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS user_organizations_role_idx ON user_organizations(role);
CREATE INDEX IF NOT EXISTS user_organizations_active_idx ON user_organizations(is_active);

CREATE INDEX IF NOT EXISTS organization_invites_email_idx ON organization_invites(email);
CREATE INDEX IF NOT EXISTS organization_invites_token_idx ON organization_invites(token);
CREATE INDEX IF NOT EXISTS organization_invites_expires_idx ON organization_invites(expires_at);

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Create a default organization for existing users
INSERT INTO organizations (name, slug, type, description) 
VALUES (
  'Community Health Network',
  'community-health-network',
  'Community Organization',
  'Default organization for Compassionate LOG users'
) ON CONFLICT (slug) DO NOTHING;

-- Note: Existing users will need to be manually assigned to organizations
-- or you can create a data migration script to handle this