-- Supabase Schema Updates for Enhanced Outreach Analytics
-- Based on schema analysis - only missing columns need to be added

-- 1. Add missing column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS role text;

-- 2. Add missing columns to locations table
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS normalized_name text GENERATED ALWAYS AS (lower(regexp_replace(name, '\\s+', ' ', 'g'))) STORED,
ADD COLUMN IF NOT EXISTS line1 text,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3. Create indexes for the new columns
CREATE UNIQUE INDEX IF NOT EXISTS locations_org_normalized_uidx 
ON public.locations (COALESCE(organization_id, '00000000-0000-0000-0000-000000000001'::uuid), normalized_name);

-- 4. Update any existing location records to have is_active = true if they don't already
UPDATE public.locations 
SET is_active = true 
WHERE is_active IS NULL;

-- 5. Verify the schema is complete by testing key functionality
-- (These are just comments for verification - run separately)
-- SELECT COUNT(*) FROM public.team_members; -- Should work
-- SELECT COUNT(*) FROM public.locations WHERE is_active = true; -- Should work  
-- SELECT * FROM public.team_member_stats_v1 LIMIT 1; -- Should work
-- SELECT * FROM public.location_analytics_v1 LIMIT 1; -- Should work
-- SELECT * FROM public.activity_timeline_v1 LIMIT 1; -- Should work