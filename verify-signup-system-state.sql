-- ============================================================================
-- VERIFY SIGNUP SYSTEM STATE
-- ============================================================================
-- Run this to check if everything is in place for signup to work
-- ============================================================================

-- 1. Check if Anonymous Haven AI exists
SELECT 
  'Organization Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Anonymous Haven AI exists'
    ELSE '❌ Anonymous Haven AI missing'
  END as status,
  id as org_id
FROM public.organizations
WHERE slug = 'anonymous-haven-ai'
GROUP BY id;

-- 2. Check if trigger exists
SELECT 
  'Trigger Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as status,
  trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 3. Check if function exists
SELECT 
  'Function Check' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status,
  proname as function_name
FROM pg_proc
WHERE proname = 'handle_new_user_signup';

-- 4. Check profiles table structure
SELECT 
  'Profiles Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'email', 'display_name', 'default_organization_id', 'terms_accepted_at', 'privacy_accepted_at')
ORDER BY column_name;

-- 5. Check RLS policies on profiles
SELECT 
  'Profiles RLS' as check_type,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Check RLS policies on user_organizations
SELECT 
  'User Orgs RLS' as check_type,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;
