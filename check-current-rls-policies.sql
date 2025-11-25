-- Check current RLS status and policies for outreach_logs

-- 1. Is RLS enabled?
SELECT 
  '=== RLS STATUS ===' as section,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'outreach_logs';

-- 2. What policies exist?
SELECT 
  '=== CURRENT POLICIES ===' as section,
  policyname,
  cmd as operation,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- 3. Test query: What would the current user see?
-- (Run this as your test user to see if RLS is working)
SELECT 
  '=== WHAT I CAN SEE ===' as section,
  COUNT(*) as total_logs_visible
FROM outreach_logs;

-- 4. Show sample of visible logs
SELECT 
  '=== SAMPLE VISIBLE LOGS ===' as section,
  id,
  organization_id,
  outreach_date,
  zip_code,
  num_kits
FROM outreach_logs
ORDER BY outreach_date DESC
LIMIT 5;
