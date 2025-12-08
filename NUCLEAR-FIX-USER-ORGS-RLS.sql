-- ============================================================================
-- NUCLEAR FIX: Remove ALL RLS policies and create minimal ones
-- ============================================================================
-- This is the absolute simplest possible RLS setup with ZERO recursion
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- Step 1: Drop EVERY policy on user_organizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_organizations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_organizations';
    END LOOP;
END $$;

-- Step 2: Create only TWO simple policies (no subqueries, no recursion)

-- Policy 1: Users can SELECT their own memberships
CREATE POLICY "Users can view their org memberships"
ON public.user_organizations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own memberships (for signup)
CREATE POLICY "Users can join orgs they are assigned to"
ON public.user_organizations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 3: Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;

-- ✅ Done! Only 2 policies, zero recursion, zero subqueries
