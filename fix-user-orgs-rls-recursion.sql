-- ============================================================================
-- FIX USER_ORGANIZATIONS RLS INFINITE RECURSION
-- ============================================================================

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Managers can view org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can see others in their org" ON public.user_organizations;
DROP POLICY IF EXISTS "Enable insert for new users" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can read their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can insert their own org memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Admins can manage all org memberships" ON public.user_organizations;

-- Create simple, non-recursive policies

-- 1. Users can see their own memberships (no recursion)
CREATE POLICY "Users can read their own org memberships"
ON public.user_organizations
FOR SELECT
USING (user_id = auth.uid());

-- 2. Users can insert their own memberships (for signup)
CREATE POLICY "Users can insert their own org memberships"
ON public.user_organizations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 3. Users can update/delete their own memberships
CREATE POLICY "Users can update their own org memberships"
ON public.user_organizations
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own org memberships"
ON public.user_organizations
FOR DELETE
USING (user_id = auth.uid());

-- 4. Enable insert for new users (for signup function with SECURITY DEFINER)
CREATE POLICY "Enable insert for new users"
ON public.user_organizations
FOR INSERT
WITH CHECK (true);

SELECT '✅ RLS policies fixed - no more recursion!' as status;
