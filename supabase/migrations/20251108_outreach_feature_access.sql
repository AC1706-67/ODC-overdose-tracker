-- Feature Access Control for Outreach
-- Only Recovery Alliance of El Paso can access outreach features

-- 1) Ensure RAEP organization exists
INSERT INTO organizations (slug, name, is_active)
VALUES ('recovery-alliance-el-paso', 'Recovery Alliance of El Paso', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true;

-- 2) Enable RLS on outreach_logs if not already enabled
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- 3) Drop existing policies if they exist
DROP POLICY IF EXISTS outreach_select_raep ON outreach_logs;
DROP POLICY IF EXISTS outreach_write_raep ON outreach_logs;

-- 4) Create SELECT policy - only RAEP users can read outreach logs
CREATE POLICY outreach_select_raep ON outreach_logs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
      AND (o.slug = 'recovery-alliance-el-paso' OR o.slug = 'recovery-alliance')
  )
);

-- 5) Create WRITE policy - only RAEP users can insert/update/delete outreach logs
CREATE POLICY outreach_write_raep ON outreach_logs
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
      AND (o.slug = 'recovery-alliance-el-paso' OR o.slug = 'recovery-alliance')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
      AND (o.slug = 'recovery-alliance-el-paso' OR o.slug = 'recovery-alliance')
  )
);

-- 6) Apply same policies to related tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Locations policies
DROP POLICY IF EXISTS locations_select_org ON locations;
DROP POLICY IF EXISTS locations_write_org ON locations;

CREATE POLICY locations_select_org ON locations
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
);

CREATE POLICY locations_write_org ON locations
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
)
WITH CHECK (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
);

-- Team members policies
DROP POLICY IF EXISTS team_members_select_org ON team_members;
DROP POLICY IF EXISTS team_members_write_org ON team_members;

CREATE POLICY team_members_select_org ON team_members
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
);

CREATE POLICY team_members_write_org ON team_members
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
)
WITH CHECK (
  organization_id IN (
    SELECT o.id
    FROM organizations o
    JOIN user_organizations uo ON uo.organization_id = o.id
    WHERE uo.user_id = auth.uid()
      AND uo.is_active = true
  )
);

COMMENT ON POLICY outreach_select_raep ON outreach_logs IS 
'Only users from Recovery Alliance of El Paso can read outreach logs';

COMMENT ON POLICY outreach_write_raep ON outreach_logs IS 
'Only users from Recovery Alliance of El Paso can write outreach logs';
