-- ============================================================================
-- OUTREACH LOGS RLS POLICY
-- ============================================================================
-- Ensures users can only see/modify outreach logs from their organizations
-- ============================================================================

-- 1. Enable RLS on outreach_logs (if not already enabled)
ALTER TABLE outreach_logs ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to start fresh
DROP POLICY IF EXISTS "outreach_select_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_insert_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_update_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_delete_by_membership" ON outreach_logs;

-- 3. SELECT Policy: Users can view logs from organizations they belong to
CREATE POLICY "outreach_select_by_membership"
ON outreach_logs
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

-- 4. INSERT Policy: Users can create logs for organizations they belong to
CREATE POLICY "outreach_insert_by_membership"
ON outreach_logs
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- 5. UPDATE Policy: Users can update logs from their organizations
CREATE POLICY "outreach_update_by_membership"
ON outreach_logs
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND is_active = true
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND is_active = true
  )
);

-- 6. DELETE Policy: Only admins/managers can delete logs
CREATE POLICY "outreach_delete_by_membership"
ON outreach_logs
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('Owner', 'Admin', 'Manager')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'outreach_logs';

-- List all policies on outreach_logs
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- ============================================================================
-- WHAT THIS DOES
-- ============================================================================
-- 
-- ✅ Users automatically see ONLY logs from organizations they're members of
-- ✅ Multi-org users see logs from ALL their organizations combined
-- ✅ Users can submit logs to any organization they belong to
-- ✅ Users can update logs from their organizations
-- ✅ Only Admins/Managers/Owners can delete logs
-- ✅ No manual filtering needed in frontend - database handles it automatically
--
-- Example scenarios:
-- - User in RAEP only → sees only RAEP logs
-- - User in RAEP + Haven AI → sees logs from both organizations
-- - User not in any org → sees nothing (empty result)
-- ============================================================================
