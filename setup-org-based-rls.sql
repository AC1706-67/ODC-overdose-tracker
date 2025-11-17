-- Setup organization-based Row Level Security
-- Rule: Users can only see/modify data from organizations they belong to

-- ============================================
-- 1. INCIDENTS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS incidents_org_select ON incidents;
DROP POLICY IF EXISTS incidents_org_insert ON incidents;
DROP POLICY IF EXISTS incidents_org_update ON incidents;
DROP POLICY IF EXISTS incidents_org_delete ON incidents;

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see incidents from their organizations
CREATE POLICY "org_members_can_select_incidents" ON incidents
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

-- INSERT: Users can create incidents for their organizations
CREATE POLICY "org_members_can_insert_incidents" ON incidents
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- UPDATE: Creators OR org admins/supervisors can update
CREATE POLICY "org_members_can_update_incidents" ON incidents
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = incidents.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- DELETE: Creators OR org admins/supervisors can delete
CREATE POLICY "org_members_can_delete_incidents" ON incidents
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = incidents.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- ============================================
-- 2. OUTREACH_LOGS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS outreach_select_raep ON outreach_logs;
DROP POLICY IF EXISTS outreach_write_raep ON outreach_logs;
DROP POLICY IF EXISTS outreach_org_select ON outreach_logs;
DROP POLICY IF EXISTS outreach_org_insert ON outreach_logs;
DROP POLICY IF EXISTS outreach_org_update ON outreach_logs;
DROP POLICY IF EXISTS outreach_org_delete ON outreach_logs;

-- Enable RLS
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see outreach logs from their organizations
CREATE POLICY "org_members_can_select_outreach" ON outreach_logs
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

-- INSERT: Users can create outreach logs for their organizations
CREATE POLICY "org_members_can_insert_outreach" ON outreach_logs
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- UPDATE: Creators OR org admins/supervisors can update
CREATE POLICY "org_members_can_update_outreach" ON outreach_logs
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = outreach_logs.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- DELETE: Creators OR org admins/supervisors can delete
CREATE POLICY "org_members_can_delete_outreach" ON outreach_logs
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = outreach_logs.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- ============================================
-- 3. DISTRIBUTIONS TABLE
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS distributions_org_select ON distributions;
DROP POLICY IF EXISTS distributions_org_insert ON distributions;
DROP POLICY IF EXISTS distributions_org_update ON distributions;
DROP POLICY IF EXISTS distributions_org_delete ON distributions;

-- Enable RLS
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can see distributions from their organizations
CREATE POLICY "org_members_can_select_distributions" ON distributions
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

-- INSERT: Users can create distributions for their organizations
CREATE POLICY "org_members_can_insert_distributions" ON distributions
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND organization_id IN (
    SELECT organization_id 
    FROM user_organizations 
    WHERE user_id = auth.uid() 
      AND is_active = true
  )
);

-- UPDATE: Creators OR org admins/supervisors can update
CREATE POLICY "org_members_can_update_distributions" ON distributions
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = distributions.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- DELETE: Creators OR org admins/supervisors can delete
CREATE POLICY "org_members_can_delete_distributions" ON distributions
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 
    FROM user_organizations uo 
    WHERE uo.user_id = auth.uid() 
      AND uo.organization_id = distributions.organization_id
      AND uo.is_active = true
      AND uo.role IN ('admin', 'supervisor')
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('incidents', 'outreach_logs', 'distributions')
ORDER BY tablename, policyname;

COMMENT ON POLICY "org_members_can_select_incidents" ON incidents IS 
'Users can only see incidents from organizations they belong to';

COMMENT ON POLICY "org_members_can_update_incidents" ON incidents IS 
'Creators or org admins/supervisors can update incidents';

COMMENT ON POLICY "org_members_can_select_outreach" ON outreach_logs IS 
'Users can only see outreach logs from organizations they belong to';

COMMENT ON POLICY "org_members_can_update_outreach" ON outreach_logs IS 
'Creators or org admins/supervisors can update outreach logs';

COMMENT ON POLICY "org_members_can_select_distributions" ON distributions IS 
'Users can only see distributions from organizations they belong to';

COMMENT ON POLICY "org_members_can_update_distributions" ON distributions IS 
'Creators or org admins/supervisors can update distributions';
