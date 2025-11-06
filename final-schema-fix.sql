-- FINAL Schema Fix for Enhanced Outreach Analytics
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. FIX ANALYTICS VIEWS TO MATCH FRONTEND EXPECTATIONS
-- =============================================

-- Fix team_member_stats_v1 to include 'id' field that frontend expects
DROP VIEW IF EXISTS public.team_member_stats_v1;
CREATE OR REPLACE VIEW public.team_member_stats_v1 AS
SELECT
    tm.organization_id,
    tm.id,
    tm.id as team_member_id,
    tm.name,
    COUNT(otm.outreach_log_id) as total_activities,
    COUNT(otm.outreach_log_id) as activities_count,
    MIN(ol.outreach_date) as first_activity_at,
    MAX(ol.outreach_date) as last_activity_at
FROM public.team_members tm
LEFT JOIN public.outreach_team_members otm ON otm.team_member_id = tm.id
LEFT JOIN public.outreach_logs ol ON ol.id = otm.outreach_log_id
GROUP BY tm.organization_id, tm.id, tm.name;

-- Fix location_analytics_v1 to include 'id' field
DROP VIEW IF EXISTS public.location_analytics_v1;
CREATE OR REPLACE VIEW public.location_analytics_v1 AS
SELECT
    COALESCE(l.organization_id, '00000000-0000-0000-0000-000000000001'::uuid) as organization_id,
    l.id,
    l.id as location_id,
    l.name,
    l.kind,
    COUNT(ol.id) as total_activities,
    COUNT(ol.id) as visits,
    MIN(ol.outreach_date) as first_visit_at,
    MAX(ol.outreach_date) as last_visit_at
FROM public.locations l
LEFT JOIN public.outreach_logs ol ON ol.location_id = l.id
GROUP BY COALESCE(l.organization_id, '00000000-0000-0000-0000-000000000001'::uuid), l.id, l.name, l.kind;

-- =============================================
-- 2. MAKE LOCATIONS.ORGANIZATION_ID NULLABLE FOR SHARED LOCATIONS
-- =============================================

-- Allow locations to be shared across organizations by making organization_id nullable
ALTER TABLE public.locations 
ALTER COLUMN organization_id DROP NOT NULL;

-- =============================================
-- 3. CREATE BETTER RLS POLICIES FOR AUTHENTICATED USERS
-- =============================================

-- Replace the PUBLIC policies with authenticated-only policies
DROP POLICY IF EXISTS "team_members_insert_policy" ON public.team_members;
CREATE POLICY "team_members_insert_policy" ON public.team_members
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "locations_insert_policy" ON public.locations;
CREATE POLICY "locations_insert_policy" ON public.locations
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_members_select_policy" ON public.team_members;
CREATE POLICY "team_members_select_policy" ON public.team_members
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "locations_select_policy" ON public.locations;
CREATE POLICY "locations_select_policy" ON public.locations
FOR SELECT TO authenticated USING (true);

-- =============================================
-- 4. VERIFICATION TESTS
-- =============================================

-- Test analytics views have correct structure
SELECT 'team_member_stats_v1 fields' as test,
       string_agg(column_name, ', ' ORDER BY ordinal_position) as fields
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'team_member_stats_v1';

SELECT 'location_analytics_v1 fields' as test,
       string_agg(column_name, ', ' ORDER BY ordinal_position) as fields
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'location_analytics_v1';

SELECT 'activity_timeline_v1 fields' as test,
       string_agg(column_name, ', ' ORDER BY ordinal_position) as fields
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'activity_timeline_v1';

-- Test that we can create locations without organization_id
INSERT INTO public.locations (name, kind, is_active)
VALUES ('Test Shared Location', 'area', true)
RETURNING id, name, organization_id;

-- Clean up test location
DELETE FROM public.locations WHERE name = 'Test Shared Location';