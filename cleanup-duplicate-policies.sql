-- ============================================================================
-- CLEANUP DUPLICATE RLS POLICIES
-- ============================================================================
-- This script removes old/duplicate policies that may conflict with the new
-- signup migration policies.
--
-- IMPORTANT: Review the policies before running this script!
-- ============================================================================

-- First, let's see what we're about to remove
SELECT 
  '=== Policies to be removed ===' as section,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_organizations'
  AND policyname IN (
    'user_orgs_insert_self',
    'user_orgs_select_own',
    'user_orgs_update_self'
  )
ORDER BY policyname;

-- ============================================================================
-- STEP 1: Remove old user_organizations policies
-- ============================================================================
-- These are likely duplicates of the new policies created by the migration

-- Old policy: user_orgs_insert_self
-- Replaced by: "Enable insert for new users"
DROP POLICY IF EXISTS "user_orgs_insert_self" ON public.user_organizations;

-- Old policy: user_orgs_select_own
-- Replaced by: "Users can view own memberships"
DROP POLICY IF EXISTS "user_orgs_select_own" ON public.user_organizations;

-- Old policy: user_orgs_update_self
-- Covered by: "Admins can manage memberships" (for admins)
-- Note: Regular users shouldn't update their own memberships
DROP POLICY IF EXISTS "user_orgs_update_self" ON public.user_organizations;

-- ============================================================================
-- STEP 2: Verify cleanup
-- ============================================================================

-- Show remaining policies on user_organizations
SELECT 
  '=== Remaining user_organizations policies ===' as section,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_organizations'
ORDER BY cmd, policyname;

-- Expected policies after cleanup:
-- 1. "Admins can manage memberships" (ALL)
-- 2. "Enable insert for new users" (INSERT)
-- 3. "Managers can view org memberships" (SELECT)
-- 4. "Users can view own memberships" (SELECT)

-- ============================================================================
-- STEP 3: Verify no conflicts
-- ============================================================================

-- Check for any remaining duplicate policy names
SELECT 
  '=== Policy name conflicts ===' as section,
  policyname,
  COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('profiles', 'user_organizations')
GROUP BY policyname
HAVING COUNT(*) > 1;

-- Should return 0 rows (no conflicts)

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this cleanup:
-- 1. Only the new migration policies will remain
-- 2. No duplicate or conflicting policies
-- 3. Signup flow will work cleanly
-- 4. RLS security is maintained
-- ============================================================================
