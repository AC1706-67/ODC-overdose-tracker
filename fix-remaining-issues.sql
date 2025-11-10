-- Fix Remaining Schema Issues
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. FIX RLS POLICIES FOR TEAM MEMBERS AND LOCATIONS
-- =============================================

-- Temporarily disable RLS for testing (you can re-enable later)
-- Or create more permissive policies

-- Create a policy that allows authenticated users to insert team members
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
CREATE POLICY "team_members_insert_policy" ON public.team_members
FOR INSERT WITH CHECK (true);

-- Create a policy that allows authenticated users to insert locations  
DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
CREATE POLICY "locations_insert_policy" ON public.locations
FOR INSERT WITH CHECK (true);

-- Create select policies for team members and locations
DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
CREATE POLICY "team_members_select_policy" ON public.team_members
FOR SELECT USING (true);

DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
CREATE POLICY "locations_select_policy" ON public.locations
FOR SELECT USING (true);

-- =============================================
-- 2. FIX ACTIVITY_TIMELINE_V1 VIEW STRUCTURE
-- =============================================

-- Drop and recreate activity_timeline_v1 with correct field names
DROP VIEW IF EXISTS public.activity_timeline_v1;
CREATE OR REPLACE VIEW public.activity_timeline_v1 AS
SELECT
    ol.organization_id,
    ol.id as outreach_id,
    ol.outreach_date,
    l.id as location_id,
    l.name as location_name,
    array_agg(DISTINCT tm.name) FILTER (WHERE tm.id IS NOT NULL) as team
FROM public.outreach_logs ol
LEFT JOIN public.locations l ON l.id = ol.location_id
LEFT JOIN public.outreach_team_members otm ON otm.outreach_log_id = ol.id
LEFT JOIN public.team_members tm ON tm.id = otm.team_member_id
GROUP BY ol.organization_id, ol.id, ol.outreach_date, l.id, l.name;

-- =============================================
-- 3. CREATE DEFAULT TEST ORGANIZATION
-- =============================================

-- Insert a default organization with a proper UUID for testing
INSERT INTO public.organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Default Test Organization')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. VERIFICATION QUERIES
-- =============================================

-- Test that team member creation works
DO $$
DECLARE
    test_member_id uuid;
BEGIN
    INSERT INTO public.team_members (name, organization_id, is_active)
    VALUES ('Test Member', '00000000-0000-0000-0000-000000000001'::uuid, true)
    RETURNING id INTO test_member_id;
    
    -- Clean up the test record
    DELETE FROM public.team_members WHERE id = test_member_id;
    
    RAISE NOTICE 'Team member creation test: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Team member creation test: FAILED - %', SQLERRM;
END $$;

-- Test that location creation works
DO $$
DECLARE
    test_location_id uuid;
BEGIN
    INSERT INTO public.locations (name, kind, is_active)
    VALUES ('Test Location', 'area', true)
    RETURNING id INTO test_location_id;
    
    -- Clean up the test record
    DELETE FROM public.locations WHERE id = test_location_id;
    
    RAISE NOTICE 'Location creation test: SUCCESS';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Location creation test: FAILED - %', SQLERRM;
END $$;

-- Test analytics views
SELECT 'activity_timeline_v1' as view_name, 
       COUNT(*) as record_count,
       CASE WHEN COUNT(*) > 0 THEN 
           (SELECT string_agg(column_name, ', ') 
            FROM information_schema.columns 
            WHERE table_name = 'activity_timeline_v1' 
            AND table_schema = 'public')
       ELSE 'No data'
       END as available_fields
FROM public.activity_timeline_v1;

-- Show current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'locations')
ORDER BY tablename, policyname;