-- ============================================================================
-- COMPLETE SIGNUP MIGRATION VERIFICATION
-- ============================================================================

-- 1. Check profiles table columns
SELECT 
  '=== Profiles Table Columns ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('terms_accepted_at', 'privacy_accepted_at', 'accepted_version')
ORDER BY column_name;

-- 2. Check profiles RLS policies
SELECT 
  '=== Profiles RLS Policies ===' as section,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- 3. Check user_organizations RLS policies
SELECT 
  '=== User Organizations RLS Policies ===' as section,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_organizations'
ORDER BY policyname;

-- 4. Check trigger exists
SELECT 
  '=== Signup Trigger ===' as section,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- 5. Check function exists
SELECT 
  '=== Signup Function ===' as section,
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'handle_new_user_signup';

-- 6. Check Anonymous Haven AI organization
SELECT 
  '=== Default Organization ===' as section,
  id,
  name,
  slug,
  is_active,
  is_certified,
  outreach_enabled
FROM public.organizations
WHERE slug = 'anonymous-haven-ai';

-- 7. Identify duplicate/overlapping policies on user_organizations
SELECT 
  '=== Potential Duplicate Policies ===' as section,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE 'user_orgs_%' THEN 'OLD (pre-migration)'
    ELSE 'NEW (from migration)'
  END as policy_source
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_organizations'
ORDER BY cmd, policyname;

-- 8. Summary
SELECT 
  '=== Summary ===' as section,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_organizations') as user_org_policies,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created') as signup_triggers,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user_signup') as signup_functions,
  (SELECT COUNT(*) FROM organizations WHERE slug = 'anonymous-haven-ai') as default_orgs;
