-- FORCE CLEAR RLS POLICIES AND CACHE
-- This will completely reset the RLS policies and clear any cached plans

-- Step 1: Disable RLS temporarily
ALTER TABLE public.user_organizations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies (even if they don't exist)
DROP POLICY IF EXISTS "Users can view their org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can join orgs they are assigned to" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can read their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can insert their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can update their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can delete their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Managers can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can see others in their org" ON public.user_organizations;
DROP POLICY IF EXISTS "Admins can manage all org memberships" ON public.user_organizations;

-- Step 3: Clear any cached query plans
DISCARD PLANS;

-- Step 4: Re-enable RLS
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Step 5: Create ONLY the 2 simple policies
CREATE POLICY "Users can view their org memberships"
ON public.user_organizations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join orgs they are assigned to"
ON public.user_organizations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Step 6: Verify
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%user_organizations%' THEN '❌ STILL RECURSIVE!'
    ELSE '✅ Safe'
  END as status
FROM pg_policies
WHERE tablename = 'user_organizations'
ORDER BY policyname;

-- Expected: Only 2 policies, both showing ✅ Safe
