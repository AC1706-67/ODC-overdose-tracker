-- ============================================================================
-- VERIFY ORGANIZATION ISOLATION FOR OUTREACH LOGS
-- ============================================================================
-- Confirms that:
-- 1. All orgs have outreach enabled
-- 2. RLS policies enforce strict org-level isolation
-- 3. Users can only see/write their own org's data
-- ============================================================================

-- Check 1: All organizations have outreach enabled
SELECT 
  '=== OUTREACH ACCESS STATUS ===' as section;

SELECT 
  name,
  slug,
  outreach_enabled,
  is_active,
  CASE 
    WHEN outreach_enabled = true AND is_active = true THEN '✅ Full access'
    WHEN outreach_enabled = false THEN '❌ Outreach disabled'
    WHEN is_active = false THEN '⚠️  Org inactive'
    ELSE '❓ Check status'
  END as status
FROM public.organizations
ORDER BY name;

-- Check 2: Verify RLS policies enforce org isolation
SELECT 
  '=== RLS POLICIES (Org Isolation) ===' as section;

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE 'org_members_%' THEN '✅ Harmonized'
    WHEN policyname LIKE 'org_admins_%' THEN '✅ Admin-only'
    ELSE '⚠️  Legacy policy'
  END as policy_type,
  CASE 
    WHEN qual LIKE '%user_organizations%' OR with_check LIKE '%user_organizations%' 
    THEN '✅ Checks org membership'
    ELSE '⚠️  No org check'
  END as isolation_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- Check 3: Show the actual policy logic
SELECT 
  '=== POLICY DETAILS ===' as section;

SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
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

-- Check 4: Verify RLS is enabled
SELECT 
  '=== RLS STATUS ===' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS enforcing org isolation'
    ELSE '❌ RLS DISABLED - SECURITY RISK!'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

-- Check 5: Summary of org isolation
SELECT 
  '=== ISOLATION SUMMARY ===' as section;

SELECT 
  'Organizations with outreach' as metric,
  COUNT(*)::text as value
FROM public.organizations
WHERE outreach_enabled = true

UNION ALL

SELECT 
  'RLS policies enforcing isolation' as metric,
  COUNT(*)::text as value
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
  AND (qual LIKE '%user_organizations%' OR with_check LIKE '%user_organizations%')

UNION ALL

SELECT 
  'RLS enabled' as metric,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'outreach_logs') 
    THEN 'Yes ✅'
    ELSE 'No ❌'
  END as value;

-- Check 6: Test query to show what a user would see
-- (This is what the RLS policies enforce)
SELECT 
  '=== EXAMPLE: What Users See ===' as section;

SELECT 
  'Users can only SELECT logs where:' as rule,
  'organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() AND is_active = true)' as enforcement;

SELECT 
  'Users can only INSERT logs where:' as rule,
  'organization_id matches their active membership' as enforcement;

SELECT 
  'Users can only UPDATE logs where:' as rule,
  'They created it OR they belong to the org' as enforcement;

SELECT 
  'Users can only DELETE logs where:' as rule,
  'They are Admin/Owner of the org' as enforcement;
