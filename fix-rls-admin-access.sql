-- ============================================================================
-- FIX RLS: ADMINS SEE ALL ORG DATA, PEERS SEE OWN DATA
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "outreach_select_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_insert_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_update_by_membership" ON outreach_logs;
DROP POLICY IF EXISTS "outreach_delete_by_membership" ON outreach_logs;

-- ============================================================================
-- SELECT POLICIES: Admins see all, others see own
-- ============================================================================

-- Policy 1: Admins/Managers/Owners see ALL logs for their organization
CREATE POLICY "admin_view_all_org_outreach"
ON outreach_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.organization_id = outreach_logs.organization_id
      AND uo.is_active = true
      AND uo.role IN ('Owner', 'Admin', 'Manager', 'Supervisor')
  )
);

-- Policy 2: Regular users (Responders/Viewers) see only their own logs
CREATE POLICY "user_view_own_outreach"
ON outreach_logs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR created_by = auth.uid()
);

-- ============================================================================
-- INSERT POLICY: Anyone in the org can create logs
-- ============================================================================

CREATE POLICY "org_member_insert_outreach"
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

-- ============================================================================
-- UPDATE POLICY: Admins update any, users update own
-- ============================================================================

CREATE POLICY "admin_update_org_outreach"
ON outreach_logs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.organization_id = outreach_logs.organization_id
      AND uo.is_active = true
      AND uo.role IN ('Owner', 'Admin', 'Manager')
  )
  OR user_id = auth.uid()
  OR created_by = auth.uid()
);

-- ============================================================================
-- DELETE POLICY: Only admins can delete
-- ============================================================================

CREATE POLICY "admin_delete_outreach"
ON outreach_logs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.organization_id = outreach_logs.organization_id
      AND uo.is_active = true
      AND uo.role IN ('Owner', 'Admin', 'Manager')
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
  '=== OUTREACH_LOGS RLS POLICIES ===' as section,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'outreach_logs'
ORDER BY cmd, policyname;
