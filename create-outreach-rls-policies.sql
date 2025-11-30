-- ============================================================================
-- CREATE RLS POLICIES FOR OUTREACH_LOGS
-- ============================================================================
-- Harmonized policies for organization-level isolation
-- Each org can only access their own outreach logs
-- ============================================================================

-- Drop any existing policies first (in case some exist)
DROP POLICY IF EXISTS "Allow anonymous outreach log submission" ON public.outreach_logs;
DROP POLICY IF EXISTS "Users can submit outreach logs for their orgs" ON public.outreach_logs;
DROP POLICY IF EXISTS "Users can view org outreach logs" ON public.outreach_logs;
DROP POLICY IF EXISTS "org_members_select_outreach_logs" ON public.outreach_logs;
DROP POLICY IF EXISTS "org_members_insert_outreach_logs" ON public.outreach_logs;
DROP POLICY IF EXISTS "org_members_update_outreach_logs" ON public.outreach_logs;
DROP POLICY IF EXISTS "org_admins_delete_outreach_logs" ON public.outreach_logs;

-- ============================================================================
-- SELECT: Users can read outreach logs from organizations they belong to
-- ============================================================================
CREATE POLICY "org_members_select_outreach_logs"
  ON public.outreach_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- INSERT: Users can insert outreach logs for organizations they belong to
-- ============================================================================
CREATE POLICY "org_members_insert_outreach_logs"
  ON public.outreach_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- UPDATE: Users can update outreach logs they created OR if they're in the org
-- ============================================================================
CREATE POLICY "org_members_update_outreach_logs"
  ON public.outreach_logs
  FOR UPDATE
  TO authenticated
  USING (
    outreach_logs.user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- DELETE: Only org admins can delete outreach logs
-- ============================================================================
CREATE POLICY "org_admins_delete_outreach_logs"
  ON public.outreach_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND uo.role IN ('Admin', 'Owner')
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- VERIFY: Show the policies we just created
-- ============================================================================
SELECT 
  '=== RLS POLICIES CREATED ===' as section;

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Org members can read their org logs'
    WHEN cmd = 'INSERT' THEN '✅ Org members can create logs for their org'
    WHEN cmd = 'UPDATE' THEN '✅ Org members can update their org logs'
    WHEN cmd = 'DELETE' THEN '✅ Only admins can delete'
  END as description
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  'RLS Enabled' as check_name,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'outreach_logs')
    THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

SELECT 
  'Policies Created' as check_name,
  COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

SELECT 
  'Organizations Ready' as check_name,
  COUNT(*)::text || ' orgs with outreach enabled' as status
FROM public.organizations
WHERE outreach_enabled = true;
