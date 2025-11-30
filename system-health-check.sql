-- ============================================================================
-- SYSTEM HEALTH CHECK
-- ============================================================================
-- Quick verification that everything is still working after restart
-- ============================================================================

-- 1. Check organizations
SELECT 
  '=== ORGANIZATIONS ===' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE outreach_enabled = true) as with_outreach
FROM public.organizations;

-- 2. Check RLS on outreach_logs
SELECT 
  '=== OUTREACH_LOGS RLS ===' as section,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'outreach_logs') as policy_count
FROM pg_tables 
WHERE tablename = 'outreach_logs';

-- 3. Check RLS on incidents
SELECT 
  '=== INCIDENTS RLS ===' as section,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'incidents') as policy_count
FROM pg_tables 
WHERE tablename = 'incidents';

-- 4. Check indexes
SELECT 
  '=== PERFORMANCE INDEXES ===' as section,
  COUNT(*) FILTER (WHERE tablename = 'user_organizations') as user_orgs_indexes,
  COUNT(*) FILTER (WHERE tablename = 'outreach_logs') as outreach_indexes,
  COUNT(*) FILTER (WHERE tablename = 'incidents') as incidents_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- 5. Overall health
SELECT 
  '=== SYSTEM HEALTH ===' as section,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.organizations WHERE outreach_enabled = true) >= 4
      AND (SELECT rowsecurity FROM pg_tables WHERE tablename = 'outreach_logs') = true
      AND (SELECT rowsecurity FROM pg_tables WHERE tablename = 'incidents') = true
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'outreach_logs') >= 4
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'incidents') >= 4
    THEN '✅ ALL SYSTEMS OPERATIONAL'
    ELSE '⚠️ SOME ISSUES DETECTED'
  END as status;
