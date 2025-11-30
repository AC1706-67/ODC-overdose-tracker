-- ============================================================================
-- CREATE RLS POLICIES FOR INCIDENTS TABLE
-- ============================================================================
-- Harmonized policies for organization-level isolation
-- Each org can only access their own health/overdose incident reports
-- ============================================================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Allow anonymous incident submission" ON public.incidents;
DROP POLICY IF EXISTS "Allow authenticated users to read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can submit incidents for their orgs" ON public.incidents;
DROP POLICY IF EXISTS "Users can view org incidents" ON public.incidents;
DROP POLICY IF EXISTS "Responders can view own incidents" ON public.incidents;
DROP POLICY IF EXISTS "org_members_select_incidents" ON public.incidents;
DROP POLICY IF EXISTS "org_members_insert_incidents" ON public.incidents;
DROP POLICY IF EXISTS "org_members_update_incidents" ON public.incidents;
DROP POLICY IF EXISTS "org_admins_delete_incidents" ON public.incidents;

-- ============================================================================
-- SELECT: Users can read incidents from organizations they belong to
-- ============================================================================
CREATE POLICY "org_members_select_incidents"
  ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = incidents.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- INSERT: Users can insert incidents for organizations they belong to
-- ============================================================================
CREATE POLICY "org_members_insert_incidents"
  ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = incidents.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- UPDATE: Users can update incidents they created OR if they're in the org
-- ============================================================================
CREATE POLICY "org_members_update_incidents"
  ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (
    incidents.created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = incidents.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- DELETE: Only org admins can delete incidents
-- ============================================================================
CREATE POLICY "org_admins_delete_incidents"
  ON public.incidents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = incidents.organization_id
        AND uo.role IN ('Admin', 'Owner')
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- VERIFY: Show the policies we just created
-- ============================================================================
SELECT 
  '=== INCIDENTS RLS POLICIES CREATED ===' as section;

SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Org members can read their org incidents'
    WHEN cmd = 'INSERT' THEN '✅ Org members can report incidents for their org'
    WHEN cmd = 'UPDATE' THEN '✅ Org members can update their org incidents'
    WHEN cmd = 'DELETE' THEN '✅ Only admins can delete'
  END as description
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'incidents'
ORDER BY 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '=== SUMMARY ===' as section;

SELECT 
  'RLS Enabled' as check_name,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'incidents')
    THEN '✅ Yes'
    ELSE '❌ No'
  END as status;

SELECT 
  'Policies Created' as check_name,
  COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'incidents';
