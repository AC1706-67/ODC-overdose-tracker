-- Add audit/tracking columns to all main tables
-- This ensures every record knows WHO created it and WHEN
-- NOTE: created_by and created_at already exist, this adds updated_at

-- 1. Incidents table - add updated_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'incidents' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE incidents ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. Outreach logs table - add updated_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'outreach_logs' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE outreach_logs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 3. Distributions table - add updated_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'distributions' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE distributions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 4. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to incidents
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to outreach_logs
DROP TRIGGER IF EXISTS update_outreach_logs_updated_at ON outreach_logs;
CREATE TRIGGER update_outreach_logs_updated_at
    BEFORE UPDATE ON outreach_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to distributions
DROP TRIGGER IF EXISTS update_distributions_updated_at ON distributions;
CREATE TRIGGER update_distributions_updated_at
    BEFORE UPDATE ON distributions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT 
  'incidents' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'incidents' 
  AND column_name IN ('created_at', 'created_by', 'updated_at', 'organization_id')
UNION ALL
SELECT 
  'outreach_logs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'outreach_logs' 
  AND column_name IN ('created_at', 'created_by', 'updated_at', 'organization_id')
ORDER BY table_name, column_name;
