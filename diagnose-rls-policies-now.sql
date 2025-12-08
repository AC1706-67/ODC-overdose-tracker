-- COMPREHENSIVE RLS POLICY DIAGNOSTIC
-- Run this to see EXACTLY what policies exist right now

-- 1. Show ALL policies on user_organizations (any schema)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY schemaname, policyname;

-- 2. Check if RLS is even enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'user_organizations';

-- 3. Look for ANY policy that references user_organizations in its definition
SELECT 
  schemaname,
  tablename,
  policyname,
  'RECURSIVE!' as warning
FROM pg_policies
WHERE tablename = 'user_organizations'
  AND (qual LIKE '%user_organizations%' OR with_check LIKE '%user_organizations%');
