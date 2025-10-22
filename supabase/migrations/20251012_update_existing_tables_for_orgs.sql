/*
  # Update Existing Tables for Organizational Structure

  1. Modify existing tables
    - Add organization_id to incidents and distributions
    - Add user_id for better tracking
    - Update RLS policies for organization-based access

  2. Data Migration
    - Handle existing data gracefully
    - Maintain backward compatibility

  3. Enhanced Analytics
    - Organization-specific reporting
    - Cross-organization aggregation (for admins)
*/

-- =============================================
-- UPDATE INCIDENTS TABLE
-- =============================================

-- Add organization and user tracking
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);

-- Create index for new columns
CREATE INDEX IF NOT EXISTS incidents_organization_idx ON incidents(organization_id);
CREATE INDEX IF NOT EXISTS incidents_submitted_by_idx ON incidents(submitted_by);

-- =============================================
-- UPDATE DISTRIBUTIONS TABLE
-- =============================================

-- Add organization tracking and rename responder_id for clarity
ALTER TABLE distributions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);

-- Update the responder_id column name for clarity (if you want to keep it)
-- ALTER TABLE distributions RENAME COLUMN responder_id TO legacy_responder_id;

-- Create index for new columns
CREATE INDEX IF NOT EXISTS distributions_organization_idx ON distributions(organization_id);
CREATE INDEX IF NOT EXISTS distributions_submitted_by_idx ON distributions(submitted_by);

-- =============================================
-- UPDATE RLS POLICIES FOR INCIDENTS
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous incident submission" ON incidents;
DROP POLICY IF EXISTS "Allow authenticated users to read incidents" ON incidents;

-- New policies with organization support

-- Allow authenticated users to submit incidents for their organizations
CREATE POLICY "Users can submit incidents for their orgs"
  ON incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
        AND is_active = true
    )
  );

-- Allow anonymous submissions (for public health emergency use)
CREATE POLICY "Allow anonymous incident submission"
  ON incidents
  FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NULL);

-- Users can view incidents from their organizations
CREATE POLICY "Users can view org incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow viewing anonymous submissions
  );

-- Responders can only view their own submissions (optional stricter policy)
CREATE POLICY "Responders can view own incidents"
  ON incidents
  FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
        AND is_active = true
    )
  );

-- =============================================
-- UPDATE RLS POLICIES FOR DISTRIBUTIONS
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous distribution submission" ON distributions;
DROP POLICY IF EXISTS "Allow authenticated users to read distributions" ON distributions;

-- New policies with organization support

-- Allow authenticated users to submit distributions for their organizations
CREATE POLICY "Users can submit distributions for their orgs"
  ON distributions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('Owner', 'Admin', 'Manager', 'Supervisor', 'Responder')
        AND is_active = true
    )
  );

-- Allow anonymous submissions (for public health emergency use)
CREATE POLICY "Allow anonymous distribution submission"
  ON distributions
  FOR INSERT
  TO anon
  WITH CHECK (organization_id IS NULL);

-- Users can view distributions from their organizations
CREATE POLICY "Users can view org distributions"
  ON distributions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    OR organization_id IS NULL -- Allow viewing anonymous submissions
  );

-- =============================================
-- HELPER FUNCTIONS FOR ORGANIZATION MANAGEMENT
-- =============================================

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid uuid DEFAULT auth.uid())
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  user_role text,
  is_default boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    uo.role,
    (o.id = p.default_organization_id) as is_default
  FROM organizations o
  JOIN user_organizations uo ON o.id = uo.organization_id
  LEFT JOIN profiles p ON p.id = user_uuid
  WHERE uo.user_id = user_uuid
    AND uo.is_active = true
    AND o.is_active = true
  ORDER BY is_default DESC, o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission in organization
CREATE OR REPLACE FUNCTION user_has_org_permission(
  user_uuid uuid,
  org_uuid uuid,
  required_role text DEFAULT 'Responder'
)
RETURNS boolean AS $$
DECLARE
  user_role text;
  role_hierarchy text[] := ARRAY['Viewer', 'Responder', 'Supervisor', 'Manager', 'Admin', 'Owner'];
  required_level int;
  user_level int;
BEGIN
  -- Get user's role in the organization
  SELECT role INTO user_role
  FROM user_organizations
  WHERE user_id = user_uuid
    AND organization_id = org_uuid
    AND is_active = true;
  
  -- If user is not in organization, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get role levels
  SELECT array_position(role_hierarchy, required_role) INTO required_level;
  SELECT array_position(role_hierarchy, user_role) INTO user_level;
  
  -- Return true if user's role level >= required level
  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(
  org_uuid uuid,
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  total_incidents bigint,
  total_distributions bigint,
  narcan_incidents bigint,
  survival_rate numeric,
  unique_zip_codes bigint,
  active_responders bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count(*) FROM incidents 
     WHERE organization_id = org_uuid 
       AND created_at BETWEEN start_date AND end_date) as total_incidents,
    
    (SELECT count(*) FROM distributions 
     WHERE organization_id = org_uuid 
       AND created_at BETWEEN start_date AND end_date) as total_distributions,
    
    (SELECT count(*) FROM incidents 
     WHERE organization_id = org_uuid 
       AND narcan_used = true 
       AND created_at BETWEEN start_date AND end_date) as narcan_incidents,
    
    (SELECT 
       CASE 
         WHEN count(*) = 0 THEN 0
         ELSE round(
           (count(*) FILTER (WHERE survival = 'Survived'))::numeric / 
           count(*)::numeric * 100, 2
         )
       END
     FROM incidents 
     WHERE organization_id = org_uuid 
       AND survival != 'Unknown'
       AND created_at BETWEEN start_date AND end_date) as survival_rate,
    
    (SELECT count(DISTINCT zip_code) FROM incidents 
     WHERE organization_id = org_uuid 
       AND created_at BETWEEN start_date AND end_date) as unique_zip_codes,
    
    (SELECT count(DISTINCT submitted_by) FROM incidents 
     WHERE organization_id = org_uuid 
       AND submitted_by IS NOT NULL
       AND created_at BETWEEN start_date AND end_date) as active_responders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organizations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_permission(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_stats(uuid, timestamptz, timestamptz) TO authenticated;