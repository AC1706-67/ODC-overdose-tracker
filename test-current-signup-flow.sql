-- ============================================================================
-- TEST CURRENT SIGNUP FLOW (Direct Database Operations)
-- ============================================================================
-- This tests the signup flow used in app/signup.tsx which does:
-- 1. supabase.auth.signUp() - creates auth user
-- 2. Direct query to organizations table
-- 3. Direct INSERT into profiles table
-- 4. Direct INSERT into user_organizations table
-- ============================================================================

-- Step 1: Verify default organization exists
SELECT 
  '1. Default Organization Check' as test,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Anonymous Haven AI exists'
    ELSE '❌ Default org missing - run ensure-default-org-exists.sql'
  END as status,
  id,
  name,
  slug,
  outreach_enabled
FROM organizations
WHERE slug = 'anonymous-haven-ai'
GROUP BY id, name, slug, outreach_enabled;

-- Step 2: Check RLS policies on profiles table
SELECT 
  '2. Profiles RLS Policies' as test,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%insert%' OR policyname LIKE '%create%' THEN '✅ Needed for signup'
    WHEN policyname LIKE '%select%' OR policyname LIKE '%read%' THEN '✅ Needed for login'
    ELSE '⚠️ Check if needed'
  END as status
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Step 3: Check RLS policies on user_organizations table
SELECT 
  '3. User Organizations RLS Policies' as test,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual LIKE '%user_organizations%' THEN '❌ RECURSIVE - will cause errors!'
    WHEN policyname LIKE '%insert%' OR policyname LIKE '%join%' THEN '✅ Needed for signup'
    WHEN policyname LIKE '%select%' OR policyname LIKE '%view%' THEN '✅ Needed for org loading'
    ELSE '⚠️ Check if needed'
  END as status
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY cmd, policyname;

-- Step 4: Check for any orphaned auth users (users without profiles)
SELECT 
  '4. Orphaned Users Check' as test,
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphaned users'
    ELSE '⚠️ ' || COUNT(*) || ' users without profiles'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Step 5: Check for users without org assignments
SELECT 
  '5. Users Without Orgs Check' as test,
  COUNT(*) as users_without_org,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All users have orgs'
    ELSE '⚠️ ' || COUNT(*) || ' users without org assignments'
  END as status
FROM public.profiles p
LEFT JOIN public.user_organizations uo ON p.id = uo.user_id
WHERE uo.user_id IS NULL;

-- Step 6: Summary of recent signups (last 10)
SELECT 
  '6. Recent Signups' as test,
  au.email,
  au.created_at as auth_created,
  CASE WHEN p.id IS NOT NULL THEN '✅' ELSE '❌' END as has_profile,
  CASE WHEN uo.user_id IS NOT NULL THEN '✅' ELSE '❌' END as has_org,
  o.name as org_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_organizations uo ON au.id = uo.user_id
LEFT JOIN public.organizations o ON uo.organization_id = o.id
ORDER BY au.created_at DESC
LIMIT 10;

-- Step 7: Check if old RPC function still exists (should be removed)
SELECT 
  '7. Old RPC Function Check' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Old RPC function removed (good!)'
    ELSE '⚠️ Old RPC function still exists (not used, but can be removed)'
  END as status
FROM pg_proc 
WHERE proname = 'handle_new_user_signup_manual'
  AND pronamespace = 'public'::regnamespace;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- 1. ✅ Anonymous Haven AI exists
-- 2. At least 2 policies: INSERT and SELECT
-- 3. Exactly 2 policies: "Users can view their org memberships" and "Users can join orgs they are assigned to"
-- 4. ✅ No orphaned users (or small number if recent signups failed)
-- 5. ✅ All users have orgs (or small number if recent signups failed)
-- 6. Recent users should have ✅ for both profile and org
-- 7. ✅ Old RPC function removed
-- ============================================================================
