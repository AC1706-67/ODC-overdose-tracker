-- Safe migration: Add missing updated_at columns and triggers
-- This script is idempotent - safe to run multiple times

-- ============================================
-- STEP 1: Add updated_at columns (if missing)
-- ============================================

-- Add to incidents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'incidents' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to incidents';
  ELSE
    RAISE NOTICE 'incidents.updated_at already exists';
  END IF;
END $$;

-- Add to outreach_logs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'outreach_logs' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE outreach_logs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to outreach_logs';
  ELSE
    RAISE NOTICE 'outreach_logs.updated_at already exists';
  END IF;
END $$;

-- Add to distributions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'distributions' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE distributions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to distributions';
  ELSE
    RAISE NOTICE 'distributions.updated_at already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create trigger function (if missing)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 
'Automatically updates the updated_at column to current timestamp on row update';

-- ============================================
-- STEP 3: Create triggers (drop and recreate)
-- ============================================

-- Incidents trigger
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Outreach logs trigger
DROP TRIGGER IF EXISTS update_outreach_logs_updated_at ON outreach_logs;
CREATE TRIGGER update_outreach_logs_updated_at
    BEFORE UPDATE ON outreach_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Distributions trigger
DROP TRIGGER IF EXISTS update_distributions_updated_at ON distributions;
CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Verify the changes
-- ============================================

-- Show columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('incidents', 'outreach_logs', 'distributions')
  AND column_name IN ('created_at', 'created_by', 'updated_at')
ORDER BY table_name, column_name;

-- Show triggers
SELECT 
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('incidents', 'outreach_logs', 'distributions')
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! All tables now have updated_at columns with auto-update triggers.';
END $$;
