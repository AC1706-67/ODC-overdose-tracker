-- ============================================================================
-- QUICK CHECK: Run this single query to get all critical info at once
-- ============================================================================

-- Check 1: Does table exist?
SELECT 'TABLE EXISTS' as check_name, 
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'outreach_logs'
  ) as result;

-- Check 2: Is RLS enabled?
SELECT 'RLS ENABLED' as check_name,
  COALESCE(
    (SELECT rowsecurity FROM pg_tables 
     WHERE schemaname = 'public' AND tablename = 'outreach_logs'),
    false
  ) as result;

-- Check 3: How many RLS policies?
SELECT 'RLS POLICIES COUNT' as check_name,
  COUNT(*)::text as result
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'outreach_logs';

-- Check 4: How many logs exist?
SELECT 'TOTAL LOGS' as check_name,
  COUNT(*)::text as result
FROM public.outreach_logs;

-- Check 5: How many orgs with outreach enabled?
SELECT 'ORGS WITH OUTREACH' as check_name,
  COUNT(*)::text as result
FROM public.organizations
WHERE outreach_enabled = true;

-- Check 6: How many active RAEP members?
SELECT 'RAEP MEMBERS' as check_name,
  COUNT(*)::text as result
FROM public.user_organizations uo
JOIN public.organizations o ON uo.organization_id = o.id
WHERE o.slug = 'raep' AND uo.is_active = true;

-- ============================================================================
-- DETAILED INFO: Run these if you need specifics
-- ============================================================================

-- Show RLS policy names
SELECT 'RLS POLICY: ' || policyname as info, cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'outreach_logs'
ORDER BY cmd;

-- Show RAEP members with emails
SELECT 
  'RAEP MEMBER: ' || COALESCE(u.email, 'Unknown') as info,
  uo.role,
  uo.user_id
FROM public.user_organizations uo
JOIN public.organizations o ON uo.organization_id = o.id
LEFT JOIN auth.users u ON uo.user_id = u.id
WHERE o.slug = 'raep' AND uo.is_active = true;

-- Show column count
SELECT 
  'COLUMNS IN outreach_logs' as info,
  COUNT(*)::text as count
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'outreach_logs';
