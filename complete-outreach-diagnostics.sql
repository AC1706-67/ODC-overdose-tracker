-- ============================================================================
-- COMPLETE OUTREACH LOGS DIAGNOSTICS
-- Run each query separately in Supabase SQL Editor
-- ============================================================================

-- QUERY 1: Table Schema
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'outreach_logs' 
ORDER BY ordinal_position;

-- QUERY 2: RLS Policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- QUERY 3: RLS Enabled Status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'outreach_logs';

-- QUERY 4: Count Total Logs
SELECT COUNT(*) as total_logs FROM public.outreach_logs;

-- QUERY 5: Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'outreach_logs'
) as table_exists;

-- QUERY 6: Get user memberships for RAEP
SELECT 
  uo.user_id,
  u.email,
  uo.role,
  uo.is_active,
  o.name as org_name,
  o.slug as org_slug
FROM public.user_organizations uo
JOIN public.organizations o ON uo.organization_id = o.id
LEFT JOIN auth.users u ON uo.user_id = u.id
WHERE o.slug = 'raep'
  AND uo.is_active = true;

-- QUERY 7: List all users (for finding test accounts)
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at IS NOT NULL THEN 'Active'
    ELSE 'Never logged in'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;
