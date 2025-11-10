/*
  # Location Data Migration Script
  
  This script migrates existing location data from outreach_logs.location field
  to the new normalized locations table and links outreach logs to location records.
  
  Requirements: 2.1, 2.2, 5.1
  
  Steps:
  1. Backup existing location data to legacy_location field
  2. Extract unique locations from existing records
  3. Create normalized location records
  4. Link existing outreach_logs to new location records
*/

-- =============================================
-- STEP 1: BACKUP EXISTING LOCATION DATA
-- =============================================

-- Copy existing location data to legacy_location field for backup
UPDATE outreach_logs 
SET legacy_location = location 
WHERE location IS NOT NULL 
  AND legacy_location IS NULL;

-- =============================================
-- STEP 2: EXTRACT AND NORMALIZE LOCATION DATA
-- =============================================

-- Create a function to parse location strings and extract components
CREATE OR REPLACE FUNCTION parse_location_string(location_text TEXT)
RETURNS TABLE (
  parsed_name TEXT,
  parsed_zip TEXT,
  parsed_city TEXT,
  parsed_state TEXT,
  location_type TEXT
) AS $
DECLARE
  clean_location TEXT;
  zip_match TEXT;
  intersection_pattern TEXT := '.*(&|and|\+).*';
  address_pattern TEXT := '^\d+\s+';
BEGIN
  -- Return empty if input is null or empty
  IF location_text IS NULL OR trim(location_text) = '' THEN
    RETURN;
  END IF;
  
  -- Clean and normalize the location string
  clean_location := trim(regexp_replace(location_text, '\s+', ' ', 'g'));
  
  -- Extract ZIP code if present (5 digits, optionally followed by -4 digits)
  zip_match := (regexp_matches(clean_location, '\b(\d{5}(?:-\d{4})?)\b'))[1];
  
  -- Remove ZIP code from location name for cleaner parsing
  IF zip_match IS NOT NULL THEN
    clean_location := trim(regexp_replace(clean_location, '\b\d{5}(?:-\d{4})?\b', '', 'g'));
  END IF;
  
  -- Determine location type and extract components
  IF clean_location ~* intersection_pattern THEN
    -- This looks like an intersection
    parsed_name := clean_location;
    location_type := 'intersection';
  ELSIF clean_location ~* address_pattern THEN
    -- This looks like a street address
    parsed_name := clean_location;
    location_type := 'address';
  ELSE
    -- General area or other location type
    parsed_name := clean_location;
    location_type := 'area';
  END IF;
  
  -- Set extracted values
  parsed_zip := zip_match;
  
  -- Try to extract city/state if present (basic pattern matching)
  -- This is a simple implementation - could be enhanced with more sophisticated parsing
  IF clean_location ~* ',\s*[A-Z]{2}\s*$' THEN
    parsed_state := trim((regexp_matches(clean_location, ',\s*([A-Z]{2})\s*$'))[1]);
    parsed_city := trim(regexp_replace(clean_location, ',\s*[A-Z]{2}\s*$', ''));
  END IF;
  
  RETURN NEXT;
END;
$ LANGUAGE plpgsql;

-- =============================================
-- STEP 3: CREATE NORMALIZED LOCATION RECORDS
-- =============================================

-- Insert unique locations from existing outreach_logs
INSERT INTO locations (name, zip_code, city, state, location_type, created_at)
SELECT DISTINCT
  COALESCE(parsed.parsed_name, 'Unknown Location') as name,
  parsed.parsed_zip as zip_code,
  parsed.parsed_city as city,
  parsed.parsed_state as state,
  COALESCE(parsed.location_type, 'area') as location_type,
  MIN(ol.created_at) as created_at
FROM outreach_logs ol
CROSS JOIN LATERAL parse_location_string(ol.location) as parsed
WHERE ol.location IS NOT NULL 
  AND trim(ol.location) != ''
  AND parsed.parsed_name IS NOT NULL
GROUP BY 
  COALESCE(parsed.parsed_name, 'Unknown Location'),
  parsed.parsed_zip,
  parsed.parsed_city,
  parsed.parsed_state,
  COALESCE(parsed.location_type, 'area')
ON CONFLICT (name, COALESCE(zip_code, '')) 
WHERE is_active = true 
DO NOTHING;

-- =============================================
-- STEP 4: LINK OUTREACH LOGS TO LOCATION RECORDS
-- =============================================

-- Update outreach_logs to reference the new location records
UPDATE outreach_logs ol
SET location_id = l.id
FROM locations l,
     LATERAL parse_location_string(ol.location) as parsed
WHERE ol.location IS NOT NULL 
  AND trim(ol.location) != ''
  AND ol.location_id IS NULL
  AND l.name = COALESCE(parsed.parsed_name, 'Unknown Location')
  AND COALESCE(l.zip_code, '') = COALESCE(parsed.parsed_zip, '')
  AND l.is_active = true;

-- =============================================
-- STEP 5: HANDLE RECORDS WITHOUT LOCATION DATA
-- =============================================

-- Create a default "Unknown Location" record for outreach logs without location data
INSERT INTO locations (name, location_type, created_at)
SELECT 'Unknown Location', 'area', MIN(created_at)
FROM outreach_logs 
WHERE (location IS NULL OR trim(location) = '') 
  AND location_id IS NULL
ON CONFLICT (name, COALESCE(zip_code, '')) 
WHERE is_active = true 
DO NOTHING;

-- Link outreach logs without location data to the "Unknown Location" record
UPDATE outreach_logs ol
SET location_id = l.id
FROM locations l
WHERE (ol.location IS NULL OR trim(ol.location) = '')
  AND ol.location_id IS NULL
  AND l.name = 'Unknown Location'
  AND l.zip_code IS NULL
  AND l.is_active = true;

-- =============================================
-- STEP 6: VALIDATION AND REPORTING
-- =============================================

-- Create a function to validate the migration results
CREATE OR REPLACE FUNCTION validate_location_migration()
RETURNS TABLE (
  total_outreach_logs BIGINT,
  logs_with_location_id BIGINT,
  logs_without_location_id BIGINT,
  total_locations_created BIGINT,
  migration_success_rate NUMERIC
) AS $
BEGIN
  SELECT 
    COUNT(*) as total_logs,
    COUNT(location_id) as with_location,
    COUNT(*) - COUNT(location_id) as without_location,
    (SELECT COUNT(*) FROM locations WHERE is_active = true) as total_locations,
    ROUND((COUNT(location_id)::NUMERIC / COUNT(*)) * 100, 2) as success_rate
  FROM outreach_logs
  INTO total_outreach_logs, logs_with_location_id, logs_without_location_id, 
       total_locations_created, migration_success_rate;
  
  RETURN NEXT;
END;
$ LANGUAGE plpgsql;

-- Run validation and display results
SELECT * FROM validate_location_migration();

-- =============================================
-- STEP 7: CLEANUP
-- =============================================

-- Drop the temporary parsing function (keep it for now in case we need to re-run)
-- DROP FUNCTION IF EXISTS parse_location_string(TEXT);

-- Create indexes for better performance on the new location relationships
CREATE INDEX IF NOT EXISTS outreach_logs_location_lookup_idx 
ON outreach_logs(location_id) 
WHERE location_id IS NOT NULL;

-- =============================================
-- MIGRATION SUMMARY
-- =============================================

-- Display summary of the migration
DO $
DECLARE
  migration_stats RECORD;
BEGIN
  SELECT * FROM validate_location_migration() INTO migration_stats;
  
  RAISE NOTICE '=== LOCATION MIGRATION SUMMARY ===';
  RAISE NOTICE 'Total outreach logs: %', migration_stats.total_outreach_logs;
  RAISE NOTICE 'Logs with location_id: %', migration_stats.logs_with_location_id;
  RAISE NOTICE 'Logs without location_id: %', migration_stats.logs_without_location_id;
  RAISE NOTICE 'Total locations created: %', migration_stats.total_locations_created;
  RAISE NOTICE 'Migration success rate: %%%', migration_stats.migration_success_rate;
  RAISE NOTICE '=====================================';
END $;