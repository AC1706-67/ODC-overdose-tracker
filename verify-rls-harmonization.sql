-- ============================================================================
-- VERIFY RLS HARMONIZATION
-- ============================================================================
-- Run this after applying the migration to verify everything is correct
-- ============================================================================

-- Check 1: Verify new columns exist
SELECT 
  '=== CHECK 1: New Columns ===' as check_name,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL: Missing columns'
  END as result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN ('share_incidents_zip_only', 'is_demo_organization');

-- Check 2: Verify demo org exists
SELECT 
  '=== CHECK 2: Demo Organization ===' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL: Demo org not found'
  END as result
FROM organizations
WHERE is_demo_organization = true AND is_active = true;

-- Check 3: Verify incidents RLS policies
SELECT 
  '=== CHECK 3: Incidents RLS Policies ===' as check_name,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL: Missing policies'
  END as result
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'incidents'
  AND policyname LIKE 'org_%';

-- Check 4: Verify outreach_logs RLS policies
SELECT 
  '=== CHECK 4: Outreach Logs RLS Policies ===' as check_name,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS'
    ELSE '❌ FAIL: Missing policies'
  END as result
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
  AND policyname LIKE 'org_%';

-- Check 5: Verify incident_zip_aggregate view exists
SELECT 
  '=== CHECK 5: ZIP Aggregate View ===' as check_name,
  CASE 
    WHEN COUNT(*) = 1 THEN '✅ PASS'
    ELSE '❌ FAIL: View not found'
  END as result
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'incident_zip_aggregate';

-- Check 6: Verify no orgs are sharing ZIP data yet
SELECT 
  '=== CHECK 6: ZIP Sharing Disabled ===' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' orgs have ZIP sharing enabled'
  END as result
FROM organizations
WHERE share_incidents_zip_only = true;

-- Check 7: Verify RLS is enabled on key tables
SELECT 
  '=== CHECK 7: RLS Enabled ===' as check_name,
  CASE 
    WHEN COUNT(*) = COUNT(*) FILTER (WHERE rowsecurity = true) THEN '✅ PASS'
    ELSE '❌ FAIL: RLS not enabled on all tables'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('incidents', 'outreach_logs', 'organizations', 'user_organizations');

-- Detailed policy listing for incidents
SELECT 
  '=== INCIDENTS POLICIES DETAIL ===' as section,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE 'org_%' THEN '✅ New harmonized policy'
    ELSE '⚠️  Old policy (should be removed)'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'incidents'
ORDER BY cmd, policyname;

-- Detailed policy listing for outreach_logs
SELECT 
  '=== OUTREACH_LOGS POLICIES DETAIL ===' as section,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE 'org_%' THEN '✅ New harmonized policy'
    ELSE '⚠️  Old policy (should be removed)'
  END as status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- Show demo org details
SELECT 
  '=== DEMO ORG DETAILS ===' as section,
  id,
  name,
  slug,
  is_demo_organization,
  is_certified,
  is_public,
  is_active,
  outreach_enabled,
  share_incidents_zip_only
FROM organizations
WHERE is_demo_organization = true;

-- Show all organizations with their sharing status
SELECT 
  '=== ALL ORGANIZATIONS ===' as section,
  name,
  slug,
  is_demo_organization,
  share_incidents_zip_only,
  is_active,
  (SELECT COUNT(*) FROM user_organizations WHERE organization_id = organizations.id) as member_count
FROM organizations
ORDER BY is_demo_organization DESC, name;

-- Final summary
SELECT 
  '=== FINAL SUMMARY ===' as section,
  (SELECT COUNT(*) FROM organizations) as total_orgs,
  (SELECT COUNT(*) FROM organizations WHERE is_demo_organization = true) as demo_orgs,
  (SELECT COUNT(*) FROM organizations WHERE share_incidents_zip_only = true) as orgs_sharing_zip,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incidents' AND policyname LIKE 'org_%') as incidents_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'outreach_logs' AND policyname LIKE 'org_%') as outreach_policies,
  (SELECT COUNT(*) FROM user_organizations WHERE organization_id IN (SELECT id FROM organizations WHERE is_demo_organization = true)) as demo_org_members;
