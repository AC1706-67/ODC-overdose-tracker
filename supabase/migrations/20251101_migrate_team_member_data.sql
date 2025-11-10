/*
  # Team Member Data Migration Script
  
  This script migrates existing team member data from outreach_logs.team_members field
  to the new normalized team_members table and creates junction table relationships.
  
  Requirements: 1.1, 1.2, 5.1
  
  Steps:
  1. Backup existing team_members data to legacy_team_members field
  2. Extract individual team member names from team_members arrays/strings
  3. Create normalized team_member records with organization associations
  4. Build outreach_team_members junction table entries
*/

-- =============================================
-- STEP 1: BACKUP EXISTING TEAM MEMBER DATA
-- =============================================

-- First, let's handle different possible formats of team_members data
-- It could be a TEXT field with comma-separated names or a TEXT[] array

-- Copy existing team_members data to legacy_team_members field for backup
UPDATE outreach_logs 
SET legacy_team_members = 
  CASE 
    WHEN team_members IS NOT NULL AND trim(team_members) != '' THEN
      -- Convert text to array, splitting by common delimiters
      string_to_array(
        regexp_replace(team_members, '\s*[,;|&]\s*', ',', 'g'), 
        ','
      )
    ELSE NULL
  END
WHERE team_members IS NOT NULL 
  AND legacy_team_members IS NULL;

-- =============================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- =============================================

-- Function to clean and normalize team member names
CREATE OR REPLACE FUNCTION clean_team_member_name(name_text TEXT)
RETURNS TEXT AS $
BEGIN
  IF name_text IS NULL OR trim(name_text) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Clean the name: trim whitespace, remove extra spaces, title case
  RETURN trim(regexp_replace(
    initcap(trim(name_text)), 
    '\s+', ' ', 'g'
  ));
END;
$ LANGUAGE plpgsql;

-- Function to extract team member names from various formats
CREATE OR REPLACE FUNCTION extract_team_member_names(team_members_data TEXT)
RETURNS TEXT[] AS $
DECLARE
  names_array TEXT[];
  clean_names TEXT[];
  name_item TEXT;
BEGIN
  -- Return empty array if input is null or empty
  IF team_members_data IS NULL OR trim(team_members_data) = '' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Split by common delimiters (comma, semicolon, pipe, ampersand)
  names_array := string_to_array(
    regexp_replace(team_members_data, '\s*[,;|&+]\s*', '|', 'g'), 
    '|'
  );
  
  -- Clean each name and filter out empty/invalid entries
  clean_names := ARRAY[]::TEXT[];
  FOREACH name_item IN ARRAY names_array
  LOOP
    name_item := clean_team_member_name(name_item);
    IF name_item IS NOT NULL AND length(name_item) >= 2 THEN
      clean_names := array_append(clean_names, name_item);
    END IF;
  END LOOP;
  
  RETURN clean_names;
END;
$ LANGUAGE plpgsql;

-- =============================================
-- STEP 3: CREATE NORMALIZED TEAM MEMBER RECORDS
-- =============================================

-- Extract unique team member names and create records
-- We'll associate them with organizations based on the outreach_logs.organization_id
INSERT INTO team_members (name, organization_id, created_at, is_active)
SELECT DISTINCT
  member_name,
  org_id,
  MIN(created_at) as created_at,
  true as is_active
FROM (
  SELECT 
    unnest(extract_team_member_names(ol.team_members)) as member_name,
    ol.organization_id as org_id,
    ol.created_at
  FROM outreach_logs ol
  WHERE ol.team_members IS NOT NULL 
    AND trim(ol.team_members) != ''
) extracted_members
WHERE member_name IS NOT NULL
  AND length(member_name) >= 2
GROUP BY member_name, org_id
ON CONFLICT (organization_id, name) DO NOTHING;

-- =============================================
-- STEP 4: HANDLE TEAM MEMBERS WITHOUT ORGANIZATION
-- =============================================

-- For outreach logs without organization_id, we need to handle team members differently
-- We'll create them without organization association (they can be assigned later)
INSERT INTO team_members (name, organization_id, created_at, is_active)
SELECT DISTINCT
  member_name,
  NULL as organization_id,
  MIN(created_at) as created_at,
  true as is_active
FROM (
  SELECT 
    unnest(extract_team_member_names(ol.team_members)) as member_name,
    ol.created_at
  FROM outreach_logs ol
  WHERE ol.team_members IS NOT NULL 
    AND trim(ol.team_members) != ''
    AND ol.organization_id IS NULL
) extracted_members
WHERE member_name IS NOT NULL
  AND length(member_name) >= 2
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.name = member_name 
    AND tm.organization_id IS NULL
  )
GROUP BY member_name;

-- =============================================
-- STEP 5: CREATE JUNCTION TABLE RELATIONSHIPS
-- =============================================

-- Create outreach_team_members relationships for logs with organization
INSERT INTO outreach_team_members (outreach_log_id, team_member_id, created_at)
SELECT DISTINCT
  ol.id as outreach_log_id,
  tm.id as team_member_id,
  ol.created_at
FROM outreach_logs ol
CROSS JOIN LATERAL (
  SELECT unnest(extract_team_member_names(ol.team_members)) as member_name
) extracted
JOIN team_members tm ON tm.name = extracted.member_name
WHERE ol.team_members IS NOT NULL 
  AND trim(ol.team_members) != ''
  AND ol.organization_id IS NOT NULL
  AND tm.organization_id = ol.organization_id
ON CONFLICT (outreach_log_id, team_member_id) DO NOTHING;

-- Create relationships for logs without organization (match by name only)
INSERT INTO outreach_team_members (outreach_log_id, team_member_id, created_at)
SELECT DISTINCT
  ol.id as outreach_log_id,
  tm.id as team_member_id,
  ol.created_at
FROM outreach_logs ol
CROSS JOIN LATERAL (
  SELECT unnest(extract_team_member_names(ol.team_members)) as member_name
) extracted
JOIN team_members tm ON tm.name = extracted.member_name
WHERE ol.team_members IS NOT NULL 
  AND trim(ol.team_members) != ''
  AND ol.organization_id IS NULL
  AND tm.organization_id IS NULL
ON CONFLICT (outreach_log_id, team_member_id) DO NOTHING;

-- =============================================
-- STEP 6: VALIDATION AND REPORTING
-- =============================================

-- Create a function to validate the team member migration results
CREATE OR REPLACE FUNCTION validate_team_member_migration()
RETURNS TABLE (
  total_outreach_logs BIGINT,
  logs_with_team_members_data BIGINT,
  logs_with_junction_records BIGINT,
  total_team_members_created BIGINT,
  total_junction_records BIGINT,
  migration_success_rate NUMERIC
) AS $
BEGIN
  SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN team_members IS NOT NULL AND trim(team_members) != '' THEN 1 END) as with_team_data,
    COUNT(DISTINCT otm.outreach_log_id) as with_junction,
    (SELECT COUNT(*) FROM team_members WHERE is_active = true) as total_members,
    (SELECT COUNT(*) FROM outreach_team_members) as total_junction,
    CASE 
      WHEN COUNT(CASE WHEN team_members IS NOT NULL AND trim(team_members) != '' THEN 1 END) > 0 THEN
        ROUND((COUNT(DISTINCT otm.outreach_log_id)::NUMERIC / 
               COUNT(CASE WHEN team_members IS NOT NULL AND trim(team_members) != '' THEN 1 END)) * 100, 2)
      ELSE 0
    END as success_rate
  FROM outreach_logs ol
  LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
  INTO total_outreach_logs, logs_with_team_members_data, logs_with_junction_records, 
       total_team_members_created, total_junction_records, migration_success_rate;
  
  RETURN NEXT;
END;
$ LANGUAGE plpgsql;

-- Run validation and display results
SELECT * FROM validate_team_member_migration();

-- =============================================
-- STEP 7: CREATE ADDITIONAL INDEXES
-- =============================================

-- Create indexes for better performance on team member relationships
CREATE INDEX IF NOT EXISTS team_members_name_search_idx 
ON team_members USING gin(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS outreach_team_members_lookup_idx 
ON outreach_team_members(outreach_log_id, team_member_id);

-- =============================================
-- STEP 8: CLEANUP FUNCTIONS (OPTIONAL)
-- =============================================

-- Keep helper functions for potential re-use or debugging
-- DROP FUNCTION IF EXISTS clean_team_member_name(TEXT);
-- DROP FUNCTION IF EXISTS extract_team_member_names(TEXT);

-- =============================================
-- MIGRATION SUMMARY
-- =============================================

-- Display summary of the migration
DO $
DECLARE
  migration_stats RECORD;
BEGIN
  SELECT * FROM validate_team_member_migration() INTO migration_stats;
  
  RAISE NOTICE '=== TEAM MEMBER MIGRATION SUMMARY ===';
  RAISE NOTICE 'Total outreach logs: %', migration_stats.total_outreach_logs;
  RAISE NOTICE 'Logs with team member data: %', migration_stats.logs_with_team_members_data;
  RAISE NOTICE 'Logs with junction records: %', migration_stats.logs_with_junction_records;
  RAISE NOTICE 'Total team members created: %', migration_stats.total_team_members_created;
  RAISE NOTICE 'Total junction records: %', migration_stats.total_junction_records;
  RAISE NOTICE 'Migration success rate: %%%', migration_stats.migration_success_rate;
  RAISE NOTICE '========================================';
END $;

-- =============================================
-- POST-MIGRATION DATA QUALITY CHECKS
-- =============================================

-- Check for potential duplicate team members (same name, different orgs)
CREATE OR REPLACE VIEW potential_duplicate_team_members AS
SELECT 
  name,
  COUNT(*) as occurrence_count,
  array_agg(DISTINCT organization_id) as organization_ids,
  array_agg(id) as team_member_ids
FROM team_members 
WHERE is_active = true
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY occurrence_count DESC, name;

-- Display potential duplicates for review
SELECT 
  'Potential duplicate team members found:' as notice,
  COUNT(*) as duplicate_name_count
FROM potential_duplicate_team_members;

-- Check for outreach logs that still don't have team member associations
SELECT 
  'Outreach logs without team member associations:' as notice,
  COUNT(*) as count
FROM outreach_logs ol
LEFT JOIN outreach_team_members otm ON ol.id = otm.outreach_log_id
WHERE ol.team_members IS NOT NULL 
  AND trim(ol.team_members) != ''
  AND otm.outreach_log_id IS NULL;