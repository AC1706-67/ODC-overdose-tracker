-- ============================================================================
-- HARMONIZE RLS POLICIES & PREP FOR ZIP-LEVEL SHARING
-- ============================================================================
-- This migration:
-- 1. Harmonizes all RLS policies to pure per-org access pattern
-- 2. Adds share_incidents_zip_only column to organizations
-- 3. Adds is_demo_organization column to organizations
-- 4. Creates incident_zip_aggregate view for future ZIP-level sharing
-- 5. Ensures consistent organization_id filtering across all tables
-- ============================================================================

-- ============================================================================
-- PART 1: ADD NEW COLUMNS TO ORGANIZATIONS
-- ============================================================================

-- Add opt-in ZIP sharing column
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS share_incidents_zip_only boolean NOT NULL DEFAULT false;

-- Add demo organization flag
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS is_demo_organization boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.organizations.share_incidents_zip_only IS 
  'When true, this organization opts in to share anonymous ZIP-level incident counts for cross-org analytics';

COMMENT ON COLUMN public.organizations.is_demo_organization IS 
  'When true, this organization is a demo/sandbox org for testing purposes';

-- ============================================================================
-- PART 2: HARMONIZE INCIDENTS TABLE RLS
-- ============================================================================

-- Drop all existing policies on incidents
DROP POLICY IF EXISTS "Allow anonymous incident submission" ON public.incidents;
DROP POLICY IF EXISTS "Allow authenticated users to read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can submit incidents for their orgs" ON public.incidents;
DROP POLICY IF EXISTS "Users can view org incidents" ON public.incidents;
DROP POLICY IF EXISTS "Responders can view own incidents" ON public.incidents;

-- SELECT: Users can read incidents from organizations they belong to
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

-- INSERT: Users can insert incidents for organizations they belong to
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

-- UPDATE: Users can update incidents they created OR if they're in the org
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

-- DELETE: Only org admins can delete incidents
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
-- PART 3: HARMONIZE OUTREACH_LOGS TABLE RLS
-- ============================================================================

-- Drop all existing policies on outreach_logs
DROP POLICY IF EXISTS "Allow anonymous outreach log submission" ON public.outreach_logs;
DROP POLICY IF EXISTS "Users can submit outreach logs for their orgs" ON public.outreach_logs;
DROP POLICY IF EXISTS "Users can view org outreach logs" ON public.outreach_logs;

-- SELECT: Users can read outreach logs from organizations they belong to
CREATE POLICY "org_members_select_outreach_logs"
  ON public.outreach_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- INSERT: Users can insert outreach logs for organizations they belong to
CREATE POLICY "org_members_insert_outreach_logs"
  ON public.outreach_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- UPDATE: Users can update outreach logs they created OR if they're in the org
CREATE POLICY "org_members_update_outreach_logs"
  ON public.outreach_logs
  FOR UPDATE
  TO authenticated
  USING (
    outreach_logs.user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- DELETE: Only org admins can delete outreach logs
CREATE POLICY "org_admins_delete_outreach_logs"
  ON public.outreach_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.organization_id = outreach_logs.organization_id
        AND uo.role IN ('Admin', 'Owner')
        AND COALESCE(uo.is_active, true) = true
    )
  );

-- ============================================================================
-- PART 4: HARMONIZE DISTRIBUTIONS TABLE RLS (if exists)
-- ============================================================================

-- Check if distributions table exists and has organization_id
DO $
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'distributions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'distributions' 
      AND column_name = 'organization_id'
  ) THEN
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Allow anonymous distribution submission" ON public.distributions;
    DROP POLICY IF EXISTS "Allow authenticated users to read distributions" ON public.distributions;
    DROP POLICY IF EXISTS "Users can submit distributions for their orgs" ON public.distributions;
    DROP POLICY IF EXISTS "Users can view org distributions" ON public.distributions;

    -- SELECT: Users can read distributions from organizations they belong to
    EXECUTE 'CREATE POLICY "org_members_select_distributions"
      ON public.distributions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_organizations uo
          WHERE uo.user_id = auth.uid()
            AND uo.organization_id = distributions.organization_id
            AND COALESCE(uo.is_active, true) = true
        )
      )';

    -- INSERT: Users can insert distributions for organizations they belong to
    EXECUTE 'CREATE POLICY "org_members_insert_distributions"
      ON public.distributions
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.user_organizations uo
          WHERE uo.user_id = auth.uid()
            AND uo.organization_id = distributions.organization_id
            AND COALESCE(uo.is_active, true) = true
        )
      )';

    -- UPDATE: Users can update distributions they created OR if they're in the org
    EXECUTE 'CREATE POLICY "org_members_update_distributions"
      ON public.distributions
      FOR UPDATE
      TO authenticated
      USING (
        distributions.submitted_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.user_organizations uo
          WHERE uo.user_id = auth.uid()
            AND uo.organization_id = distributions.organization_id
            AND COALESCE(uo.is_active, true) = true
        )
      )';

    -- DELETE: Only org admins can delete distributions
    EXECUTE 'CREATE POLICY "org_admins_delete_distributions"
      ON public.distributions
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.user_organizations uo
          WHERE uo.user_id = auth.uid()
            AND uo.organization_id = distributions.organization_id
            AND uo.role IN (''Admin'', ''Owner'')
            AND COALESCE(uo.is_active, true) = true
        )
      )';
  END IF;
END $;

-- ============================================================================
-- PART 5: CREATE INCIDENT_ZIP_AGGREGATE VIEW
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.incident_zip_aggregate;

-- Create view for anonymous ZIP-level incident aggregation
-- This view only includes data from organizations that have opted in
CREATE VIEW public.incident_zip_aggregate AS
SELECT
  i.zip_code,
  date_trunc('day', COALESCE(i.occurred_at, i.created_at)) AS day,
  count(*) AS total_incidents
FROM public.incidents i
JOIN public.organizations o ON o.id = i.organization_id
WHERE o.share_incidents_zip_only = true
  AND i.zip_code IS NOT NULL
GROUP BY i.zip_code, date_trunc('day', COALESCE(i.occurred_at, i.created_at));

COMMENT ON VIEW public.incident_zip_aggregate IS 
  'Anonymous ZIP-level incident counts from organizations that have opted in to sharing. No org IDs, user IDs, or identifying information included.';

-- Grant access to service_role only (not to authenticated users yet)
GRANT SELECT ON public.incident_zip_aggregate TO service_role;

-- ============================================================================
-- PART 6: CREATE DEMO ORGANIZATION
-- ============================================================================

-- Insert demo organization if it doesn't exist
INSERT INTO public.organizations (
  slug,
  name,
  type,
  description,
  is_active,
  is_certified,
  is_public,
  is_demo_organization,
  share_incidents_zip_only,
  outreach_enabled
)
VALUES (
  'anonymous-haven-tester',
  'Anonymous Haven – Tester Organization',
  'Demo/Testing',
  'Sandbox organization for testing the app before going live. All data here is for demonstration purposes only.',
  true,
  true,
  true,
  true,
  false,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  is_demo_organization = true,
  description = EXCLUDED.description,
  is_active = true,
  is_certified = true,
  is_public = true;

-- ============================================================================
-- PART 7: UPDATE AUTO-ASSIGNMENT TRIGGER TO USE DEMO ORG
-- ============================================================================

-- Update the auto-assignment function to assign new users to demo org
CREATE OR REPLACE FUNCTION public.auto_assign_default_organization()
RETURNS TRIGGER AS $
DECLARE
  demo_org_id UUID;
BEGIN
  -- Get the demo organization ID
  SELECT id INTO demo_org_id
  FROM public.organizations
  WHERE is_demo_organization = true
    AND is_active = true
  LIMIT 1;

  -- If demo org exists, assign the new user to it
  IF demo_org_id IS NOT NULL THEN
    INSERT INTO public.user_organizations (
      user_id,
      organization_id,
      role,
      is_active
    )
    VALUES (
      NEW.id,
      demo_org_id,
      'Tester',
      true
    )
    ON CONFLICT (user_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-assigned user % to demo organization', NEW.id;
  END IF;

  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 8: VERIFICATION QUERIES
-- ============================================================================

-- Show new organization columns
SELECT 
  '=== ORGANIZATIONS NEW COLUMNS ===' as section,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'organizations'
  AND column_name IN ('share_incidents_zip_only', 'is_demo_organization')
ORDER BY column_name;

-- Show demo organization
SELECT 
  '=== DEMO ORGANIZATION ===' as section,
  id,
  name,
  slug,
  is_demo_organization,
  is_active,
  is_certified,
  is_public
FROM public.organizations
WHERE is_demo_organization = true;

-- Show RLS policies for incidents
SELECT 
  '=== INCIDENTS RLS POLICIES ===' as section,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'incidents'
ORDER BY cmd, policyname;

-- Show RLS policies for outreach_logs
SELECT 
  '=== OUTREACH_LOGS RLS POLICIES ===' as section,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'outreach_logs'
ORDER BY cmd, policyname;

-- Show incident_zip_aggregate view
SELECT 
  '=== INCIDENT_ZIP_AGGREGATE VIEW ===' as section,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'incident_zip_aggregate';

-- Summary
SELECT 
  '=== SUMMARY ===' as section,
  (SELECT COUNT(*) FROM public.organizations WHERE share_incidents_zip_only = true) as orgs_sharing_zip_data,
  (SELECT COUNT(*) FROM public.organizations WHERE is_demo_organization = true) as demo_orgs,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'incidents') as incidents_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'outreach_logs') as outreach_policies;
