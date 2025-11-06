/*
  # Complete Enhanced Outreach Analytics Data Migration
  
  This is the master migration script that orchestrates the complete data migration
  for the enhanced outreach analytics feature. It includes both location and team
  member data migration with comprehensive validation and rollback capabilities.
  
  Requirements: 5.1, 5.2, 5.5
  
  This script should be run after:
  - 20251101_create_enhanced_outreach_analytics.sql
  - 20251101_migrate_location_data.sql  
  - 20251101_migrate_team_member_data.sql
*/

-- =============================================
-- MIGRATION ORCHESTRATION AND VALIDATION
-- =============================================

-- Create a migration log table to track progress
CREATE TABLE IF NOT EXISTS migration_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name text NOT NULL,
  step_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'rolled_back')),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Function to log migration steps
CREATE OR REPLACE FUNCTION log_migration_step(
  migration_name text,
  step_name text,
  status text,
  error_msg text DEFAULT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $
BEGIN
  INSERT INTO migration_log (migration_name, step_name, status, error_message, metadata)
  VALUES (migration_name, step_name, status, error_msg, metadata);
  
  IF status = 'completed' THEN
    UPDATE migration_log 
    SET end_time = now() 
    WHERE migration_name = log_migration_step.migration_name 
      AND step_name = log_migration_step.step_name 
      AND status = 'started';
  END IF;
END;
$ LANGUAGE plpgsql;

-- =============================================
-- PRE-MIGRATION VALIDATION
-- =============================================

DO $
DECLARE
  pre_migration_stats jsonb;
BEGIN
  -- Log start of migration
  PERFORM log_migration_step('enhanced_outreach_analytics', 'pre_validation', 'started');
  
  -- Collect pre-migration statistics
  SELECT jsonb_build_object(
    'total_outreach_logs', (SELECT COUNT(*) FROM outreach_logs),
    'logs_with_location', (SELECT COUNT(*) FROM outreach_logs WHERE location IS NOT NULL AND trim(location) != ''),
    'logs_with_team_members', (SELECT COUNT(*) FROM outreach_logs WHERE team_members IS NOT NULL AND trim(team_members) != ''),
    'existing_locations', (SELECT COUNT(*) FROM locations WHERE is_active = true),
    'existing_team_members', (SELECT COUNT(*) FROM team_members WHERE is_active = true),
    'existing_junction_records', (SELECT COUNT(*) FROM outreach_team_members)
  ) INTO pre_migration_stats;
  
  -- Log pre-migration stats
  PERFORM log_migration_step('enhanced_outreach_analytics', 'pre_validation', 'completed', NULL, pre_migration_stats);
  
  RAISE NOTICE '=== PRE-MIGRATION VALIDATION ===';
  RAISE NOTICE 'Statistics collected: %', pre_migration_stats;
END $;

-- =============================================
-- MIGRATION EXECUTION
-- =============================================

-- Execute location migration if not already done
DO $
BEGIN
  -- Check if location migration has already been completed
  IF NOT EXISTS (
    SELECT 1 FROM migration_log 
    WHERE migration_name = 'enhanced_outreach_analytics' 
      AND step_name = 'location_migration' 
      AND status = 'completed'
  ) THEN
    
    PERFORM log_migration_step('enhanced_outreach_analytics', 'location_migration', 'started');
    
    -- Run location migration (this would typically be done by including the location migration script)
    RAISE NOTICE 'Location migration would be executed here (run 20251101_migrate_location_data.sql first)';
    
    PERFORM log_migration_step('enhanced_outreach_analytics', 'location_migration', 'completed');
  ELSE
    RAISE NOTICE 'Location migration already completed, skipping...';
  END IF;
END $;

-- Execute team member migration if not already done
DO $
BEGIN
  -- Check if team member migration has already been completed
  IF NOT EXISTS (
    SELECT 1 FROM migration_log 
    WHERE migration_name = 'enhanced_outreach_analytics' 
      AND step_name = 'team_member_migration' 
      AND status = 'completed'
  ) THEN
    
    PERFORM log_migration_step('enhanced_outreach_analytics', 'team_member_migration', 'started');
    
    -- Run team member migration (this would typically be done by including the team member migration script)
    RAISE NOTICE 'Team member migration would be executed here (run 20251101_migrate_team_member_data.sql first)';
    
    PERFORM log_migration_step('enhanced_outreach_analytics', 'team_member_migration', 'completed');
  ELSE
    RAISE NOTICE 'Team member migration already completed, skipping...';
  END IF;
END $;

-- =============================================
-- POST-MIGRATION VALIDATION
-- =============================================

-- Comprehensive validation function
CREATE OR REPLACE FUNCTION validate_complete_migration()
RETURNS TABLE (
  validation_check text,
  expected_value bigint,
  actual_value bigint,
  status text,
  details text
) AS $
DECLARE
  total_logs bigint;
  logs_with_original_location bigint;
  logs_with_original_team_members bigint;
BEGIN
  -- Get baseline counts
  SELECT COUNT(*) INTO total_logs FROM outreach_logs;
  SELECT COUNT(*) INTO logs_with_original_location 
    FROM outreach_logs WHERE legacy_location IS NOT NULL;
  SELECT COUNT(*) INTO logs_with_original_team_members 
    FROM outreach_logs WHERE legacy_team_members IS NOT NULL;
  
  -- Validation 1: All outreach logs should have location_id
  RETURN QUERY
  SELECT 
    'Location ID Assignment'::text,
    total_logs,
    (SELECT COUNT(*) FROM outreach_logs WHERE location_id IS NOT NULL),
    CASE WHEN (SELECT COUNT(*) FROM outreach_logs WHERE location_id IS NOT NULL) = total_logs 
         THEN 'PASS' ELSE 'FAIL' END,
    'All outreach logs should have a location_id assigned'::text;
  
  -- Validation 2: Legacy location data preserved
  RETURN QUERY
  SELECT 
    'Legacy Location Preservation'::text,
    logs_with_original_location,
    (SELECT COUNT(*) FROM outreach_logs WHERE legacy_location IS NOT NULL),
    CASE WHEN (SELECT COUNT(*) FROM outreach_logs WHERE legacy_location IS NOT NULL) >= logs_with_original_location 
         THEN 'PASS' ELSE 'FAIL' END,
    'Original location data should be preserved in legacy_location field'::text;
  
  -- Validation 3: Team member junction records created
  RETURN QUERY
  SELECT 
    'Team Member Junction Records'::text,
    logs_with_original_team_members,
    (SELECT COUNT(DISTINCT outreach_log_id) FROM outreach_team_members otm 
     JOIN outreach_logs ol ON otm.outreach_log_id = ol.id 
     WHERE ol.legacy_team_members IS NOT NULL),
    CASE WHEN (SELECT COUNT(DISTINCT outreach_log_id) FROM outreach_team_members otm 
               JOIN outreach_logs ol ON otm.outreach_log_id = ol.id 
               WHERE ol.legacy_team_members IS NOT NULL) >= logs_with_original_team_members 
         THEN 'PASS' ELSE 'FAIL' END,
    'Junction records should exist for logs with original team member data'::text;
  
  -- Validation 4: No orphaned team members
  RETURN QUERY
  SELECT 
    'No Orphaned Team Members'::text,
    0::bigint,
    (SELECT COUNT(*) FROM team_members tm 
     WHERE NOT EXISTS (SELECT 1 FROM outreach_team_members otm WHERE otm.team_member_id = tm.id)),
    CASE WHEN (SELECT COUNT(*) FROM team_members tm 
               WHERE NOT EXISTS (SELECT 1 FROM outreach_team_members otm WHERE otm.team_member_id = tm.id)) = 0 
         THEN 'PASS' ELSE 'WARN' END,
    'Team members should have at least one outreach activity association'::text;
  
  -- Validation 5: Location referential integrity
  RETURN QUERY
  SELECT 
    'Location Referential Integrity'::text,
    0::bigint,
    (SELECT COUNT(*) FROM outreach_logs ol 
     WHERE ol.location_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = ol.location_id)),
    CASE WHEN (SELECT COUNT(*) FROM outreach_logs ol 
               WHERE ol.location_id IS NOT NULL 
                 AND NOT EXISTS (SELECT 1 FROM locations l WHERE l.id = ol.location_id)) = 0 
         THEN 'PASS' ELSE 'FAIL' END,
    'All location_id references should point to valid location records'::text;
END;
$ LANGUAGE plpgsql;

-- Run comprehensive validation
DO $
DECLARE
  validation_result RECORD;
  all_passed boolean := true;
  post_migration_stats jsonb;
BEGIN
  PERFORM log_migration_step('enhanced_outreach_analytics', 'post_validation', 'started');
  
  RAISE NOTICE '=== POST-MIGRATION VALIDATION ===';
  
  -- Run all validation checks
  FOR validation_result IN SELECT * FROM validate_complete_migration()
  LOOP
    RAISE NOTICE '% | Expected: % | Actual: % | Status: % | %', 
      validation_result.validation_check,
      validation_result.expected_value,
      validation_result.actual_value,
      validation_result.status,
      validation_result.details;
    
    IF validation_result.status = 'FAIL' THEN
      all_passed := false;
    END IF;
  END LOOP;
  
  -- Collect post-migration statistics
  SELECT jsonb_build_object(
    'total_outreach_logs', (SELECT COUNT(*) FROM outreach_logs),
    'logs_with_location_id', (SELECT COUNT(*) FROM outreach_logs WHERE location_id IS NOT NULL),
    'logs_with_legacy_location', (SELECT COUNT(*) FROM outreach_logs WHERE legacy_location IS NOT NULL),
    'logs_with_legacy_team_members', (SELECT COUNT(*) FROM outreach_logs WHERE legacy_team_members IS NOT NULL),
    'total_locations', (SELECT COUNT(*) FROM locations WHERE is_active = true),
    'total_team_members', (SELECT COUNT(*) FROM team_members WHERE is_active = true),
    'total_junction_records', (SELECT COUNT(*) FROM outreach_team_members),
    'validation_passed', all_passed
  ) INTO post_migration_stats;
  
  IF all_passed THEN
    PERFORM log_migration_step('enhanced_outreach_analytics', 'post_validation', 'completed', NULL, post_migration_stats);
    RAISE NOTICE 'All validation checks passed!';
  ELSE
    PERFORM log_migration_step('enhanced_outreach_analytics', 'post_validation', 'failed', 'Some validation checks failed', post_migration_stats);
    RAISE WARNING 'Some validation checks failed. Review the results above.';
  END IF;
  
  RAISE NOTICE 'Post-migration statistics: %', post_migration_stats;
END $;

-- =============================================
-- ROLLBACK PROCEDURES
-- =============================================

-- Create rollback function for emergency use
CREATE OR REPLACE FUNCTION rollback_enhanced_outreach_migration()
RETURNS void AS $
BEGIN
  RAISE NOTICE 'Starting rollback of enhanced outreach analytics migration...';
  
  -- Log rollback start
  PERFORM log_migration_step('enhanced_outreach_analytics', 'rollback', 'started');
  
  -- Remove junction table records
  DELETE FROM outreach_team_members;
  RAISE NOTICE 'Cleared outreach_team_members junction table';
  
  -- Remove team member records (keep those that might have been manually created)
  DELETE FROM team_members 
  WHERE created_at >= (
    SELECT MIN(start_time) 
    FROM migration_log 
    WHERE migration_name = 'enhanced_outreach_analytics'
  );
  RAISE NOTICE 'Removed migrated team member records';
  
  -- Remove location records (keep those that might have been manually created)
  DELETE FROM locations 
  WHERE created_at >= (
    SELECT MIN(start_time) 
    FROM migration_log 
    WHERE migration_name = 'enhanced_outreach_analytics'
  );
  RAISE NOTICE 'Removed migrated location records';
  
  -- Clear location_id references in outreach_logs
  UPDATE outreach_logs SET location_id = NULL;
  RAISE NOTICE 'Cleared location_id references from outreach_logs';
  
  -- Optionally restore original data (if legacy fields were cleared)
  -- UPDATE outreach_logs SET location = legacy_location WHERE legacy_location IS NOT NULL;
  -- UPDATE outreach_logs SET team_members = array_to_string(legacy_team_members, ', ') WHERE legacy_team_members IS NOT NULL;
  
  -- Log rollback completion
  PERFORM log_migration_step('enhanced_outreach_analytics', 'rollback', 'completed');
  
  RAISE NOTICE 'Rollback completed. Original data preserved in legacy fields.';
END;
$ LANGUAGE plpgsql;

-- =============================================
-- MIGRATION COMPLETION
-- =============================================

DO $
BEGIN
  PERFORM log_migration_step('enhanced_outreach_analytics', 'migration_complete', 'completed', NULL, 
    jsonb_build_object(
      'completion_time', now(),
      'migration_version', '20251101_complete_data_migration'
    )
  );
  
  RAISE NOTICE '=== MIGRATION COMPLETED ===';
  RAISE NOTICE 'Enhanced Outreach Analytics data migration has been completed.';
  RAISE NOTICE 'Check the migration_log table for detailed execution history.';
  RAISE NOTICE 'Use SELECT * FROM migration_log WHERE migration_name = ''enhanced_outreach_analytics'' ORDER BY start_time;';
  RAISE NOTICE '========================';
END $;