-- ============================================================================
-- VERIFY ALL TABLES HAVE ORG ISOLATION
-- ============================================================================
-- Check that incidents, outreach_logs, and all org-related tables
-- have proper RLS policies for organization isolation
-- ============================================================================

-- Check 1: incidents table RLS
SELECT '=== INCIDENTS TABLE RLS ===' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'incidents';

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE 'org_%' THEN '✅ Harmonized'
    ELSE '⚠️  Legacy policy'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'incidents'
ORDER BY cmd;

-- Check 2: outreach_logs table RLS
SELECT '=== OUTREACH_LOGS TABLE RLS ===' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE 'org_%' THEN '✅ Harmonized'
    ELSE '⚠️  Legacy policy'
  END as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY cmd;

-- Check 3: distributions table (if exists)
SELECT '=== DISTRIBUTIONS TABLE RLS ===' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS enabled'
    ELSE '❌ RLS disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'distributions';

SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'distributions'
ORDER BY cmd;

-- Check 4: All tables with organization_id column
SELECT '=== ALL TABLES WITH ORGANIZATION_ID ===' as section;

SELECT 
  t.table_name,
  COALESCE(pt.rowsecurity, false) as rls_enabled,
  COUNT(pp.policyname) as policy_count,
  CASE 
    WHEN COALESCE(pt.rowsecurity, false) = true AND COUNT(pp.policyname) >= 4 
    THEN '✅ Fully protected'
    WHEN COALESCE(pt.rowsecurity, false) = true AND COUNT(pp.policyname) > 0 
    THEN '⚠️  Partial protection'
    WHEN COALESCE(pt.rowsecurity, false) = true 
    THEN '❌ RLS enabled but no policies'
    ELSE '❌ No RLS'
  END as security_status
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
LEFT JOIN pg_tables pt ON pt.tablename = t.table_name AND pt.schemaname = 'public'
LEFT JOIN pg_policies pp ON pp.tablename = t.table_name AND pp.schemaname = 'public'
WHERE c.table_schema = 'public'
  AND c.column_name = 'organization_id'
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, pt.rowsecurity
ORDER BY t.table_name;

-- Check 5: Summary
SELECT '=== SECURITY SUMMARY ===' as section;

SELECT 
  'incidents' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname LIKE 'org_%')
    THEN '✅ Protected'
    ELSE '❌ Missing policies'
  END as status
UNION ALL
SELECT 
  'outreach_logs' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'outreach_logs' AND policyname LIKE 'org_%')
    THEN '✅ Protected'
    ELSE '❌ Missing policies'
  END as status
ORDER BY table_name;
