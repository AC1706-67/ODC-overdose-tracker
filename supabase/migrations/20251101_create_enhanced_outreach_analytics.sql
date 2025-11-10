/*
  # Enhanced Outreach Analytics Schema
  
  Creates new tables for enhanced outreach analytics:
  1. team_members - Individual team member records with organization linkage
  2. locations - Normalized location data for outreach activities
  3. outreach_team_members - Junction table linking outreach logs to team members
  4. Enhanced outreach_logs with location_id and legacy fields
  
  Requirements: 1.1, 1.2, 2.1, 2.2, 4.1
*/

-- =============================================
-- CREATE TEAM_MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email varchar(255) UNIQUE,
  phone varchar(50),
  role varchar(100),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT team_members_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT team_members_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT team_members_org_name_unique UNIQUE (organization_id, name)
);

-- =============================================
-- CREATE LOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  address text,
  zip_code varchar(10),
  city varchar(100),
  state varchar(50),
  coordinates point, -- For future mapping features
  location_type varchar(50) DEFAULT 'area' CHECK (location_type IN ('intersection', 'address', 'area')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT locations_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT locations_zip_format CHECK (zip_code IS NULL OR zip_code ~ '^[0-9]{5}(-[0-9]{4})?$')
);

-- =============================================
-- CREATE OUTREACH_TEAM_MEMBERS JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS outreach_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_log_id uuid NOT NULL REFERENCES outreach_logs(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role_in_activity varchar(100), -- 'lead', 'volunteer', 'coordinator'
  created_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate team member assignments to same outreach log
  CONSTRAINT outreach_team_members_unique UNIQUE (outreach_log_id, team_member_id)
);

-- =============================================
-- ADD NEW COLUMNS TO OUTREACH_LOGS
-- =============================================

-- Add location_id reference
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'location_id') THEN
        ALTER TABLE outreach_logs ADD COLUMN location_id uuid REFERENCES locations(id);
    END IF;
END $;

-- Add legacy_location field to preserve original location data during migration
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'legacy_location') THEN
        ALTER TABLE outreach_logs ADD COLUMN legacy_location text;
    END IF;
END $;

-- Add legacy_team_members field to preserve original team_members data during migration
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'legacy_team_members') THEN
        ALTER TABLE outreach_logs ADD COLUMN legacy_team_members text[];
    END IF;
END $;

-- Add additional fields for enhanced analytics
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'males_reached') THEN
        ALTER TABLE outreach_logs ADD COLUMN males_reached integer DEFAULT 0 CHECK (males_reached >= 0);
    END IF;
END $;

DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'females_reached') THEN
        ALTER TABLE outreach_logs ADD COLUMN females_reached integer DEFAULT 0 CHECK (females_reached >= 0);
    END IF;
END $;

DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'outreach_logs' 
                   AND column_name = 'trip_count') THEN
        ALTER TABLE outreach_logs ADD COLUMN trip_count integer DEFAULT 1 CHECK (trip_count > 0);
    END IF;
END $;

-- =============================================
-- CREATE PERFORMANCE INDEXES
-- =============================================

-- Team Members indexes
CREATE INDEX IF NOT EXISTS team_members_organization_idx ON team_members(organization_id);
CREATE INDEX IF NOT EXISTS team_members_name_idx ON team_members(name);
CREATE INDEX IF NOT EXISTS team_members_email_idx ON team_members(email);
CREATE INDEX IF NOT EXISTS team_members_active_idx ON team_members(is_active);
CREATE INDEX IF NOT EXISTS team_members_org_active_idx ON team_members(organization_id, is_active);

-- Locations indexes
CREATE INDEX IF NOT EXISTS locations_name_idx ON locations(name);
CREATE INDEX IF NOT EXISTS locations_zip_code_idx ON locations(zip_code);
CREATE INDEX IF NOT EXISTS locations_city_state_idx ON locations(city, state);
CREATE INDEX IF NOT EXISTS locations_type_idx ON locations(location_type);
CREATE INDEX IF NOT EXISTS locations_active_idx ON locations(is_active);
CREATE INDEX IF NOT EXISTS locations_coordinates_idx ON locations USING GIST(coordinates);

-- Outreach Team Members indexes
CREATE INDEX IF NOT EXISTS outreach_team_members_outreach_idx ON outreach_team_members(outreach_log_id);
CREATE INDEX IF NOT EXISTS outreach_team_members_member_idx ON outreach_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS outreach_team_members_role_idx ON outreach_team_members(role_in_activity);

-- Enhanced Outreach Logs indexes
CREATE INDEX IF NOT EXISTS outreach_logs_location_idx ON outreach_logs(location_id);
CREATE INDEX IF NOT EXISTS outreach_logs_date_org_idx ON outreach_logs(outreach_date, organization_id);
CREATE INDEX IF NOT EXISTS outreach_logs_males_reached_idx ON outreach_logs(males_reached);
CREATE INDEX IF NOT EXISTS outreach_logs_females_reached_idx ON outreach_logs(females_reached);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS team_members_org_name_active_idx ON team_members(organization_id, name, is_active);
CREATE INDEX IF NOT EXISTS locations_zip_name_idx ON locations(zip_code, name);
CREATE INDEX IF NOT EXISTS outreach_logs_org_date_location_idx ON outreach_logs(organization_id, outreach_date, location_id);

-- =============================================
-- CREATE UNIQUE CONSTRAINTS
-- =============================================

-- Prevent duplicate locations with same name and zip_code
CREATE UNIQUE INDEX IF NOT EXISTS locations_name_zip_unique_idx 
ON locations(name, COALESCE(zip_code, '')) 
WHERE is_active = true;

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS WITH CASCADE RULES
-- =============================================

-- Add foreign key constraint for outreach_logs.location_id if not exists
DO $ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'outreach_logs_location_id_fkey') THEN
        ALTER TABLE outreach_logs 
        ADD CONSTRAINT outreach_logs_location_id_fkey 
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
    END IF;
END $;

-- =============================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =============================================

-- Team Members updated_at trigger
DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_team_members ENABLE ROW LEVEL SECURITY;
-- 
=============================================
-- RLS POLICIES - TEAM_MEMBERS
-- =============================================

-- Users can view team members from their organizations
CREATE POLICY "Users can view org team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Managers+ can insert team members for their organizations
CREATE POLICY "Managers can create team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager')
        AND is_active = true
    )
  );

-- Managers+ can update team members in their organizations
CREATE POLICY "Managers can update team members"
  ON team_members
  FOR UPDATE
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

-- Admins+ can delete team members from their organizations
CREATE POLICY "Admins can delete team members"
  ON team_members
  FOR DELETE
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
-- RLS POLICIES - LOCATIONS
-- =============================================

-- All authenticated users can view active locations (shared resource)
CREATE POLICY "Users can view active locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow anonymous users to view locations for public submissions
CREATE POLICY "Anonymous can view active locations"
  ON locations
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Responders+ can create new locations
CREATE POLICY "Responders can create locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
        AND is_active = true
    )
  );

-- Managers+ can update locations
CREATE POLICY "Managers can update locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager')
        AND is_active = true
    )
  );

-- Admins+ can delete locations
CREATE POLICY "Admins can delete locations"
  ON locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin')
        AND is_active = true
    )
  );

-- =============================================
-- RLS POLICIES - OUTREACH_TEAM_MEMBERS
-- =============================================

-- Users can view team member assignments for outreach logs they can access
CREATE POLICY "Users can view org outreach team assignments"
  ON outreach_team_members
  FOR SELECT
  TO authenticated
  USING (
    outreach_log_id IN (
      SELECT id
      FROM outreach_logs
      WHERE organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND is_active = true
      )
      OR organization_id IS NULL -- Allow viewing anonymous submissions
    )
  );

-- Responders+ can create team member assignments for their organization's outreach logs
CREATE POLICY "Responders can assign team members"
  ON outreach_team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    outreach_log_id IN (
      SELECT id
      FROM outreach_logs
      WHERE organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
          AND is_active = true
      )
    )
    AND team_member_id IN (
      SELECT id
      FROM team_members
      WHERE organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND is_active = true
      )
    )
  );

-- Responders+ can update team member assignments for their organization's outreach logs
CREATE POLICY "Responders can update team assignments"
  ON outreach_team_members
  FOR UPDATE
  TO authenticated
  USING (
    outreach_log_id IN (
      SELECT id
      FROM outreach_logs
      WHERE organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
          AND is_active = true
      )
    )
  );

-- Managers+ can delete team member assignments
CREATE POLICY "Managers can delete team assignments"
  ON outreach_team_members
  FOR DELETE
  TO authenticated
  USING (
    outreach_log_id IN (
      SELECT id
      FROM outreach_logs
      WHERE organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND role IN ('Owner', 'Admin', 'Manager')
          AND is_active = true
      )
    )
  );

-- =============================================
-- HELPER FUNCTIONS FOR ENHANCED ANALYTICS
-- =============================================

-- Function to get team member statistics
CREATE OR REPLACE FUNCTION get_team_member_stats(
  org_uuid uuid DEFAULT NULL,
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  team_member_id uuid,
  team_member_name text,
  organization_id uuid,
  organization_name text,
  total_activities bigint,
  active_days bigint,
  total_people_reached bigint,
  last_activity_date timestamptz
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.name,
    tm.organization_id,
    o.name as org_name,
    COUNT(otm.outreach_log_id) as total_activities,
    COUNT(DISTINCT ol.outreach_date) as active_days,
    COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
    MAX(ol.outreach_date) as last_activity_date
  FROM team_members tm
  LEFT JOIN outreach_team_members otm ON tm.id = otm.team_member_id
  LEFT JOIN outreach_logs ol ON otm.outreach_log_id = ol.id 
    AND ol.outreach_date BETWEEN start_date AND end_date
  LEFT JOIN organizations o ON tm.organization_id = o.id
  WHERE tm.is_active = true
    AND (org_uuid IS NULL OR tm.organization_id = org_uuid)
    AND (
      org_uuid IS NULL OR tm.organization_id IN (
        SELECT organization_id
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND is_active = true
      )
    )
  GROUP BY tm.id, tm.name, tm.organization_id, o.name
  ORDER BY total_activities DESC, tm.name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get location analytics
CREATE OR REPLACE FUNCTION get_location_analytics(
  org_uuid uuid DEFAULT NULL,
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  location_id uuid,
  location_name text,
  zip_code text,
  city text,
  total_activities bigint,
  total_people_reached bigint,
  total_kits_distributed bigint,
  active_days bigint,
  last_activity_date timestamptz,
  unique_team_members bigint
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.zip_code,
    l.city,
    COUNT(ol.id) as total_activities,
    COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
    COALESCE(SUM(ol.num_kits), 0) as total_kits_distributed,
    COUNT(DISTINCT ol.outreach_date) as active_days,
    MAX(ol.outreach_date) as last_activity_date,
    COUNT(DISTINCT otm.team_member_id) as unique_team_members
  FROM locations l
  LEFT JOIN outreach_logs ol ON l.id = ol.location_id 
    AND ol.outreach_date BETWEEN start_date AND end_date
    AND (org_uuid IS NULL OR ol.organization_id = org_uuid)
  LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
  WHERE l.is_active = true
  GROUP BY l.id, l.name, l.zip_code, l.city
  HAVING COUNT(ol.id) > 0 OR org_uuid IS NULL
  ORDER BY total_activities DESC, l.name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_team_member_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_analytics(uuid, timestamptz, timestamptz) TO authenticated;--
 =============================================
-- CREATE ANALYTICS VIEWS
-- =============================================

-- Team Member Statistics View
CREATE OR REPLACE VIEW team_member_stats_v1 AS
SELECT 
  tm.id,
  tm.name,
  tm.organization_id,
  o.name as organization_name,
  COUNT(otm.outreach_log_id) as total_activities,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
  MAX(ol.outreach_date) as last_activity_date
FROM team_members tm
LEFT JOIN outreach_team_members otm ON tm.id = otm.team_member_id
LEFT JOIN outreach_logs ol ON otm.outreach_log_id = ol.id
LEFT JOIN organizations o ON tm.organization_id = o.id
WHERE tm.is_active = true
GROUP BY tm.id, tm.name, tm.organization_id, o.name;

-- Location Analytics View
CREATE OR REPLACE VIEW location_analytics_v1 AS
SELECT 
  l.id,
  l.name,
  l.zip_code,
  l.city,
  COUNT(ol.id) as total_activities,
  COALESCE(SUM(ol.people_reached), 0) as total_people_reached,
  COALESCE(SUM(ol.num_kits), 0) as total_kits_distributed,
  COUNT(DISTINCT ol.outreach_date) as active_days,
  MAX(ol.outreach_date) as last_activity_date,
  COUNT(DISTINCT otm.team_member_id) as unique_team_members
FROM locations l
LEFT JOIN outreach_logs ol ON l.id = ol.location_id
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
GROUP BY l.id, l.name, l.zip_code, l.city;

-- Activity Timeline View
CREATE OR REPLACE VIEW activity_timeline_v1 AS
SELECT 
  ol.id as outreach_id,
  ol.outreach_date,
  ol.organization_id,
  o.name as organization_name,
  l.name as location_name,
  l.zip_code,
  ol.people_reached,
  ol.num_kits,
  ARRAY_AGG(tm.name ORDER BY tm.name) FILTER (WHERE tm.name IS NOT NULL) as team_members,
  ol.notes
FROM outreach_logs ol
LEFT JOIN organizations o ON ol.organization_id = o.id
LEFT JOIN locations l ON ol.location_id = l.id
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
LEFT JOIN team_members tm ON otm.team_member_id = tm.id
GROUP BY ol.id, ol.outreach_date, ol.organization_id, o.name, l.name, l.zip_code, ol.people_reached, ol.num_kits, ol.notes
ORDER BY ol.outreach_date DESC;

-- =============================================
-- GRANT VIEW PERMISSIONS
-- =============================================

-- Grant select permissions on views to authenticated users
GRANT SELECT ON team_member_stats_v1 TO authenticated;
GRANT SELECT ON location_analytics_v1 TO authenticated;
GRANT SELECT ON activity_timeline_v1 TO authenticated;