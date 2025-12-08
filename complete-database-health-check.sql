-- ============================================================================
-- COMPLETE DATABASE HEALTH CHECK
-- Run this in Supabase SQL Editor to see what's missing or misconfigured
-- ============================================================================

-- 1. CHECK ALL REQUIRED TABLES EXIST
SELECT 
  'TABLES' as check_type,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ Core tables exist (' || COUNT(*)::text || ')'
    ELSE '❌ Missing tables: ' || (7 - COUNT(*))::text
  END as status,
  string_agg(table_name, ', ') as found_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'organizations',
    'user_organizations',
    'incidents',
    'outreach_logs',
    'team_members',
    'certification_requests'
  );

-- 2. CHECK CRITICAL COLUMNS IN PROFILES
SELECT 
  'PROFILES COLUMNS' as check_type,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ Profile columns OK'
    ELSE '❌ Missing columns'
  END as status,
  string_agg(column_name, ', ') as found_columns
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'email', 'terms_accepted_at', 'privacy_accepted_at', 'display_name', 'created_at');

-- 3. CHECK ORGANIZATIONS TABLE
SELECT 
  'ORGANIZATIONS' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::text || ' organizations exist'
    ELSE '❌ No organizations found'
  END as status,
  string_agg(name || ' (' || slug || ')', ', ') as orgs
FROM public.organizations
WHERE is_active = true;

-- 4. CHECK DEFAULT ORG EXISTS
SELECT 
  'DEFAULT ORG' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Anonymous Haven AI exists'
    ELSE '❌ Default org missing - run ensure-default-org-exists.sql'
  END as status,
  COALESCE(MAX(id)::text, 'N/A') as org_id
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- 5. CHECK RLS POLICIES ON USER_ORGANIZATIONS
SELECT 
  'USER_ORGS RLS' as check_type,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ ' || COUNT(*)::text || ' policies'
    ELSE '❌ Missing RLS policies'
  END as status,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename = 'user_organizations';

-- 6. CHECK FOR RECURSIVE POLICIES (BAD!)
SELECT 
  'RECURSIVE POLICIES' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No recursive policies'
    ELSE '❌ ' || COUNT(*)::text || ' recursive policies found!'
  END as status,
  string_agg(policyname, ', ') as bad_policies
FROM pg_policies
WHERE tablename = 'user_organizations'
  AND (qual LIKE '%user_organizations%' OR with_check LIKE '%user_organizations%');

-- 7. CHECK RLS POLICIES ON PROFILES
SELECT 
  'PROFILES RLS' as check_type,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ ' || COUNT(*)::text || ' policies'
    ELSE '❌ Missing RLS policies'
  END as status,
  string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE tablename = 'profiles';

-- 8. CHECK INCIDENTS TABLE
SELECT 
  'INCIDENTS TABLE' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents') 
    THEN '✅ Incidents table exists'
    ELSE '❌ Incidents table missing'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'incidents')
    THEN (SELECT COUNT(*)::text FROM public.incidents) || ' incidents'
    ELSE 'N/A'
  END as data;

-- 9. CHECK OUTREACH_LOGS TABLE
SELECT 
  'OUTREACH_LOGS TABLE' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outreach_logs') 
    THEN '✅ Outreach logs table exists'
    ELSE '❌ Outreach logs table missing'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'outreach_logs')
    THEN (SELECT COUNT(*)::text FROM public.outreach_logs) || ' logs'
    ELSE 'N/A'
  END as data;

-- 10. CHECK TEAM_MEMBERS TABLE
SELECT 
  'TEAM_MEMBERS TABLE' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') 
    THEN '✅ Team members table exists'
    ELSE '❌ Team members table missing'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members')
    THEN (SELECT COUNT(*)::text FROM public.team_members) || ' members'
    ELSE 'N/A'
  END as data;

-- 11. CHECK CERTIFICATION_REQUESTS TABLE (replaces invite codes)
SELECT 
  'CERT_REQUESTS TABLE' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certification_requests') 
    THEN '✅ Certification requests table exists'
    ELSE '❌ Run create-certification-requests-table-now.sql'
  END as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certification_requests')
    THEN (SELECT COUNT(*)::text FROM public.certification_requests WHERE status = 'pending') || ' pending'
    ELSE 'N/A'
  END as data;

-- 13. CHECK FOR ORPHANED USERS (users without profiles)
SELECT 
  'ORPHANED USERS' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users have profiles'
    ELSE '❌ ' || COUNT(*)::text || ' users without profiles'
  END as status,
  string_agg(au.email, ', ') as orphaned_emails
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
LIMIT 5;

-- 14. CHECK FOR USERS WITHOUT ORGS
SELECT 
  'USERS WITHOUT ORGS' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users assigned to orgs'
    ELSE '❌ ' || COUNT(*)::text || ' users without orgs'
  END as status,
  string_agg(p.email, ', ') as unassigned_emails
FROM public.profiles p
LEFT JOIN public.user_organizations uo ON uo.user_id = p.id AND uo.is_active = true
WHERE uo.id IS NULL
LIMIT 5;

-- 15. CHECK OUTREACH_ENABLED FLAG
SELECT 
  'OUTREACH ENABLED' as check_type,
  COUNT(*) || ' orgs with outreach enabled' as status,
  string_agg(name, ', ') as orgs_with_outreach
FROM public.organizations
WHERE outreach_enabled = true;

-- 16. SUMMARY
SELECT 
  '==================' as separator,
  'HEALTH CHECK COMPLETE' as message,
  'Review results above' as action;
