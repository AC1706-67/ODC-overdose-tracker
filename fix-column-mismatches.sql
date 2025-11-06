-- COMPREHENSIVE Fix for Frontend-Backend Field Mismatches
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. ADD MISSING COLUMNS
-- =============================================

-- Add role_in_activity column to outreach_team_members table
-- (Frontend expects this field name)
ALTER TABLE public.outreach_team_members 
ADD COLUMN IF NOT EXISTS role_in_activity text DEFAULT 'volunteer';

-- Add location_type column to locations table as alias for kind
-- (Frontend expects location_type, database has kind)
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS location_type text;

-- Update location_type to match kind values
UPDATE public.locations 
SET location_type = kind 
WHERE location_type IS NULL;

-- =============================================
-- 2. UPDATE ANALYTICS VIEWS TO USE OUTREACH_DATE
-- =============================================

-- Drop and recreate team_member_stats_v1 with correct date column
DROP VIEW IF EXISTS public.team_member_stats_v1;
CREATE OR REPLACE VIEW public.team_member_stats_v1 AS
SELECT
    tm.organization_id,
    tm.id as team_member_id,
    tm.name,
    COUNT(otm.outreach_log_id) as activities_count,
    MIN(ol.outreach_date) as first_activity_at,
    MAX(ol.outreach_date) as last_activity_at
FROM public.team_members tm
LEFT JOIN public.outreach_team_members otm ON otm.team_member_id = tm.id
LEFT JOIN public.outreach_logs ol ON ol.id = otm.outreach_log_id
GROUP BY tm.organization_id, tm.id, tm.name;

-- Drop and recreate location_analytics_v1 with correct date column
DROP VIEW IF EXISTS public.location_analytics_v1;
CREATE OR REPLACE VIEW public.location_analytics_v1 AS
SELECT
    COALESCE(l.organization_id, '00000000-0000-0000-0000-000000000001'::uuid) as organization_id,
    l.id as location_id,
    l.name,
    l.kind,
    COUNT(ol.id) as visits,
    MIN(ol.outreach_date) as first_visit_at,
    MAX(ol.outreach_date) as last_visit_at
FROM public.locations l
LEFT JOIN public.outreach_logs ol ON ol.location_id = l.id
GROUP BY organization_id, l.id, l.name, l.kind;

-- Drop and recreate activity_timeline_v1 with correct date column
DROP VIEW IF EXISTS public.activity_timeline_v1;
CREATE OR REPLACE VIEW public.activity_timeline_v1 AS
SELECT
    ol.organization_id,
    ol.id as outreach_log_id,
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
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Index for the new role_in_activity column
CREATE INDEX IF NOT EXISTS outreach_team_members_role_idx 
ON public.outreach_team_members (role_in_activity);

-- Index for outreach_date queries
CREATE INDEX IF NOT EXISTS outreach_logs_date_idx 
ON public.outreach_logs (outreach_date);

-- =============================================
-- 4. VERIFICATION QUERIES
-- =============================================

-- Test that all views work with new date column
SELECT 'team_member_stats_v1' as view_name, COUNT(*) as record_count FROM public.team_member_stats_v1
UNION ALL
SELECT 'location_analytics_v1' as view_name, COUNT(*) as record_count FROM public.location_analytics_v1  
UNION ALL
SELECT 'activity_timeline_v1' as view_name, COUNT(*) as record_count FROM public.activity_timeline_v1;

-- Test the new role_in_activity column
SELECT 'outreach_team_members' as table_name, 
       COUNT(*) as total_records,
       COUNT(role_in_activity) as records_with_role
FROM public.outreach_team_members;

-- Test location_type column
SELECT 'locations' as table_name,
       COUNT(*) as total_records,
       COUNT(location_type) as records_with_location_type,
       COUNT(DISTINCT location_type) as unique_location_types
FROM public.locations;

-- Show sample data to verify everything works
SELECT 'Sample outreach_logs fields' as test_type,
       COUNT(outreach_date) as has_outreach_date,
       COUNT(people_reached) as has_people_reached,
       COUNT(location_id) as has_location_id
FROM public.outreach_logs
LIMIT 1;